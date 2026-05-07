package com.diploma.pharma.service;

import com.diploma.pharma.dto.AnalyticsResponse;
import com.diploma.pharma.repository.ProductEventRepository;
import com.diploma.pharma.repository.ProductMetadataRepository;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {
    private final ProductMetadataRepository productMetadataRepository;
    private final ProductEventRepository productEventRepository;

    public AnalyticsService(ProductMetadataRepository productMetadataRepository, ProductEventRepository productEventRepository) {
        this.productMetadataRepository = productMetadataRepository;
        this.productEventRepository = productEventRepository;
    }

    public AnalyticsResponse summary() {
        return new AnalyticsResponse(
                productMetadataRepository.count(),
                productEventRepository.count(),
                productEventRepository.countByEventType("PRODUCT_CREATED"),
                productEventRepository.countByEventType("PRODUCT_TRANSFERRED"),
                productEventRepository.countByEventType("STATUS_UPDATED"),
                productEventRepository.countByEventType("BATCH_RECALLED")
        );
    }
}
