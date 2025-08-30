package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.model.Prescription;
import com.medapp.model.User;
import com.medapp.repository.UserRepository;
import com.medapp.service.PrescriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.medapp.service.TrackingService;
import com.medapp.model.PrescriptionTracking;
import org.springframework.security.access.prepost.PreAuthorize;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.HashMap;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PrescriptionController {
    private static final Logger logger = LoggerFactory.getLogger(PrescriptionController.class);
    
    @Autowired
    private PrescriptionService prescriptionService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TrackingService trackingService;

    // DTO for frontend
    public static class PrescriptionDTO {
        public String id;
        public String patientId;
        public String patientName;
        public String imageUrl;
        public String fileUrl; // New field for public file URL
        public String status;
        public String notes;
        public String createdAt;
        public String updatedAt;

        public PrescriptionDTO(Prescription p, String fileUrl) {
            this.id = p.getId() != null ? p.getId().toString() : "";
            this.patientId = p.getPatient() != null && p.getPatient().getId() != null ? p.getPatient().getId().toString() : "";
            this.patientName = p.getPatient() != null ? p.getPatient().getName() : "";
            this.imageUrl = p.getImageUrl();
            this.fileUrl = fileUrl; // Set the public file URL
            this.status = p.getStatus() != null ? p.getStatus().name() : "PENDING";
            this.notes = p.getNotes();
            this.createdAt = p.getCreatedAt() != null ? p.getCreatedAt().toString() : "";
            this.updatedAt = p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : "";
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> uploadPrescription(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        logger.info("Upload request received for user: {}", userDetails != null ? userDetails.getUsername() : "null");
        if (userDetails == null) {
            logger.error("UserDetails is null - authentication failed");
            return ResponseEntity.badRequest().body(ApiResponse.error("Authentication required"));
        }
        try {
            Prescription prescription = prescriptionService.uploadPrescription(userDetails.getUsername(), file);
            String fileUrl = prescriptionService.generateFileUrl(prescription);
            try { trackingService.record(prescription.getId(), PrescriptionTracking.Status.UPLOADED, null); } catch (Exception ignore) {}
            logger.info("Prescription uploaded successfully for user: {} with file URL: {}", userDetails.getUsername(), fileUrl);
            return ResponseEntity.ok(ApiResponse.success(new PrescriptionDTO(prescription, fileUrl), "Prescription uploaded successfully"));
        } catch (Exception e) {
            logger.error("Failed to upload prescription: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Patient's prescription history
    @GetMapping("/my-history")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getMyPrescriptions(@AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Getting prescription history for user: {}", userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PATIENT) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only patients can access prescription history"));
            }
            List<Prescription> prescriptions = prescriptionService.getPrescriptionsForPatient(user);
            List<PrescriptionDTO> dtos = prescriptions.stream()
                .map(p -> new PrescriptionDTO(p, prescriptionService.generateFileUrl(p)))
                .collect(Collectors.toList());
            logger.info("Found {} prescriptions for patient {}", dtos.size(), user.getEmail());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Prescription history retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get prescription history: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Pharmacist's pending prescriptions
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getPendingPrescriptions(@AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Getting pending prescriptions for user: {}", userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only pharmacists can access pending prescriptions"));
            }
            List<Prescription> prescriptions = prescriptionService.getPendingPrescriptions();
            List<PrescriptionDTO> dtos = prescriptions.stream()
                .map(p -> new PrescriptionDTO(p, prescriptionService.generateFileUrl(p)))
                .collect(Collectors.toList());
            logger.info("Found {} pending prescriptions", dtos.size());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Pending prescriptions retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get pending prescriptions: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // General prescriptions endpoint (for backward compatibility)
    @GetMapping
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getPrescriptions(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            List<Prescription> prescriptions = prescriptionService.getPrescriptionsForUser(user);
            List<PrescriptionDTO> dtos = prescriptions.stream()
                .map(p -> new PrescriptionDTO(p, prescriptionService.generateFileUrl(p)))
                .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Prescriptions retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get prescriptions: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> getPrescriptionById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            Prescription prescription = prescriptionService.getPrescriptionById(id);
            
            // Check if user has access to this prescription
            if (user.getRole() == User.Role.PATIENT && !prescription.getPatient().getId().equals(user.getId())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Access denied"));
            }
            
            String fileUrl = prescriptionService.generateFileUrl(prescription);
            return ResponseEntity.ok(ApiResponse.success(new PrescriptionDTO(prescription, fileUrl), "Prescription retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get prescription by ID: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> updatePrescriptionStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only pharmacists can update prescription status"));
            }
            Prescription.Status status = Prescription.Status.valueOf(body.get("status"));
            String notes = body.getOrDefault("notes", null);
            Prescription updated = prescriptionService.updatePrescriptionStatus(id, status, notes);
            String fileUrl = prescriptionService.generateFileUrl(updated);
            return ResponseEntity.ok(ApiResponse.success(new PrescriptionDTO(updated, fileUrl), "Prescription status updated successfully"));
        } catch (Exception e) {
            logger.error("Failed to update prescription status: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Pharmacist endpoint: Approve prescription
     * PUT /api/prescriptions/{id}/approve
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> approvePrescription(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Approving prescription {} by pharmacist: {}", id, userDetails.getUsername());
        try {
            String notes = body != null ? body.get("notes") : null;
            
            // Update prescription status to APPROVED
            Prescription updated = prescriptionService.updatePrescriptionStatus(id, Prescription.Status.APPROVED, notes);
            String fileUrl = prescriptionService.generateFileUrl(updated);
            try { trackingService.record(updated.getId(), PrescriptionTracking.Status.APPROVED, notes); } catch (Exception ignore) {}
            
            // TODO: Send notification to patient about prescription approval
            logger.info("Prescription {} approved successfully", id);
            return ResponseEntity.ok(ApiResponse.success(new PrescriptionDTO(updated, fileUrl), "Prescription approved successfully"));
        } catch (Exception e) {
            logger.error("Failed to approve prescription: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Pharmacist endpoint: Reject prescription
     * PUT /api/prescriptions/{id}/reject
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> rejectPrescription(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Rejecting prescription {} by pharmacist: {}", id, userDetails.getUsername());
        try {
            String reason = body.get("reason");
            
            // Update prescription status to REJECTED
            Prescription updated = prescriptionService.updatePrescriptionStatus(id, Prescription.Status.REJECTED, reason);
            String fileUrl = prescriptionService.generateFileUrl(updated);
            
            // TODO: Send notification to patient about prescription rejection
            logger.info("Prescription {} rejected successfully", id);
            return ResponseEntity.ok(ApiResponse.success(new PrescriptionDTO(updated, fileUrl), "Prescription rejected successfully"));
        } catch (Exception e) {
            logger.error("Failed to reject prescription: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/file/{filename}")
    public ResponseEntity<org.springframework.core.io.Resource> getPrescriptionFile(@PathVariable String filename) {
        try {
            // Validate filename to prevent directory traversal attacks
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return ResponseEntity.badRequest().build();
            }
            
            // Try multiple possible file locations
            java.nio.file.Path[] possiblePaths = {
                java.nio.file.Paths.get(System.getProperty("user.dir"), "uploads", filename),
                java.nio.file.Paths.get(System.getProperty("user.dir"), "backend", "uploads", filename)
            };
            
            java.nio.file.Path filePath = null;
            for (java.nio.file.Path path : possiblePaths) {
                if (java.nio.file.Files.exists(path)) {
                    filePath = path;
                    break;
                }
            }
            
            // Check if file exists in any location
            if (filePath == null) {
                logger.warn("File not found in any location: {}", filename);
                return ResponseEntity.notFound().build();
            }
            
            // Create resource
            org.springframework.core.io.Resource resource = new org.springframework.core.io.FileSystemResource(filePath.toFile());
            
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
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("Error serving file: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/test-file-access")
    public ResponseEntity<Map<String, Object>> testFileAccess() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Test if we can access a known file
            String testFilename = "presc_1753977182138.png";
            java.nio.file.Path[] possiblePaths = {
                java.nio.file.Paths.get(System.getProperty("user.dir"), "uploads", testFilename),
                java.nio.file.Paths.get(System.getProperty("user.dir"), "backend", "uploads", testFilename)
            };
            
            boolean fileExists = false;
            String foundPath = null;
            for (java.nio.file.Path path : possiblePaths) {
                if (java.nio.file.Files.exists(path)) {
                    fileExists = true;
                    foundPath = path.toString();
                    break;
                }
            }
            
            response.put("fileExists", fileExists);
            response.put("foundPath", foundPath);
            response.put("currentWorkingDir", System.getProperty("user.dir"));
            response.put("testFilename", testFilename);
            response.put("possiblePaths", Arrays.stream(possiblePaths).map(p -> p.toString()).collect(Collectors.toList()));
            
            logger.info("File access test - File exists: {}, Found path: {}", fileExists, foundPath);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error in file access test", e);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 