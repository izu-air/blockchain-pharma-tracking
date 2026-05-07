package com.diploma.pharma.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Pharma Supply Chain API")
                        .version("1.0.0")
                        .description("REST API for supplementary metadata. Blockchain remains the source of truth."));
    }
}
