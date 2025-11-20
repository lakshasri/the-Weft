-- Migration: Remove 'Assigned' status from Orders table
-- The new workflow uses: Pending → Confirmed → Shipped → Delivered

USE scm_db_roles;

-- Step 1: Update any existing orders with 'Assigned' status to 'Confirmed'
UPDATE Orders 
SET Status = 'Confirmed' 
WHERE Status = 'Assigned';

-- Step 2: Alter the Orders table to remove 'Assigned' status from the ENUM
ALTER TABLE Orders 
MODIFY COLUMN Status ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled') 
NOT NULL DEFAULT 'Pending';

-- Verify the change
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'scm_db_roles' 
  AND TABLE_NAME = 'Orders' 
  AND COLUMN_NAME = 'Status';
