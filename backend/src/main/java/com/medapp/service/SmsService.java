package com.medapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@Service
public class SmsService {
    private static final Logger logger = LoggerFactory.getLogger(SmsService.class);

    @Value("${msg91.api.key:}")
    private String msg91ApiKey;

    @Value("${msg91.sender.id:REMEDGO}")
    private String senderId;

    @Value("${msg91.template.id:}")
    private String templateId;

    @Value("${msg91.api.url:https://api.msg91.com/api/v5/flow/}")
    private String msg91ApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Send SMS using MSG91 API
     * @param phoneNumber The recipient's phone number (with country code)
     * @param message The SMS message content
     * @return true if SMS was sent successfully, false otherwise
     */
    public boolean sendSms(String phoneNumber, String message) {
        if (msg91ApiKey == null || msg91ApiKey.trim().isEmpty()) {
            logger.warn("MSG91 API key not configured. SMS will not be sent.");
            return false;
        }

        try {
            // Prepare the request body for MSG91 API
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("flow_id", templateId);
            requestBody.put("sender", senderId);
            requestBody.put("mobiles", phoneNumber);
            
            // Add variables if using template
            Map<String, String> variables = new HashMap<>();
            variables.put("message", message);
            requestBody.put("VAR1", message);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("authkey", msg91ApiKey);

            // Create HTTP entity
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Make API call
            ResponseEntity<Map> response = restTemplate.postForEntity(msg91ApiUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null && "1".equals(responseBody.get("type"))) {
                    logger.info("SMS sent successfully to {}: {}", phoneNumber, message);
                    return true;
                } else {
                    logger.error("MSG91 API returned error: {}", responseBody);
                    return false;
                }
            } else {
                logger.error("Failed to send SMS. HTTP Status: {}", response.getStatusCode());
                return false;
            }

        } catch (Exception e) {
            logger.error("Error sending SMS to {}: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Send refill reminder SMS
     * @param phoneNumber Patient's phone number
     * @param patientName Patient's name
     * @param prescriptionId Prescription ID
     * @param refillDate Refill date
     * @param medicineList List of medicines running low
     * @param refillLink Link to request refill
     * @return true if SMS was sent successfully
     */
    public boolean sendRefillReminderSms(String phoneNumber, String patientName, String prescriptionId, 
                                       String refillDate, String medicineList, String refillLink) {
        String message = String.format(
            "Hello %s,  " +
            "Your medicines for Prescription #%s are running low.  " +
            "Refill Before: %s  " +
            "Running Low Medicines:  " +
            "%s  " +
            "Click here to request refill: %s  " +
            "- ReMedGo Pharmacy",
            patientName, prescriptionId, refillDate, medicineList, refillLink
        );
        
        return sendSms(phoneNumber, message);
    }

    /**
     * Send medicine filled notification SMS
     * @param phoneNumber Patient's phone number
     * @param patientName Patient's name
     * @param prescriptionId Prescription ID
     * @param medicineList List of medicines with quantities
     * @param refillDate Refill reminder date (or "Reminders disabled")
     * @return true if SMS was sent successfully
     */
    public boolean sendMedicineFilledSms(String phoneNumber, String patientName, String prescriptionId, 
                                       String medicineList, String refillDate) {
        String message;
        if ("Reminders disabled".equals(refillDate)) {
            message = String.format(
                "Hello %s,  " +
                "Your medicines for Prescription #%s have been filled.  " +
                "Medicines:  " +
                "%s  " +
                "- ReMedGo Pharmacy",
                patientName, prescriptionId, medicineList
            );
        } else {
            message = String.format(
                "Hello %s,  " +
                "Your medicines for Prescription #%s have been filled.  " +
                "Medicines:  " +
                "%s  " +
                "Refill Reminder Date: %s  " +
                "- ReMedGo Pharmacy",
                patientName, prescriptionId, medicineList, refillDate
            );
        }
        
        return sendSms(phoneNumber, message);
    }

    /**
     * Send medicine dispatched notification SMS
     * @param phoneNumber Patient's phone number
     * @param patientName Patient's name
     * @param prescriptionId Prescription ID
     * @return true if SMS was sent successfully
     */
    public boolean sendMedicineDispatchedSms(String phoneNumber, String patientName, String prescriptionId) {
        String message = String.format(
            "Hi %s, your prescription #%s has been dispatched and is on its way to you. " +
            "You will receive it soon. " +
            "Reply STOP to unsubscribe.",
            patientName, prescriptionId
        );
        
        return sendSms(phoneNumber, message);
    }

    /**
     * Check if SMS service is properly configured
     * @return true if MSG91 API key is configured
     */
    public boolean isConfigured() {
        return msg91ApiKey != null && !msg91ApiKey.trim().isEmpty();
    }
}
