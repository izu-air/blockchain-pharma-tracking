# QR-code verification

## What the app does today (QR v1)

When a product is created, `RegisterProductPage` renders a QR encoded with:

```
<VITE_PUBLIC_APP_URL | window.location.origin>/verify?serial=SN-…&nonce=<uuid>&ts=<unix>&v=1
```

* `serial` — the human-readable manufacturer serial (matches the on-chain
  `productIdBySerial` lookup key).
* `nonce` — `crypto.randomUUID()`; cosmetic in v1, useful for audit logs.
* `ts` — issuance timestamp in seconds; used to surface a "QR is more
  than a year old" amber banner on `/verify`.
* `v` — schema version, reserved for future signed payloads.

When a consumer scans the QR (camera scanner or paste), `VerifyProductPage`
calls `verifyProductBySerial(serial)` on the contract and renders the
`{authentic, recalled, expired, blocked}` flags.  **The source of trust
is the blockchain**, not the QR — the QR is a convenient index, not an
authenticator.

## Threat model

| Attack                              | What stops it today (QR v1)                                                           |
|-------------------------------------|----------------------------------------------------------------------------------------|
| Scan a real QR off a real package   | Works as intended — buyer sees green badge.                                            |
| Print a QR with a fake serial       | `verifyProductBySerial` returns "Product does not exist" → red badge.                  |
| Print a QR with a *real* serial copied from a recalled lot | Contract returns `recalled: true` → red badge.                                         |
| Print a QR with a real serial of a still-valid product | **Not prevented** in v1 — any counterfeit package can carry the legitimate serial.     |
| Print a QR that points at attacker's clone of the dApp | Browser hostname differs — visible to a paranoid user but not auto-detected.            |

## Legacy "serial-only" verification

The current QR v1 is best understood as **"on-chain serialization with
QR convenience"**.  It confirms the *serial number* is one the
manufacturer published; it does **not** prove the *physical package* in
your hand was the one the manufacturer printed it on.

This is documented on `/verify` so a regulator cannot mistake an MVP
demo for a forensic anti-counterfeit assertion.

## Production-grade QR v2 (roadmap)

Add a signed payload that binds the URL to the manufacturer's private key:

```
…/verify?serial=SN-…&pu=<uuidv4>&ts=<unix>&sig=0x<eip191-signature>&v=2
```

* `pu` (packaging unit ID): unique per physical package, NOT per serial
  number, so repeated scans can be detected and per-package replays can
  be revoked individually.
* `sig` = `personal_sign(keccak256(abi.encodePacked(chainId, contract,
  productId, serial, pu, ts)))`.

Backend tables added in v2:

```sql
CREATE TABLE packaging_units (
    id                    UUID PRIMARY KEY,
    blockchain_product_id BIGINT NOT NULL,
    serial_number         VARCHAR(64) NOT NULL,
    qr_payload_hash       VARCHAR(128) NOT NULL,
    issued_by_wallet      VARCHAR(42)  NOT NULL,
    issued_at             TIMESTAMPTZ  NOT NULL,
    revoked               BOOLEAN      NOT NULL DEFAULT FALSE,
    scan_count            BIGINT       NOT NULL DEFAULT 0,
    first_scanned_at      TIMESTAMPTZ,
    last_scanned_at       TIMESTAMPTZ,
    suspicious            BOOLEAN      NOT NULL DEFAULT FALSE
);
```

Endpoints (`MANUFACTURER` only):

* `POST /api/qr/issue` — emits a fresh signed QR for a product.
* `POST /api/qr/{packagingUnitId}/revoke` — marks a unit revoked.

Public endpoint:

* `POST /api/qr/verify` — receives a scanned URL, recovers the signer,
  cross-references the on-chain `product.manufacturer`, increments
  `scan_count`, sets `suspicious = true` when `scan_count` exceeds a
  configurable threshold (default 5), responds:

```json
{
  "authentic": true,
  "qrValid": true,
  "productExists": true,
  "recalled": false,
  "expired": false,
  "blocked": false,
  "suspicious": false,
  "message": "OK",
  "product": { ... },
  "batch":   { ... }
}
```

`suspicious = true` does NOT auto-fail verification — the consumer UI
shows a yellow banner instead of green so they investigate, and the
regulator can decide to revoke or recall.

## UI distinction (v2)

| State                                                | Badge   | Meaning                                                             |
|------------------------------------------------------|---------|---------------------------------------------------------------------|
| `authentic && qrValid && !recalled && !expired && !suspicious` | Green   | Trust this package: product on chain + signed QR + fresh + clean.   |
| `authentic && qrValid && suspicious`                 | Yellow  | Real product, real QR, but scanned suspiciously many times — verify physically. |
| `authentic && !qrValid`                              | Yellow  | Product exists on chain, but the QR signature does not validate.    |
| `!authentic || recalled || expired`                  | Red     | Do not use.                                                         |

## Why this is hard

Pharma counterfeiters print copies of legitimate codes; on-chain
serialization alone cannot tell the difference between "first scan of
the real package" and "fifth scan of a photocopy".  v2 helps by adding a
per-package signature + scan counter, but the only truly tamper-evident
solution is a physical security feature (hologram, NFC tag, tamper-
evident foil) coupled with the digital signature.  Future work.
