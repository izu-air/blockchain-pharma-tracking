package com.diploma.pharma.controller;

import com.diploma.pharma.dto.AnalyticsResponse;
import com.diploma.pharma.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public AnalyticsResponse summary() {
        return analyticsService.summary();
    }
}
