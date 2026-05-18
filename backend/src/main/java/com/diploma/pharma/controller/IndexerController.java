package com.diploma.pharma.controller;

import com.diploma.pharma.service.BlockchainEventIndexerService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin/ops control plane for the blockchain indexer.  Allows manual
 * re-processing of a block range after operator intervention (e.g. RPC
 * outage recovery, suspected reorg) without restarting the application.
 */
@RestController
@RequestMapping("/api/indexer")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class IndexerController {
    private final BlockchainEventIndexerService indexer;

    public IndexerController(BlockchainEventIndexerService indexer) {
        this.indexer = indexer;
    }

    /**
     * Process the next chunk now (in addition to the scheduled run).  Useful
     * after fixing an RPC misconfiguration to avoid waiting for the next
     * tick of the {@code @Scheduled} cron.
     */
    @PostMapping("/run")
    @PreAuthorize("hasRole('ADMIN')")
    public RunResponse runOnce() {
        return new RunResponse(indexer.runOnce());
    }

    /**
     * Re-index an explicit block range.  Idempotent — events that already
     * exist are silently skipped via the V5 unique key.
     */
    @PostMapping("/backfill")
    @PreAuthorize("hasRole('ADMIN')")
    public BackfillResponse backfill(
            @RequestParam("from") long fromBlock,
            @RequestParam("to") long toBlock
    ) {
        int saved = indexer.backfill(fromBlock, toBlock);
        return new BackfillResponse(fromBlock, toBlock, saved);
    }

    public record RunResponse(long lastProcessedBlock) { }
    public record BackfillResponse(long fromBlock, long toBlock, int eventsPersisted) { }
}
