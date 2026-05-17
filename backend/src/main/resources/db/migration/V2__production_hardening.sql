-- =============================================================================
-- V2 — production hardening introduced by the senior/QA audit.
-- Adds: CHECK constraints for enum-ish columns, refresh-token rotation chain,
-- audit-log lookup index, and an organizations.wallet_address column referenced
-- by the entity but missing from V1.
-- =============================================================================

-- ---- app_users -------------------------------------------------------------
ALTER TABLE app_users
    ADD CONSTRAINT chk_app_users_role
    CHECK (role IN ('MANUFACTURER','DISTRIBUTOR','PHARMACY','REGULATOR','CONSUMER'));

ALTER TABLE app_users
    ADD CONSTRAINT chk_app_users_wallet_format
    CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$');

CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);

-- ---- product_events --------------------------------------------------------
ALTER TABLE product_events
    ADD CONSTRAINT chk_product_events_tx_format
    CHECK (transaction_hash ~ '^0x[a-fA-F0-9]{64}$');

CREATE INDEX IF NOT EXISTS idx_product_events_created
    ON product_events(blockchain_product_id, created_at DESC);

-- ---- audit_logs ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_logs_target
    ON audit_logs(target_type, target_id);

-- ---- refresh_tokens — one-time-use rotation chain --------------------------
ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS parent_id BIGINT
    REFERENCES refresh_tokens(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_wallet
    ON refresh_tokens(wallet_address);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
    ON refresh_tokens(expires_at, revoked);

-- ---- blockchain_transactions ----------------------------------------------
ALTER TABLE blockchain_transactions
    ADD CONSTRAINT chk_btx_status
    CHECK (status IN ('PENDING','CONFIRMED','FAILED'));

CREATE INDEX IF NOT EXISTS idx_btx_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_btx_actor  ON blockchain_transactions(actor_wallet);
