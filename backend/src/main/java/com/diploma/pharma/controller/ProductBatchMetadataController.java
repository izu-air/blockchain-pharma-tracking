package com.diploma.pharma.controller;

import com.diploma.pharma.dto.ProductBatchMetadataRequest;
import com.diploma.pharma.dto.ProductBatchMetadataResponse;
import com.diploma.pharma.service.ProductBatchMetadataService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/batch-metadata")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class ProductBatchMetadataController {
    private final ProductBatchMetadataService service;

    public ProductBatchMetadataController(ProductBatchMetadataService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANUFACTURER','ADMIN')")
    public ProductBatchMetadataResponse create(@Valid @RequestBody ProductBatchMetadataRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<ProductBatchMetadataResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{blockchainBatchId}")
    public ProductBatchMetadataResponse findByBlockchainBatchId(@PathVariable Long blockchainBatchId) {
        return service.findByBlockchainBatchId(blockchainBatchId);
    }
}
