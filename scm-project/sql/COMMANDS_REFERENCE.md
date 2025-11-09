# SCM Database - Commands Reference

This document contains usage examples for all triggers, stored procedures, and functions in the Supply Chain Management database.

---

## **TRIGGERS**

Triggers execute automatically when specific database events occur. No manual commands are needed to invoke them.

### **1. Stock Deduction Trigger (`trg_reduce_stock_on_order`)**

**Automatically fires when:** A new order item is inserted

```sql
-- This will automatically reduce stock and update LastRestocked if needed
INSERT INTO OrderItems (OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase) 
VALUES (1, 1, 5, 299.99);

-- Check the stock after insertion
SELECT rp.RetailerProductID, rp.Stock, rp.MinStockAlert, rp.LastRestocked,
       p.ProductName, r.StoreName
FROM RetailerProducts rp
JOIN Products p ON rp.ProductID = p.ProductID
JOIN Retailers r ON rp.RetailerID = r.RetailerID
WHERE rp.RetailerProductID = 1;
```

### **2. Order Total Calculation Triggers**

**Automatically fires when:** Order items are inserted, updated, or deleted

```sql
-- Insert order items - total will be calculated automatically
INSERT INTO OrderItems (OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase) VALUES
(1, 1, 2, 250.00),
(1, 2, 1, 179.00);

-- Update order item - total will be recalculated
UPDATE OrderItems 
SET Quantity = 3 
WHERE OrderItemID = 1;

-- Delete order item - total will be recalculated
DELETE FROM OrderItems WHERE OrderItemID = 2;

-- Check the updated order total
SELECT OrderID, TotalAmount, Status 
FROM Orders 
WHERE OrderID = 1;
```

---

## **STORED PROCEDURES**

### **1. Process Order (`sp_process_order`)**

Creates a complete order with multiple items in a single transaction.

**Parameters:**
- `p_customer_id` (INT): Customer placing the order
- `p_retailer_id` (INT): Retailer fulfilling the order
- `p_shipping_address` (TEXT): Delivery address
- `p_items` (JSON): Array of items with retailer_product_id and quantity

```sql
-- Example 1: Process order with single item
CALL sp_process_order(
    1,  -- Customer ID
    1,  -- Retailer ID
    '123 Grove Lane, City, CA 90001',  -- Shipping address
    '[{"retailer_product_id": 1, "quantity": 2}]'  -- Items JSON
);

-- Example 2: Process order with multiple items
CALL sp_process_order(
    2,  -- Customer ID
    2,  -- Retailer ID
    '456 Lake Road, City, TX 75001',  -- Shipping address
    '[
        {"retailer_product_id": 4, "quantity": 1},
        {"retailer_product_id": 5, "quantity": 2},
        {"retailer_product_id": 6, "quantity": 1}
    ]'
);

-- Example 3: Handle insufficient stock (will throw error)
CALL sp_process_order(
    1, 1, '123 Grove Lane, City, CA 90001',
    '[{"retailer_product_id": 1, "quantity": 1000}]'  -- More than available stock
);
```

**Expected Output:**
```
+----------+--------------------------------+
| OrderID  | Message                        |
+----------+--------------------------------+
|        4 | Order processed successfully   |
+----------+--------------------------------+
```

### **2. Generate Restock Alerts (`sp_generate_restock_alerts`)**

Generates inventory alerts for products below minimum stock levels.

**Parameters:**
- `p_retailer_id` (INT, OPTIONAL): Specific retailer ID, or NULL for all retailers

```sql
-- Example 1: Get restock alerts for all retailers
CALL sp_generate_restock_alerts(NULL);

-- Example 2: Get restock alerts for specific retailer
CALL sp_generate_restock_alerts(1);  -- Metro Outfitters only

-- Example 3: First reduce some stock to create alerts, then check
UPDATE RetailerProducts SET Stock = 2 WHERE RetailerProductID = 1;
UPDATE RetailerProducts SET Stock = 0 WHERE RetailerProductID = 3;
CALL sp_generate_restock_alerts(NULL);
```

