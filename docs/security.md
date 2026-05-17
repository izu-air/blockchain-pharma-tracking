# Security Explanation

## Smart Contract Security

The contract uses OpenZeppelin `AccessControl` instead of custom role logic. This reduces the risk of implementing role checks incorrectly.

Implemented protections:

- only manufacturers create batches and products;
- duplicate serial numbers are rejected;
- only current owner can transfer or update product status;
- transfers are allowed only between authorized supply-chain actors;
- only pharmacies can mark products as sold;
- recalled products are blocked;
- sold products cannot be transferred;
- `operationId` prevents replay of the same business operation;
- product and batch existence checks prevent reading default mapping values as valid records.

## Anti-Counterfeit Logic

Each product has a unique `serialNumber`. A counterfeit product cannot create a duplicate serial number in the contract. Consumers verify a product by serial number or QR URL and read the on-chain state directly.

## Recall Safety

When a regulator recalls a batch, unsold products are marked as blocked. Pharmacies cannot sell blocked or recalled products.

## Backend Security

### Wallet-signature login (SIWE-like)

Authentication is two-step and password-less:

1. `POST /api/auth/nonce { walletAddress }` issues a one-time message.  The
   challenge is stored as a SHA-256 hash with a 5-minute TTL.  A DB leak
   does not expose still-active challenges.
2. The user signs the message with MetaMask (`personal_sign`, EIP-191).
3. `POST /api/auth/login { walletAddress, message, signature }` recovers
   the signer with `web3j.crypto.Sign`, compares to `walletAddress` case-
   insensitively, atomically marks the nonce consumed, and returns a JWT.

Failure modes are all surfaced as `403 Forbidden` to avoid leaking which
step failed (bad signature vs. unknown wallet vs. expired nonce).  Every
login attempt — success or failure — is written to `audit_logs` with the
actor wallet pseudonymized via `WalletPseudonymizer` (HMAC-SHA256 with a
server-side pepper).

### Role model

User roles live in two tiers:

- **Off-chain JWT role** (`UserRole`): `ADMIN`, `MANUFACTURER`,
  `DISTRIBUTOR`, `PHARMACY`, `REGULATOR`, `CONSUMER`.  Enforced by Spring
  Security `@PreAuthorize` annotations on controllers.
- **On-chain role**: OpenZeppelin `AccessControl` in `SupplyChain.sol`.
  The blockchain is the ultimate authority — a forged JWT cannot bypass
  the `onlyRole(...)` modifier.

Public self-registration via `POST /api/users` is restricted to
`CONSUMER`.  All other roles must be created by an authenticated
`ADMIN`.  An ADMIN bootstrap path is provided via `APP_ADMIN_WALLET` so
fresh deployments are not locked out.

### Token & secret hygiene

- JWT HS256 with constant-time signature comparison (`MessageDigest.isEqual`);
  the secret must be ≥ 32 chars or startup fails.
- Refresh tokens are stored as SHA-256 hashes, single-use, and any reuse
  attempt revokes the whole token family for that wallet.
- `AUDIT_PEPPER` is required in production so audit-log pseudonyms are
  not reproducible by an attacker who knows the algorithm but not the
  pepper.
- CORS allow-list is explicit; no wildcard with credentials.

## Privacy Tradeoff

The contract stores hashes for metadata and temperature logs instead of storing full private documents on-chain. This keeps the public chain useful for verification without exposing sensitive details.
