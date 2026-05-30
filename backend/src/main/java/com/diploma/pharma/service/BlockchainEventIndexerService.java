package com.diploma.pharma.service;

import com.diploma.pharma.dto.ProductEventRequest;
import com.diploma.pharma.entity.IndexerState;
import com.diploma.pharma.repository.IndexerStateRepository;
import java.math.BigInteger;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.response.EthLog;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.protocol.http.HttpService;
import org.web3j.utils.Numeric;

/**
 * Periodic blockchain indexer.
 *
 * <p>Iter 8 invariants:</p>
 * <ul>
 *   <li>First run starts from {@code BLOCKCHAIN_START_BLOCK} (defaults to 0
 *       for local Hardhat), NOT from {@code latest-1} — so history is not
 *       skipped.</li>
 *   <li>"Safe latest" = {@code latest - BLOCKCHAIN_CONFIRMATIONS} prevents
 *       processing of yet-unfinal blocks; defaults to 1 (good for Hardhat;
 *       set 12 for Ethereum mainnet via env var).</li>
 *   <li>Each event row carries {@code block_number} + {@code log_index};
 *       the V5 unique index {@code (tx_hash, log_index, event_type)} makes
 *       inserts idempotent across runs.</li>
 *   <li>Batch events go into the same table but with
 *       {@code blockchainProductId = 0} and {@code blockchainBatchId} set,
 *       so analytics never need to invent a fake product id.</li>
 * </ul>
 */
@Service
public class BlockchainEventIndexerService {
    private static final Logger LOG = LoggerFactory.getLogger(BlockchainEventIndexerService.class);

    // keccak256(eventSignature) — kept as constants so we don't need to
    // re-load the ABI at runtime.  Values match SupplyChain.sol events.
    private static final String TOPIC_BATCH_CREATED       = "0x1d49f16041e5173d0ab40ae22d3caddf61ab21fafb45757eea923ea87457180d";
    private static final String TOPIC_PRODUCT_CREATED     = "0xa87911476579fe520d4c29824d21dde6c5361ac2e6277cc238109cb3b8504a88";
    private static final String TOPIC_PRODUCT_TRANSFERRED = "0xd4577699d41d6715cf16ad6336bc4776504c736af364415a2ca6496ab17fcc4f";
    private static final String TOPIC_PRODUCT_STATUS      = "0x4a895713562b50f8c6cf8da974ae579b2aeb2009bcd78649cdf13e86d98cb839";
    private static final String TOPIC_BATCH_RECALLED      = "0x9dd55b080561b4f234404654c8464792d7a5f09b220cdd59444d8ed7a767258f";

    private final boolean enabled;
    private final String rpcUrl;
    private final String contractAddress;
    private final long startBlock;
    private final int chunkSize;
    private final int confirmations;
    private final AuditLogService auditLogService;
    private final ProductEventService productEventService;
    private final IndexerStateRepository indexerStateRepository;

    public BlockchainEventIndexerService(
            @Value("${blockchain.indexer.enabled:false}") boolean enabled,
            @Value("${blockchain.rpc-url:}") String rpcUrl,
            @Value("${blockchain.contract-address:}") String contractAddress,
            @Value("${blockchain.indexer.start-block:0}") long startBlock,
            @Value("${blockchain.indexer.chunk-size:2000}") int chunkSize,
            @Value("${blockchain.indexer.confirmations:1}") int confirmations,
            AuditLogService auditLogService,
            ProductEventService productEventService,
            IndexerStateRepository indexerStateRepository
    ) {
        this.enabled = enabled;
        this.rpcUrl = rpcUrl;
        this.contractAddress = contractAddress;
        this.startBlock = Math.max(0L, startBlock);
        this.chunkSize = Math.max(1, chunkSize);
        this.confirmations = Math.max(0, confirmations);
        this.auditLogService = auditLogService;
        this.productEventService = productEventService;
        this.indexerStateRepository = indexerStateRepository;
    }