**Expected Output:**
```
+------------+------------------+----------------------+--------------+---------------+--------------------+----------+
| RetailerID | StoreName        | ProductName          | CurrentStock | MinStockAlert | RecommendedRestock | Priority |
+------------+------------------+----------------------+--------------+---------------+--------------------+----------+
|          1 | Metro Outfitters | Urban Messenger Bag  |            0 |             5 |                 15 | CRITICAL |
|          1 | Metro Outfitters | Premium Leather Jacket|            2 |            10 |                 28 | HIGH     |
+------------+------------------+----------------------+--------------+---------------+--------------------+----------+
```

---

## **FUNCTIONS**

### **1. Customer Loyalty Score (`fn_calculate_loyalty_score`)**

Calculates customer loyalty based on order history (0-100 scale).

**Parameters:**
- `p_customer_id` (INT): Customer ID to calculate loyalty for

```sql
-- Example 1: Get loyalty score for specific customer
SELECT fn_calculate_loyalty_score(1) as LoyaltyScore;

-- Example 2: Get loyalty scores for all customers
SELECT 
    c.CustomerID,
    u.FullName,
    fn_calculate_loyalty_score(c.CustomerID) as LoyaltyScore,
    CASE 
        WHEN fn_calculate_loyalty_score(c.CustomerID) >= 80 THEN 'Platinum'
        WHEN fn_calculate_loyalty_score(c.CustomerID) >= 60 THEN 'Gold'
        WHEN fn_calculate_loyalty_score(c.CustomerID) >= 40 THEN 'Silver'
        ELSE 'Bronze'
    END as LoyaltyTier
FROM Customers c
JOIN Users u ON c.UserID = u.UserID
ORDER BY LoyaltyScore DESC;

-- Example 3: Find top 5 most loyal customers
SELECT 
    u.FullName,
    u.Email,
    fn_calculate_loyalty_score(c.CustomerID) as LoyaltyScore
FROM Customers c
JOIN Users u ON c.UserID = u.UserID
ORDER BY LoyaltyScore DESC
LIMIT 5;
```

**Expected Output:**
```
+--------------+---------------------------+-------------+-------------+
| CustomerID   | FullName                  | LoyaltyScore| LoyaltyTier |
+--------------+---------------------------+-------------+-------------+
|            1 | Amelia Rivera             |       45.30 | Silver      |
|            2 | Liam Patel                |       22.98 | Bronze      |
+--------------+---------------------------+-------------+-------------+
```

### **2. Product Performance Score (`fn_product_performance_score`)**

Calculates product performance based on sales, adoption, and turnover (0-100 scale).

**Parameters:**
- `p_product_id` (INT): Product ID to calculate performance for

```sql
-- Example 1: Get performance score for specific product
SELECT fn_product_performance_score(1) as PerformanceScore;

-- Example 2: Get performance scores for all products
SELECT 
    p.ProductID,
    p.ProductName,
    p.Category,
    m.CompanyName as Manufacturer,
    fn_product_performance_score(p.ProductID) as PerformanceScore,
    CASE 
        WHEN fn_product_performance_score(p.ProductID) >= 80 THEN 'Excellent'
        WHEN fn_product_performance_score(p.ProductID) >= 60 THEN 'Good'
        WHEN fn_product_performance_score(p.ProductID) >= 40 THEN 'Average'
        ELSE 'Poor'
    END as PerformanceRating
FROM Products p
JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
WHERE p.IsActive = TRUE
ORDER BY PerformanceScore DESC;

-- Example 3: Find underperforming products that need attention
SELECT 
    p.ProductName,
    p.Category,
    fn_product_performance_score(p.ProductID) as PerformanceScore,
    COUNT(rp.RetailerID) as RetailerCount,
    AVG(rp.Stock) as AvgStock
FROM Products p
LEFT JOIN RetailerProducts rp ON p.ProductID = rp.ProductID
WHERE fn_product_performance_score(p.ProductID) < 30
GROUP BY p.ProductID, p.ProductName, p.Category
ORDER BY PerformanceScore ASC;

-- Example 4: Compare product performance by category
SELECT 
    p.Category,
    COUNT(*) as ProductCount,
    AVG(fn_product_performance_score(p.ProductID)) as AvgPerformanceScore,
    MAX(fn_product_performance_score(p.ProductID)) as BestPerformance,
    MIN(fn_product_performance_score(p.ProductID)) as WorstPerformance
FROM Products p
GROUP BY p.Category
ORDER BY AvgPerformanceScore DESC;
```

