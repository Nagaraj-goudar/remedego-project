package com.medapp.dto;

import jakarta.validation.constraints.*;

public class ForgotPasswordRequest {
    @NotEmpty(message = "Email cannot be empty")
    @Email(message = "Please provide a valid email address")
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