    @Scheduled(fixedDelayString = "${blockchain.indexer.delay-ms:30000}")
    public void indexEvents() {
        if (!enabled) return;
        if (rpcUrl.isBlank() || contractAddress.isBlank()) {
            LOG.debug("Indexer skipped — RPC URL or contract address not configured");
            return;
        }
        runOnce();
    }

    /**
     * Process the next chunk of blocks past the saved checkpoint, capped at
     * the safe latest block.  Returns the highest block number persisted to
     * the indexer state, or -1 if nothing was processed.
     */
    public long runOnce() {
        Web3j web3j = Web3j.build(new HttpService(rpcUrl));
        try {
            BigInteger latest = web3j.ethBlockNumber().send().getBlockNumber();
            long safeLatest = latest.longValue() - confirmations;
            if (safeLatest < 0) return -1L;

            IndexerState state = indexerStateRepository.findById(1L)
                    .orElseGet(() -> bootstrapState(startBlock - 1L));
            long from = state.getLastProcessedBlock() + 1;
            if (from < startBlock) from = startBlock;
            if (from > safeLatest) return state.getLastProcessedBlock();

            long to = Math.min(safeLatest, from + chunkSize - 1);
            int saved = fetchAndPersist(web3j, from, to);

            state.setLastProcessedBlock(to);
            indexerStateRepository.save(state);
            LOG.info("Indexer synced blocks {}-{}, persisted {} events (safe-latest {})",
                    from, to, saved, safeLatest);
            return to;
        } catch (Exception exception) {
            LOG.error("Indexer failure", exception);
            auditLogService.record("indexer", "INDEXER_FAILURE", "BLOCKCHAIN", "0",
                    exception.getClass().getSimpleName() + ": " + exception.getMessage());
            return -1L;
        } finally {
            try { web3j.shutdown(); } catch (Exception ignored) { /* swallow */ }
        }
    }

    /** Сбрасывает чекпойнт индексатора. */
    @org.springframework.transaction.annotation.Transactional
    public long reset(Long toBlock) {
        long target = (toBlock != null) ? Math.max(-1L, toBlock) : (startBlock - 1L);
        IndexerState state = indexerStateRepository.findById(1L)
                .orElseGet(() -> {
                    IndexerState fresh = new IndexerState();
                    fresh.setId(1L);
                    return fresh;
                });
        long previous = state.getLastProcessedBlock();
        state.setLastProcessedBlock(target);
        indexerStateRepository.save(state);
        LOG.warn("Indexer checkpoint reset: {} -> {} (start-block={})", previous, target, startBlock);
        auditLogService.record("indexer", "INDEXER_RESET", "BLOCKCHAIN",
                Long.toString(target),
                "previous=" + previous + ", startBlock=" + startBlock);
        return target;
    }

    /**
     * Admin-triggered backfill of an explicit block range.  Useful when the
     * indexer was offline for a long time or to re-process a chunk after a
     * suspected reorg.  Idempotent via the V5 unique key.
     */
    public int backfill(long fromBlock, long toBlock) {
        if (fromBlock < 0 || toBlock < fromBlock) {
            throw new IllegalArgumentException(
                    "Invalid range: from=" + fromBlock + " to=" + toBlock);
        }
        if (rpcUrl.isBlank() || contractAddress.isBlank()) {
            throw new IllegalStateException("Indexer is not configured (RPC URL / contract address missing).");
        }
        Web3j web3j = Web3j.build(new HttpService(rpcUrl));
        int total = 0;
        try {
            long cursor = fromBlock;
            while (cursor <= toBlock) {
                long end = Math.min(toBlock, cursor + chunkSize - 1);
                total += fetchAndPersist(web3j, cursor, end);
                cursor = end + 1;
            }
            LOG.info("Backfill complete: blocks {}-{}, persisted {} events", fromBlock, toBlock, total);
            auditLogService.record("indexer", "INDEXER_BACKFILL", "BLOCKCHAIN",
                    fromBlock + "-" + toBlock, "events=" + total);
            return total;
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new RuntimeException("Backfill failed: " + exception.getMessage(), exception);
        } finally {
            try { web3j.shutdown(); } catch (Exception ignored) { /* swallow */ }
        }
    }

