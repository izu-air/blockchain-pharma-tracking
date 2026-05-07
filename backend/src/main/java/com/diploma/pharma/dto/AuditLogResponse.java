package com.diploma.pharma.dto;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        String actor,
        String action,
        String targetType,
        String targetId,
        String details,
        Instant createdAt
) {
}
