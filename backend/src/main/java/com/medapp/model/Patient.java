package com.medapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import java.time.LocalDate;

@Entity
public class Patient extends User {
    @Column
    private LocalDate dateOfBirth;

    @Column
    private String address;

    @Column(nullable = false)
    private boolean isApproved = true;

    // Getters and setters
    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }
    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }
    public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }

    public boolean isApproved() {
        return isApproved;
    }
    public void setIsApproved(boolean isApproved) {
        this.isApproved = isApproved;
    }
} 