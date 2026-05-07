package com.diploma.pharma.controller;

import com.diploma.pharma.dto.ProductMetadataRequest;
import com.diploma.pharma.dto.ProductMetadataResponse;
import com.diploma.pharma.service.ProductMetadataService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/product-metadata")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class ProductMetadataController {
    private final ProductMetadataService service;

    public ProductMetadataController(ProductMetadataService service) {
        this.service = service;
    }

    @PostMapping
    public ProductMetadataResponse create(@Valid @RequestBody ProductMetadataRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<ProductMetadataResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/search")
    public List<ProductMetadataResponse> search(@RequestParam String query) {
        return service.search(query);
    }

    @GetMapping("/{blockchainProductId}")
    public ProductMetadataResponse findByBlockchainProductId(@PathVariable Long blockchainProductId) {
        return service.findByBlockchainProductId(blockchainProductId);
    }
}
