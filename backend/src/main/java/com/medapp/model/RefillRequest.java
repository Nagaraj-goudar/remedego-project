package com.medapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "refill_requests")
public class RefillRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "pharmacist_id")
    private User pharmacist;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "requested_at", updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "actioned_at")
    private LocalDateTime actionedAt;

    @Column(name = "reason_for_rejection", length = 1000)
    private String reasonForRejection;

    // Snapshot of delivery address at the time of request
    @Column(name = "delivery_address_line1", length = 255, nullable = false)
    private String deliveryAddressLine1;

    @Column(name = "delivery_address_line2", length = 255)
    private String deliveryAddressLine2;

    @Column(name = "delivery_city", length = 100, nullable = false)
    private String deliveryCity;

    @Column(name = "delivery_state", length = 100, nullable = false)
    private String deliveryState;

    @Column(name = "delivery_pincode", length = 6, nullable = false)
    private String deliveryPincode;

    @Column(name = "delivery_phone", length = 15, nullable = false)
    private String deliveryPhone;

    public enum Status {
        PENDING, APPROVED, REJECTED, FILLED, DISPATCHED
    }

    @PrePersist
    protected void onCreate() {
        requestedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        if (status != Status.PENDING && actionedAt == null) {
            actionedAt = LocalDateTime.now();
        }
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Prescription getPrescription() {
        return prescription;
    }

    public void setPrescription(Prescription prescription) {
        this.prescription = prescription;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public User getPharmacist() {
        return pharmacist;
    }

    public void setPharmacist(User pharmacist) {
        this.pharmacist = pharmacist;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getActionedAt() {
        return actionedAt;
    }

    public void setActionedAt(LocalDateTime actionedAt) {
        this.actionedAt = actionedAt;
    }

    public String getReasonForRejection() {
        return reasonForRejection;
    }

    public void setReasonForRejection(String reasonForRejection) {
        this.reasonForRejection = reasonForRejection;
    }

    public String getDeliveryAddressLine1() { return deliveryAddressLine1; }
    public void setDeliveryAddressLine1(String deliveryAddressLine1) { this.deliveryAddressLine1 = deliveryAddressLine1; }
    public String getDeliveryAddressLine2() { return deliveryAddressLine2; }
    public void setDeliveryAddressLine2(String deliveryAddressLine2) { this.deliveryAddressLine2 = deliveryAddressLine2; }
    public String getDeliveryCity() { return deliveryCity; }
    public void setDeliveryCity(String deliveryCity) { this.deliveryCity = deliveryCity; }
    public String getDeliveryState() { return deliveryState; }
    public void setDeliveryState(String deliveryState) { this.deliveryState = deliveryState; }
    public String getDeliveryPincode() { return deliveryPincode; }
    public void setDeliveryPincode(String deliveryPincode) { this.deliveryPincode = deliveryPincode; }
    public String getDeliveryPhone() { return deliveryPhone; }
    public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }
} 