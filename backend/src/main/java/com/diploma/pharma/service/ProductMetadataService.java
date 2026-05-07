package com.diploma.pharma.service;

import com.diploma.pharma.dto.ProductMetadataRequest;
import com.diploma.pharma.dto.ProductMetadataResponse;
import com.diploma.pharma.entity.ProductMetadata;
import com.diploma.pharma.exception.DuplicateResourceException;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.ProductMetadataRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductMetadataService {
    private final ProductMetadataRepository repository;

    public ProductMetadataService(ProductMetadataRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ProductMetadataResponse create(ProductMetadataRequest request) {
        if (repository.existsByBlockchainProductId(request.blockchainProductId())) {
            throw new DuplicateResourceException("Metadata for this blockchain product already exists");
        }

        ProductMetadata metadata = new ProductMetadata();
        metadata.setBlockchainProductId(request.blockchainProductId());
        metadata.setBatchNumber(request.batchNumber());
        metadata.setExpirationDate(request.expirationDate());
        metadata.setDescription(request.description());
        return toResponse(repository.save(metadata));
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
