package com.medapp.service;

import com.medapp.model.RefillRequest;
import com.medapp.model.Prescription;
import com.medapp.model.Patient;
import com.medapp.model.RefillReminder;
import com.medapp.model.MedicineFillHistory;
import com.medapp.repository.RefillRequestRepository;
import com.medapp.repository.PrescriptionRepository;
import com.medapp.repository.RefillReminderRepository;
import com.medapp.repository.MedicineFillHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RefillReminderService {
    private static final Logger logger = LoggerFactory.getLogger(RefillReminderService.class);

    @Autowired
    private PrescriptionRepository prescriptionRepository;
    
    @Autowired
    private RefillRequestRepository refillRequestRepository;

    @Autowired
    private RefillReminderRepository refillReminderRepository;

    @Autowired
    private MedicineFillHistoryRepository medicineFillHistoryRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Scheduled task that runs daily at 9:00 AM to check for refill reminders
     * Cron expression: "0 0 9 * * ?" means every day at 9:00 AM
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void checkRefillReminders() {
        logger.info("Starting daily refill reminder check...");
        
        try {
            // Find all reminders that are due today and not yet sent
            LocalDate today = LocalDate.now();
            List<RefillReminder> dueReminders = refillReminderRepository.findByReminderDateAndIsEnabledAndSmsSent(
                today, true, false);
            
            int remindersChecked = dueReminders.size();
            int remindersSent = 0;
            
            for (RefillReminder reminder : dueReminders) {
                try {
                    // Check if there's already a pending refill request
                    boolean hasPendingRefill = refillRequestRepository.existsByPrescriptionAndPatientAndStatus(
                            reminder.getPrescription(), reminder.getPatient(), RefillRequest.Status.PENDING);
                    
                    if (!hasPendingRefill) {
                        // Build medicine list from latest fill history (each on new line)
                        java.util.List<MedicineFillHistory> historiesForReminder =
                            medicineFillHistoryRepository.findByPrescriptionOrderByFillDateDesc(reminder.getPrescription());
                        String medicineList = "";
                        if (!historiesForReminder.isEmpty()) {
                            var latestHistory = historiesForReminder.get(0);
                            medicineList = latestHistory.getFilledMedicines().stream()
                                .map(fm -> String.format("- %s (x%d)", fm.getMedicineName(), fm.getTotalNeeded()))
                                .reduce("", (a, b) -> a.isEmpty() ? b : a + "\n" + b);
                        }

                        // Refill due date is reminder date + 3 days
                        String refillDate = reminder.getReminderDate().plusDays(3).toString();

                        // Send Email reminder
                        boolean emailSent = emailService.sendRefillReminderEmail(
                            reminder.getPatient().getEmail(),
                            reminder.getPatient().getName(),
                            reminder.getPrescription().getId().toString(),
                            refillDate,
                            medicineList
                        );

                        if (emailSent) {
                            // Update reminder as sent
                            reminder.setSmsSent(true);
                            reminder.setSmsSentAt(LocalDateTime.now());
                            reminder.setSmsMessage("Refill reminder sent via Email");
                            refillReminderRepository.save(reminder);
                        remindersSent++;

                            logger.info("Email reminder sent to patient {} for prescription #{}",
                                reminder.getPatient().getName(), reminder.getPrescription().getId());
                        } else {
                            logger.error("Failed to send email reminder to patient {} for prescription #{}",
                                reminder.getPatient().getName(), reminder.getPrescription().getId());
                        }
                    } else {
                        logger.info("Skipping reminder for prescription #{} - pending refill request exists",
                            reminder.getPrescription().getId());
                    }
                } catch (Exception e) {
                    logger.error("Error processing reminder for prescription #{}: {}", 
                        reminder.getPrescription().getId(), e.getMessage(), e);
                }
            }
            
            logger.info("Refill reminder check completed. Checked: {}, Emails sent: {}", 
                       remindersChecked, remindersSent);
            
        } catch (Exception e) {
            logger.error("Error during refill reminder check: {}", e.getMessage(), e);
        }
    }

    /**
     * Create a refill reminder when medicines are filled
     * @param prescription The prescription
     * @param patient The patient
     * @param daysUntilRefill Days until refill is needed (calculated from medicine fill)
     */
    public void createRefillReminder(Prescription prescription, Patient patient, int daysUntilRefill) {
        try {
            // Calculate reminder date (3 days before medicines run out)
            LocalDate reminderDate = LocalDate.now().plusDays(daysUntilRefill - 3);
            
            // Create new reminder
            RefillReminder reminder = new RefillReminder();
            reminder.setPrescription(prescription);
            reminder.setPatient(patient);
            reminder.setDaysUntilRefill(daysUntilRefill);
            reminder.setReminderDate(reminderDate);
            reminder.setEnabled(true);
            reminder.setSmsSent(false);
            reminder.setPatientPhone(patient.getPhone());
            
            refillReminderRepository.save(reminder);
            
            logger.info("Created refill reminder for prescription #{} - reminder date: {}, days until refill: {}",
                prescription.getId(), reminderDate, daysUntilRefill);
                
        } catch (Exception e) {
            logger.error("Error creating refill reminder for prescription #{}: {}", 
                prescription.getId(), e.getMessage(), e);
        }
    }

    /**
     * Send medicine filled notification Email
     */
    public void sendMedicineFilledNotification(Prescription prescription, Patient patient,
                                               java.util.List<com.medapp.model.FilledMedicine> filledMedicines,
                                               String refillDate) {
        try {
            String medicineList = filledMedicines.stream()
                .map(fm -> String.format("- %s (x%d)", fm.getMedicineName(), fm.getTotalNeeded()))
                .reduce("", (a, b) -> a.isEmpty() ? b : a + "\n" + b);

            boolean emailSent = emailService.sendMedicineFilledEmail(
                patient.getEmail(),
                patient.getName(),
                prescription.getId().toString(),
                java.time.LocalDate.now().toString(),
                medicineList,
                refillDate
            );

            if (emailSent) {
                logger.info("Medicine filled email sent to patient {} for prescription #{}",
                    patient.getName(), prescription.getId());
            } else {
                logger.error("Failed to send medicine filled email to patient {} for prescription #{}",
                    patient.getName(), prescription.getId());
            }
        } catch (Exception e) {
            logger.error("Error sending medicine filled notification for prescription #{}: {}",
                prescription.getId(), e.getMessage(), e);
        }
    }

    /**
     * Send medicine dispatched notification Email
     */
    public void sendMedicineDispatchedNotification(Prescription prescription, Patient patient) {
        try {
            java.util.List<com.medapp.model.MedicineFillHistory> histories =
                medicineFillHistoryRepository.findByPrescriptionOrderByFillDateDesc(prescription);
            String medicineList = "";
            if (!histories.isEmpty()) {
                var latest = histories.get(0);
                medicineList = latest.getFilledMedicines().stream()
                    .map(fm -> String.format("- %s (x%d)", fm.getMedicineName(), fm.getTotalNeeded()))
                    .reduce("", (a, b) -> a.isEmpty() ? b : a + "\n" + b);
            }

            // Get delivery address from the latest refill request
            String deliveryAddress = "Address not available";
            try {
                List<RefillRequest> refillRequests = refillRequestRepository.findByPrescriptionOrderByRequestedAtDesc(prescription);
                if (!refillRequests.isEmpty()) {
                    RefillRequest latestRequest = refillRequests.get(0);
                    if (latestRequest.getDeliveryAddressLine1() != null && !latestRequest.getDeliveryAddressLine1().isEmpty()) {
                        StringBuilder address = new StringBuilder();
                        address.append(latestRequest.getDeliveryAddressLine1());
                        if (latestRequest.getDeliveryAddressLine2() != null && !latestRequest.getDeliveryAddressLine2().isEmpty()) {
                            address.append("\n").append(latestRequest.getDeliveryAddressLine2());
                        }
                        address.append("\n").append(latestRequest.getDeliveryCity()).append(", ").append(latestRequest.getDeliveryState());
                        address.append("\nPincode: ").append(latestRequest.getDeliveryPincode());
                        if (latestRequest.getDeliveryPhone() != null && !latestRequest.getDeliveryPhone().isEmpty()) {
                            address.append("\nPhone: ").append(latestRequest.getDeliveryPhone());
                        }
                        deliveryAddress = address.toString();
                    }
                }
            } catch (Exception e) {
                logger.warn("Could not retrieve delivery address for prescription #{}: {}", prescription.getId(), e.getMessage());
            }

            boolean emailSent = emailService.sendMedicineDispatchedEmail(
                patient.getEmail(),
                patient.getName(),
                prescription.getId().toString(),
                java.time.LocalDate.now().toString(),
                medicineList,
                deliveryAddress
            );

            if (emailSent) {
                logger.info("Medicine dispatched email sent to patient {} for prescription #{}",
                    patient.getName(), prescription.getId());
            } else {
                logger.error("Failed to send medicine dispatched email to patient {} for prescription #{}",
                    patient.getName(), prescription.getId());
            }
        } catch (Exception e) {
            logger.error("Error sending medicine dispatched notification for prescription #{}: {}",
                prescription.getId(), e.getMessage(), e);
        }
    }

    /**
     * Enable or disable reminders for a patient
     * @param patientId Patient ID
     * @param enabled Whether reminders should be enabled
     */
    public void updateReminderSettings(Long patientId, boolean enabled) {
        try {
            List<RefillReminder> reminders = refillReminderRepository.findByPatientId(patientId);
            for (RefillReminder reminder : reminders) {
                reminder.setEnabled(enabled);
            }
            refillReminderRepository.saveAll(reminders);
            
            logger.info("Updated reminder settings for patient {}: enabled = {}", patientId, enabled);
        } catch (Exception e) {
            logger.error("Error updating reminder settings for patient {}: {}", patientId, e.getMessage(), e);
        }
    }

    /**
     * Get reminder statistics
     */
    public RefillReminderStats getRefillReminderStats() {
        try {
            LocalDate today = LocalDate.now();
            
            int totalReminders = (int) refillReminderRepository.count();
            int enabledReminders = (int) refillReminderRepository.countByIsEnabled(true);
            int dueToday = (int) refillReminderRepository.countByReminderDateAndIsEnabledAndSmsSent(today, true, false);
            int sentToday = (int) refillReminderRepository.countBySmsSentAtBetween(
                LocalDateTime.now().withHour(0).withMinute(0).withSecond(0),
                LocalDateTime.now().withHour(23).withMinute(59).withSecond(59)
            );
            
            return new RefillReminderStats(
                totalReminders,
                enabledReminders,
                dueToday,
                sentToday
            );
        } catch (Exception e) {
            logger.error("Error getting reminder stats: {}", e.getMessage(), e);
            return new RefillReminderStats(0, 0, 0, 0);
        }
    }

    /**
     * Manual method to trigger refill reminder check (useful for testing)
     */
    public void triggerRefillReminderCheck() {
        logger.info("Manually triggering refill reminder check...");
        checkRefillReminders();
    }

    /**
     * Statistics DTO for refill reminders
     */
    public static class RefillReminderStats {
        public final int totalReminders;
        public final int enabledReminders;
        public final int dueToday;
        public final int sentToday;

        public RefillReminderStats(int totalReminders, int enabledReminders, int dueToday, int sentToday) {
            this.totalReminders = totalReminders;
            this.enabledReminders = enabledReminders;
            this.dueToday = dueToday;
            this.sentToday = sentToday;
        }
    }
}