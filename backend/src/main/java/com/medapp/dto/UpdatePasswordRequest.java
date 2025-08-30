package com.medapp.dto;

public class UpdatePasswordRequest {
    private String oldPassword;
    private String newPassword;

    // Default constructor
    public UpdatePasswordRequest() {}

    // Constructor with parameters
    public UpdatePasswordRequest(String oldPassword, String newPassword) {
        this.oldPassword = oldPassword;
        this.newPassword = newPassword;
    }

    // Getters and setters
    public String getOldPassword() {
        return oldPassword;
    }

    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
