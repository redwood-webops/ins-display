# ins-display

Embeddable Instagram post widget built on Cloudflare Workers + React. Fetches posts via the Instagram Graph API, stores them in Cloudflare D1, and renders them as a self-contained carousel card designed to be dropped into any site as an `<iframe>`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.9, SCSS Modules |
| Build | Vite 7, `@cloudflare/vite-plugin` |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Dev tooling | Wrangler 4, ESLint 9, Prettier 3 |

---

## Commands

### npm scripts

```bash
npm run dev        # Vite dev server with live worker (localhost:5173)
npm run build      # tsc -b && vite build → dist/
npm run lint       # ESLint
npm run preview    # Vite preview of production build
```

### Wrangler (Cloudflare)

```bash
# One-time setup
wrangler d1 create ins-posts
wrangler d1 execute ins-posts --local --file=./schema.sql

# Regenerate worker type bindings
wrangler types

# Set production secrets
wrangler secret put INSTAGRAM_CLIENT_ID
wrangler secret put INSTAGRAM_CLIENT_SECRET

# Deploy
wrangler deploy
```

### Database management

```bash
# Sync remote D1 → local (exports remote, resets local, imports)
./pull-remote-db.sh

# Reset local database
wrangler d1 execute ins-posts --local --file=./reset-db.sql
```

---

## Code Structure

```
├── src/                          # React frontend
│   ├── main.tsx                  # Entry point — mounts <App /> to #root
│   ├── App.tsx                   # Reads ?idx / ?range, fetches /api/posts, renders <InsCard>
│   ├── App.module.scss
│   ├── InsCard.tsx               # Card widget with carousel, caption, header
│   ├── InsCard.module.scss
│   └── types/
│       └── post.ts               # Post, Media, MediaType
│
├── worker/                       # Cloudflare Worker backend
│   ├── index.ts                  # All API handlers + scheduled job
│   ├── types.ts                  # Instagram Graph API response types
│   └── README.md
│
├── schema.sql                    # D1 table definitions
├── reset-db.sql                  # DROP all tables
├── pull-remote-db.sh             # Sync remote DB to local
├── commands.txt                  # Reference list of wrangler commands
│
├── embed.html                    # Instagram blockquote embed example
├── iframe.html                   # iframe embed example
│
├── wrangler.jsonc                # Worker name, D1 binding, cron trigger, asset routing
├── vite.config.ts                # Vite plugins: react + cloudflare
├── tsconfig.json                 # Project references
├── tsconfig.app.json             # Frontend: ES2022, react-jsx, strict
├── tsconfig.node.json            # Build tools: ES2023
├── tsconfig.worker.json          # Worker: extends tsconfig.node.json
└── package.json
```

---

## Frontend Components

### `App.tsx`

Reads query parameters from `window.location.search`, fetches `/api/posts`, and renders a single `<InsCard>`. Returns `null` while loading or if no posts are returned.

| Query param | Type | Default | Description |
|-------------|------|---------|-------------|
| `idx` | int | `0` | Offset — `0` is the most recent captioned post |
| `range` | int | `1` | Number of posts to load (1–10) |

### `InsCard.tsx`

The main card widget (400 × 500 px). Receives an array of `Post` objects and:

1. Flattens them into a `Media[]` list — carousel albums are expanded into individual slides, each inheriting the parent's caption.
2. Renders:
   - **`Header`** — Instagram gradient SVG icon + username link
   - **`Carousel`** — sliding track, 400 px per slide
     - Auto-advances every 5 seconds
     - Prev / next chevron buttons (visible on hover, wrap-around)
     - Manual navigation resets the auto-advance timer
   - **`Media`** — `<img>` for `IMAGE`, `<video autoPlay loop muted>` for `VIDEO`
   - **`Caption`** — displays the caption of the currently visible slide; uses binary search to truncate to fit the available height with a `…` suffix

### Types (`src/types/post.ts`)

```ts
enum MediaType {
  IMAGE    = 'IMAGE',
  VIDEO    = 'VIDEO',
  CAROUSEL = 'CAROUSEL_ALBUM',
}

interface Post {
  id: string;
  caption: string | null;
  media_type: MediaType;
  media_url: string | null;
  permalink: string | null;
  timestamp: string;       // ISO 8601
  children: Post[] | null; // set for CAROUSEL_ALBUM posts
}

interface Media {           // flattened unit used by InsCard
  id: string;
  caption: string | null;
  media_url: string | null;
  media_type: 'IMAGE' | 'VIDEO';
  timestamp: string;
}
```

