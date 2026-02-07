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

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
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

      const { access_token: longLivedToken } = await longLivedRes.json<{
        access_token: string;
        token_type: string;
        expires_in: number;
      }>();

      // Upsert user into D1
      await env.DB.prepare(
        `INSERT OR REPLACE INTO users (id, name, username, profile_picture_url, followers_count, media_count, access_token)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          userInfo.id,
          userInfo.name,
          userInfo.username,
          userInfo.profile_picture_url ?? null,
          userInfo.followers_count ?? null,
          userInfo.media_count ?? null,
          longLivedToken
        )
        .run();

      return Response.redirect(`${origin}/`, 302);
    }

    if (pathname === '/api/posts') {
      // Get three most recent posts with caption (meaning they’re not
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
  },
} satisfies ExportedHandler<Env>;
