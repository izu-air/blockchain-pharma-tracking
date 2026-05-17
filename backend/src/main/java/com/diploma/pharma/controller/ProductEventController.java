package com.diploma.pharma.controller;

import com.diploma.pharma.dto.ProductEventRequest;
import com.diploma.pharma.dto.ProductEventResponse;
import com.diploma.pharma.service.ProductEventService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/product-events")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class ProductEventController {
    private final ProductEventService service;

    public ProductEventController(ProductEventService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANUFACTURER','DISTRIBUTOR','PHARMACY','REGULATOR')")
    public ProductEventResponse create(@Valid @RequestBody ProductEventRequest request) {
        return service.create(request);
    }

    @GetMapping("/{blockchainProductId}")
    @PreAuthorize("isAuthenticated()")
    public List<ProductEventResponse> findByProduct(@PathVariable Long blockchainProductId) {
        return service.findByProduct(blockchainProductId);
    }
}
