package com.diploma.pharma.service;

import com.diploma.pharma.dto.ProductEventRequest;
import com.diploma.pharma.repository.AuditLogRepository;
import com.diploma.pharma.repository.ProductEventRepository;
import com.diploma.pharma.support.DebugNdjsonLogger;
import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Import({ProductEventService.class, AuditLogService.class, WalletPseudonymizer.class})
class ProductEventServiceTest {
    @Autowired
    private ProductEventService productEventService;

    @Autowired
    private ProductEventRepository productEventRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private DataSource dataSource;

    @Test
    void cachesBlockchainEventAndWritesAuditLog() {
        String datasourceMeta = "unavailable";
        try (var connection = dataSource.getConnection()) {
            var md = connection.getMetaData();
            datasourceMeta = "{\"url\":\"" + md.getURL() + "\",\"db\":\"" + md.getDatabaseProductName() + "\"}";
        } catch (Exception exception) {
            datasourceMeta = "{\"error\":\"" + exception.getClass().getSimpleName() + ":" + exception.getMessage() + "\"}";
        }
        // #region agent log
        DebugNdjsonLogger.log(
                "run-product-event",
                "H2",
                "ProductEventServiceTest:cachesBlockchainEventAndWritesAuditLog:pre-create",
                "Pre-create JDBC and Hibernate dialect snapshot",
                "{\"hibernateDialect\":\"" + entityManagerFactory.getProperties().get("hibernate.dialect") + "\",\"datasource\":" + datasourceMeta + "}"
        );
        // #endregion

        ProductEventRequest request = new ProductEventRequest(
                1L,
                "PRODUCT_CREATED",
                "0x0000000000000000000000000000000000000000000000000000000000000000"
        );

        productEventService.create(request);

        assertThat(productEventRepository.count()).isEqualTo(1);
        assertThat(auditLogRepository.count()).isEqualTo(1);
    }
}
