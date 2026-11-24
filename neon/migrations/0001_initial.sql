-- Scan-app Neon PostgreSQL schema. Run in the Neon SQL Editor before deployment.
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY, "name" text NOT NULL, "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false, "image" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY, "expiresAt" timestamptz NOT NULL, "token" text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text, "userAgent" text, "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY, "accountId" text NOT NULL, "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" text, "refreshToken" text, "idToken" text,
  "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz,
  "scope" text, "password" text, "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY, "identifier" text NOT NULL, "value" text NOT NULL,
  "expiresAt" timestamptz NOT NULL, "createdAt" timestamptz DEFAULT now(), "updatedAt" timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");
CREATE TABLE IF NOT EXISTS ports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80), webhook_url text NOT NULL,
  token_hash text NOT NULL UNIQUE, webhook_secret text NOT NULL, enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ports_user_id_idx ON ports(user_id);
CREATE TABLE IF NOT EXISTS scan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), port_id uuid NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  external_request_id text NOT NULL, client_payload text NOT NULL, scanner_token_hash text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(port_id, external_request_id)
);
CREATE INDEX IF NOT EXISTS scan_requests_port_created_idx ON scan_requests(port_id, created_at DESC);
CREATE TABLE IF NOT EXISTS scan_events (
  id uuid PRIMARY KEY, port_id uuid NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES scan_requests(id) ON DELETE CASCADE,
  barcode text NOT NULL CHECK (char_length(barcode) BETWEEN 1 AND 512), payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scan_events_request_created_idx ON scan_events(request_id, created_at DESC);
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES scan_events(id) ON DELETE CASCADE,
  port_id uuid NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('delivered','failed')), http_status integer,
  response_excerpt text, attempts integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS webhook_deliveries_port_created_idx ON webhook_deliveries(port_id, created_at DESC);
-- Database access is server-only. No browser data API or public database credentials are exposed.
