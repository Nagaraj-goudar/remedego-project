package com.medapp.dto;

import com.medapp.model.User;
import com.medapp.model.Pharmacist;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private User.Role role;
    private boolean active;
    private boolean verified;
    private String phone;
    private String licenseNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructor for User
    public UserDTO(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.active = user.isActive();
        this.verified = user.isVerified();
        this.phone = user.getPhone();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
        
        // If it's a Pharmacist, get the license number
        if (user instanceof Pharmacist) {
            Pharmacist pharmacist = (Pharmacist) user;
            this.licenseNumber = pharmacist.getLicenseNumber();
        }
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public User.Role getRole() {
        return role;
    }

    public void setRole(User.Role role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
