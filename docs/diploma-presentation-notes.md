# Diploma Presentation Notes

## Short Project Pitch

This project is a blockchain-powered pharmaceutical supply chain tracking prototype. It prevents fake product records by storing serialized product units, ownership transfers, recall status and audit history in a smart contract.

## Best Demo Scenario

1. Open the dashboard and explain participant roles.
2. Connect MetaMask.
3. Create a product batch as manufacturer.
4. Register a product with a serial number.
5. Show the generated QR code.
6. Open the verification page with the QR URL.
7. Transfer the product to distributor and pharmacy.
8. Mark the product delivered and sold.
9. Recall a batch as regulator.
10. Show that recalled products display warning and cannot be sold.
11. Open product history and explain immutable timeline.

## Key Defense Arguments

- Blockchain is used where trust matters: ownership, status, recall and history.
- PostgreSQL is used where ordinary application storage is enough: metadata, analytics and search.
- Duplicate serial protection blocks counterfeit duplicate records.
- QR verification lets consumers independently check authenticity.
- Recall logic demonstrates regulator control and patient safety.
- Hashes demonstrate off-chain document integrity without storing private files on-chain.

## Known Limitations

- The system is a diploma prototype, not a certified medical logistics product.
- JWT authentication is simplified and should use wallet signature challenge in production.
- Batch recall loops over batch products, which is acceptable for MVP but should be optimized for large production batches.
- Public blockchain data must be selected carefully because privacy cannot be retrofitted later.
