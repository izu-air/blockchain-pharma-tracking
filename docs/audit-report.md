# Professional audit report

## Scope

- Solidity `SupplyChain` (roles, batches, serialization, recall, history, verification).
- Hardhat configuration and contract tests.
- React / TypeScript frontend (routing, MetaMask, API, UX, Vitest).
- Spring Boot backend (JPA, DTOs, JWT, security, indexing, OpenAPI).
- Documentation and reproducible local setup.

## Executive summary

The codebase already demonstrated a coherent split: **on-chain truth** for ownership, status, recall and immutable history, and **off-chain** PostgreSQL for human-readable metadata, analytics and audit logs. This pass hardened **API security**, **JWT correctness**, **event indexing**, **frontend stability** (routes, verification flow, theming, chain checks), and **seed data** aligned with default Hardhat accounts so a defense demo works without manual SQL edits.

## Issues addressed in this revision

1. **JWT never expired in authorization path** — `JwtService.isValid` only checked the HMAC signature. **Fix:** `parseValidToken` verifies signature and `exp`; login continues to issue 24h tokens with an overload for tests.

2. **Mutating backend APIs were effectively anonymous** — any client could POST metadata or events. **Fix:** Spring Security with a bearer JWT filter; `GET` and `POST /api/auth/login` and `POST /api/users` stay public; other `POST`/`PUT`/`PATCH`/`DELETE` require authentication. Profile flag `app.security.require-authentication-for-mutations` (env `REQUIRE_JWT_FOR_WRITES`) defaults to `true` and is **`false` in `application-test.yml`** so automated tests stay simple.

3. **Blockchain indexer was a stub** — it incremented a counter without reading the chain. **Fix:** Web3j-backed `eth_getLogs` over configured topics, persisting deduplicated rows via `ProductEventService` (idempotent on `transactionHash` + `eventType` + `blockchainProductId`) and checkpointing in `indexer_state`.

4. **Duplicate Solidity entrypoint** — misspelled `unrecalledBatch` wrapper added surface area without benefit. **Fix:** removed; regulators use `unrecallBatch`.

5. **Broken product deep-link** — `/products/:id` rendered `HistoryPage` without using the route param. **Fix:** `ProductDetailsPage` passes `initialProductId`; `HistoryPage` auto-loads from the URL.

6. **QR / serial verification race** — `useEffect` depended incorrectly on search params. **Fix:** stable `serialFromUrl` string and `useCallback` for verification; link from verify page to full on-chain timeline.

7. **UI inconsistency** — several panels used light “stone” styles on a dark layout. **Fix:** unified slate/emerald system across `ProductCard`, `HistoryTimeline`, `RegisterProductPage`, `ResultMessage`, and wallet role text.

8. **Wrong network risk** — optional `VITE_CHAIN_ID` plus `ensureExpectedChain()` before state-changing contract calls.

9. **Frontend test runner not wired** — tests existed but `package.json` lacked Vitest. **Fix:** Vitest + `vitest/config` in Vite, `npm test` script; builds and tests verified in CI-friendly commands.

10. **Constraint violations on path/query params** — could surface as generic 500s. **Fix:** `ConstraintViolationException` handler in `GlobalExceptionHandler`.

11. **Demo users did not match Hardhat keys** — JWT login could not match MetaMask on a local node. **Fix:** `data.sql` seeds accounts `0xf39F…`, `0x7099…`, `0x3C44…`, `0x90F7…` (Hardhat defaults) and adds `REGULATOR` in `UserRole`.

## Residual risks / limitations (defense talking points)

- **Unbounded batch loops** in `recallBatch` / `unrecallBatch` are \(O(n)\) over units in a batch — acceptable for a diploma prototype, not for huge national inventories without pagination or merkle strategies.
- **`unrecallBatch`** restores recalled units to `InTransit`, not necessarily the pre-recall economic status — document as regulatory “clear to re-enter logistics under new assessment”.
- **Indexer** assumes event topic0 hashes match the compiled ABI; after **contract ABI changes**, topic constants in `BlockchainEventIndexerService` must be recomputed (`ethers.id` of the canonical event signature).
- **JWT** is a compact custom HS256 implementation suitable for a demo; production would use a standard library, refresh/rotation, and asymmetric keys.

## Verification

- `contracts`: `npx hardhat test` — 10 tests passing (including role/authorization negatives).
- `frontend`: `npm run build`, `npm test` — passing.
- `backend`: requires **JDK 17+** and **Maven** on the host; `mvn test` is expected to pass with the H2 test profile and security mutations disabled for tests.
