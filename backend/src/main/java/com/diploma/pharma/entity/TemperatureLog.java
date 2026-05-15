package com.diploma.pharma.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "temperature_logs")
public class TemperatureLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long blockchainBatchId;

    @Column(nullable = false, length = 66)
    private String logHash;

    @Column(nullable = false, length = 42)
    private String recordedBy;

    private Double celsiusMin;
    private Double celsiusMax;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBlockchainBatchId() { return blockchainBatchId; }
    public void setBlockchainBatchId(Long blockchainBatchId) { this.blockchainBatchId = blockchainBatchId; }
    public String getLogHash() { return logHash; }
    public void setLogHash(String logHash) { this.logHash = logHash; }
    public String getRecordedBy() { return recordedBy; }
    public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }
    public Double getCelsiusMin() { return celsiusMin; }
    public void setCelsiusMin(Double celsiusMin) { this.celsiusMin = celsiusMin; }
    public Double getCelsiusMax() { return celsiusMax; }
    public void setCelsiusMax(Double celsiusMax) { this.celsiusMax = celsiusMax; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
