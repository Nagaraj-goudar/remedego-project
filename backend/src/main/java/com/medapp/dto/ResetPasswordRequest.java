package com.medapp.dto;

import jakarta.validation.constraints.*;

public class ResetPasswordRequest {
    @NotEmpty(message = "Token cannot be empty")
    private String token;

    @NotEmpty(message = "Password cannot be empty")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String newPassword;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
