package com.diploma.pharma.service;

import com.diploma.pharma.entity.IndexerState;
import com.diploma.pharma.repository.IndexerStateRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BlockchainEventIndexerServiceResetTest {

    private IndexerStateRepository indexerStateRepository;
    private AuditLogService auditLogService;
    private ProductEventService productEventService;
    private BlockchainEventIndexerService indexer;

    @BeforeEach
    void setUp() {
        indexerStateRepository = Mockito.mock(IndexerStateRepository.class);
        auditLogService        = Mockito.mock(AuditLogService.class);
        productEventService    = Mockito.mock(ProductEventService.class);

        // start-block = 100, so reset(null) should park the checkpoint at 99
        indexer = new BlockchainEventIndexerService(
                /* enabled */         false,
                /* rpcUrl */          "",
                /* contractAddress */ "",
                /* startBlock */      100L,
                /* chunkSize */       2000,
                /* confirmations */   1,
                auditLogService,
                productEventService,
                indexerStateRepository
        );
    }

    @Test
    void resetWithoutArgumentReturnsToStartBlockMinusOne() {
        IndexerState existing = new IndexerState();
        existing.setId(1L);
        existing.setLastProcessedBlock(987654L);
        when(indexerStateRepository.findById(1L)).thenReturn(Optional.of(existing));

        long checkpoint = indexer.reset(null);

        assertThat(checkpoint).isEqualTo(99L);

        ArgumentCaptor<IndexerState> saved = ArgumentCaptor.forClass(IndexerState.class);
        verify(indexerStateRepository).save(saved.capture());
        assertThat(saved.getValue().getLastProcessedBlock()).isEqualTo(99L);

        verify(auditLogService).record(
                eq("indexer"), eq("INDEXER_RESET"), eq("BLOCKCHAIN"),
                eq("99"), Mockito.contains("previous=987654"));
    }

    @Test
    void resetWithExplicitTargetUsesIt() {
        IndexerState existing = new IndexerState();
        existing.setId(1L);
        existing.setLastProcessedBlock(987654L);
        when(indexerStateRepository.findById(1L)).thenReturn(Optional.of(existing));

        long checkpoint = indexer.reset(42L);

        assertThat(checkpoint).isEqualTo(42L);
        ArgumentCaptor<IndexerState> saved = ArgumentCaptor.forClass(IndexerState.class);
        verify(indexerStateRepository).save(saved.capture());
        assertThat(saved.getValue().getLastProcessedBlock()).isEqualTo(42L);
    }

    @Test
    void resetClampsNegativeTargetToMinusOne() {
        IndexerState existing = new IndexerState();
        existing.setId(1L);
        existing.setLastProcessedBlock(5L);
        when(indexerStateRepository.findById(1L)).thenReturn(Optional.of(existing));

        long checkpoint = indexer.reset(-9999L);

        assertThat(checkpoint).isEqualTo(-1L);
    }

    @Test
    void resetBootstrapsStateIfMissing() {
        when(indexerStateRepository.findById(1L)).thenReturn(Optional.empty());

        long checkpoint = indexer.reset(null);

        assertThat(checkpoint).isEqualTo(99L);
        verify(indexerStateRepository, times(1)).save(any(IndexerState.class));
        verify(auditLogService).record(
                eq("indexer"), eq("INDEXER_RESET"), eq("BLOCKCHAIN"),
                eq("99"), Mockito.contains("previous=0"));
    }
}
