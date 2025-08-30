package com.medapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescription_tracking")
public class PrescriptionTracking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Status status;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Status {
        UPLOADED,
        APPROVED,
        REFILL_REQUESTED,
        REFILL_APPROVED,
        FILLING,
        FILLED,
        DISPATCHED,
        DELIVERED
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Prescription getPrescription() { return prescription; }
    public void setPrescription(Prescription prescription) { this.prescription = prescription; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}


