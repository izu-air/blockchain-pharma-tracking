package com.diploma.pharma.dto;

import com.diploma.pharma.entity.UserRole;
import java.time.Instant;

public record UserResponse(
        Long id,
        String name,
        UserRole role,
        String walletAddress,
        Instant createdAt
) {
}
