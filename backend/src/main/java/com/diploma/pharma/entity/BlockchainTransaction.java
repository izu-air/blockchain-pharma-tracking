package com.diploma.pharma.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blockchain_transactions")
public class BlockchainTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 66)
    private String transactionHash;

    @Column(nullable = false, length = 64)
    private String operationType;

    @Column(length = 42)
    private String actorWallet;

    @Column(nullable = false, length = 32)
    private String status = "CONFIRMED";

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTransactionHash() { return transactionHash; }
    public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }
    public String getOperationType() { return operationType; }
    public void setOperationType(String operationType) { this.operationType = operationType; }
    public String getActorWallet() { return actorWallet; }
    public void setActorWallet(String actorWallet) { this.actorWallet = actorWallet; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
