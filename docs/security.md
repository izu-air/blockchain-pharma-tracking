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

The backend includes demo JWT authentication by registered wallet address. This is intentionally simple for a diploma MVP. Real production authentication would require wallet signature verification, nonce challenge, token revocation and stricter authorization filters.

## Privacy Tradeoff

The contract stores hashes for metadata and temperature logs instead of storing full private documents on-chain. This keeps the public chain useful for verification without exposing sensitive details.
