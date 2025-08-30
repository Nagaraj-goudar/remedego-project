package com.medapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class Admin extends User {
    @Column(nullable = false)
    private boolean isApproved = true;

    // Getters and setters
    public boolean isApproved() {
        return isApproved;
    }
    public void setIsApproved(boolean isApproved) {
        this.isApproved = isApproved;
    }
} 