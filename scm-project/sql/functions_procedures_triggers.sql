-- Functions, Procedures, and Triggers for SCM Project

-- ======================================
-- FUNCTIONS
-- ======================================

-- Function 1: Calculate Order Total
DELIMITER //
CREATE FUNCTION CalculateOrderTotal(order_id INT) 
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(10,2) DEFAULT 0.00;
    
    SELECT COALESCE(SUM(Quantity * UnitPriceAtPurchase), 0.00)
    INTO total
    FROM OrderItems
    WHERE OrderID = order_id;
    
    RETURN total;
END //
DELIMITER ;

-- Function 2: Get Retailer Stock Value
DELIMITER //
CREATE FUNCTION GetRetailerStockValue(retailer_id INT) 
RETURNS DECIMAL(12,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE stock_value DECIMAL(12,2) DEFAULT 0.00;
    
    SELECT COALESCE(SUM(Stock * Price), 0.00)
    INTO stock_value
    FROM RetailerProducts
    WHERE RetailerID = retailer_id;
    
    RETURN stock_value;
END //
DELIMITER ;

-- ======================================
-- STORED PROCEDURES
-- ======================================

-- Procedure 1: Check Low Stock Products
DELIMITER //
CREATE PROCEDURE CheckLowStockProducts(IN retailer_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE product_name VARCHAR(255);
    DECLARE current_stock INT;
    DECLARE min_stock INT;
    DECLARE retailer_name VARCHAR(100);
    
    DECLARE stock_cursor CURSOR FOR
        SELECT p.ProductName, rp.Stock, rp.MinStockLevel, r.BusinessName
        FROM RetailerProducts rp
        JOIN Products p ON rp.ProductID = p.ProductID
        JOIN Retailers r ON rp.RetailerID = r.RetailerID
        WHERE rp.RetailerID = retailer_id 
        AND rp.Stock <= rp.MinStockLevel;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Create temporary table for results
    DROP TEMPORARY TABLE IF EXISTS LowStockReport;
    CREATE TEMPORARY TABLE LowStockReport (
        RetailerName VARCHAR(100),
        ProductName VARCHAR(255),
        CurrentStock INT,
        MinStockLevel INT,
        RestockNeeded INT
    );
    
    OPEN stock_cursor;
    
    read_loop: LOOP
        FETCH stock_cursor INTO product_name, current_stock, min_stock, retailer_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO LowStockReport VALUES (
            retailer_name, 
            product_name, 
            current_stock, 
            min_stock, 
            min_stock - current_stock + 10  -- Suggest restock quantity
        );
    END LOOP;
    
    CLOSE stock_cursor;
    
    -- Return the report
    SELECT * FROM LowStockReport;
    
END //
DELIMITER ;

-- Procedure 2: Process Order with Validation
DELIMITER //
CREATE PROCEDURE ProcessOrderWithValidation(
    IN customer_id INT,
    IN retailer_id INT,
    IN shipping_address VARCHAR(255),
    IN product_id INT,
    IN quantity INT,
    OUT order_id INT,
    OUT result_message VARCHAR(255)
)
BEGIN
    DECLARE current_stock INT DEFAULT 0;
    DECLARE product_price DECIMAL(10,2) DEFAULT 0.00;
    DECLARE retailer_product_id INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET result_message = 'Error: Transaction failed';
        SET order_id = -1;
    END;
    
    START TRANSACTION;
    
    -- Check if retailer stocks this product
    SELECT RetailerProductID, Stock, Price 
    INTO retailer_product_id, current_stock, product_price
    FROM RetailerProducts 
    WHERE RetailerID = retailer_id AND ProductID = product_id;
    
    -- Validate stock availability
    IF retailer_product_id = 0 THEN
        SET result_message = 'Error: Product not available from this retailer';
        SET order_id = -1;
        ROLLBACK;
    ELSEIF current_stock < quantity THEN
        SET result_message = CONCAT('Error: Insufficient stock. Available: ', current_stock);
        SET order_id = -1;
        ROLLBACK;
    ELSE
        -- Create order
        INSERT INTO Orders (CustomerID, RetailerID, ShippingAddress, Status, TotalAmount)
        VALUES (customer_id, retailer_id, shipping_address, 'Pending', quantity * product_price);
        
        SET order_id = LAST_INSERT_ID();
        
        -- Add order item
        INSERT INTO OrderItems (OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase)
        VALUES (order_id, retailer_product_id, quantity, product_price);
        
        -- Update inventory
        UPDATE RetailerProducts 
        SET Stock = Stock - quantity 
        WHERE RetailerProductID = retailer_product_id;
        
        SET result_message = CONCAT('Success: Order #', order_id, ' created successfully');
        COMMIT;
    END IF;
    
END //
DELIMITER ;

-- ======================================
-- AUDIT TABLE FOR TRIGGERS
-- ======================================

-- Create audit table for inventory changes
CREATE TABLE InventoryAudit (
    AuditID INT AUTO_INCREMENT PRIMARY KEY,
    RetailerProductID INT NOT NULL,
    RetailerID INT NOT NULL,
    ProductID INT NOT NULL,
    OldStock INT,
    NewStock INT,
    StockChange INT,
    ChangeReason ENUM('ORDER', 'RESTOCK', 'ADJUSTMENT', 'RETURN') DEFAULT 'ADJUSTMENT',
    ChangedBy VARCHAR(100),
    ChangeDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    OrderID INT NULL,
    INDEX idx_retailer_date (RetailerID, ChangeDate),
    INDEX idx_product_date (ProductID, ChangeDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================
-- TRIGGERS
-- ======================================

-- Trigger 1: Auto-Update Order Total on Item Changes
DELIMITER //
CREATE TRIGGER UpdateOrderTotalAfterItem
AFTER INSERT ON OrderItems
FOR EACH ROW
BEGIN
    UPDATE Orders 
    SET TotalAmount = CalculateOrderTotal(NEW.OrderID)
    WHERE OrderID = NEW.OrderID;
END //

CREATE TRIGGER UpdateOrderTotalAfterItemUpdate
AFTER UPDATE ON OrderItems
FOR EACH ROW
BEGIN
    UPDATE Orders 
    SET TotalAmount = CalculateOrderTotal(NEW.OrderID)
    WHERE OrderID = NEW.OrderID;
END //

CREATE TRIGGER UpdateOrderTotalAfterItemDelete
AFTER DELETE ON OrderItems
FOR EACH ROW
BEGIN
    UPDATE Orders 
    SET TotalAmount = CalculateOrderTotal(OLD.OrderID)
    WHERE OrderID = OLD.OrderID;
END //
DELIMITER ;

-- Trigger 2: Inventory Audit Trail
DELIMITER //
CREATE TRIGGER AuditInventoryChanges
AFTER UPDATE ON RetailerProducts
FOR EACH ROW
BEGIN
    DECLARE change_reason ENUM('ORDER', 'RESTOCK', 'ADJUSTMENT', 'RETURN') DEFAULT 'ADJUSTMENT';
    
    -- Only log if stock actually changed
    IF OLD.Stock != NEW.Stock THEN
        -- Determine reason based on stock change pattern
        IF NEW.Stock < OLD.Stock THEN
            SET change_reason = 'ORDER';  -- Stock decreased, likely a sale
        ELSEIF NEW.Stock > OLD.Stock THEN
            SET change_reason = 'RESTOCK';  -- Stock increased, likely restocking
        END IF;
        
        INSERT INTO InventoryAudit (
            RetailerProductID, 
            RetailerID, 
            ProductID, 
            OldStock, 
            NewStock, 
            StockChange, 
            ChangeReason
        ) VALUES (
            NEW.RetailerProductID,
            NEW.RetailerID,
            NEW.ProductID,
            OLD.Stock,
            NEW.Stock,
            NEW.Stock - OLD.Stock,
            change_reason
        );
    END IF;
END //
DELIMITER ;
