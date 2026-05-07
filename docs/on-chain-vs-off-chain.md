# On-Chain vs Off-Chain Data

## Stored On-Chain

- roles;
- batch id;
- production and expiration timestamps;
- metadata hash;
- temperature hash;
- product serial number;
- current owner;
- status;
- recall state;
- immutable product history.

This data is important for trust and independent verification.

## Stored Off-Chain

- human-readable descriptions;
- organization records;
- additional batch metadata;
- cached transaction hashes;
- analytics;
- audit logs;
- optional certificate files or IPFS URLs.

This data is useful for search and UI, but it is not the source of truth for ownership or authenticity.

## Why This Split

Blockchain writes cost gas and public data is visible. The project stores only trust-critical facts on-chain and keeps bulky readable information in PostgreSQL or optional IPFS.
