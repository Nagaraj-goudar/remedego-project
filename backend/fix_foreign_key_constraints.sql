-- Fix foreign key constraints to handle user deletion properly
-- This script updates foreign key constraints to CASCADE on delete

-- Drop existing foreign key constraints
ALTER TABLE messages DROP FOREIGN KEY FK4ui4nnwntodh6wjvck53dbk9m;
ALTER TABLE messages DROP FOREIGN KEY FK_receiver_id;

-- Add new foreign key constraints with CASCADE DELETE
ALTER TABLE messages 
ADD CONSTRAINT FK_messages_sender 
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT FK_messages_receiver 
FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update refill_requests foreign keys
ALTER TABLE refill_requests DROP FOREIGN KEY FK_refill_requests_patient;
ALTER TABLE refill_requests DROP FOREIGN KEY FK_refill_requests_pharmacist;

ALTER TABLE refill_requests 
ADD CONSTRAINT FK_refill_requests_patient 
FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE refill_requests 
ADD CONSTRAINT FK_refill_requests_pharmacist 
FOREIGN KEY (pharmacist_id) REFERENCES users(id) ON DELETE SET NULL;

-- Update prescriptions foreign key
ALTER TABLE prescriptions DROP FOREIGN KEY FK_prescriptions_patient;

ALTER TABLE prescriptions 
ADD CONSTRAINT FK_prescriptions_patient 
FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update orders foreign key
ALTER TABLE orders DROP FOREIGN KEY FK_orders_patient;

ALTER TABLE orders 
ADD CONSTRAINT FK_orders_patient 
FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update inventory foreign key
ALTER TABLE inventory DROP FOREIGN KEY FK_inventory_pharmacist;

ALTER TABLE inventory 
ADD CONSTRAINT FK_inventory_pharmacist 
FOREIGN KEY (pharmacist_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update refill_request_medicines foreign key
ALTER TABLE refill_request_medicines DROP FOREIGN KEY FK_refill_request_medicines_refill_request;

ALTER TABLE refill_request_medicines 
ADD CONSTRAINT FK_refill_request_medicines_refill_request 
FOREIGN KEY (refill_request_id) REFERENCES refill_requests(id) ON DELETE CASCADE;

-- Update order_medicines foreign key (if exists)
-- ALTER TABLE order_medicines DROP FOREIGN KEY FK_order_medicines_order;
-- ALTER TABLE order_medicines 
-- ADD CONSTRAINT FK_order_medicines_order 
-- FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
