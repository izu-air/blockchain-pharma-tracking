package com.diploma.pharma.dto;

import java.time.Instant;
import java.time.LocalDate;

public record ProductBatchMetadataResponse(
        Long id,
        Long blockchainBatchId,
        String batchNumber,
        String manufacturerName,
        LocalDate productionDate,
        LocalDate expirationDate,
        String metadataHash,
        String temperatureHash,
        Instant createdAt
) {
}
