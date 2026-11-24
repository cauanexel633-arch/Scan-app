# Scan-app

Secure barcode intake and webhook relay platform.

## Architecture
- Next.js App Router on Vercel
- Supabase Auth for dashboard accounts
- Supabase Postgres with Row Level Security
- Per-port random bearer tokens stored only as SHA-256 hashes
- Scanner events delivered immediately to each port's configured webhook
- HMAC-SHA256 signatures on outbound webhook requests

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and apply `supabase/migrations/0001_initial.sql`.
3. Configure the environment variables.
4. Run `npm install` and `npm run dev`.

## Security
Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Dashboard APIs require a verified Supabase session. Port APIs require a per-port bearer token. Configure webhook destinations only to trusted HTTPS endpoints.

See `docs/API.md` and `docs/SECURITY.md`.
