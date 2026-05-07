package com.diploma.pharma.dto;

import com.diploma.pharma.entity.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OrganizationRequest(
        @NotBlank String name,
        @NotNull UserRole role,
        @NotBlank String country
) {
}