**Expected Output:**
```
+-----------+----------------------+-------------+----------------------+------------------+
| ProductID | ProductName          | Category    | PerformanceScore     | PerformanceRating|
+-----------+----------------------+-------------+----------------------+------------------+
|         1 | Premium Leather Jacket| Apparel    |                67.50 | Good             |
|         2 | Carbon Trek Backpack  | Accessories |                45.20 | Average          |
|         3 | Atlas Servo X200      | Electronics |                52.80 | Average          |
+-----------+----------------------+-------------+----------------------+------------------+
```

---

## **COMPREHENSIVE TESTING SCENARIOS**

### **Scenario 1: Complete Order Processing Flow**

```sql
-- Step 1: Check initial stock
SELECT rp.RetailerProductID, rp.Stock, p.ProductName, r.StoreName
FROM RetailerProducts rp
JOIN Products p ON rp.ProductID = p.ProductID
JOIN Retailers r ON rp.RetailerID = r.RetailerID;

-- Step 2: Process an order (triggers will fire automatically)
CALL sp_process_order(1, 1, '789 New Address, City', 
    '[{"retailer_product_id": 1, "quantity": 3}]');

-- Step 3: Check updated stock and order totals
SELECT rp.RetailerProductID, rp.Stock, p.ProductName
FROM RetailerProducts rp
JOIN Products p ON rp.ProductID = p.ProductID
WHERE rp.RetailerProductID = 1;

SELECT * FROM Orders WHERE OrderID = LAST_INSERT_ID();
```

### **Scenario 2: Inventory Management**

```sql
-- Step 1: Simulate low stock situations
UPDATE RetailerProducts SET Stock = 3 WHERE RetailerProductID IN (1, 2);
UPDATE RetailerProducts SET Stock = 0 WHERE RetailerProductID = 3;

-- Step 2: Generate restock alerts
CALL sp_generate_restock_alerts(NULL);

-- Step 3: Check which products need immediate attention
SELECT 
    p.ProductName,
    rp.Stock,
    rp.MinStockAlert,
    CASE 
        WHEN rp.Stock = 0 THEN 'OUT OF STOCK'
        WHEN rp.Stock <= rp.MinStockAlert THEN 'LOW STOCK'
        ELSE 'ADEQUATE'
    END as StockStatus
FROM RetailerProducts rp
JOIN Products p ON rp.ProductID = p.ProductID
ORDER BY rp.Stock ASC;
```

### **Scenario 3: Analytics and Reporting**

```sql
-- Customer analytics
SELECT 
    u.FullName,
    COUNT(o.OrderID) as TotalOrders,
    SUM(o.TotalAmount) as TotalSpent,
    fn_calculate_loyalty_score(c.CustomerID) as LoyaltyScore
FROM Customers c
JOIN Users u ON c.UserID = u.UserID
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
GROUP BY c.CustomerID, u.FullName;

-- Product analytics
SELECT 
    p.ProductName,
    COUNT(DISTINCT rp.RetailerID) as RetailerCount,
    SUM(COALESCE(oi.Quantity, 0)) as TotalSold,
    fn_product_performance_score(p.ProductID) as PerformanceScore
FROM Products p
LEFT JOIN RetailerProducts rp ON p.ProductID = rp.ProductID
LEFT JOIN OrderItems oi ON rp.RetailerProductID = oi.RetailerProductID
GROUP BY p.ProductID, p.ProductName
ORDER BY PerformanceScore DESC;
```

---

## **ERROR HANDLING EXAMPLES**

### **Common Error Scenarios:**

```sql
-- 1. Insufficient stock error
CALL sp_process_order(1, 1, '123 Test St', 
    '[{"retailer_product_id": 1, "quantity": 999}]');
-- Expected: Error 1644 (45000): Insufficient stock for product

-- 2. Invalid retailer product ID
CALL sp_process_order(1, 1, '123 Test St', 
    '[{"retailer_product_id": 999, "quantity": 1}]');
-- Expected: Error 1329 (02000): No data - zero rows fetched, selected, or processed

-- 3. Invalid JSON format
CALL sp_process_order(1, 1, '123 Test St', 'invalid_json');
-- Expected: Error 3140 (22032): Invalid JSON text

-- 4. Function with non-existent customer
SELECT fn_calculate_loyalty_score(999);
-- Expected: Returns 0.00 (handles gracefully)
```

This reference guide provides comprehensive examples for using all database objects in your SCM system effectively.
