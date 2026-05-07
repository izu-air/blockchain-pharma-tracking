package com.diploma.pharma.controller;

import com.diploma.pharma.dto.AuditLogResponse;
import com.diploma.pharma.service.AuditLogService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class AuditLogController {
    private final AuditLogService service;

    public AuditLogController(AuditLogService service) {
        this.service = service;
    }

    @GetMapping
    public List<AuditLogResponse> recent() {
        return service.recent();
    }
}
