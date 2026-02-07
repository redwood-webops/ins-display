# Instagram Integration Worker

API endpoints for Instagram OAuth and post management.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/login` | Initiates Instagram OAuth flow |
| `GET /api/login/callback` | OAuth callback handler |
| `GET /api/auth/refresh?user=<username>` | Refreshes access token |
| `GET /api/posts/refresh?user=<username>` | Fetches latest posts from Instagram |
| `GET /api/posts?idx=<n>` | Returns single post at index n (0 = most recent) |

## Endpoint Details

### `/api/login`

Redirects to Instagram authorization.

- Only works from allowed origins
- Allowed usernames: `redwoodkyudojo`, `redwood_webops`

### `/api/login/callback`

Handles OAuth callback from Instagram.

- Exchanges authorization code for long-lived token
- Stores user info in D1 database

### `/api/auth/refresh?user=<username>`

Refreshes the user's access token.

**Response:**
```json
{ "success": true, "expires_at": "<ISO date>" }
```

### `/api/posts/refresh?user=<username>`

Fetches 10 most recent posts from Instagram API.

- Saves posts and carousel children to database

**Response:**
```json
{ "success": true, "posts_count": 10 }
```

### `/api/posts?idx=<n>`

Returns a single post at index `n` (0 = most recent, 1 = second most recent, etc.).

- `idx` parameter is optional, defaults to 0
- Returns `null` if index is out of range
- Includes carousel children if present

## Scheduled Task

Auto-refreshes tokens expiring within 5 days.

## Example Usage

```bash
# Refresh posts for a user
curl "https://ins-display.webops-f4b.workers.dev/api/posts/refresh?user=redwoodkyudojo"

# Get most recent post
curl "https://ins-display.webops-f4b.workers.dev/api/posts"

# Get second most recent post
curl "https://ins-display.webops-f4b.workers.dev/api/posts?idx=1"
```
