package com.diploma.pharma.controller;

import com.diploma.pharma.dto.AnalyticsDailyResponse;
import com.diploma.pharma.dto.AnalyticsResponse;
import com.diploma.pharma.service.AnalyticsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Aggregated counters across the supply chain.  Restricted to roles that
     * legitimately need operational visibility — consumers can verify a
     * specific product, but not browse system-wide totals.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','REGULATOR','MANUFACTURER','DISTRIBUTOR','PHARMACY')")
    public AnalyticsResponse summary() {
        return analyticsService.summary();
    }

    /** Подневные счётчики событий для линейного графика. */
    @GetMapping("/daily")
    @PreAuthorize("hasAnyRole('ADMIN','REGULATOR','MANUFACTURER','DISTRIBUTOR','PHARMACY')")
    public AnalyticsDailyResponse daily(
            @RequestParam(defaultValue = "30") int days
    ) {
        return analyticsService.daily(days);
    }
}
