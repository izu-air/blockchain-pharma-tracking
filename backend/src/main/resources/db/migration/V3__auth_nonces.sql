-- =============================================================================
-- V3 — Wallet-signature login (SIWE-like)
--
-- Replaces the previous "login by wallet address only" with a challenge-
-- response flow:
--   1. POST /api/auth/nonce   -> server issues a one-time message
--   2. Client signs the message with MetaMask (personal_sign / EIP-191)
--   3. POST /api/auth/login    -> server verifies signature, marks nonce used,
--                                 issues JWT
--
-- Nonces are stored hashed (SHA-256) — leaking the table does not let an
-- attacker replay a not-yet-used challenge.
-- =============================================================================

CREATE TABLE IF NOT EXISTS auth_nonces (
    id              BIGSERIAL     PRIMARY KEY,
    wallet_address  VARCHAR(42)   NOT NULL,
    nonce_hash      VARCHAR(128)  NOT NULL,
    message         TEXT          NOT NULL,
    expires_at      TIMESTAMPTZ   NOT NULL,
    used            BOOLEAN       NOT NULL DEFAULT FALSE,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_auth_nonces_wallet
        CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Lookup: "find latest active challenge for wallet X" during login.
CREATE INDEX IF NOT EXISTS idx_auth_nonces_wallet_active
    ON auth_nonces (wallet_address, used, expires_at DESC);

-- Cleanup: cron job deletes expired / used rows.
CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires
    ON auth_nonces (expires_at)
    WHERE used = FALSE;

-- Defense against duplicate challenge with same hash collision.
CREATE UNIQUE INDEX IF NOT EXISTS uq_auth_nonces_hash
    ON auth_nonces (nonce_hash);
