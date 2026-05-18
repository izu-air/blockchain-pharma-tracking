# Blockchain event indexer

The backend mirrors a subset of `SupplyChain.sol` events into the
`product_events` Postgres table so analytics, history pages, and ops
don't have to issue `eth_getLogs` for every read.

## Why

* `verifyProductBySerial` is a single call — fine for one product.
* But "show me every event for batch N over the last 30 days" requires
  scanning logs, which is expensive on a public RPC.
* The indexer keeps a cache so those queries hit Postgres.

## Schema

```text
product_events
├── id                    BIGSERIAL PK
├── blockchain_product_id BIGINT     (0 for batch-level events)
├── blockchain_batch_id   BIGINT     (nullable; populated for batch events)
├── event_type            VARCHAR(40)
├── transaction_hash      VARCHAR(66)
├── block_number          BIGINT     (V5 — nullable; populated by indexer)
├── log_index             BIGINT     (V5 — nullable; populated by indexer)
└── created_at            TIMESTAMPTZ
```

Unique key (V5):
`(transaction_hash, COALESCE(log_index, -1), event_type)` — strong enough
to dedup canonical indexer rows AND the best-effort writes from the
frontend (where `log_index` is null).

## Configuration

| env var                          | default          | meaning                                                                 |
|----------------------------------|-------------------|--------------------------------------------------------------------------|
| `BLOCKCHAIN_INDEXER_ENABLED`     | `false`           | Master switch. Keep `false` until RPC URL is configured.                 |
| `BLOCKCHAIN_RPC_URL`             | empty             | HTTP RPC endpoint, e.g. `http://127.0.0.1:8545` or Infura URL.           |
| `BLOCKCHAIN_CONTRACT_ADDRESS`    | empty             | `0x…` of the deployed `SupplyChain` instance.                            |
| `BLOCKCHAIN_INDEXER_START_BLOCK` | `0`               | First block to ever index.  Set to the deploy block for chains with long history. |
| `BLOCKCHAIN_INDEXER_CHUNK_SIZE`  | `2000`            | Block range per `eth_getLogs` call (some RPCs cap this).                 |
| `BLOCKCHAIN_INDEXER_CONFIRMATIONS` | `1`             | Skip the last N blocks to avoid reorgs.  Use `12` on Ethereum mainnet.   |
| `BLOCKCHAIN_INDEXER_DELAY_MS`    | `30000`           | Polling interval for the `@Scheduled` job.                               |

## Behaviour

1. **First run** — bootstraps the `IndexerState` row with
   `last_processed_block = start_block - 1`, then processes
   `[start_block, safeLatest]` chunk by chunk.  No "latest-1" history
   skip.
2. **Subsequent runs** — process `[lastProcessed+1, safeLatest]` capped
   at `chunk_size`.  `safeLatest = latest - confirmations`.
3. **Idempotent** — relies on the V5 unique index.  Re-running the
   indexer over the same blocks is safe.
4. **Logging** — each iteration logs `blocks X-Y, persisted N events`
   at INFO; failures go to ERROR and an `INDEXER_FAILURE` audit_log
   entry.

## Reorg strategy

The MVP uses confirmation delay only — a configurable number of trailing
blocks is *not* processed.  This is sufficient for Hardhat (no reorgs)
and 99% of Ethereum mainnet cases (12 confirmations covers re-org depth
historically).  Stronger options for v2:

* Store block hash alongside `block_number`; on each tick fetch the
  current hash for the highest processed block and if it differs,
  rewind to the latest unchanged ancestor.
* Subscribe to `newHeads` instead of polling; more complex,
  diminishing returns on Hardhat / consortium chains.

## Ops endpoints (ADMIN only)

```
POST /api/indexer/run                       # process one chunk now
POST /api/indexer/backfill?from=X&to=Y      # explicit range re-index
```

Both are guarded by `@PreAuthorize("hasRole('ADMIN')")` and require a
valid JWT from a wallet bootstrapped via `APP_ADMIN_WALLET`.

## What this replaces

Pre-Iter 8 the frontend made a best-effort `POST /api/product-events`
after every transaction.  That call still exists (it's how
`RecallPage` / `RegisterProductPage` cache an event before the indexer
catches up) but **is no longer the source of truth** — the indexer can
fully rebuild the table from chain logs.  If a user closes the browser
mid-transaction the indexer will pick the event up on its next tick.

## Future work (out of scope for this iteration)

* Replace the polled `eth_getLogs` with a Subgraph or pub/sub provider.
* Add `chain_id` and `contract_address` columns so the table can hold
  events from multiple deployments simultaneously.
* Add an admin UI surface for triggering backfill (currently a curl
  invocation only).
