package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.service.RefillReminderService;
import com.medapp.service.SmsService;
import com.medapp.model.User;
import com.medapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reminders")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ReminderController {

    @Autowired
    private RefillReminderService refillReminderService;

    @Autowired
    private SmsService smsService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get reminder statistics (Admin only)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RefillReminderService.RefillReminderStats>> getReminderStats() {
        try {
            RefillReminderService.RefillReminderStats stats = refillReminderService.getRefillReminderStats();
            return ResponseEntity.ok(ApiResponse.success(stats, "Reminder statistics retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to get reminder stats: " + e.getMessage()));
        }
    }

    /**
     * Update reminder settings for a patient
     */
    @PutMapping("/settings")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<String>> updateReminderSettings(
            @RequestBody ReminderSettingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Username is the email; resolve user and ensure patient
            String email = userDetails.getUsername();
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null || user.getRole() != User.Role.PATIENT) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only patients can update reminder settings"));
            }

            refillReminderService.updateReminderSettings(user.getId(), request.enabled);

            String message = request.enabled ? "Email reminders enabled successfully" : "Email reminders disabled successfully";
            return ResponseEntity.ok(ApiResponse.success(message, "Settings updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to update settings: " + e.getMessage()));
        }
    }

    /**
     * Check if SMS service is configured (Admin only)
     */
    @GetMapping("/sms-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SmsStatusResponse>> getSmsStatus() {
        try {
            boolean configured = smsService.isConfigured();
            SmsStatusResponse response = new SmsStatusResponse();
            response.configured = configured;
            response.message = configured ? "SMS service is properly configured" : "SMS service is not configured";
            
            return ResponseEntity.ok(ApiResponse.success(response, "SMS status retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to get SMS status: " + e.getMessage()));
        }
    }

    /**
     * Manually trigger reminder check (Admin only - for testing)
     */
    @PostMapping("/trigger-check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> triggerReminderCheck() {
        try {
            refillReminderService.triggerRefillReminderCheck();
            return ResponseEntity.ok(ApiResponse.success("Reminder check triggered successfully", "Check completed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to trigger reminder check: " + e.getMessage()));
        }
    }

    /**
     * Test SMS sending (Admin only - for testing)
     */
    @PostMapping("/test-sms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> testSms(@RequestBody TestSmsRequest request) {
        try {
            if (!smsService.isConfigured()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("SMS service is not configured"));
            }

            boolean sent = smsService.sendSms(request.phoneNumber, request.message);
            
            if (sent) {
                return ResponseEntity.ok(ApiResponse.success("Test SMS sent successfully", "SMS sent"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Failed to send test SMS"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to send test SMS: " + e.getMessage()));
        }
    }

    // Request/Response DTOs
    public static class ReminderSettingsRequest {
        public boolean enabled;
    }

    public static class SmsStatusResponse {
        public boolean configured;
        public String message;
    }

    public static class TestSmsRequest {
        public String phoneNumber;
        public String message;
    }
}


