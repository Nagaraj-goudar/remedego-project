package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.dto.AuthResponse;
import com.medapp.dto.LoginRequest;
import com.medapp.dto.RegisterRequest;
import com.medapp.dto.ForgotPasswordRequest;
import com.medapp.dto.ResetPasswordRequest;
import com.medapp.dto.UpdateProfileRequest;
import com.medapp.exception.AccountNotVerifiedException;
import com.medapp.exception.EmailAlreadyExistsException;
import com.medapp.exception.InvalidTokenException;
import com.medapp.model.Patient;
import com.medapp.model.User;
import com.medapp.repository.UserRepository;
import com.medapp.security.JwtUtil;
import com.medapp.service.AuthService;
import com.medapp.service.EmailService;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;

import jakarta.validation.Valid;
import com.medapp.model.Pharmacist;
import com.medapp.dto.UpdatePasswordRequest;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthService authService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        logger.info("Received registration request for email: {}", request.getEmail());
        logger.info("Request body: {}", request);
        try {
            AuthResponse authResponse = authService.register(request);
            logger.info("Registration successful for email: {}", request.getEmail());
            return ResponseEntity.ok(ApiResponse.success(authResponse, "Registration successful"));
        } catch (EmailAlreadyExistsException e) {
            logger.error("Registration failed - email already exists: {}", request.getEmail());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Registration failed for email {}: {}", request.getEmail(), e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        logger.info("Received login request for email: {}", request.getEmail());
        try {
            AuthResponse authResponse = authService.login(request);
            logger.info("Login successful for email: {}", request.getEmail());
            return ResponseEntity.ok(ApiResponse.success(authResponse, "Login successful"));
        } catch (AccountNotVerifiedException e) {
            logger.error("Login failed - account not verified: {}", request.getEmail());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (RuntimeException e) {
            logger.error("Login failed for email {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Login failed for email {}: {}", request.getEmail(), e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Login failed. Please check your credentials and try again."));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        logger.info("Password reset request for email: {}", request.getEmail());
        try {
            authService.forgotPassword(request);
            logger.info("Password reset email sent to: {}", request.getEmail());
            return ResponseEntity.ok(ApiResponse.success("Password reset email sent", "If an account exists with this email, a password reset link has been sent"));
        } catch (Exception e) {
            logger.error("Password reset failed for email {}: {}", request.getEmail(), e.getMessage(), e);
            // Return success even on error to prevent email enumeration
            return ResponseEntity.ok(ApiResponse.success("Password reset email sent", "If an account exists with this email, a password reset link has been sent"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        logger.info("Password reset attempt with token");
        try {
            authService.resetPassword(request);
            logger.info("Password reset successful");
            return ResponseEntity.ok(ApiResponse.success("Password reset successful", "Your password has been reset successfully"));
        } catch (InvalidTokenException e) {
            logger.error("Password reset failed - invalid token");
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Password reset failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/create-test-user")
    public ResponseEntity<ApiResponse<String>> createTestUser() {
        logger.info("Creating test user");
        try {
            // Check if test user already exists
            if (userRepository.findByEmail("test@remedgo.com").isPresent()) {
                return ResponseEntity.ok(ApiResponse.success("Test user already exists", "Use email: test@remedgo.com, password: test123"));
            }
            
            // Create a test patient
            Patient patient = new Patient();
            patient.setName("Test User");
            patient.setEmail("test@remedgo.com");
            patient.setPassword(passwordEncoder.encode("test123"));
            patient.setRole(User.Role.PATIENT);
            patient.setActive(true);
            patient.setVerified(true);
            
            userRepository.save(patient);
            
            logger.info("Test user created successfully");
            return ResponseEntity.ok(ApiResponse.success("Test user created", "Use email: test@remedgo.com, password: test123"));
        } catch (Exception e) {
            logger.error("Failed to create test user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/create-admin")
    public ResponseEntity<ApiResponse<String>> createAdmin() {
        logger.info("Creating admin user");
        try {
            // Check if admin already exists
            if (userRepository.findByEmail("admin@remedgo.com").isPresent()) {
                return ResponseEntity.ok(ApiResponse.success("Admin already exists", "Use email: admin@remedgo.com, password: admin123"));
            }
            
            // Create an admin user
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@remedgo.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(User.Role.ADMIN);
            admin.setActive(true);
            admin.setVerified(true);
            admin.setPhone("1234567890");
            
            userRepository.save(admin);
            
            logger.info("Admin user created successfully");
            return ResponseEntity.ok(ApiResponse.success("Admin created", "Use email: admin@remedgo.com, password: admin123"));
        } catch (Exception e) {
            logger.error("Failed to create admin: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/fix-user-password")
    public ResponseEntity<ApiResponse<String>> fixUserPassword() {
        logger.info("Fixing user password for nagarajgoudar78@remedgo.com");
        try {
            User user = userRepository.findByEmail("nagarajgoudar78@remedgo.com")
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Reset password to a known value
            String newPassword = "password123";
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            
            logger.info("User password fixed successfully");
            return ResponseEntity.ok(ApiResponse.success("Password fixed", "New password: " + newPassword));
        } catch (Exception e) {
            logger.error("Failed to fix user password: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7); // Remove "Bearer "
            String email = jwtUtil.getSubject(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(ApiResponse.success(user, "User retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<User>> updateCurrentUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfileRequest request) {
        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.getSubject(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (request.getName() != null && !request.getName().trim().isEmpty()) {
                user.setName(request.getName().trim());
            }
            if (request.getPhone() != null) {
                user.setPhone(request.getPhone().trim());
            }
            
            // Handle role-specific fields
            if (request.getAddress() != null) {
                if (user instanceof Patient) {
                    ((Patient) user).setAddress(request.getAddress().trim());
                }
            }
            if (request.getDateOfBirth() != null) {
                if (user instanceof Patient) {
                    ((Patient) user).setDateOfBirth(request.getDateOfBirth());
                }
            }
            if (request.getLicenseNumber() != null) {
                if (user instanceof Pharmacist) {
                    ((Pharmacist) user).setLicenseNumber(request.getLicenseNumber().trim());
                }
            }
            
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success(user, "Profile updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/profile-photo")
    public ResponseEntity<ApiResponse<String>> uploadProfilePhoto(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("file") MultipartFile file) {
        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.getSubject(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/"))) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only image files are allowed"));
            }

            // Validate file size (1MB max)
            if (file.getSize() > 1024 * 1024) {
                return ResponseEntity.badRequest().body(ApiResponse.error("File size must be less than 1MB"));
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = "profile_" + user.getId() + "_" + UUID.randomUUID().toString() + extension;

            // Create uploads directory if it doesn't exist
            Path uploadsDir = Paths.get(System.getProperty("user.dir"), "uploads");
            if (!Files.exists(uploadsDir)) {
                Files.createDirectories(uploadsDir);
            }

            // Save file
            Path filePath = uploadsDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            // Update user's profile photo field
            user.setProfilePhoto(filename);
            userRepository.save(user);

            logger.info("Profile photo uploaded successfully for user: {}", email);
            return ResponseEntity.ok(ApiResponse.success(filename, "Profile photo uploaded successfully"));
        } catch (Exception e) {
            logger.error("Failed to upload profile photo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/update-password")
    public ResponseEntity<ApiResponse<String>> updatePassword(
            @RequestBody UpdatePasswordRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.getSubject(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Verify old password
            if (!authService.verifyPassword(request.getOldPassword(), user.getPassword())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Current password is incorrect"));
            }

            // Validate new password
            if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("New password cannot be empty"));
            }

            if (request.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest().body(ApiResponse.error("New password must be at least 6 characters long"));
            }

            // Hash and update new password
            String hashedNewPassword = authService.hashPassword(request.getNewPassword());
            user.setPassword(hashedNewPassword);
            userRepository.save(user);

            logger.info("Password updated successfully for user: {}", email);
            return ResponseEntity.ok(ApiResponse.success("Password updated successfully", "Password updated successfully"));
        } catch (Exception e) {
            logger.error("Failed to update password: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/debug-user/{email}")
    public ResponseEntity<ApiResponse<String>> debugUser(@PathVariable String email) {
        logger.info("Debug request for email: {}", email);
        try {
            User user = userRepository.findByEmail(email)
                    .orElse(null);
            
            if (user == null) {
                return ResponseEntity.ok(ApiResponse.success("User not found", "No user exists with this email"));
            }
            
            String userInfo = String.format("User found: Name=%s, Role=%s, Active=%s, Verified=%s, HasPassword=%s", 
                user.getName(), 
                user.getRole(), 
                user.isActive(),
                user.isVerified(),
                user.getPassword() != null && !user.getPassword().isEmpty());
            
            logger.info("Debug info for {}: {}", email, userInfo);
            return ResponseEntity.ok(ApiResponse.success(userInfo, "User details retrieved"));
        } catch (Exception e) {
            logger.error("Debug failed for email {}: {}", email, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/test-register")
    public ResponseEntity<ApiResponse<String>> testRegister(@RequestBody RegisterRequest request) {
        logger.info("Test registration request for email: {}", request.getEmail());
        logger.info("Test request body: {}", request);
        
        // Validate required fields manually
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Name is required"));
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Password must be at least 6 characters"));
        }
        if (request.getPhone() == null || !request.getPhone().matches("^\\d{10}$")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phone must be exactly 10 digits"));
        }
        if (request.getRole() == null || !request.getRole().matches("^(PATIENT|PHARMACIST)$")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Role must be PATIENT or PHARMACIST"));
        }
        
        return ResponseEntity.ok(ApiResponse.success("Validation passed", "All fields are valid"));
    }

    @PostMapping("/test-forgot-password")
    public ResponseEntity<ApiResponse<String>> testForgotPassword(@RequestBody ForgotPasswordRequest request) {
        logger.info("Test forgot password request for email: {}", request.getEmail());
        logger.info("Test request body: {}", request);
        
        // Validate email
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }
        
        // Check if user exists
        boolean userExists = userRepository.findByEmail(request.getEmail()).isPresent();
        
        return ResponseEntity.ok(ApiResponse.success("Test completed", 
            String.format("Email validation passed. User exists: %s", userExists)));
    }

    @PostMapping("/verify-pharmacist/{email}")
    public ResponseEntity<ApiResponse<String>> verifyPharmacist(@PathVariable String email) {
        logger.info("Verifying pharmacist: {}", email);
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User is not a pharmacist"));
            }
            
            if (user.isVerified()) {
                return ResponseEntity.ok(ApiResponse.success("Pharmacist already verified", "User is already verified"));
            }
            
            user.setVerified(true);
            userRepository.save(user);
            
            // Send verification email
            emailService.sendAccountVerifiedEmail(user);
            
            logger.info("Pharmacist verified successfully: {}", email);
            return ResponseEntity.ok(ApiResponse.success("Pharmacist verified", "User can now login"));
        } catch (Exception e) {
            logger.error("Failed to verify pharmacist {}: {}", email, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
} 