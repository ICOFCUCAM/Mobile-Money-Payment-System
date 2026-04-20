# School Payment SaaS

A multi-tenant SaaS that lets schools accept tuition and fee payments over mobile money (MTN MoMo, Orange Money, etc.). Each school is an isolated tenant with its own students, provider credentials, dashboard, subscription plan and audit trail.

## Highlights

- **Multi-tenant by design.** Every table carries a `school_id`. A dedicated `tenantResolver` middleware plus scoped queries make cross-tenant leaks structurally impossible.
- **Tenant resolution** via JWT (user sessions), `X-API-Key` (machine), `X-School-Slug` header or subdomain (`<slug>.yourapp.com`).
- **Provider abstraction layer.** A small `BaseProvider` contract plus a `ProviderFactory` registry lets you drop in new providers (Wave, M-Pesa…) without touching the rest of the code.
- **Pluggable subscription plans.** Plan features (max students, available providers, reports, audit logs) are enforced in middleware (`planGuard`).
- **Secure by default.** AES-256-GCM encryption of provider credentials at rest, bcrypt password hashes, HMAC signature verification on webhooks, helmet, strict rate limiting, per-tenant isolation, audit log on every sensitive action.
- **Batteries included.** Postgres-backed (Neon/Vercel-PG/Supabase/self-hosted). Vercel serverless entry + `vercel.json` out of the box. Optional Upstash Redis for multi-instance rate limits. Static SPA dashboard.

## Quick start (local)

```bash
cp .env.example .env
# edit DATABASE_URL, ENCRYPTION_KEY, JWT_SECRET
npm install
npm run migrate       # creates schema in Postgres
npm start             # or: npm run dev (nodemon)
```

Open <http://localhost:3000/>, register a school, log in, configure a provider, add students, submit a payment.

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploy to Vercel

Short version:

```bash
npx vercel login && npx vercel link
npx vercel env add DATABASE_URL production     # Neon postgres URL (?sslmode=require)
npx vercel env add ENCRYPTION_KEY production   # 64-char hex
npx vercel env add JWT_SECRET production       # long random
DATABASE_URL="<neon-url>" npm run migrate       # one-off schema create
npx vercel --prod
```

Full guide + Upstash/Redis + Docker options: see [`DEPLOYMENT.md`](./DEPLOYMENT.md).
API reference: [`openapi.yaml`](./openapi.yaml).

## Architecture

```
src/
  config/                 Environment + runtime config
  core/
    database.js           Schema + SQLite init, audit log helper
    encryption.js         AES-256-GCM + HMAC helpers
    errors.js             Typed error classes
    logger.js             Minimal structured logger
  middleware/
    auth.js               JWT + API-key auth, token helpers
    tenantResolver.js     Maps each request to exactly one school
    rbac.js               Role gates (admin | bursar | auditor)
    planGuard.js          Enforces plan feature flags
    rateLimiter.js        Per-IP / per-tenant limiters
    errorHandler.js       Unified error responses
  providers/
    BaseProvider.js       Contract every provider implements
    MTNProvider.js        MTN MoMo Collection API
    OrangeProvider.js     Orange Money WebPay
    ProviderFactory.js    Registry + per-school instantiation
  modules/
    schools/              Registration, admin, payment_configs
    auth/                 Login, user management
    students/             CRUD + quota enforcement
    payments/             Submit / verify / list / summary
    subscriptions/        Plans catalogue + plan changes
    webhooks/             Provider webhook ingestion
    dashboard/            Aggregated overview + reports
  utils/                  Validators + async handler
public/                   Static dashboard (vanilla JS SPA)
```

### Data model

| Table | Purpose |
| --- | --- |
| `schools` | Tenants. Holds API-key hash + plan. |
| `users` | Admins / bursars / auditors, one-to-many with `schools`. |
| `students` | Owned by a school, unique `(school_id, student_code)`. |
| `payment_configs` | Encrypted per-school provider creds. Unique `(school_id, provider)`. |
| `transactions` | Verified payments. Unique `(school_id, provider, external_id)` — prevents replay. |
| `subscriptions` | Plan history for billing/audit. |
| `audit_logs` | Every sensitive mutation (register, config change, payment, etc.). |

## API cheat-sheet

All `/api/*` routes are rate-limited. Authenticated routes accept either a JWT (`Authorization: Bearer …`) or a per-school API key (`X-API-Key: …`) where marked.

