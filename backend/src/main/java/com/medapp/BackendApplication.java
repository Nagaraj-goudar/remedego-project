package com.medapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.file.Paths;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {
    private static final Logger logger = LoggerFactory.getLogger(BackendApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
		
		// Log startup information for debugging
		logger.info("ReMedGo Backend Application Started");
		logger.info("Current working directory: {}", System.getProperty("user.dir"));
		logger.info("Uploads directory path: {}", Paths.get(System.getProperty("user.dir"), "uploads"));
		logger.info("Backend uploads directory path: {}", Paths.get(System.getProperty("user.dir"), "backend", "uploads"));
	}
}
