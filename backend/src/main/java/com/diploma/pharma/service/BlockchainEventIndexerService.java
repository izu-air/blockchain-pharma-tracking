package com.diploma.pharma.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class BlockchainEventIndexerService {
    private final boolean enabled;
    private final String rpcUrl;
    private final String contractAddress;
    private final AuditLogService auditLogService;
    private long lastIndexedBlock;

    public BlockchainEventIndexerService(
            @Value("${blockchain.indexer.enabled:false}") boolean enabled,
            @Value("${blockchain.rpc-url:}") String rpcUrl,
            @Value("${blockchain.contract-address:}") String contractAddress,
            AuditLogService auditLogService
    ) {
        this.enabled = enabled;
        this.rpcUrl = rpcUrl;
        this.contractAddress = contractAddress;
        this.auditLogService = auditLogService;
    }

    @Scheduled(fixedDelayString = "${blockchain.indexer.delay-ms:30000}")
    public void indexEvents() {
        if (!enabled) {
            return;
        }

        if (rpcUrl.isBlank() || contractAddress.isBlank()) {
            auditLogService.record("indexer", "INDEXER_SKIPPED", "BLOCKCHAIN", "0", "RPC URL or contract address is not configured");
            return;
        }

        // Diploma-friendly extension point: production code would poll logs from rpcUrl,
        // decode contract events and store them as ProductEvent rows. The frontend already
        // caches transaction hashes, so local runs stay simple and deterministic.
        lastIndexedBlock++;
        auditLogService.record("indexer", "INDEXER_HEARTBEAT", "BLOCKCHAIN", Long.toString(lastIndexedBlock), contractAddress);
    }
}
