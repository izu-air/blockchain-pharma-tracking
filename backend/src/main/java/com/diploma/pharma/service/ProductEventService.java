package com.diploma.pharma.service;

import com.diploma.pharma.dto.ProductEventRequest;
import com.diploma.pharma.dto.ProductEventResponse;
import com.diploma.pharma.entity.ProductEvent;
import com.diploma.pharma.repository.ProductEventRepository;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductEventService {
    private final ProductEventRepository repository;
    private final AuditLogService auditLogService;

    public ProductEventService(ProductEventRepository repository, AuditLogService auditLogService) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    /**
     * Idempotent insert.  Relies on the V5 composite unique index
     * (transaction_hash, coalesce(log_index,-1), event_type) at the DB level —
     * not a pre-check — so concurrent indexer / API writes can't race.
     */
    @Transactional
    public ProductEventResponse create(ProductEventRequest request) {
        ProductEvent event = toEntity(request);
        try {
            ProductEvent saved = repository.saveAndFlush(event);
            auditLogService.record(
                    "indexer-or-frontend", request.eventType(), "BLOCKCHAIN_EVENT",
                    String.valueOf(request.blockchainProductId() != null ? request.blockchainProductId() : 0),
                    request.transactionHash());
            return toResponse(saved);
        } catch (DataIntegrityViolationException duplicate) {
            // Already persisted by another writer — return the existing row.
            return repository.findFirstByTransactionHashAndEventTypeOrderByIdDesc(
                            request.transactionHash(), request.eventType())
                    .map(this::toResponse)
                    .orElseThrow(() -> duplicate);
        }
    }

    @Transactional(readOnly = true)
    public List<ProductEventResponse> findByProduct(Long blockchainProductId) {
        return repository.findByBlockchainProductIdOrderByCreatedAtDesc(blockchainProductId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ProductEvent toEntity(ProductEventRequest request) {
        ProductEvent event = new ProductEvent();
        event.setBlockchainProductId(request.blockchainProductId());
        event.setBlockchainBatchId(request.blockchainBatchId());
        event.setEventType(request.eventType());
        event.setTransactionHash(request.transactionHash());
        event.setBlockNumber(request.blockNumber());
        event.setLogIndex(request.logIndex());
        return event;
    }

    private ProductEventResponse toResponse(ProductEvent event) {
        return new ProductEventResponse(
                event.getId(),
                event.getBlockchainProductId(),
                event.getBlockchainBatchId(),
                event.getEventType(),
                event.getTransactionHash(),
                event.getBlockNumber(),
                event.getLogIndex(),
                event.getCreatedAt()
        );
    }
}
