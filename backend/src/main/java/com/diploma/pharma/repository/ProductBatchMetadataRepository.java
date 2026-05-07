package com.diploma.pharma.repository;

import com.diploma.pharma.entity.ProductBatchMetadata;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductBatchMetadataRepository extends JpaRepository<ProductBatchMetadata, Long> {
    Optional<ProductBatchMetadata> findByBlockchainBatchId(Long blockchainBatchId);
    boolean existsByBlockchainBatchId(Long blockchainBatchId);
}
