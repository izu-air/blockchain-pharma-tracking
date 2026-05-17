package com.diploma.pharma.service;

import com.diploma.pharma.dto.AuditLogResponse;
import com.diploma.pharma.entity.AuditLog;
import com.diploma.pharma.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
    /** Hard cap on page size to keep large requests from exhausting heap. */
    private static final int MAX_PAGE_SIZE = 200;
    private static final int DEFAULT_PAGE_SIZE = 50;

    private final AuditLogRepository repository;
    private final WalletPseudonymizer pseudonymizer;

    public AuditLogService(AuditLogRepository repository, WalletPseudonymizer pseudonymizer) {
        this.repository = repository;
        this.pseudonymizer = pseudonymizer;
    }

    @Transactional
    public void record(String actor, String action, String targetType, String targetId, String details) {
        AuditLog log = new AuditLog();
        // Wallet addresses are stored pseudonymized (HMAC) — never plaintext.
        log.setActor(pseudonymizer.pseudonymize(actor));
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetails(details);
        repository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> list(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return repository.findAll(pageable).map(this::toResponse);
    }

    /** Backwards-compatible default. */
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> recent() {
        return list(0, DEFAULT_PAGE_SIZE);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(log.getId(), log.getActor(), log.getAction(), log.getTargetType(), log.getTargetId(), log.getDetails(), log.getCreatedAt());
    }
}
