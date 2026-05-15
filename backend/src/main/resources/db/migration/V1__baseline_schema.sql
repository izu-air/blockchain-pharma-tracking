CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    country VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_metadata (
    id BIGSERIAL PRIMARY KEY,
    blockchain_product_id BIGINT NOT NULL UNIQUE,
    batch_number VARCHAR(255) NOT NULL,
    expiration_date DATE NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_batch_metadata (
    id BIGSERIAL PRIMARY KEY,
    blockchain_batch_id BIGINT NOT NULL UNIQUE,
    batch_number VARCHAR(255) NOT NULL,
    production_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    temperature_log_hash VARCHAR(66),
    metadata_hash VARCHAR(66),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_events (
    id BIGSERIAL PRIMARY KEY,
    blockchain_product_id BIGINT NOT NULL,
    blockchain_batch_id BIGINT,
    event_type VARCHAR(64) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_events_dedup
    ON product_events (transaction_hash, event_type, blockchain_product_id);

CREATE INDEX IF NOT EXISTS idx_product_events_product_id ON product_events (blockchain_product_id);
CREATE INDEX IF NOT EXISTS idx_product_events_batch_id ON product_events (blockchain_batch_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    details VARCHAR(1200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS indexer_state (
    id BIGINT PRIMARY KEY,
    last_processed_block BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    wallet_address VARCHAR(42) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS temperature_logs (
    id BIGSERIAL PRIMARY KEY,
    blockchain_batch_id BIGINT NOT NULL,
    log_hash VARCHAR(66) NOT NULL,
    recorded_by VARCHAR(42) NOT NULL,
    celsius_min DOUBLE PRECISION,
    celsius_max DOUBLE PRECISION,
    notes VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_temperature_logs_batch ON temperature_logs (blockchain_batch_id);

CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    operation_type VARCHAR(64) NOT NULL,
    actor_wallet VARCHAR(42),
    status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
