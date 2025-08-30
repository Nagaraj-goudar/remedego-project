package com.medapp.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class FaviconController {
    private static final Logger logger = LoggerFactory.getLogger(FaviconController.class);

    @GetMapping("/favicon.ico")
    public ResponseEntity<Void> getFavicon() {
        logger.debug("Favicon request received");
        // Return 204 No Content to indicate no favicon is available
        // This prevents the 403 error and stops the browser from retrying
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/robots.txt")
    public ResponseEntity<String> getRobotsTxt() {
        logger.debug("Robots.txt request received");
        // Return a simple robots.txt to prevent 403 errors
        return ResponseEntity.ok("User-agent: *\nDisallow: /api/\nAllow: /");
    }

    @GetMapping("/sitemap.xml")
    public ResponseEntity<String> getSitemapXml() {
        logger.debug("Sitemap.xml request received");
        // Return a simple sitemap to prevent 403 errors
        return ResponseEntity.ok("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>");
    }
} 