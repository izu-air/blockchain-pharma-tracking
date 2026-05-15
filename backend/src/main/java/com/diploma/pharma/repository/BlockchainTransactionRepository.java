package com.diploma.pharma.repository;

import com.diploma.pharma.entity.BlockchainTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlockchainTransactionRepository extends JpaRepository<BlockchainTransaction, Long> {
    boolean existsByTransactionHash(String transactionHash);
}
