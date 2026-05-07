package com.diploma.pharma.controller;

import com.diploma.pharma.dto.OrganizationRequest;
import com.diploma.pharma.dto.OrganizationResponse;
import com.diploma.pharma.service.OrganizationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organizations")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class OrganizationController {
    private final OrganizationService service;

    public OrganizationController(OrganizationService service) {
        this.service = service;
    }

    @PostMapping
    public OrganizationResponse create(@Valid @RequestBody OrganizationRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<OrganizationResponse> findAll() {
        return service.findAll();
    }
}
