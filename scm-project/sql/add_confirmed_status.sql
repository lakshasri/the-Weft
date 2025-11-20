-- Migration: Add 'Confirmed' status to Orders table
-- This allows retailers to confirm customer orders before shipping

USE scm_db_roles;

-- Alter the Orders table to add 'Confirmed' status to the ENUM
ALTER TABLE Orders 
MODIFY COLUMN Status ENUM('Pending', 'Confirmed', 'Assigned', 'Shipped', 'Delivered', 'Cancelled') 
NOT NULL DEFAULT 'Pending';

-- Verify the change
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'scm_db_roles' 
  AND TABLE_NAME = 'Orders' 
  AND COLUMN_NAME = 'Status';
