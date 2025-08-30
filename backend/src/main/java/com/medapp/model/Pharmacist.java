package com.medapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class Pharmacist extends User {
    @Column(nullable = true, unique = true)
    private String licenseNumber;

    @Column(nullable = false)
    private boolean isApproved = false;

    // Getters and setters
    public String getLicenseNumber() {
        return licenseNumber;
    }
    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }
    public boolean isApproved() {
        return isApproved;
    }
    public void setIsApproved(boolean isApproved) {
        this.isApproved = isApproved;
    }
} 