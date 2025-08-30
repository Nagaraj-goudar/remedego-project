package com.medapp.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacist_id", nullable = false)
    private User pharmacist;
    
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;
    
    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold;
    
    @Column(name = "expiry_date")
    private LocalDate expiryDate;
    
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
    
    @PrePersist
    protected void onCreate() {
        lastUpdated = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Medicine getMedicine() {
        return medicine;
    }
    
    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }
    
    public User getPharmacist() {
        return pharmacist;
    }
    
    public void setPharmacist(User pharmacist) {
        this.pharmacist = pharmacist;
    }
    
    public Integer getStockQuantity() {
        return stockQuantity;
    }
    
    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }
    
    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }
    
    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }
    
    public LocalDate getExpiryDate() {
        return expiryDate;
    }
    
    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }
    
    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
    
    // Helper method to check if stock is low
    public boolean isLowStock() {
        return stockQuantity <= lowStockThreshold;
    }
} 