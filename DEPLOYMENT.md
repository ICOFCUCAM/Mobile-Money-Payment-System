# Deployment Guide

This document covers running the School Payment SaaS in production. The app is a stateless Node.js (Express) server backed by a relational database; any container platform (Render, Fly, Railway, AWS ECS, GKE, Kubernetes) will work.

## 1. Environment

Minimum required variables (see `.env.example`):

| Variable | Notes |
| --- | --- |
| `NODE_ENV` | Set to `production`. |
| `PORT` | Port to bind. Defaults to 3000. |
| `APP_URL` | Public URL (used in emails / links). |
| `DATABASE_URL` | Path to SQLite file, or a Postgres URL once you migrate. |
| `ENCRYPTION_KEY` | 64-character hex string (32 bytes). **Never rotate without re-encrypting `payment_configs`.** |
| `JWT_SECRET` | Long random value. Rotate with care — invalidates sessions. |
| `JWT_EXPIRES_IN` | Default `7d`. |
| `WEBHOOK_SHARED_SECRET` | Optional platform-wide signing fallback. Schools' per-provider secrets remain the primary signature verifier. |
| `RATE_LIMIT_WINDOW_MS` | Global limiter window. |
| `RATE_LIMIT_MAX` | Requests per window per IP. |
| `MTN_BASE_URL` / `ORANGE_BASE_URL` | Sandbox vs. production provider URLs. |

Generate strong secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. Building the image

Example Dockerfile:

```dockerfile
FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t school-payment-saas .
docker run -p 3000:3000 --env-file .env school-payment-saas
```

## 3. Database choices

### Development / single-node: SQLite (default)

The shipped schema (`src/core/database.js`) is SQLite-compatible and safe for one process. Mount `data/` to a persistent volume.

### Production / scale: PostgreSQL

The schema is standard SQL. To migrate:

1. Install `pg` and replace `better-sqlite3` with `pg`'s async driver in `src/core/database.js` (the surface area is ~100 lines — keep the same `getDb()`/`writeAudit()` API).
2. Translate `datetime('now')` → `now()`.
3. Add a connection pool + migrations runner (`node-pg-migrate`, `knex`, …).
4. Promote `transactions.external_id` uniqueness, add partial indexes on `status`.

### Scaling knobs

- Run multiple replicas behind a load balancer; the app is stateless.
- Put the Postgres primary in the same AZ; use read replicas for reporting endpoints if needed.
- Move rate limit state to Redis (swap `express-rate-limit` store to `rate-limit-redis`).
- Terminate TLS at the LB; keep HTTP inside the VPC.
- Pin the worker to `node --max-old-space-size=512` on small dynos.

## 4. Tenancy strategy in production

Two supported resolution modes — pick based on your infra:

1. **Subdomain per school** — `greenwood.app.com`, `saint-mary.app.com`. Wildcard DNS + wildcard TLS cert (Let's Encrypt or managed). `tenantResolver.js` picks it up automatically.
2. **Single domain + JWT/API key** — every request carries auth that identifies the school. Simpler to operate; recommended for API-first integrations.

Either way, avoid querystring tenant identifiers — they're easy to spoof.

## 5. Webhook endpoints

Each provider needs a webhook URL configured in their dashboard:

```
POST https://<your-domain>/webhooks/MTN/<school-slug>
POST https://<your-domain>/webhooks/ORANGE/<school-slug>
```

- Signatures must be present (`X-MoMo-Signature`, `X-Orange-Signature`). Requests without a valid HMAC are rejected with 401.
- Webhook ingestion is idempotent (`UNIQUE(school_id, provider, external_id)`). Providers may retry safely.

## 6. Observability

- **Logs**: structured lines via the built-in logger; ship via Fluent Bit / Vector to Loki / CloudWatch / Datadog.
- **Health**: `GET /health` returns 200 + uptime. Add this as your liveness probe.
- **Metrics**: wrap `paymentsService.submitTransaction` with Prometheus counters if you want latency + success rate per provider.
- **Audit log**: `audit_logs` holds every sensitive mutation — export to your SIEM nightly.

## 7. Backups

- SQLite: nightly file snapshot of `data/*.db` to S3.
- Postgres: managed daily snapshots + PITR. Test restores quarterly.
- Rotate `ENCRYPTION_KEY` with a re-encryption job (read rows → decrypt with old key → encrypt with new → write). Never drop rows.

## 8. Release checklist

- [ ] Secrets set (JWT, ENCRYPTION_KEY, provider URLs).
- [ ] `npm ci --omit=dev` in build.
- [ ] Static dashboard under `public/` is bundled with the image.
- [ ] `X-Forwarded-For` trusted (`app.set('trust proxy', 1)` is on).
- [ ] TLS enforced at LB.
- [ ] Webhook endpoints whitelisted on provider dashboards.
- [ ] Alerting on 5xx rate, auth failures spike, pending transactions > threshold.

## 9. Roadmap stubs

- Swap in Redis-backed rate limiting and session store.
- Stripe integration for the subscriptions module (replace the manual `paymentReference`).
- Per-school webhook retry queue + dead-letter.
- Export audit logs to S3 via a scheduled job.
- Add e2e tests (Playwright) for the dashboard and integration tests for each provider using `nock`.
