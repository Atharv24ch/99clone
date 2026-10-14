# Deploying Aangan

Web on **Vercel**, API and worker on **Railway**, Postgres on **Neon**, Redis on **Upstash**, media on **S3**.

## 1. Database migrations (run before deploying the new API)

The API now reads `users.password_hash` and `password_reset_tokens`. Apply both
migrations to Neon first, otherwise sign-up and login fail:

```bash
psql "$DATABASE_URL" -f packages/db/drizzle/0001_add_password_hash.sql
psql "$DATABASE_URL" -f packages/db/drizzle/0002_password_reset_tokens.sql
```

Both are idempotent (`IF NOT EXISTS`).

## 2. Railway: API service

`railway.json` builds and starts `node apps/api-server/dist/server.js` with a `/health` check.

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled connection string |
| `REDIS_URL` | Upstash `rediss://` URL |
| `JWT_SECRET` | 32+ random characters. The API refuses to start without it |
| `ALLOWED_ORIGIN` | Your Vercel URL(s), comma-separated |
| `APP_URL` | Public web URL, used in email links |
| `RESEND_API_KEY`, `EMAIL_FROM` | Email delivery (reset links, lead and approval emails) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` | Photo uploads. Leave `AWS_S3_ENDPOINT` unset |
| `CLOUDFLARE_CDN_URL` | Public base URL serving the bucket |
| `OPENSEARCH_URL` | Optional. Suggestions fall back to Postgres |

## 3. Railway: worker service

Create a second service from the same repo with the same variables, the same
build command, and start command `node apps/api-server/dist/worker.js`. It
processes photo watermarks and thumbnails, and sends lead and approval emails.
Without it, uploads stay unprocessed and no notifications go out.

## 4. Vercel: web

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Railway API URL |
| `NEXT_PUBLIC_SITE_URL` | Public web URL (canonical URLs, Open Graph) |
| `NEXT_PUBLIC_CDN_URL` | Same as `CLOUDFLARE_CDN_URL` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional. The map view shows a notice without it |

## 5. S3 bucket CORS

Browsers upload straight to S3 with presigned URLs, so the bucket must allow
`PUT` from the web origin:

```json
[{ "AllowedOrigins": ["https://your-app.vercel.app"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3000 }]
```

## 6. First moderator

Listings stay in review until an admin publishes them. After deploying, sign up
on the site, then run with the production `DATABASE_URL` set:

```bash
DATABASE_URL="..." pnpm --filter @99acres/api-server admin:promote you@yourdomain.com
```

Sign out and back in; **Moderation** appears in the dashboard.

## Not yet built

- Terms and Privacy pages (need real legal copy)
- Google sign-in
- SMS delivery for leads (messages are logged by the worker)