---

## Worker — API Endpoints

All requests to `/api/*` are handled by the worker before static assets are served (`run_worker_first` in `wrangler.jsonc`). All methods are `GET`.

| Path | Query params | Description |
|------|-------------|-------------|
| `/api/login` | — | Initiates Instagram OAuth. Validates request origin against the allow-list, then redirects to `https://www.instagram.com/oauth/authorize` with scope `instagram_business_basic`. |
| `/api/login/callback` | `code` | OAuth callback. Exchanges the authorization code for a short-lived token, fetches user info, validates the username against the allow-list, exchanges for a long-lived token (~60 days), upserts the user into D1, and redirects to `/`. |
| `/api/auth/refresh` | `user` (username) | Refreshes the named user's long-lived token via `graph.instagram.com/refresh_access_token` and updates D1. Response: `{ success: true, expires_at: "<ISO 8601>" }`. |
| `/api/posts/refresh` | `user` (username) | Fetches the 10 most recent posts from `graph.instagram.com/{userId}/media` (including carousel children) and upserts everything into D1. Response: `{ success: true, posts_count: <n> }`. |
| `/api/posts` | `idx` (int ≥ 0, default `0`), `range` (int 1–10, default `1`) | Returns `range` posts from D1 starting at offset `idx`, ordered by `timestamp DESC`, filtered to posts with captions. Each post includes its carousel children. Response: `Post[]`. |

### Scheduled job

Cron: `0 * * * *` (every hour at minute 0).

For every user that has a valid `access_token` in D1:
- If the token expires within 5 days → refresh it.
- Sync the latest posts.

We always refresh the latest 10 posts because the media url from instagram expires after some time. And we only allow querying for the last 10 posts at most, because only these posts are guaranteed to have valid media url.

---

## Database Schema

Three tables in Cloudflare D1 (`ins-posts`):

```sql
CREATE TABLE users (
  id                      TEXT PRIMARY KEY,  -- Instagram user ID
  name                    TEXT NOT NULL,
  username                TEXT NOT NULL,
  profile_picture_url     TEXT,
  followers_count         INTEGER,
  media_count             INTEGER,
  access_token            TEXT,
  access_token_expires_at TEXT               -- ISO 8601
);

CREATE TABLE posts (
  id         TEXT PRIMARY KEY,  -- Instagram media ID
  caption    TEXT,
  media_type TEXT NOT NULL,     -- IMAGE | VIDEO | CAROUSEL_ALBUM
  media_url  TEXT,
  permalink  TEXT,
  timestamp  TEXT NOT NULL      -- ISO 8601
);

CREATE TABLE children (
  parent_id TEXT NOT NULL REFERENCES posts(id),
  child_id  TEXT NOT NULL REFERENCES posts(id),
  PRIMARY KEY (parent_id, child_id)
);
```

`children` is a junction table that maps a `CAROUSEL_ALBUM` post to each of its individual slides (which are also stored in `posts`).

---

## Environment Variables

### Local development — `.dev.vars`

```
INSTAGRAM_CLIENT_ID=<your app client ID>
INSTAGRAM_CLIENT_SECRET=<your app client secret>
```

### Production secrets

```bash
wrangler secret put INSTAGRAM_CLIENT_ID
wrangler secret put INSTAGRAM_CLIENT_SECRET
```

### Allow-lists (hard-coded in `worker/index.ts`)

```ts
const ALLOWED_ORIGINS   = ['https://www.redwoodkyudojo.com', 'https://ins-display.webops-f4b.workers.dev'];
const ALLOWED_USERNAMES = ['redwoodkyudojo', 'redwood_webops'];
```

OAuth callbacks and Instagram usernames are validated against these lists. Requests from other origins or with other usernames are rejected with `403`.

---

## Embed Usage

The widget is designed to be embedded via `<iframe>`. The card renders at 400 × 500 px.

```html
<!-- Most recent post -->
<iframe src="https://ins-display.webops-f4b.workers.dev?idx=0" width="400" height="500" frameborder="0"></iframe>

<!-- Second most recent post -->
<iframe src="https://ins-display.webops-f4b.workers.dev?idx=1" width="400" height="500" frameborder="0"></iframe>

<!-- Load 3 posts as one carousel -->
<iframe src="https://ins-display.webops-f4b.workers.dev?idx=0&range=3" width="400" height="500" frameborder="0"></iframe>
```

See `iframe.html` for a working multi-embed example and `embed.html` for the native Instagram blockquote embed alternative.
