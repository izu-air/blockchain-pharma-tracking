package com.diploma.pharma.service;

import com.diploma.pharma.dto.AnalyticsDailyResponse;
import com.diploma.pharma.dto.AnalyticsResponse;
import com.diploma.pharma.entity.ProductEvent;
import com.diploma.pharma.repository.ProductEventRepository;
import com.diploma.pharma.repository.ProductMetadataRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {
    /** Hard cap so a careless `?days=99999` does not load the whole table. */
    private static final int MAX_DAYS = 365;

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

    @Transactional(readOnly = true)
    public AnalyticsDailyResponse daily(int days) {
        int window = Math.max(1, Math.min(days, MAX_DAYS));
        Instant since = Instant.now().minus(window, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);

        Map<LocalDate, long[]> buckets = new LinkedHashMap<>(window);
        LocalDate cursor = LocalDate.ofInstant(since, ZoneOffset.UTC);
        for (int i = 0; i < window; i++) {
            buckets.put(cursor.plusDays(i), new long[]{0, 0, 0, 0});
        }

        List<ProductEvent> events = productEventRepository
                .findByCreatedAtGreaterThanEqualOrderByCreatedAtAsc(since);

        for (ProductEvent event : events) {
            if (event.getCreatedAt() == null) continue;
            LocalDate day = LocalDate.ofInstant(event.getCreatedAt(), ZoneOffset.UTC);
            long[] counts = buckets.get(day);
            if (counts == null) continue;
            // index by event type: 0 created, 1 transferred, 2 status, 3 recalled
            switch (event.getEventType() == null ? "" : event.getEventType()) {
                case "PRODUCT_CREATED"     -> counts[0]++;
                case "PRODUCT_TRANSFERRED" -> counts[1]++;
                case "STATUS_UPDATED"      -> counts[2]++;
                case "BATCH_RECALLED",
                     "BATCH_UNRECALLED",
                     "PRODUCT_BLOCKED",
                     "PRODUCT_UNBLOCKED"   -> counts[3]++;
                default                    -> { /* ignored — keeps unknown event types out */ }
            }
        }

        List<AnalyticsDailyResponse.DayBucket> out = new ArrayList<>(window);
        for (Map.Entry<LocalDate, long[]> entry : buckets.entrySet()) {
            long[] c = entry.getValue();
            out.add(new AnalyticsDailyResponse.DayBucket(
                    entry.getKey().toString(),
                    c[0] + c[1] + c[2] + c[3],
                    c[0], c[1], c[2], c[3]
            ));
        }
        return new AnalyticsDailyResponse(window, out);
    }
}
