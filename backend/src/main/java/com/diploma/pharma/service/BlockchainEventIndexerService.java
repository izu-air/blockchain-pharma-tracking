package com.diploma.pharma.service;

import com.diploma.pharma.dto.ProductEventRequest;
import com.diploma.pharma.entity.IndexerState;
import com.diploma.pharma.repository.IndexerStateRepository;
import java.math.BigInteger;
import java.util.List;
import java.util.Locale;
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

@Service
public class BlockchainEventIndexerService {
    private static final String TOPIC_BATCH_CREATED = "0x1d49f16041e5173d0ab40ae22d3caddf61ab21fafb45757eea923ea87457180d";
    private static final String TOPIC_PRODUCT_CREATED = "0xa87911476579fe520d4c29824d21dde6c5361ac2e6277cc238109cb3b8504a88";
    private static final String TOPIC_PRODUCT_TRANSFERRED = "0xd4577699d41d6715cf16ad6336bc4776504c736af364415a2ca6496ab17fcc4f";
    private static final String TOPIC_PRODUCT_STATUS = "0x4a895713562b50f8c6cf8da974ae579b2aeb2009bcd78649cdf13e86d98cb839";
    private static final String TOPIC_BATCH_RECALLED = "0x9dd55b080561b4f234404654c8464792d7a5f09b220cdd59444d8ed7a767258f";

    private final boolean enabled;
    private final String rpcUrl;
    private final String contractAddress;
    private final int chunkSize;
    private final AuditLogService auditLogService;
    private final ProductEventService productEventService;
    private final IndexerStateRepository indexerStateRepository;

    public BlockchainEventIndexerService(
            @Value("${blockchain.indexer.enabled:false}") boolean enabled,
            @Value("${blockchain.rpc-url:}") String rpcUrl,
            @Value("${blockchain.contract-address:}") String contractAddress,
            @Value("${blockchain.indexer.chunk-size:2000}") int chunkSize,
            AuditLogService auditLogService,
            ProductEventService productEventService,
            IndexerStateRepository indexerStateRepository
    ) {
        this.enabled = enabled;
        this.rpcUrl = rpcUrl;
        this.contractAddress = contractAddress;
        this.chunkSize = Math.max(1, chunkSize);
        this.auditLogService = auditLogService;
        this.productEventService = productEventService;
        this.indexerStateRepository = indexerStateRepository;
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

        // Web3j в ряде версий не реализует AutoCloseable — try-with-resources недопустим.
        // Явный shutdown() в finally освобождает пулы потоков / соединения HttpService после опроса RPC.
        Web3j web3j = Web3j.build(new HttpService(rpcUrl));
        try {
            BigInteger latest = web3j.ethBlockNumber().send().getBlockNumber();
            long latestLong = latest.longValue();
            IndexerState state = indexerStateRepository.findById(1L).orElseGet(() -> bootstrapState(latestLong));
            long from = state.getLastProcessedBlock() + 1;
            if (from > latestLong) {
                return;
            }
            long to = Math.min(latestLong, from + chunkSize - 1);

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
                auditLogService.record("indexer", "INDEXER_RPC_ERROR", "BLOCKCHAIN", "0", response.getError().getMessage());
                return;
            }

            // getLogs() в web3j — List элементов EthLog.LogResult, а не List<Log>; для eth_getLogs это обычно LogObject extends Log.
            // Обходим как List<?> и принимаем только экземпляры Log (игнорируем иные варианты LogResult, напр. Hash со String).
            List<?> logResults = response.getLogs();
            if (logResults != null) {
                for (Object entry : logResults) {
                    if (entry instanceof Log log) {
                        processLog(log);
                    }
                }
            }
            state.setLastProcessedBlock(to);
            indexerStateRepository.save(state);
            auditLogService.record("indexer", "INDEXER_SYNC", "BLOCKCHAIN", Long.toString(to), "blocks " + from + "-" + to);
        } catch (Exception exception) {
            auditLogService.record("indexer", "INDEXER_FAILURE", "BLOCKCHAIN", "0", exception.getMessage());
        } finally {
            try {
                web3j.shutdown();
            } catch (Exception ignored) {
                // shutdown не должен маскировать основную ошибку индексации
            }
        }
    }

    private IndexerState bootstrapState(long latestLong) {
        IndexerState state = new IndexerState();
        state.setId(1L);
        state.setLastProcessedBlock(Math.max(-1L, latestLong - 1L));
        return indexerStateRepository.save(state);
    }

    private void processLog(Log log) {
        if (log.getTopics() == null || log.getTopics().isEmpty()) {
            return;
        }
        String topic0 = log.getTopics().get(0).toLowerCase(Locale.ROOT);
        String tx = log.getTransactionHash();

        try {
            if (TOPIC_PRODUCT_CREATED.equals(topic0)) {
                long productId = Numeric.toBigInt(log.getTopics().get(1)).longValue();
                productEventService.create(new ProductEventRequest(productId, "PRODUCT_CREATED", tx));
            } else if (TOPIC_PRODUCT_TRANSFERRED.equals(topic0)) {
                long productId = Numeric.toBigInt(log.getTopics().get(1)).longValue();
                productEventService.create(new ProductEventRequest(productId, "PRODUCT_TRANSFERRED", tx));
            } else if (TOPIC_PRODUCT_STATUS.equals(topic0)) {
                long productId = Numeric.toBigInt(log.getTopics().get(1)).longValue();
                productEventService.create(new ProductEventRequest(productId, "STATUS_UPDATED", tx));
            } else if (TOPIC_BATCH_RECALLED.equals(topic0)) {
                productEventService.create(new ProductEventRequest(0L, "BATCH_RECALLED", tx));
            } else if (TOPIC_BATCH_CREATED.equals(topic0)) {
                productEventService.create(new ProductEventRequest(0L, "BATCH_CREATED", tx));
            }
        } catch (Exception exception) {
            auditLogService.record("indexer", "INDEXER_LOG_SKIP", "BLOCKCHAIN", tx, exception.getMessage());
        }
    }
}
