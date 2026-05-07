package com.diploma.pharma.repository;

import com.diploma.pharma.entity.ProductEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductEventRepository extends JpaRepository<ProductEvent, Long> {
    List<ProductEvent> findByBlockchainProductIdOrderByCreatedAtDesc(Long blockchainProductId);
    long countByEventType(String eventType);
}
