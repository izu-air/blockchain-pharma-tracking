package com.diploma.pharma.service;

import com.diploma.pharma.dto.ProductBatchMetadataRequest;
import com.diploma.pharma.dto.ProductBatchMetadataResponse;
import com.diploma.pharma.entity.ProductBatchMetadata;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.ProductBatchMetadataRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductBatchMetadataService {
    private final ProductBatchMetadataRepository repository;
    private final AuditLogService auditLogService;

    public ProductBatchMetadataService(ProductBatchMetadataRepository repository, AuditLogService auditLogService) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    /** UPSERT по blockchainBatchId — INSERT если новой, UPDATE если уже есть. */
    @Transactional
    public ProductBatchMetadataResponse create(ProductBatchMetadataRequest request) {
        ProductBatchMetadata metadata = repository.findByBlockchainBatchId(request.blockchainBatchId())
                .orElseGet(() -> {
                    ProductBatchMetadata fresh = new ProductBatchMetadata();
                    fresh.setBlockchainBatchId(request.blockchainBatchId());
                    return fresh;
                });
        boolean isNew = metadata.getId() == null;
        metadata.setBatchNumber(request.batchNumber());
        metadata.setManufacturerName(request.manufacturerName());
        metadata.setProductionDate(request.productionDate());
        metadata.setExpirationDate(request.expirationDate());
        metadata.setMetadataHash(request.metadataHash());
        metadata.setTemperatureHash(request.temperatureHash());
        ProductBatchMetadata saved = repository.save(metadata);
        auditLogService.record("system",
                isNew ? "BATCH_METADATA_CREATED" : "BATCH_METADATA_UPDATED",
                "BATCH", request.blockchainBatchId().toString(),
                request.batchNumber());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductBatchMetadataResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductBatchMetadataResponse findByBlockchainBatchId(Long id) {
        return repository.findByBlockchainBatchId(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Batch metadata not found"));
    }

    private ProductBatchMetadataResponse toResponse(ProductBatchMetadata metadata) {
        return new ProductBatchMetadataResponse(
                metadata.getId(),
                metadata.getBlockchainBatchId(),
                metadata.getBatchNumber(),
                metadata.getManufacturerName(),
                metadata.getProductionDate(),
                metadata.getExpirationDate(),
                metadata.getMetadataHash(),
                metadata.getTemperatureHash(),
                metadata.getCreatedAt()
        );
    }
}
