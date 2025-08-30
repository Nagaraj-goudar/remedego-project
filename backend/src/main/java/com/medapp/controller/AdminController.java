package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.dto.UserDTO;
import com.medapp.model.User;
import com.medapp.repository.*;
import com.medapp.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PharmacistRepository pharmacistRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private RefillRequestRepository refillRequestRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private EmailService emailService;

    // Get all pending pharmacists
    @GetMapping("/pending-pharmacists")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getPendingPharmacists() {
        logger.info("Admin requesting pending pharmacists");
        try {
            List<User> pendingPharmacists = userRepository.findByRoleAndIsVerifiedOrderByCreatedAtDesc(
                User.Role.PHARMACIST, false);

            List<UserDTO> pharmacistDTOs = pendingPharmacists.stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());

            logger.info("Found {} pending pharmacists", pharmacistDTOs.size());
            return ResponseEntity.ok(ApiResponse.success(pharmacistDTOs, "Pending pharmacists retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get pending pharmacists: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Get all pharmacists (both pending and approved)
    @GetMapping("/all-pharmacists")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllPharmacists() {
        logger.info("Admin requesting all pharmacists");
        try {
            List<User> allPharmacists = userRepository.findByRoleOrderByCreatedAtDesc(User.Role.PHARMACIST);

            List<UserDTO> pharmacistDTOs = allPharmacists.stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());

            logger.info("Found {} total pharmacists", pharmacistDTOs.size());
            return ResponseEntity.ok(ApiResponse.success(pharmacistDTOs, "All pharmacists retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get all pharmacists: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Approve pharmacist
    @PostMapping("/pharmacists/{id}/approve")
    public ResponseEntity<ApiResponse<String>> approvePharmacist(@PathVariable Long id) {
        logger.info("Admin approving pharmacist with ID: {}", id);
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Pharmacist not found"));
            }

            User user = userOpt.get();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User is not a pharmacist"));
            }

            if (user.isVerified()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Pharmacist is already verified"));
            }

            user.setVerified(true);
            userRepository.save(user);

            // Send approval email
            emailService.sendAccountVerifiedEmail(user);

            logger.info("Pharmacist approved successfully: {}", user.getEmail());
            return ResponseEntity.ok(ApiResponse.success("Pharmacist approved successfully",
                "Pharmacist " + user.getName() + " has been approved and can now login"));
        } catch (Exception e) {
            logger.error("Failed to approve pharmacist {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Reject pharmacist
    @PostMapping("/pharmacists/{id}/reject")
    @Transactional
    public ResponseEntity<ApiResponse<String>> rejectPharmacist(
            @PathVariable Long id,
            @RequestBody(required = false) RejectionRequest request) {
        logger.info("Admin rejecting pharmacist with ID: {}", id);
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Pharmacist not found"));
            }

            User user = userOpt.get();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User is not a pharmacist"));
            }

            if (user.isVerified()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Pharmacist is already verified"));
            }

            // Send rejection email with reason
            String reason = request != null && request.getReason() != null ? request.getReason() : "No specific reason provided";
            emailService.sendPharmacistRejectionEmail(user, reason);

            // Proactively detach references to avoid FK violations
            try {
                refillRequestRepository.unsetPharmacistForUser(user);
            } catch (Exception detachEx) {
                logger.warn("Failed to unset pharmacist references for user {} before delete: {}", id, detachEx.getMessage());
            }

            // Delete the user account (CASCADE DELETE will handle related data)
            userRepository.delete(user);

            logger.info("Pharmacist rejected and deleted: {}", user.getEmail());
            return ResponseEntity.ok(ApiResponse.success("Pharmacist rejected successfully",
                "Pharmacist " + user.getName() + " has been rejected and their account has been removed"));
        } catch (Exception e) {
            logger.error("Failed to reject pharmacist {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Get pharmacist details
    @GetMapping("/pharmacists/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getPharmacistDetails(@PathVariable Long id) {
        logger.info("Admin requesting pharmacist details for ID: {}", id);
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Pharmacist not found"));
            }

            User user = userOpt.get();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User is not a pharmacist"));
            }

            UserDTO userDTO = new UserDTO(user);
            return ResponseEntity.ok(ApiResponse.success(userDTO, "Pharmacist details retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get pharmacist details {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Get all users
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        logger.info("Admin requesting all users");
        try {
            List<User> allUsers = userRepository.findAll();

            List<UserDTO> userDTOs = allUsers.stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());

            logger.info("Found {} total users", userDTOs.size());
            return ResponseEntity.ok(ApiResponse.success(userDTOs, "All users retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get all users: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Update user status (activate/deactivate)
    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateUserStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest request) {
        logger.info("Admin updating user status for ID: {}", id);
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();
            user.setActive(request.isActive());
            userRepository.save(user);

            String status = request.isActive() ? "activated" : "deactivated";
            logger.info("User {} {} successfully", user.getEmail(), status);
            return ResponseEntity.ok(ApiResponse.success("User " + status + " successfully"));
        } catch (Exception e) {
            logger.error("Failed to update user status: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Delete user
    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        logger.info("Admin deleting user with ID: {}", id);
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();
            if (user.getRole() == User.Role.ADMIN) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Cannot delete admin users"));
            }

            // Delete the user account (CASCADE DELETE will handle related data)
            userRepository.delete(user);
            logger.info("User {} deleted successfully", user.getEmail());
            return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
        } catch (Exception e) {
            logger.error("Failed to delete user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // DTO for rejection request
    public static class RejectionRequest {
        private String reason;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public static class StatusUpdateRequest {
        private boolean active;

        public boolean isActive() {
            return active;
        }

        public void setActive(boolean active) {
            this.active = active;
        }
    }
}
