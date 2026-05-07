package com.diploma.pharma.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "product_batch_metadata")
public class ProductBatchMetadata {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long blockchainBatchId;

    @Column(nullable = false)
    private String batchNumber;

    @Column(nullable = false)
    private String manufacturerName;

    @Column(nullable = false)
    private LocalDate productionDate;

    @Column(nullable = false)
    private LocalDate expirationDate;

    @Column(nullable = false, length = 66)
    private String metadataHash;

    @Column(nullable = false, length = 66)
    private String temperatureHash;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBlockchainBatchId() { return blockchainBatchId; }
    public void setBlockchainBatchId(Long blockchainBatchId) { this.blockchainBatchId = blockchainBatchId; }
    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
    public String getManufacturerName() { return manufacturerName; }
    public void setManufacturerName(String manufacturerName) { this.manufacturerName = manufacturerName; }
    public LocalDate getProductionDate() { return productionDate; }
    public void setProductionDate(LocalDate productionDate) { this.productionDate = productionDate; }
    public LocalDate getExpirationDate() { return expirationDate; }
    public void setExpirationDate(LocalDate expirationDate) { this.expirationDate = expirationDate; }
    public String getMetadataHash() { return metadataHash; }
    public void setMetadataHash(String metadataHash) { this.metadataHash = metadataHash; }
    public String getTemperatureHash() { return temperatureHash; }
    public void setTemperatureHash(String temperatureHash) { this.temperatureHash = temperatureHash; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
