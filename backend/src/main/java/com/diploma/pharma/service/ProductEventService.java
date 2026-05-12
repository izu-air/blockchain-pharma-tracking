package com.diploma.pharma.service;

import com.diploma.pharma.dto.ProductEventRequest;
import com.diploma.pharma.dto.ProductEventResponse;
import com.diploma.pharma.entity.ProductEvent;
import com.diploma.pharma.repository.ProductEventRepository;
import java.util.List;
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

    @Transactional
    public ProductEventResponse create(ProductEventRequest request) {
        if (repository.existsByTransactionHashAndEventTypeAndBlockchainProductId(
                request.transactionHash(),
                request.eventType(),
                request.blockchainProductId()
        )) {
            return repository
                    .findFirstByTransactionHashAndEventTypeAndBlockchainProductIdOrderByIdDesc(
                            request.transactionHash(),
                            request.eventType(),
                            request.blockchainProductId()
                    )
                    .map(this::toResponse)
                    .orElseThrow();
        }

        ProductEvent event = new ProductEvent();
        event.setBlockchainProductId(request.blockchainProductId());
        event.setEventType(request.eventType());
        event.setTransactionHash(request.transactionHash());
        ProductEvent saved = repository.save(event);
        auditLogService.record("frontend", request.eventType(), "BLOCKCHAIN_EVENT", request.blockchainProductId().toString(), request.transactionHash());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductEventResponse> findByProduct(Long blockchainProductId) {
        return repository.findByBlockchainProductIdOrderByCreatedAtDesc(blockchainProductId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ProductEventResponse toResponse(ProductEvent event) {
        return new ProductEventResponse(
                event.getId(),
                event.getBlockchainProductId(),
                event.getEventType(),
                event.getTransactionHash(),
                event.getCreatedAt()
        );
    }
}
