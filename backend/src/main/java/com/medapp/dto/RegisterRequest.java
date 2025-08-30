package com.medapp.dto;

import jakarta.validation.constraints.*;

public class RegisterRequest {
    @NotEmpty(message = "Name cannot be empty")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Name must contain only alphabetic characters")
    private String name;

    @NotEmpty(message = "Email cannot be empty")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotEmpty(message = "Password cannot be empty")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>])[A-Za-z\\d!@#$%^&*(),.?\":{}|<>]{8,}$", 
             message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
    private String password;

    @NotEmpty(message = "Role cannot be empty")
    @Pattern(regexp = "^(PATIENT|PHARMACIST)$", message = "Role must be either PATIENT or PHARMACIST")
    private String role;

    @NotEmpty(message = "Phone number cannot be empty")
    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    private String licenseNumber; // for pharmacist

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
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public String getRole() {
        return role;
    }
    public void setRole(String role) {
        this.role = role;
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

    @Override
    public String toString() {
        return "RegisterRequest{" +
                "name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", phone='" + phone + '\'' +
                ", licenseNumber='" + licenseNumber + '\'' +
                '}';
    }
} 