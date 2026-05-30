package com.diploma.pharma.dto;

import com.diploma.pharma.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public record UserRoleUpdate(
        @NotNull UserRole role,
        String reason
) {
}
