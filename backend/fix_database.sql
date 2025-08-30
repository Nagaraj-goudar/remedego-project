-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS medapp;

-- Use the database
USE medapp;

-- Fix existing users table for single table inheritance
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dtype VARCHAR(31) DEFAULT 'User';

-- Update existing users to have proper defaults
UPDATE users SET is_approved = TRUE WHERE is_approved IS NULL;
UPDATE users SET active = TRUE WHERE active IS NULL;
UPDATE users SET dtype = 'User' WHERE dtype IS NULL;

-- Ensure is_approved column has a default value
ALTER TABLE users MODIFY COLUMN is_approved BOOLEAN NOT NULL DEFAULT TRUE;

-- Create medicines table if it doesn't exist
CREATE TABLE IF NOT EXISTS medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    manufacturer VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(100) NOT NULL,
    strength VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Fix existing medicines table if needed
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
UPDATE medicines SET is_active = TRUE WHERE is_active IS NULL;
ALTER TABLE medicines MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Remove old price column if it exists (no longer needed)
ALTER TABLE medicines DROP COLUMN IF EXISTS price;

-- Create inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    pharmacist_id BIGINT NOT NULL,
    stock_quantity INT NOT NULL,
    low_stock_threshold INT NOT NULL,
    expiry_date DATE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (pharmacist_id) REFERENCES users(id),
    UNIQUE KEY unique_medicine_pharmacist (medicine_id, pharmacist_id)
);

-- Insert some sample medicines for testing
INSERT IGNORE INTO medicines (name, manufacturer, dosage_form, strength, description, is_active) VALUES
('Paracetamol', 'Pfizer', 'Tablet', '500mg', 'Pain reliever and fever reducer', TRUE),
('Amoxicillin', 'GlaxoSmithKline', 'Capsule', '250mg', 'Antibiotic for bacterial infections', TRUE),
('Omeprazole', 'AstraZeneca', 'Capsule', '20mg', 'Proton pump inhibitor for acid reflux', TRUE),
('Metformin', 'Merck', 'Tablet', '500mg', 'Oral diabetes medicine', TRUE),
('Ibuprofen', 'Johnson & Johnson', 'Tablet', '400mg', 'Non-steroidal anti-inflammatory drug', TRUE);

-- Show the created tables
SHOW TABLES;

-- Fix original_order_id column to be nullable
ALTER TABLE refill_requests MODIFY COLUMN original_order_id BIGINT NULL;

-- Create refill_request_medicines table for tracking medicines filled in a refill request
CREATE TABLE IF NOT EXISTS refill_request_medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    refill_request_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (refill_request_id) REFERENCES refill_requests(id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- History tables
CREATE TABLE IF NOT EXISTS medicine_fill_history (
    history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    pharmacist_id BIGINT NOT NULL,
    fill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('FILLED','DISPATCHED') NOT NULL DEFAULT 'FILLED',
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacist_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS filled_medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    history_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    times_per_day INT NOT NULL,
    days INT NOT NULL,
    total_needed INT NOT NULL,
    stock_before INT NOT NULL,
    stock_after INT NOT NULL,
    FOREIGN KEY (history_id) REFERENCES medicine_fill_history(history_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refill_reminders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    days_until_refill INT NOT NULL,
    reminder_date DATE NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_sent BOOLEAN NOT NULL DEFAULT FALSE,
    sms_sent_at DATETIME NULL,
    sms_message VARCHAR(500) NULL,
    patient_phone VARCHAR(20) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tracking table for real-time status
CREATE TABLE IF NOT EXISTS prescription_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    status ENUM('UPLOADED','APPROVED','REFILL_REQUESTED','REFILL_APPROVED','FILLING','FILLED','DISPATCHED','DELIVERED') NOT NULL,
    notes VARCHAR(1000),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
);

-- Update refill_requests status ENUM to include new statuses
ALTER TABLE refill_requests MODIFY COLUMN status ENUM('PENDING','APPROVED','REJECTED','FILLED','DISPATCHED') NOT NULL DEFAULT 'PENDING';

-- Add is_edited column to messages table for chat message editing
ALTER TABLE messages ADD COLUMN is_edited BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE messages SET is_edited = FALSE WHERE is_edited IS NULL;

-- Add verification and password reset columns to users table
ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP NULL;

-- Update existing users to be verified (except pharmacists who need admin approval)
UPDATE users SET is_verified = TRUE WHERE role != 'PHARMACIST';
UPDATE users SET is_verified = FALSE WHERE role = 'PHARMACIST'; 