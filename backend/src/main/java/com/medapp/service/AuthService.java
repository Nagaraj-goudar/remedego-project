package com.medapp.service;

import com.medapp.dto.AuthResponse;
import com.medapp.dto.LoginRequest;
import com.medapp.dto.RegisterRequest;
import com.medapp.dto.ForgotPasswordRequest;
import com.medapp.dto.ResetPasswordRequest;
import com.medapp.exception.AccountNotVerifiedException;
import com.medapp.exception.EmailAlreadyExistsException;
import com.medapp.exception.InvalidTokenException;
import com.medapp.model.Patient;
import com.medapp.model.Pharmacist;
import com.medapp.model.User;
import com.medapp.repository.PatientRepository;
import com.medapp.repository.PharmacistRepository;
import com.medapp.repository.UserRepository;
import com.medapp.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private PharmacistRepository pharmacistRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        logger.info("Starting registration for email: {}", request.getEmail());
        
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            logger.error("Email already in use: {}", request.getEmail());
            throw new EmailAlreadyExistsException("Email already in use");
        }
        
        User.Role role = User.Role.valueOf(request.getRole().toUpperCase());
        User user;
        
        try {
            if (role == User.Role.PATIENT) {
                logger.info("Creating patient account for: {}", request.getEmail());
                Patient patient = new Patient();
                patient.setName(request.getName());
                patient.setEmail(request.getEmail());
                patient.setPassword(passwordEncoder.encode(request.getPassword()));
                patient.setRole(User.Role.PATIENT);
                patient.setActive(true);
                patient.setVerified(true); // Patients are verified immediately
                user = patientRepository.save(patient);
                logger.info("Patient account created successfully for: {}", request.getEmail());
            } else if (role == User.Role.PHARMACIST) {
                logger.info("Creating pharmacist account for: {}", request.getEmail());
                Pharmacist pharmacist = new Pharmacist();
                pharmacist.setName(request.getName());
                pharmacist.setEmail(request.getEmail());
                pharmacist.setPassword(passwordEncoder.encode(request.getPassword()));
                pharmacist.setRole(User.Role.PHARMACIST);
                pharmacist.setLicenseNumber(request.getLicenseNumber());
                pharmacist.setIsApproved(false); // Needs admin approval
                pharmacist.setActive(true);
                pharmacist.setVerified(false); // Pharmacists need admin verification
                user = pharmacistRepository.save(pharmacist);
                logger.info("Pharmacist account created successfully for: {}", request.getEmail());
            } else {
                logger.error("Invalid role: {}", request.getRole());
                throw new RuntimeException("Invalid role");
            }
            
            // Send registration confirmation email
            try {
                emailService.sendRegistrationConfirmationEmail(user);
                logger.info("Registration confirmation email sent to: {}", request.getEmail());
            } catch (Exception e) {
                logger.warn("Failed to send registration email to {}: {}", request.getEmail(), e.getMessage());
            }
            
            String token = jwtUtil.generateToken(user.getEmail());
            logger.info("Registration completed successfully for: {}", request.getEmail());
            return new AuthResponse(token, user);
        } catch (Exception e) {
            logger.error("Error during registration for {}: {}", request.getEmail(), e.getMessage(), e);
            throw e;
        }
    }

    public AuthResponse login(LoginRequest request) {
        logger.info("Login attempt for email: {}", request.getEmail());
        try {
            // First check if user exists
            User existingUser = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (existingUser == null) {
                logger.error("User not found for email: {}", request.getEmail());
                throw new RuntimeException("Invalid email or password");
            }
            
            // Check if pharmacist account is verified
            if (existingUser.getRole() == User.Role.PHARMACIST && !existingUser.isVerified()) {
                logger.error("Unverified pharmacist login attempt: {}", request.getEmail());
                throw new AccountNotVerifiedException("Your account is pending admin approval. Please wait for verification before logging in.");
            }
            
            logger.info("User found: {} with role: {}", existingUser.getName(), existingUser.getRole());
            
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            logger.info("Authentication successful for: {}", request.getEmail());
            
            String token = jwtUtil.generateToken(request.getEmail());
            logger.info("Login successful for: {}", request.getEmail());
            return new AuthResponse(token, existingUser);
        } catch (AuthenticationException e) {
            logger.error("Authentication failed for {}: {}", request.getEmail(), e.getMessage());
            throw new RuntimeException("Invalid email or password");
        } catch (AccountNotVerifiedException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during login for {}: {}", request.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Invalid email or password");
        }
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        logger.info("Password reset requested for email: {}", request.getEmail());
        
        // Always return success to prevent email enumeration
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            try {
                // Generate reset token
                String resetToken = UUID.randomUUID().toString();
                user.setResetToken(resetToken);
                user.setResetTokenExpiry(LocalDateTime.now().plusHours(1)); // 1 hour expiry
                userRepository.save(user);
                
                // Send password reset email
                emailService.sendPasswordResetEmail(user, resetToken);
                logger.info("Password reset email sent to: {}", request.getEmail());
            } catch (Exception e) {
                logger.error("Failed to process password reset for {}: {}", request.getEmail(), e.getMessage());
            }
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        logger.info("Password reset attempt with token");
        
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired reset token"));
        
        // Check if token is expired
        if (user.getResetTokenExpiry() != null && user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            logger.error("Expired reset token used");
            throw new InvalidTokenException("Reset token has expired");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        
        logger.info("Password reset successful for user: {}", user.getEmail());
    }

    /**
     * Verify if a raw password matches the encoded password
     */
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    /**
     * Hash a raw password
     */
    public String hashPassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
} 