package com.diploma.pharma.repository;

import com.diploma.pharma.entity.ProductEvent;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductEventRepository extends JpaRepository<ProductEvent, Long> {
    List<ProductEvent> findByBlockchainProductIdOrderByCreatedAtDesc(Long blockchainProductId);

    long countByEventType(String eventType);

    /**
     * Looks up the canonical event row for the V5 uniqueness key.  Used by
     * {@code ProductEventService.create} when an INSERT loses the race to a
     * concurrent writer and needs to read back the existing row.
     */
    Optional<ProductEvent> findFirstByTransactionHashAndEventTypeOrderByIdDesc(
            String transactionHash,
            String eventType
    );

    List<ProductEvent> findByCreatedAtGreaterThanEqualOrderByCreatedAtAsc(Instant since);
}
