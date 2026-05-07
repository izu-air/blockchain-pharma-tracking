package com.diploma.pharma.repository;

import com.diploma.pharma.entity.ProductMetadata;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductMetadataRepository extends JpaRepository<ProductMetadata, Long> {
    Optional<ProductMetadata> findByBlockchainProductId(Long blockchainProductId);
    boolean existsByBlockchainProductId(Long blockchainProductId);
    List<ProductMetadata> findByBatchNumberContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String batchNumber, String description);
}
