package com.diploma.pharma.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "indexer_state")
public class IndexerState {
    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private long lastProcessedBlock;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public long getLastProcessedBlock() {
        return lastProcessedBlock;
    }

    public void setLastProcessedBlock(long lastProcessedBlock) {
        this.lastProcessedBlock = lastProcessedBlock;
    }
}
