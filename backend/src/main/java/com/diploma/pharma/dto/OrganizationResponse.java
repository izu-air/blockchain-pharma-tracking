package com.diploma.pharma.dto;

import com.diploma.pharma.entity.UserRole;
import java.time.Instant;

public record OrganizationResponse(
        Long id,
        String name,
        UserRole role,
        String country,
        Instant createdAt
) {
}
