package com.diploma.pharma.dto;

import com.diploma.pharma.entity.UserRole;

public record AuthResponse(
        String token,
        String walletAddress,
        UserRole role
) {
}
