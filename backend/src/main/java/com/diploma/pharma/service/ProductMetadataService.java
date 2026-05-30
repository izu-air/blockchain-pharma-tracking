package com.diploma.pharma.service;

import com.diploma.pharma.dto.ProductMetadataRequest;
import com.diploma.pharma.dto.ProductMetadataResponse;
import com.diploma.pharma.entity.ProductMetadata;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.ProductMetadataRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductMetadataService {
    private final ProductMetadataRepository repository;
    private final AuditLogService auditLogService;

    public ProductMetadataService(ProductMetadataRepository repository, AuditLogService auditLogService) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    /** UPSERT по blockchainProductId. */
    @Transactional
    public ProductMetadataResponse create(ProductMetadataRequest request) {
        ProductMetadata metadata = repository.findByBlockchainProductId(request.blockchainProductId())
                .orElseGet(() -> {
                    ProductMetadata fresh = new ProductMetadata();
                    fresh.setBlockchainProductId(request.blockchainProductId());
                    return fresh;
                });
        boolean isNew = metadata.getId() == null;
        metadata.setBatchNumber(request.batchNumber());
        metadata.setExpirationDate(request.expirationDate());
        metadata.setDescription(request.description());
        ProductMetadata saved = repository.save(metadata);
        auditLogService.record("system",
                isNew ? "PRODUCT_METADATA_CREATED" : "PRODUCT_METADATA_UPDATED",
                "PRODUCT", request.blockchainProductId().toString(),
                request.batchNumber());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductMetadataResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductMetadataResponse findByBlockchainProductId(Long blockchainProductId) {
        return repository.findByBlockchainProductId(blockchainProductId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Product metadata not found"));
    }

    @Transactional(readOnly = true)
    public List<ProductMetadataResponse> search(String query) {
        return repository.findByBatchNumberContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ProductMetadataResponse toResponse(ProductMetadata metadata) {
        return new ProductMetadataResponse(
                metadata.getId(),
                metadata.getBlockchainProductId(),
                metadata.getBatchNumber(),
                metadata.getExpirationDate(),
                metadata.getDescription(),
                metadata.getCreatedAt()
        );
    }
}
