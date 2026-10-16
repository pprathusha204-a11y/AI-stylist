# Callback widget

Implemented locally using the existing React/Vite, Express, MySQL dependency, Jost font and slate branding. The service dropdown comes from the backend and uses the five services already shown in StylistWelcome. No email service or database connection module existed in this checkout; a server-only SMTP adapter and MySQL pool were added.

## Required setup (before deployment)

1. Copy `server/.env.example` to `server/.env`. Supply `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` for the existing MySQL database. Use a least-privilege application user with SELECT/INSERT/UPDATE/DELETE access to the callback tables.
2. Apply `server/database/callback.sql` to that database using your MySQL administration tool. This is an additive, repeatable migration; no existing tables are changed. Run it separately from starting the app.
3. Supply your company's `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and `CALLBACK_NOTIFY_TO`. Port 587 normally uses `SMTP_SECURE=false` with STARTTLS; port 465 uses `true`. Your provider must authorize the sender address. Never place these credentials in client environment variables.
4. Set `CLIENT_URL` to the exact website origin. Copy `client/.env.example` to `client/.env` and set `VITE_API_URL` to the backend API URL (ending in `/api`). Rebuild the client after changing it. Use HTTPS in production.
5. If behind a reverse proxy, set `TRUST_PROXY_HOPS` to the actual number of trusted hops and prevent clients bypassing that proxy. Leave it unset for direct connections. Incorrect settings compromise IP rate limiting.

## Behavior

`GET /api/callback/services` lists the services. `POST /api/callback` validates the name, international phone number and service, then writes a timestamped Pending record. A unique request key makes retries idempotent. The browser shows success only after an affirmative saved-record response. Requests are limited to five attempts per IP per 15-minute window in MySQL, shared across server processes. Honeypot, origin checks, minimum form time and a 4 KB body limit provide basic spam protection. No automatic customer calls occur.

The same row contains a durable notification outbox. The running Express server checks it every 30 seconds; failed notifications remain Pending and retry after five minutes. SMTP success marks `notification_status=Sent`. A MySQL advisory lock prevents concurrent workers sending the same batch. SMTP acceptance confirms provider receipt, not inbox delivery; a crash between sending and recording may produce a repeated notification. With missing configuration, the database request can still succeed while email waits for setup. Server logs identify missing database/email setup without printing customer details or secrets.

Staff can read callback requests through the existing database administration tools, order by `created_at`, and update `status` to `Contacted` or `Closed`. No unauthenticated request-list endpoint is exposed. Keep the Express process running for outbox delivery; follow company retention policy for customer records.

The native modal supports Escape, close button, focus containment and focus return. The phone launcher avoids the current fixed composer and fixed cookie/control panels near its corner. For externally injected controls, add `data-callback-obstacle` to their outer container or increase the host's bottom spacing as needed. The popup intentionally takes focus while open.

## Verification

From `server`, run `npm test`. This covers endpoint validation, origin rejection, rate-limit responses, saved-record acknowledgement, idempotent retry contract, database failure and SMTP delivery to a local test receiver, plus existing order-guidance tests.

To verify real persistence, apply the migration to a **test database**, supply its DB variables, set `CALLBACK_DB_TEST=true`, and run `npm test`. This opt-in test checks actual stored fields, Pending status, timestamp, retry uniqueness and concurrent rate counters, then removes its test records. It sends no company email.

From `client`, run `npm run test:callback`. Chrome tests cover opening/closing, keyboard focus, Escape, validation, loading, failure/retry, success and layouts at 1280, 375 and 320 pixels, plus a simulated cookie banner. Set `CHROME_PATH` if Chrome is installed elsewhere. Browser API responses are mocked so these UI tests do not send customer data.

Build using `npm run build` in each project. On this Windows host Vite needed `npm run build -- --configLoader runner` to avoid its config bundler's native-module issue.

No MySQL instance or company mail credentials were available during implementation. Live database storage and company-inbox delivery require the above setup and a final end-to-end form submission. Deployment remains a separate step.
