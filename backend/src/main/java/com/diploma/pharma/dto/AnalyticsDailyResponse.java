package com.diploma.pharma.dto;

import java.util.List;

public record AnalyticsDailyResponse(
        int window,
        List<DayBucket> buckets
) {
    public record DayBucket(
            String date,
            long total,
            long created,
            long transferred,
            long status,
            long recalled
    ) {
    }
}