    private int fetchAndPersist(Web3j web3j, long from, long to) throws Exception {
        EthFilter filter = new EthFilter(
                DefaultBlockParameter.valueOf(BigInteger.valueOf(from)),
                DefaultBlockParameter.valueOf(BigInteger.valueOf(to)),
                contractAddress.toLowerCase(Locale.ROOT)
        );
        filter.addOptionalTopics(
                TOPIC_BATCH_CREATED,
                TOPIC_PRODUCT_CREATED,
                TOPIC_PRODUCT_TRANSFERRED,
                TOPIC_PRODUCT_STATUS,
                TOPIC_BATCH_RECALLED
        );

        EthLog response = web3j.ethGetLogs(filter).send();
        if (response.hasError()) {
            String message = response.getError().getMessage();
            LOG.warn("eth_getLogs error blocks {}-{}: {}", from, to, message);
            auditLogService.record("indexer", "INDEXER_RPC_ERROR", "BLOCKCHAIN",
                    Long.toString(to), message);
            return 0;
        }
        List<?> logResults = response.getLogs();
        if (logResults == null || logResults.isEmpty()) return 0;

        int persisted = 0;
        for (Object entry : logResults) {
            if (!(entry instanceof Log log)) continue;
            try {
                if (processLog(log)) persisted++;
            } catch (Exception exception) {
                LOG.warn("Skipping log tx={} reason={}", log.getTransactionHash(), exception.getMessage());
                auditLogService.record("indexer", "INDEXER_LOG_SKIP", "BLOCKCHAIN",
                        log.getTransactionHash(),
                        exception.getClass().getSimpleName() + ": " + exception.getMessage());
            }
        }
        return persisted;
    }

    /** Returns true when the event was new (the idempotent insert may return an existing row). */
    private boolean processLog(Log log) {
        if (log.getTopics() == null || log.getTopics().isEmpty()) return false;
        String topic0 = log.getTopics().get(0).toLowerCase(Locale.ROOT);
        String tx = log.getTransactionHash();
        Long block = log.getBlockNumber() != null ? log.getBlockNumber().longValue() : null;
        Long logIndex = log.getLogIndex() != null ? log.getLogIndex().longValue() : null;

        if (TOPIC_PRODUCT_CREATED.equals(topic0)) {
            long productId = Numeric.toBigInt(log.getTopics().get(1)).longValue();
            long batchId   = Numeric.toBigInt(log.getTopics().get(2)).longValue();
            productEventService.create(new ProductEventRequest(
                    productId, batchId, "PRODUCT_CREATED", tx, block, logIndex));
            return true;
        }
        if (TOPIC_PRODUCT_TRANSFERRED.equals(topic0)) {
            long productId = Numeric.toBigInt(log.getTopics().get(1)).longValue();
            productEventService.create(new ProductEventRequest(
                    productId, null, "PRODUCT_TRANSFERRED", tx, block, logIndex));
            return true;
        }
        if (TOPIC_PRODUCT_STATUS.equals(topic0)) {
            long productId = Numeric.toBigInt(log.getTopics().get(1)).longValue();
            productEventService.create(new ProductEventRequest(
                    productId, null, "STATUS_UPDATED", tx, block, logIndex));
            return true;
        }
        if (TOPIC_BATCH_RECALLED.equals(topic0)) {
            long batchId = Numeric.toBigInt(log.getTopics().get(1)).longValue();
            productEventService.create(new ProductEventRequest(
                    0L, batchId, "BATCH_RECALLED", tx, block, logIndex));
            return true;
        }
        if (TOPIC_BATCH_CREATED.equals(topic0)) {
            long batchId = Numeric.toBigInt(log.getTopics().get(1)).longValue();
            productEventService.create(new ProductEventRequest(
                    0L, batchId, "BATCH_CREATED", tx, block, logIndex));
            return true;
        }
        return false;
    }

    private IndexerState bootstrapState(long initialLastBlock) {
        IndexerState state = new IndexerState();
        state.setId(1L);
        state.setLastProcessedBlock(initialLastBlock);
        return indexerStateRepository.save(state);
    }
}
