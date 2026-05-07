package com.diploma.pharma.dto;

public record AnalyticsResponse(
        long metadataRecords,
        long cachedEvents,
        long createdEvents,
        long transferEvents,
        long statusEvents,
        long recallEvents
) {
}
