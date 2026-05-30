package com.diploma.pharma.controller;

import com.diploma.pharma.dto.AuditLogResponse;
import com.diploma.pharma.service.AuditLogService;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class AuditLogController {
    private final AuditLogService service;

    public AuditLogController(AuditLogService service) {
        this.service = service;
    }

    /** Список audit-log с опциональными фильтрами: action, wallet, диапазон дат. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','REGULATOR')")
    public Page<AuditLogResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String wallet,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return service.list(page, size, action, wallet, from, to);
    }
}
