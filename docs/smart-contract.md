# Smart Contract Explanation

Contract path:

```text
contracts/contracts/SupplyChain.sol
```

## Main Types

### Product

```solidity
struct Product {
    uint256 id;
    string name;
    address manufacturer;
    address currentOwner;
    uint256 createdAt;
    Status status;
    bool exists;
}
```

`exists` is used because default Solidity mapping values do not tell whether a product was actually created.

### Status

```solidity
enum Status {
    Manufactured,
    InTransit,
    Delivered,
    Sold
}
```

Statuses model a simplified supply chain lifecycle.

## Functions

### createProduct(name)

Creates a new product. The sender becomes manufacturer and current owner.

### transferProduct(productId, newOwner)

Transfers product ownership. Only the current owner can call it. The product status becomes `InTransit`.

### updateStatus(productId, newStatus)

Updates product status. Only the current owner can call it. Sold products are final.

### getProduct(productId)

Returns product data.

### getProductHistory(productId)

Returns the chronological product history.

## Events

- `ProductCreated`
- `ProductTransferred`
- `ProductStatusUpdated`

Events make it easier to show transaction activity in frontend and blockchain explorers.

## Validation

The contract uses `require` checks to keep business rules simple:

- product must exist;
- product name cannot be empty;
- only current owner can transfer or update;
- new owner cannot be zero address;
- sold product cannot be transferred;
- product must be delivered before it is sold.
