package com.diploma.pharma.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "product_events")
public class ProductEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long blockchainProductId;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false, length = 66)
    private String transactionHash;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBlockchainProductId() {
        return blockchainProductId;
    }

    public void setBlockchainProductId(Long blockchainProductId) {
        this.blockchainProductId = blockchainProductId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getTransactionHash() {
        return transactionHash;
    }

    public void setTransactionHash(String transactionHash) {
        this.transactionHash = transactionHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
