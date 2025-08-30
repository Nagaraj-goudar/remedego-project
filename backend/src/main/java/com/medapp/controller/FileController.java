package com.medapp.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class FileController {
    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    @GetMapping("/uploads/{filename}")
    public ResponseEntity<byte[]> serveFile(@PathVariable String filename) {
        try {
            // Validate filename to prevent directory traversal attacks
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                logger.warn("Invalid filename detected: {}", filename);
                return ResponseEntity.badRequest().build();
            }
            
            // Try multiple possible file locations
            Path[] possiblePaths = {
                Paths.get(System.getProperty("user.dir"), "uploads", filename),
                Paths.get(System.getProperty("user.dir"), "backend", "uploads", filename)
            };
            
            Path filePath = null;
            for (Path path : possiblePaths) {
                if (Files.exists(path)) {
                    filePath = path;
                    break;
                }
            }
            
            // Check if file exists in any location
            if (filePath == null) {
                logger.warn("File not found in any location: {}", filename);
                return ResponseEntity.notFound().build();
            }
            
            // Read file content
            byte[] fileContent = Files.readAllBytes(filePath);
            
            // Determine content type
            String contentType = "application/octet-stream";
            if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filename.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.toLowerCase().endsWith(".gif")) {
                contentType = "image/gif";
            }
            
            logger.info("Serving file: {} with content type: {} from location: {}", filename, contentType, filePath);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(fileContent.length);
            headers.set("Content-Disposition", "inline; filename=\"" + filename + "\"");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);
                    
        } catch (IOException e) {
            logger.error("Error reading file: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            logger.error("Unexpected error serving file: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 