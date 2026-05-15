package com.diploma.pharma.repository;

import com.diploma.pharma.entity.TemperatureLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemperatureLogRepository extends JpaRepository<TemperatureLog, Long> {
    List<TemperatureLog> findByBlockchainBatchIdOrderByCreatedAtDesc(Long blockchainBatchId);
}
