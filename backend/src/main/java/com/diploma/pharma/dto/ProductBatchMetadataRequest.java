package com.diploma.pharma.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

public record ProductBatchMetadataRequest(
        @NotNull @Positive Long blockchainBatchId,
        @NotBlank String batchNumber,
        @NotBlank String manufacturerName,
        @NotNull LocalDate productionDate,
        @NotNull LocalDate expirationDate,
        @NotBlank @Pattern(regexp = "^0x[a-fA-F0-9]{64}$") String metadataHash,
        @NotBlank @Pattern(regexp = "^0x[a-fA-F0-9]{64}$") String temperatureHash
) {
}
