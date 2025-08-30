package com.medapp.service;

import com.medapp.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isConfigured() {
        return fromAddress != null && !fromAddress.trim().isEmpty();
    }

    public boolean sendSimpleMessage(String to, String subject, String text) {
        if (!isConfigured()) {
            logger.warn("Email service not configured; skipping email to {} with subject '{}'", to, subject);
            return false;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            logger.info("Email sent to {} with subject '{}'", to, subject);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send email to {} with subject '{}': {}", to, subject, e.getMessage(), e);
            return false;
        }
    }

    // Notification emails for refill workflow
    public boolean sendRefillReminderEmail(String to, String patientName, String prescriptionId,
                                           String refillDueDate, String medicineList) {
        String subject = "ReMedGo – Refill Reminder";
        String body = "Hello " + patientName + ",\n\n" +
                "This is a reminder that your medicines for prescription #" + prescriptionId +
                " will run out soon.\n" +
                "Refill Due Date: " + refillDueDate + "\n\n" +
                "Medicines (with dosage):\n" + medicineList + "\n\n" +
                "You can request a refill from your ReMedGo dashboard.\n\n" +
                "- ReMedGo";
        return sendSimpleMessage(to, subject, body);
    }

    public boolean sendMedicineFilledEmail(String to, String patientName, String prescriptionId,
                                           String filledDate, String medicineList, String refillReminderDateOrNote) {
        String subject = "ReMedGo – Medicines Filled";
        String body = "Hello " + patientName + ",\n\n" +
                "Your medicines for prescription #" + prescriptionId + " have been filled on " + filledDate + ".\n\n" +
                "Medicines (with quantities):\n" + medicineList + "\n\n" +
                (refillReminderDateOrNote != null && !refillReminderDateOrNote.isBlank()
                        ? ("Refill reminder date: " + refillReminderDateOrNote + "\n\n")
                        : "") +
                "- ReMedGo";
        return sendSimpleMessage(to, subject, body);
    }

    public boolean sendMedicineDispatchedEmail(String to, String patientName, String prescriptionId,
                                               String dispatchDate, String medicineList, String deliveryAddress) {
        String subject = "ReMedGo – Medicines Dispatched";
        String body = "Hello " + patientName + ",\n\n" +
                "Your prescription #" + prescriptionId + " has been dispatched on " + dispatchDate + ".\n\n" +
                "Medicines:\n" + medicineList + "\n\n" +
                "Delivery Address:\n" + deliveryAddress + "\n\n" +
                "You will receive it soon.\n\n" +
                "Email: " + to + "\n" +
                "- ReMedGo";
        return sendSimpleMessage(to, subject, body);
    }

    // Existing account emails
    public void sendRegistrationConfirmationEmail(User user) {
        String subject;
        String body;
        if (user.getRole() == User.Role.PATIENT) {
            subject = "Welcome to ReMedGo!";
            body = "Hi " + user.getName() + ",\n\n" +
                    "Your account has been successfully created and is now active. " +
                    "You can log in to manage your prescriptions.\n\n" +
                    "Best regards,\nThe ReMedGo Team";
        } else if (user.getRole() == User.Role.PHARMACIST) {
            subject = "ReMedGo Registration Received";
            body = "Hi " + user.getName() + ",\n\n" +
                    "Thank you for registering with ReMedGo. " +
                    "Your account is currently under review by an administrator and will be activated shortly. " +
                    "You will receive an email notification once your account is approved.\n\n" +
                    "Best regards,\nThe ReMedGo Team";
        } else {
            subject = "Welcome to ReMedGo!";
            body = "Hi " + user.getName() + ",\n\nWelcome to ReMedGo.\n\n- The ReMedGo Team";
        }
        sendSimpleMessage(user.getEmail(), subject, body);
    }

    public void sendPasswordResetEmail(User user, String resetToken) {
        String subject = "Password Reset Request - ReMedGo";
        String body = "Hi " + user.getName() + ",\n\n" +
                "You have requested to reset your password. " +
                "Click the link below to reset your password:\n\n" +
                frontendUrl + "/reset-password?token=" + resetToken + "\n\n" +
                "This link will expire in 1 hour. " +
                "If you did not request this password reset, please ignore this email.\n\n" +
                "Best regards,\nThe ReMedGo Team";
        sendSimpleMessage(user.getEmail(), subject, body);
    }

    public void sendAccountVerifiedEmail(User user) {
        String subject = "Account Verified - ReMedGo";
        String body = "Hi " + user.getName() + ",\n\n" +
                "Great news! Your account has been verified and approved by an administrator. " +
                "You can now log in to access all pharmacist features.\n\n" +
                "Best regards,\nThe ReMedGo Team";
        sendSimpleMessage(user.getEmail(), subject, body);
    }

    public void sendPharmacistRejectionEmail(User user, String reason) {
        String subject = "Account Application Status - ReMedGo";
        String body = "Hi " + user.getName() + ",\n\n" +
                "We regret to inform you that your pharmacist account application has not been approved.\n\n" +
                "Reason: " + reason + "\n\n" +
                "If you believe this decision was made in error or if you would like to reapply, " +
                "please contact our support team.\n\n" +
                "Best regards,\nThe ReMedGo Team";
        sendSimpleMessage(user.getEmail(), subject, body);
    }
}
