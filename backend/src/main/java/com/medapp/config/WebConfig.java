package com.medapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private static final Logger logger = LoggerFactory.getLogger(WebConfig.class);

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        logger.info("Configuring resource handlers for file serving...");
        
        // Serve uploaded files from multiple possible locations
        // Primary location: root uploads directory
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/")
                .setCachePeriod(3600) // Cache for 1 hour
                .resourceChain(true);
        
        // Fallback location: backend/uploads directory
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:backend/uploads/")
                .setCachePeriod(3600) // Cache for 1 hour
                .resourceChain(true);
        
        // Handle favicon.ico requests to prevent 403 errors
        registry.addResourceHandler("/favicon.ico")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(86400); // Cache for 24 hours
        
        logger.info("Resource handlers configured successfully");
    }
} 