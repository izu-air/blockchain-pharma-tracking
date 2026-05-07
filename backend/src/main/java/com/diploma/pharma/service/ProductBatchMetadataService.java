package com.diploma.pharma.service;

import com.diploma.pharma.dto.ProductBatchMetadataRequest;
import com.diploma.pharma.dto.ProductBatchMetadataResponse;
import com.diploma.pharma.entity.ProductBatchMetadata;
import com.diploma.pharma.exception.DuplicateResourceException;
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

    @Transactional
    public ProductBatchMetadataResponse create(ProductBatchMetadataRequest request) {
        if (repository.existsByBlockchainBatchId(request.blockchainBatchId())) {
            throw new DuplicateResourceException("Batch metadata already exists");
        }
        ProductBatchMetadata metadata = new ProductBatchMetadata();
        metadata.setBlockchainBatchId(request.blockchainBatchId());
        metadata.setBatchNumber(request.batchNumber());
        metadata.setManufacturerName(request.manufacturerName());
        metadata.setProductionDate(request.productionDate());
        metadata.setExpirationDate(request.expirationDate());
        metadata.setMetadataHash(request.metadataHash());
        metadata.setTemperatureHash(request.temperatureHash());
        ProductBatchMetadata saved = repository.save(metadata);
        auditLogService.record("system", "BATCH_METADATA_CREATED", "BATCH", request.blockchainBatchId().toString(), request.batchNumber());
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
