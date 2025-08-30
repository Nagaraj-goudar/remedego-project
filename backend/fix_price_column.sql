-- Fix the medicines table by removing the price column
USE medapp;

-- Remove the price column if it exists
ALTER TABLE medicines DROP COLUMN IF EXISTS price;

-- Verify the table structure
DESCRIBE medicines; 