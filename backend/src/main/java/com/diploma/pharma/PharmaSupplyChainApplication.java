package com.diploma.pharma;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class PharmaSupplyChainApplication {
    public static void main(String[] args) {
        SpringApplication.run(PharmaSupplyChainApplication.class, args);
    }
}
