// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SupplyChain is Ownable {
    enum Status {
        Manufactured,
        InTransit,
        Delivered,
        Sold
    }

    struct Product {
        uint256 id;
        string name;
        address manufacturer;
        address currentOwner;
        uint256 createdAt;
        Status status;
        bool exists;
    }

    struct ProductHistory {
        uint256 timestamp;
        address actor;
        address from;
        address to;
        Status status;
        string action;
    }

    uint256 private nextProductId = 1;

    mapping(uint256 => Product) private products;
    mapping(uint256 => ProductHistory[]) private productHistories;

    event ProductCreated(uint256 indexed productId, string name, address indexed manufacturer);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to);
    event ProductStatusUpdated(uint256 indexed productId, Status status, address indexed actor);

    modifier productExists(uint256 productId) {
        require(products[productId].exists, "Product does not exist");
        _;
    }

    modifier onlyCurrentOwner(uint256 productId) {
        require(products[productId].currentOwner == msg.sender, "Only current owner can perform this action");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createProduct(string calldata name) external returns (uint256) {
        require(bytes(name).length > 0, "Product name is required");

        uint256 productId = nextProductId;
        nextProductId++;

        products[productId] = Product({
            id: productId,
            name: name,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            createdAt: block.timestamp,
            status: Status.Manufactured,
            exists: true
        });

        productHistories[productId].push(ProductHistory({
            timestamp: block.timestamp,
            actor: msg.sender,
            from: address(0),
            to: msg.sender,
            status: Status.Manufactured,
            action: "Product created"
        }));

        emit ProductCreated(productId, name, msg.sender);
        return productId;
    }

    function transferProduct(uint256 productId, address newOwner)
        external
        productExists(productId)
        onlyCurrentOwner(productId)
    {
        require(newOwner != address(0), "New owner is required");
        require(newOwner != msg.sender, "New owner must be different");
        require(products[productId].status != Status.Sold, "Sold product cannot be transferred");

        address previousOwner = products[productId].currentOwner;
        products[productId].currentOwner = newOwner;
        products[productId].status = Status.InTransit;

        productHistories[productId].push(ProductHistory({
            timestamp: block.timestamp,
            actor: msg.sender,
            from: previousOwner,
            to: newOwner,
            status: Status.InTransit,
            action: "Product transferred"
        }));

        emit ProductTransferred(productId, previousOwner, newOwner);
        emit ProductStatusUpdated(productId, Status.InTransit, msg.sender);
    }

    function updateStatus(uint256 productId, Status newStatus)
        external
        productExists(productId)
        onlyCurrentOwner(productId)
    {
        require(products[productId].status != Status.Sold, "Sold product status is final");

        if (newStatus == Status.Sold) {
            require(products[productId].status == Status.Delivered, "Product must be delivered before sold");
        }

        products[productId].status = newStatus;

        productHistories[productId].push(ProductHistory({
            timestamp: block.timestamp,
            actor: msg.sender,
            from: msg.sender,
            to: msg.sender,
            status: newStatus,
            action: "Status updated"
        }));

        emit ProductStatusUpdated(productId, newStatus, msg.sender);
    }

    function getProduct(uint256 productId)
        external
        view
        productExists(productId)
        returns (Product memory)
    {
        return products[productId];
    }

    function getProductHistory(uint256 productId)
        external
        view
        productExists(productId)
        returns (ProductHistory[] memory)
    {
        return productHistories[productId];
    }
}