```
POST   /api/schools/register            Public. Creates school + admin. Returns one-time API key.
POST   /api/auth/login                  { email, password, schoolSlug? } -> { token, user, school }
GET    /api/auth/me                     JWT. Who am I + which school.
POST   /api/auth/users                  Admin. Invite bursar/auditor users.

GET    /api/schools/me                  JWT. School profile.
PATCH  /api/schools/me                  Admin. Update name / phone / active.
POST   /api/schools/me/api-key/rotate   Admin. Rotate the API key (returned once).
GET    /api/schools/me/payment-configs  Admin/Bursar. List configured providers.
PUT    /api/schools/me/payment-configs  Admin. Upsert provider creds (encrypted).

GET    /api/students                    JWT or API key. ?q= search, ?limit&offset.
POST   /api/students                    Admin/Bursar. Creates a student (plan cap enforced).
PATCH  /api/students/:id                Admin/Bursar.
DELETE /api/students/:id                Admin.

POST   /api/payments                    Submit { studentCode, provider, externalId } for verification.
GET    /api/payments                    List. ?status, ?provider, ?studentId, ?limit&offset.
GET    /api/payments/summary            Dashboard tiles.

GET    /api/dashboard/overview          Aggregated tiles + recent activity.
GET    /api/dashboard/report?days=30    Pro+ plans only. Time series.

GET    /api/subscriptions/plans         Public catalogue.
GET    /api/subscriptions/current       Current plan + history.
POST   /api/subscriptions/change        Admin. { plan: 'pro', paymentReference }.

POST   /webhooks/:provider/:schoolSlug  Provider callback (HMAC-signed; no auth header).
```

### Submitting a payment

```http
POST /api/payments
X-API-Key: sk_...        (or Bearer <JWT>)
Content-Type: application/json

{
  "studentCode": "STU102",
  "provider": "MTN",
  "externalId": "MoMo-REF-XYZ123"
}
```

The platform looks up the school's MTN credentials, calls MTN's verify API with the reference, and — only if the provider confirms status `SUCCESSFUL` — records the transaction and credits the student in a single DB transaction. The `UNIQUE(school_id, provider, external_id)` constraint plus application-level duplicate checks prevent the same transaction ID from being used twice.

### Webhook flow

1. MTN / Orange calls `POST /webhooks/MTN/<school-slug>` with the payment event.
2. The webhook handler resolves the school, instantiates its provider, and verifies the signature using the school's own `api_secret` (HMAC-SHA256).
3. The normalised event is upserted idempotently. If a matching `pending` row already exists it's promoted to `success` and the student is credited.

## Adding a new provider

1. Create `src/providers/<Name>Provider.js` extending `BaseProvider` and implement `verifyTransaction`, `verifyWebhook`, `parseWebhook` (and optionally `requestPayment`).
2. Register it in `ProviderFactory.js`:

   ```js
   const WaveProvider = require('./WaveProvider');
   registerProvider(WaveProvider.id, WaveProvider, 'https://api.wave.com');
   ```

3. If you want it gated by plan, add the provider id to `plans.js` under `features.providers`.

That's it — the controllers, webhooks and dashboard dropdown all discover the new provider automatically.

## Security notes

- **Credentials at rest**: `payment_configs.api_key`/`api_secret` are stored as base64 AES-256-GCM blobs keyed by `ENCRYPTION_KEY` (32-byte hex). The key never leaves the server.
- **Passwords**: bcrypt with 12 rounds.
- **API keys**: only the SHA-256 hash (`api_key_hash`) is persisted. Plaintext is shown once at creation / rotation.
- **Webhook signatures**: per-provider HMAC validation using `req.rawBody` (captured by the JSON parser) — no signature means reject.
- **Replay protection**: `UNIQUE(school_id, provider, external_id)` + explicit duplicate check in `payments.service.js`.
- **Tenant isolation**: every query scopes by `school_id`; the `tenantResolver` middleware and auth layer guarantee the school can't be spoofed from the client.
- **Rate limits**: global (`apiLimiter`), auth-specific (`authLimiter`), payment-specific (`paymentLimiter`, per-tenant).
- **Audit trail**: every mutation (register, config upsert, payment verify, subscription change, user create) lands in `audit_logs`.

## Testing the MTN / Orange integrations

The provider classes talk to MTN and Orange sandbox endpoints out of the box (`MTN_BASE_URL`, `ORANGE_BASE_URL` in `.env`). To run against production, simply set the real base URLs and plug in your production app credentials via `PUT /api/schools/me/payment-configs`.

For local development without network access, the provider methods gracefully surface `failed` + `raw.error` so the dashboard stays usable while you wire up the real tokens later.

## License

MIT
