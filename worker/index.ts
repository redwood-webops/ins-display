/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import type { Post } from '../src/types/post';

const ALLOWED_USERNAMES = ['redwoodkyudojo', 'redwood_webops'];
const ALLOWED_ORIGINS = [
  'https://www.redwoodkyudojo.com',
  'https://ins-display.webops-f4b.workers.dev',
];

function isAllowedOrigin(origin: string): boolean {
  const url = new URL(origin);
  return ALLOWED_ORIGINS.some((allowed) => {
    const allowedUrl = new URL(allowed);
    return url.hostname === allowedUrl.hostname && url.protocol === allowedUrl.protocol;
  });
}

async function refreshAccessToken(
  env: Env,
  userId: string,
  currentToken: string
): Promise<{ token: string; expiresAt: string }> {
  const refreshUrl = new URL('https://graph.instagram.com/refresh_access_token');
  refreshUrl.searchParams.set('grant_type', 'ig_refresh_token');
  refreshUrl.searchParams.set('access_token', currentToken);

  const res = await fetch(refreshUrl.toString());
  if (!res.ok) {
    throw new Error(`Failed to refresh token: ${res.status}`);
  }

  const data = await res.json<{ access_token: string; token_type: string; expires_in: number }>();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await env.DB.prepare(
    `UPDATE users SET access_token = ?, access_token_expires_at = ? WHERE id = ?`
  )
    .bind(data.access_token, expiresAt, userId)
    .run();

  return { token: data.access_token, expiresAt };
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname: rawPathname } = url;
  const pathname = rawPathname.replace(/\/+$/, '') || '/';
  const origin = url.origin;

  // REF: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
  if (pathname === '/api/login') {
    if (!isAllowedOrigin(origin)) {
      return new Response('Forbidden: origin not allowed', { status: 403 });
    }
    const redirectUri = `${origin}/api/login/callback`;
    const authUrl = new URL('https://www.instagram.com/oauth/authorize');
    authUrl.searchParams.set('force_reauth', 'true');
    authUrl.searchParams.set('client_id', env.INSTAGRAM_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'instagram_business_basic');
    return Response.redirect(authUrl.toString(), 302);
  }

  if (pathname === '/api/login/callback') {
    if (!isAllowedOrigin(origin)) {
      return new Response('Forbidden: origin not allowed', { status: 403 });
    }
    const redirectUri = `${origin}/api/login/callback`;

    // Extract auth code and strip trailing #_
    let code = url.searchParams.get('code') ?? '';
    code = code.replace(/#_$/, '');

    if (!code) {
      return new Response('Missing authorization code', { status: 400 });
    }

    // Exchange code for short-lived token
    const tokenBody = new URLSearchParams({
      client_id: env.INSTAGRAM_CLIENT_ID,
      client_secret: env.INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenBody,
    });

    if (!tokenRes.ok) {
      return new Response('Failed to exchange code for token', { status: 502 });
    }

    const { access_token: shortLivedToken } = await tokenRes.json<{
      access_token: string;
      user_id: string;
    }>();

    // Fetch user info
    const meUrl = new URL('https://graph.instagram.com/me');
    meUrl.searchParams.set(
      'fields',
      'user_id,name,username,profile_picture_url,followers_count,media_count'
    );
    meUrl.searchParams.set('access_token', shortLivedToken);

    const meRes = await fetch(meUrl.toString());
    if (!meRes.ok) {
      return new Response('Failed to fetch user info', { status: 502 });
    }

    const userInfo = await meRes.json<{
      id: string;
      name: string;
      username: string;
      profile_picture_url?: string;
      followers_count?: number;
      media_count?: number;
    }>();

    // Check username
    if (!ALLOWED_USERNAMES.includes(userInfo.username)) {
      return new Response(`Forbidden: unauthorized username: ${userInfo.username}`, {
        status: 403,
      });
    }

    // Exchange for long-lived token
    const longLivedUrl = new URL('https://graph.instagram.com/access_token');
    longLivedUrl.searchParams.set('grant_type', 'ig_exchange_token');
    longLivedUrl.searchParams.set('client_secret', env.INSTAGRAM_CLIENT_SECRET);
    longLivedUrl.searchParams.set('access_token', shortLivedToken);

    const longLivedRes = await fetch(longLivedUrl.toString());
    if (!longLivedRes.ok) {
      return new Response('Failed to exchange for long-lived token', { status: 502 });
    }

    const longLivedTokenData = await longLivedRes.json<{
      access_token: string;
      token_type: string;
      expires_in: number;
    }>();

    const longLivedToken = longLivedTokenData.access_token;
    const expiresAt = new Date(Date.now() + longLivedTokenData.expires_in * 1000).toISOString();

    // Upsert user into D1
    await env.DB.prepare(
      `INSERT OR REPLACE INTO users (id, name, username, profile_picture_url, followers_count, media_count, access_token, access_token_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        userInfo.id,
        userInfo.name,
        userInfo.username,
        userInfo.profile_picture_url ?? null,
        userInfo.followers_count ?? null,
        userInfo.media_count ?? null,
        longLivedToken,
        expiresAt
      )
      .run();

    return Response.redirect(`${origin}/`, 302);
  }

  if (pathname === '/api/auth/refresh') {
    const username = url.searchParams.get('user');
    if (!username) {
      return new Response('Missing user parameter', { status: 400 });
    }

    const user = await env.DB.prepare('SELECT id, access_token FROM users WHERE username = ?')
      .bind(username)
      .first<{ id: string; access_token: string }>();

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    try {
      const { expiresAt } = await refreshAccessToken(env, user.id, user.access_token);
      return Response.json({ success: true, expires_at: expiresAt });
    } catch (error) {
      return new Response(`Failed to refresh token: ${error}`, { status: 502 });
    }
  }

  if (pathname === '/api/posts') {
    // Get three most recent posts with caption (meaning they're not
    // child posts of a carousel), then get the children of each
    // post (if exists), assemble the post objects and return.
    let { results: posts } = await env.DB.prepare(
      'SELECT * FROM posts WHERE caption IS NOT NULL ORDER BY timestamp DESC LIMIT 3'
    ).run<Post>();

    if (posts.length === 0) {
      return Response.json([]);
    }

    const parentIds = posts.map((p) => p.id);

    const placeholders = parentIds.map(() => '?').join(', ');
    const { results: childRows } = await env.DB.prepare(
      `SELECT c.parent_id, p.* FROM children c JOIN posts p ON c.child_id = p.id WHERE c.parent_id IN (${placeholders})`
    )
      .bind(...parentIds)
      .run<Post & { parent_id: string }>();

    const childrenByParent = new Map<string, Post[]>();
    for (const row of childRows) {
      const { parent_id, ...child } = row;
      if (!childrenByParent.has(parent_id)) {
        childrenByParent.set(parent_id, []);
      }
      childrenByParent.get(parent_id)!.push(child as Post);
    }

    posts = posts.map((post) => ({
      ...post,
      children: childrenByParent.get(post.id) ?? null,
    }));

    return Response.json(posts);
  }

  return new Response(null, { status: 404 });
}

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error('Unexpected error:', error);
      const errorStr = JSON.stringify(error, null, 2);
      return new Response(`Internal Server Error, ${errorStr}`, {
        status: 500,
      });
    }
  },

  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    // Find users with tokens expiring in the next 5 days
    const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const { results: users } = await env.DB.prepare(
      `SELECT id, access_token FROM users
       WHERE access_token IS NOT NULL
       AND access_token_expires_at IS NOT NULL
       AND access_token_expires_at < ?`
    )
      .bind(fiveDaysFromNow)
      .run<{ id: string; access_token: string }>();

    for (const user of users) {
      try {
        await refreshAccessToken(env, user.id, user.access_token);
        console.log(`Refreshed token for user ${user.id}`);
      } catch (error) {
        console.error(`Failed to refresh token for user ${user.id}:`, error);
      }
    }
  },
} satisfies ExportedHandler<Env>;
