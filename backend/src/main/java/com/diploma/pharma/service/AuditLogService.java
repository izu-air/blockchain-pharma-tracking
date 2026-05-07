package com.diploma.pharma.service;

import com.diploma.pharma.dto.AuditLogResponse;
import com.diploma.pharma.entity.AuditLog;
import com.diploma.pharma.repository.AuditLogRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
    private final AuditLogRepository repository;

    public AuditLogService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(String actor, String action, String targetType, String targetId, String details) {
        AuditLog log = new AuditLog();
        log.setActor(actor);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetails(details);
        repository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> recent() {
        return repository.findTop100ByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(log.getId(), log.getActor(), log.getAction(), log.getTargetType(), log.getTargetId(), log.getDetails(), log.getCreatedAt());
    }
}
