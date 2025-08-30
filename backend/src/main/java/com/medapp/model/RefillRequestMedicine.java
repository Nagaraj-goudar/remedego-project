package com.medapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "refill_request_medicines")
public class RefillRequestMedicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "refill_request_id")
    private RefillRequest refillRequest;

    @ManyToOne(optional = false)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RefillRequest getRefillRequest() { return refillRequest; }
    public void setRefillRequest(RefillRequest refillRequest) { this.refillRequest = refillRequest; }
    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}