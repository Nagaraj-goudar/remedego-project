package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.model.RefillRequest;
import com.medapp.model.User;
import com.medapp.repository.UserRepository;
import com.medapp.service.RefillRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class RefillRequestController {
    private static final Logger logger = LoggerFactory.getLogger(RefillRequestController.class);
    
    @Autowired
    private RefillRequestService refillRequestService;
    
    @Autowired
    private UserRepository userRepository;

    // DTO for frontend
    public static class RefillRequestDTO {
        public String id;
        public String prescriptionId;
        public String patientId;
        public String patientName;
        public String pharmacistId;
        public String pharmacistName;
        public String status;
        public String requestedAt;
        public String actionedAt;
        public String reasonForRejection;
        public String addressLine1;
        public String addressLine2;
        public String city;
        public String state;
        public String pincode;
        public String phone;

        public RefillRequestDTO(RefillRequest r) {
            this.id = r.getId() != null ? r.getId().toString() : "";
            this.prescriptionId = r.getPrescription() != null && r.getPrescription().getId() != null 
                ? r.getPrescription().getId().toString() : "";
            this.patientId = r.getPatient() != null && r.getPatient().getId() != null 
                ? r.getPatient().getId().toString() : "";
            this.patientName = r.getPatient() != null ? r.getPatient().getName() : "";
            this.pharmacistId = r.getPharmacist() != null && r.getPharmacist().getId() != null 
                ? r.getPharmacist().getId().toString() : "";
            this.pharmacistName = r.getPharmacist() != null ? r.getPharmacist().getName() : "";
            this.status = r.getStatus() != null ? r.getStatus().name() : "PENDING";
            this.requestedAt = r.getRequestedAt() != null ? r.getRequestedAt().toString() : "";
            this.actionedAt = r.getActionedAt() != null ? r.getActionedAt().toString() : "";
            this.reasonForRejection = r.getReasonForRejection();
            this.addressLine1 = r.getDeliveryAddressLine1();
            this.addressLine2 = r.getDeliveryAddressLine2();
            this.city = r.getDeliveryCity();
            this.state = r.getDeliveryState();
            this.pincode = r.getDeliveryPincode();
            this.phone = r.getDeliveryPhone();
        }
    }

    /**
     * Patient endpoint: Request a refill
     * POST /api/patient/refill-requests
     */
    @PostMapping("/patient/refill-requests")
    public ResponseEntity<ApiResponse<RefillRequestDTO>> requestRefill(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Refill request from patient: {}", userDetails.getUsername());
        try {
            // Validate user role
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PATIENT) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only patients can request refills"));
            }
            
            Long prescriptionId = Long.valueOf(body.get("prescriptionId").toString());
            Map<String, Object> addr = (Map<String, Object>) body.get("address");
            if (addr == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Delivery address is required"));
            }
            String line1 = String.valueOf(addr.getOrDefault("line1", "")).trim();
            String line2 = String.valueOf(addr.getOrDefault("line2", "")).trim();
            String city = String.valueOf(addr.getOrDefault("city", "")).trim();
            String state = String.valueOf(addr.getOrDefault("state", "")).trim();
            String pincode = String.valueOf(addr.getOrDefault("pincode", "")).trim();
            String phone = String.valueOf(addr.getOrDefault("phone", "")).trim();

            RefillRequest refillRequest = refillRequestService.requestRefill(
                prescriptionId, userDetails.getUsername(),
                line1, line2, city, state, pincode, phone
            );
            
            logger.info("Refill request created successfully: {}", refillRequest.getId());
            return ResponseEntity.ok(ApiResponse.success(
                new RefillRequestDTO(refillRequest), 
                "Refill request submitted successfully"
            ));
        } catch (Exception e) {
            logger.error("Failed to create refill request: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Patient endpoint: Get my refill requests
     * GET /api/patient/refill-requests
     */
    @GetMapping("/patient/refill-requests")
    public ResponseEntity<ApiResponse<List<RefillRequestDTO>>> getMyRefillRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Getting refill requests for patient: {}", userDetails.getUsername());
        try {
            // Validate user role
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PATIENT) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only patients can view their refill requests"));
            }
            
            List<RefillRequest> refillRequests = refillRequestService.getRefillRequestsForPatient(userDetails.getUsername());
            List<RefillRequestDTO> dtos = refillRequests.stream()
                .map(RefillRequestDTO::new)
                .collect(Collectors.toList());
            
            logger.info("Found {} refill requests for patient", dtos.size());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Refill requests retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get refill requests: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Pharmacist endpoint: Get refill requests by status (pending by default, can filter by status)
     * GET /api/pharmacist/refill-requests?status=APPROVED
     */
    @GetMapping("/pharmacist/refill-requests")
    public ResponseEntity<ApiResponse<List<RefillRequestDTO>>> getRefillRequestsByStatus(
            @RequestParam(value = "status", required = false) String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Getting refill requests for pharmacist: {} with status: {}", userDetails.getUsername(), status);
        try {
            // Validate user role
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only pharmacists can view refill requests"));
            }
            List<RefillRequest> refillRequests;
            if (status != null) {
                refillRequests = refillRequestService.getRefillRequestsByStatus(status);
            } else {
                refillRequests = refillRequestService.getPendingRefillRequests();
            }
            List<RefillRequestDTO> dtos = refillRequests.stream()
                .map(RefillRequestDTO::new)
                .collect(Collectors.toList());
            logger.info("Found {} refill requests", dtos.size());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Refill requests retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get refill requests: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Pharmacist endpoint: Approve refill request
     * PUT /api/pharmacist/refill-requests/{id}/approve
     */
    @PutMapping("/pharmacist/refill-requests/{id}/approve")
    public ResponseEntity<ApiResponse<RefillRequestDTO>> approveRefillRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Approving refill request {} by pharmacist: {}", id, userDetails.getUsername());
        try {
            // Validate user role
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only pharmacists can approve refill requests"));
            }
            
            RefillRequest approved = refillRequestService.approveRefillRequest(id, userDetails.getUsername());
            
            logger.info("Refill request {} approved successfully", id);
            return ResponseEntity.ok(ApiResponse.success(
                new RefillRequestDTO(approved), 
                "Refill request approved successfully"
            ));
        } catch (Exception e) {
            logger.error("Failed to approve refill request: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Pharmacist endpoint: Reject refill request
     * PUT /api/pharmacist/refill-requests/{id}/reject
     */
    @PutMapping("/pharmacist/refill-requests/{id}/reject")
    public ResponseEntity<ApiResponse<RefillRequestDTO>> rejectRefillRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Rejecting refill request {} by pharmacist: {}", id, userDetails.getUsername());
        try {
            // Validate user role
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only pharmacists can reject refill requests"));
            }
            
            String rejectionReason = body.getOrDefault("reason", "No reason provided");
            RefillRequest rejected = refillRequestService.rejectRefillRequest(id, userDetails.getUsername(), rejectionReason);
            
            logger.info("Refill request {} rejected successfully", id);
            return ResponseEntity.ok(ApiResponse.success(
                new RefillRequestDTO(rejected), 
                "Refill request rejected successfully"
            ));
        } catch (Exception e) {
            logger.error("Failed to reject refill request: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Pharmacist endpoint: Fill refill request with medicines
     * PUT /api/pharmacist/refill-requests/{id}/fill
     */
    @PutMapping("/pharmacist/refill-requests/{id}/fill")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> fillRefillRequest(
            @PathVariable Long id,
            @RequestBody List<RefillRequestService.MedicineFillItem> items,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Filling refill request {} by pharmacist: {}", id, userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only pharmacists can fill refill requests"));
            }
            List<String> lowStockAlerts = refillRequestService.fillRefillRequest(id, userDetails.getUsername(), items);
            Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("message", "Medicines filled successfully");
            resp.put("lowStockAlerts", lowStockAlerts);
            return ResponseEntity.ok(ApiResponse.success(resp, "Medicines filled successfully"));
        } catch (Exception e) {
            logger.error("Failed to fill refill request: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}