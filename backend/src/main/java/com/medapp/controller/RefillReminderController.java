package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.model.User;
import com.medapp.repository.UserRepository;
import com.medapp.service.RefillReminderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/admin/refill-reminders")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class RefillReminderController {
    private static final Logger logger = LoggerFactory.getLogger(RefillReminderController.class);
    
    @Autowired
    private RefillReminderService refillReminderService;
    
    @Autowired
    private UserRepository userRepository;

    /**
     * Admin endpoint: Manually trigger refill reminder check
     * POST /api/admin/refill-reminders/trigger
     */
    @PostMapping("/trigger")
    public ResponseEntity<ApiResponse<String>> triggerRefillReminders(
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Manual refill reminder trigger requested by: {}", userDetails.getUsername());
        try {
            // Validate user role
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.ADMIN) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only admins can trigger refill reminders"));
            }
            
            refillReminderService.triggerRefillReminderCheck();
            
            logger.info("Refill reminder check triggered successfully");
            return ResponseEntity.ok(ApiResponse.success(
                "Refill reminder check completed successfully", 
                "Check the application logs for details"
            ));
        } catch (Exception e) {
            logger.error("Failed to trigger refill reminders: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Admin endpoint: Get refill reminder statistics
     * GET /api/admin/refill-reminders/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<RefillReminderService.RefillReminderStats>> getRefillReminderStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Refill reminder stats requested by: {}", userDetails.getUsername());
        try {
            // Validate user role
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.ADMIN) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only admins can view refill reminder stats"));
            }
            
            RefillReminderService.RefillReminderStats stats = refillReminderService.getRefillReminderStats();
            
            logger.info("Refill reminder stats retrieved successfully");
            return ResponseEntity.ok(ApiResponse.success(stats, "Refill reminder statistics retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get refill reminder stats: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}