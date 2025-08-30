package com.medapp.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "refill_reminders")
public class RefillReminder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(name = "days_until_refill", nullable = false)
    private int daysUntilRefill;

    @Column(name = "reminder_date", nullable = false)
    private LocalDate reminderDate;

    @Column(name = "is_enabled", nullable = false)
    private boolean isEnabled = true;

    @Column(name = "sms_sent", nullable = false)
    private boolean smsSent = false;

    @Column(name = "sms_sent_at")
    private LocalDateTime smsSentAt;

    @Column(name = "sms_message")
    private String smsMessage;

    @Column(name = "patient_phone")
    private String patientPhone;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Prescription getPrescription() { return prescription; }
    public void setPrescription(Prescription prescription) { this.prescription = prescription; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public int getDaysUntilRefill() { return daysUntilRefill; }
    public void setDaysUntilRefill(int daysUntilRefill) { this.daysUntilRefill = daysUntilRefill; }
    public LocalDate getReminderDate() { return reminderDate; }
    public void setReminderDate(LocalDate reminderDate) { this.reminderDate = reminderDate; }
    public boolean isEnabled() { return isEnabled; }
    public void setEnabled(boolean enabled) { isEnabled = enabled; }
    public boolean isSmsSent() { return smsSent; }
    public void setSmsSent(boolean smsSent) { this.smsSent = smsSent; }
    public LocalDateTime getSmsSentAt() { return smsSentAt; }
    public void setSmsSentAt(LocalDateTime smsSentAt) { this.smsSentAt = smsSentAt; }
    public String getSmsMessage() { return smsMessage; }
    public void setSmsMessage(String smsMessage) { this.smsMessage = smsMessage; }
    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}


