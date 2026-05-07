package com.diploma.pharma.service;

import com.diploma.pharma.dto.OrganizationRequest;
import com.diploma.pharma.dto.OrganizationResponse;
import com.diploma.pharma.entity.Organization;
import com.diploma.pharma.repository.OrganizationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {
    private final OrganizationRepository repository;
    private final AuditLogService auditLogService;

    public OrganizationService(OrganizationRepository repository, AuditLogService auditLogService) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public OrganizationResponse create(OrganizationRequest request) {
        Organization organization = new Organization();
        organization.setName(request.name());
        organization.setRole(request.role());
        organization.setCountry(request.country());
        Organization saved = repository.save(organization);
        auditLogService.record("system", "ORGANIZATION_CREATED", "ORGANIZATION", saved.getId().toString(), saved.getName());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    private OrganizationResponse toResponse(Organization organization) {
        return new OrganizationResponse(
                organization.getId(),
                organization.getName(),
                organization.getRole(),
                organization.getCountry(),
                organization.getCreatedAt()
        );
    }
}
