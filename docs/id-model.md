# ID Model

Six different identifiers live in this system.  Confusing them is the
single biggest source of UX bugs and on-chain reverts (the famous
`invalid BigNumberish string: Cannot convert BATCH-2026-001 to a BigInt`
came directly from typing a business batch number into a numeric
on-chain ID field).  Use the table below as the canonical reference.

| Concept | Type | Where it lives | Who creates it | User-facing? | Example |
|---|---|---|---|---|---|
| **Blockchain product ID** | `uint256` | smart-contract `_products[id]` mapping | auto-increment in `createProduct` | yes, numeric | `1`, `2`, `342` |
| **Blockchain batch ID** | `uint256` | smart-contract `_batches[id]` mapping | auto-increment in `createBatch` | yes, numeric | `1`, `2`, `17` |
| **Batch number** | `string` (human label) | off-chain `product_batch_metadata.batch_number` | manufacturer / ERP / GMP system | yes, human-readable | `BATCH-2026-001` |
| **Serial number** | `string` (human label) | on-chain `productIdBySerial` map + off-chain metadata | manufacturer at product registration | yes, human-readable | `SN-DEMO-001`, `RU-AS-001` |
| **DB id** | `BIGSERIAL` primary key | backend Postgres tables | Postgres `IDENTITY` | NO — never required in user forms | `15` |
| **QR token / packaging unit ID** | UUID or signed payload | (future) `packaging_units` table | server when issuing signed QR | NO — scanned, never typed | `b39d…2af1` + signature |

---

## Mapping between layers

```
   Smart contract (on-chain)         Backend / Postgres (off-chain)
   ─────────────────────────         ───────────────────────────────
   Product { id: uint256 }   ◄────►  product_metadata
                                       blockchain_product_id : BIGINT  ← same value
                                       batch_number          : string  (the LABEL)
                                       expiration_date       : date
                                       description           : text

   Batch { batchId: uint256 } ◄───►  product_batch_metadata
                                       blockchain_batch_id   : BIGINT  ← same value
                                       batch_number          : string  (the LABEL)
                                       manufacturer_name     : string
                                       production_date / expiration_date
                                       metadata_hash / temperature_hash
```

* The contract has *no* concept of `batch_number` — it only knows the
  uint256 `batchId`.  The string label is purely descriptive metadata.
* `serial_number` IS on-chain (it’s the lookup key in
  `productIdBySerial`) — but it must round-trip the off-chain metadata
  unchanged (case + whitespace normalised on the frontend, never in
  Solidity).

---

## When you see a field, ask: which one is it?

* If the value is a small integer like `1`, `2`, `15` → **Blockchain ID**.
  Type goes to `uint256`.  Frontend must validate `/^\d+$/` before sending
  to ethers, otherwise BigNumberish error.
* If the value contains letters, hyphens, or year/serial style numbering
  like `BATCH-2026-001`, `LOT/24/Q4-A` → **batch number** (a `string`).
  Goes only into off-chain metadata fields.
* If the value is on a pharmacy package barcode → **serial number**, also
  a string but lives on-chain as a mapping key.
* If the value looks like a UUID printed near a QR → **QR token** (future
  v2 feature, signed packaging-unit ID).
* If the value is the auto-increment Postgres `id` from a JSON response
  → **DB id**, never expose in forms.

## UX rules baked into the codebase

1. After `createBatch` the frontend auto-fills the numeric **Blockchain
   batch ID** field in step 2 of the Register Product flow.  Manual
   override is behind a "ввести вручную" toggle and validated with
   `requirePositiveInteger`.
2. Every numeric input that ends up in a `uint256` contract argument is
   guarded by `requireUint(value, fieldName)` in `lib/contract.ts` so the
   error surfaces in Russian *before* ethers tries to encode.
3. Labels in forms are explicit:
   - "Blockchain product ID (число)" — for uint256
   - "Blockchain batch ID (число)" — for uint256
   - "Номер партии производителя" — for the human string
   - "Серийный номер с упаковки" — for the on-chain string key
4. DB id is never asked for in any user form.  Backend responses that
   include it use the JSON field `id` so the frontend can ignore it.

## Future evolution

* When **packaging units** ship (Iteration 9 Part B), the canonical
  consumer ID for a single physical package becomes the signed QR
  token.  Serial number remains the manufacturer-side ID; multiple
  packages may share a serial when packaging hierarchy is added.
* When **CAIP-10 / EIP-155** multi-chain support lands, the on-chain IDs
  become `(chainId, contract, blockchainProductId)` tuples; the type of
  `blockchainProductId` does not change, but DB columns gain `chain_id`.
