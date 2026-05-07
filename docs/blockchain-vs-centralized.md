# Blockchain vs Centralized Database

## Centralized Database

Advantages:

- simpler to build;
- faster queries;
- cheaper storage;
- easy updates.

Weaknesses:

- administrator can change history;
- consumers must trust one company;
- disputes require database owner cooperation;
- counterfeiters can exploit weak integration points.

## Blockchain-Based Tracking

Advantages:

- history is append-only;
- ownership transfers are signed by wallets;
- consumers can independently verify product existence;
- regulator recall is visible to all participants;
- product metadata hashes make tampering detectable.

Weaknesses:

- gas costs;
- slower writes;
- public data must be selected carefully;
- wallet UX is more complex.

## Project Decision

This diploma project uses blockchain only where it adds trust:

- product ownership;
- status;
- batch recall;
- immutable history;
- authenticity verification.

The backend remains useful for search, metadata, analytics and audit logs, but it is not the source of truth for the supply chain.
