# Deployment Guide

The project has two apps in one repo:

- `src/` — Express + Postgres API.
- `web/` — Vite + React + shadcn/ui SPA.

It deploys as:

- **Vercel** (recommended, via `vercel.json`):
    - `buildCommand` installs `web/` deps and runs `vite build` into `web/dist/`.
    - `outputDirectory: web/dist` — Vercel's CDN serves the SPA statically.
    - `/api/*`, `/webhooks/*`, `/health` are rewritten to the serverless function at `api/index.js`, which mounts the Express app.
    - Everything else falls through to `/index.html` so the SPA's client router can handle deep links (e.g. `/forgot-password`).
- **A Docker container** on any platform (Render, Fly, Railway, AWS ECS, Kubernetes) — the `Dockerfile` runs only the Express API. Front the container with your own CDN if you want the SPA co-located.
- **A plain Node.js process** (`npm start`) behind your own reverse proxy.

## Deploy from Git (recommended)

Once set up, every push to `main` auto-deploys to production, and every push to any other branch or PR gets a preview URL — no laptop CLI required.

### One-time setup

**1. Provision infra**
- **Neon** Postgres (free tier): <https://console.neon.tech/> — copy the Direct Connection URL, append `?sslmode=require`.
- **Upstash** Redis (optional, for multi-instance rate limits): <https://console.upstash.com/>.

**2. Create the Vercel project + token (on your laptop, one time)**
```bash
npm install -g vercel
vercel login
vercel link        # pick "create new project" in this repo, accept defaults
cat .vercel/project.json   # note orgId + projectId
```
Then create a token at <https://vercel.com/account/tokens>.

**3. Set the Vercel env vars** (for both `production` and `preview` environments)
```bash
vercel env add DATABASE_URL production        # Neon URL with ?sslmode=require
vercel env add DATABASE_URL preview
vercel env add ENCRYPTION_KEY production      # 64-char hex (see below)
vercel env add ENCRYPTION_KEY preview
vercel env add JWT_SECRET production
vercel env add JWT_SECRET preview
# Optional:
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
```

**4. Add GitHub repository secrets**
In GitHub → Settings → Secrets and variables → Actions → New repository secret:
- `VERCEL_TOKEN` — the token from step 2
- `VERCEL_ORG_ID` — `orgId` from `.vercel/project.json`
- `VERCEL_PROJECT_ID` — `projectId` from `.vercel/project.json`

**5. Initial schema**
```bash
DATABASE_URL="<neon-url>" npm run migrate
```

**6. Push to trigger a deploy**
Pushing to `main` hits `.github/workflows/deploy-production.yml` and goes live. Any other branch or PR triggers `deploy-preview.yml` which comments the preview URL on the PR.

### Manual CLI deploy (fallback)

```bash
vercel --prod
```

Generate a production-strength encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The `vercel.json` routes `/api/*`, `/webhooks/*` and `/health` through the serverless handler at `api/index.js`, while everything else serves the static SPA in `public/`.

### Vercel + serverless gotchas to know

- **Cold starts reinit the DB pool.** The pool is module-scoped, so warm invocations reuse it. Schema creation is a one-shot `CREATE TABLE IF NOT EXISTS` executed on the first query per cold start — cheap and idempotent.
- **`maxDuration: 15` seconds** is set in `vercel.json`. Provider API calls run in <2s normally; raise it on the Pro plan if Orange/MTN get slow.
- **Logs**: Vercel's built-in logs + `logger.info/warn/error` output. For structured logs, swap `logger.js` with `pino`.
- **No local filesystem.** The app writes nothing to disk — all state lives in Postgres.
- **Rate limits**: set `UPSTASH_REDIS_REST_URL/TOKEN` or every instance keeps its own in-memory limiter (fine for tiny workloads, leaky at scale).

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` on Vercel. |
| `DATABASE_URL` | yes | Postgres connection string. Use `?sslmode=require` on Neon/managed. |
| `DATABASE_POOL_MAX` | no | Default 5 in prod, 10 in dev. Keep low on Vercel to avoid exhausting Neon. |
| `ENCRYPTION_KEY` | yes | 64-char hex (32 bytes). **Never rotate without re-encrypting `payment_configs`.** |
| `JWT_SECRET` | yes | Long random value. Rotating invalidates all sessions. |
| `JWT_EXPIRES_IN` | no | Default `7d`. |
| `UPSTASH_REDIS_REST_URL` | no | Enables Redis-backed rate limits. |
| `UPSTASH_REDIS_REST_TOKEN` | no | Paired with `_URL`. |
| `RATE_LIMIT_WINDOW_MS` | no | Default 900000 (15 min). |
| `RATE_LIMIT_MAX` | no | Default 300 req / window / IP. |
| `WEBHOOK_SHARED_SECRET` | no | Fallback. Schools' per-provider secrets remain primary. |
| `MTN_BASE_URL` | no | Sandbox by default. |
| `ORANGE_BASE_URL` | no | Sandbox by default. |

## Docker

```bash
docker build -t school-payment-saas .
docker run -p 3000:3000 --env-file .env school-payment-saas
```

The shipped `Dockerfile` is a multi-stage build: `npm ci --omit=dev` in a `deps` stage then copies `node_modules` into a slim runtime. Includes a HEALTHCHECK hitting `/health`.

## Postgres

- **Neon** (recommended for Vercel): serverless, free tier, auto-suspend.
- **Supabase**: works identically — use the "Connection Pooling" URI.
- **Self-hosted / RDS**: any Postgres 12+.

Run `npm run migrate` once — it executes the idempotent `CREATE TABLE IF NOT EXISTS` schema in `src/core/database.js`. For ongoing migrations in a real deployment, add `node-pg-migrate` or `prisma migrate`.

### Scaling knobs

- Multiple replicas are safe; the app is stateless.
- Prefer Postgres read replicas for `/api/dashboard/report` as volumes grow.
- Use Upstash (or a self-hosted Redis) for rate limits and, eventually, sessions.
- If you need >15s request budgets on Vercel, move long-running verifications to a background worker on Railway/Render and keep only the webhook receiver on Vercel.

## Webhooks

Configure each provider to call:

```
POST https://<your-domain>/webhooks/MTN/<school-slug>
POST https://<your-domain>/webhooks/ORANGE/<school-slug>
```

Signatures must be present (`X-MoMo-Signature`, `X-Orange-Signature`). Requests without a valid HMAC are rejected with 401. Ingestion is idempotent (`UNIQUE(school_id, provider, external_id)`), so providers may retry safely.

## CI

`.github/workflows/ci.yml` spins up a Postgres 16 service, runs `npm ci`, a syntax check over `src/`, `api/`, `tests/`, `npm run migrate`, and the end-to-end smoke test in `tests/smoke.js`.

## Observability

- **Logs**: structured lines from `src/core/logger.js`; ship via Vercel log drains or Fluent Bit/Vector.
- **Health**: `GET /health` returns 200 + uptime.
- **Audit trail**: every sensitive mutation lands in `audit_logs`.
- **Metrics**: wrap `paymentsService.submitTransaction` with Prometheus counters for payment latency/success rate per provider.

## Release checklist

- [ ] Secrets set (`DATABASE_URL`, `ENCRYPTION_KEY`, `JWT_SECRET`).
- [ ] Schema migrated (`npm run migrate`).
- [ ] Optional: Upstash configured for multi-instance rate limits.
- [ ] Provider webhook URLs registered on MTN / Orange dashboards.
- [ ] `/health` green.
- [ ] Alerts on 5xx rate, auth failures spike, pending transactions > threshold.
