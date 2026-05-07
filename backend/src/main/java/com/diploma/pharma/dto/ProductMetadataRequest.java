package com.diploma.pharma.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ProductMetadataRequest(
        @NotNull @Positive Long blockchainProductId,
        @NotBlank String batchNumber,
        @NotNull @Future LocalDate expirationDate,
        @Size(max = 1000) String description
) {
}
