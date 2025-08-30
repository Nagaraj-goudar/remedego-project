-- Remove the price column from medicines table
USE medapp;
ALTER TABLE medicines DROP COLUMN IF EXISTS price; 