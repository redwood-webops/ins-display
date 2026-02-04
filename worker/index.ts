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

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    const { pathname } = new URL(request.url);

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
