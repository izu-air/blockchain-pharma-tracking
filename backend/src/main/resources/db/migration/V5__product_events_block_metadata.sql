-- =============================================================================
-- V5 — extend product_events with block-level fields so the table can serve
-- as a rebuildable canonical event cache (Iter 8).
--
-- The original V1 already defines an optional blockchain_batch_id BIGINT
-- nullable column, so the only additions here are block_number / log_index
-- for reorg-aware indexing plus a stricter uniqueness key.
-- =============================================================================

ALTER TABLE product_events
    ADD COLUMN IF NOT EXISTS block_number BIGINT,
    ADD COLUMN IF NOT EXISTS log_index    BIGINT;

-- The old uniqueness constraint included blockchain_product_id, which is
-- 0 for batch-level events (BATCH_CREATED / BATCH_RECALLED).  Concurrent
-- runs of the indexer used to insert duplicates because (tx_hash, type, 0)
-- compared equal across the same block.  Replace with a stronger composite
-- key that includes log_index when present.
DROP INDEX IF EXISTS uq_product_events_idempotency;
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_events_canonical
    ON product_events (transaction_hash, COALESCE(log_index, -1), event_type);

-- Speed up "latest events first" admin/regulator queries.
CREATE INDEX IF NOT EXISTS idx_product_events_block
    ON product_events (block_number DESC NULLS LAST);
