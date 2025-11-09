-- DDL Script for SCM Project

-- Ensure legacy FKs don't block drops when upgrading schema
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they already exist
DROP TABLE IF EXISTS OrderDetails; -- legacy table from previous schema
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS RetailerProducts;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Distributors;
DROP TABLE IF EXISTS Retailers;
DROP TABLE IF EXISTS Manufacturers;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Users;
SET FOREIGN_KEY_CHECKS = 1;

-- Base Users table for common authentication attributes
CREATE TABLE Users (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Email VARCHAR(255) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  FullName VARCHAR(100),
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customers - end users who place orders
CREATE TABLE Customers (
  CustomerID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  ShippingAddress TEXT,
  BillingAddress TEXT,
  Phone VARCHAR(20),
  DateOfBirth DATE,
  CONSTRAINT fk_customers_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Manufacturers - create and manage products
CREATE TABLE Manufacturers (
  ManufacturerID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  CompanyName VARCHAR(255) NOT NULL,
  BusinessLicense VARCHAR(100),
  ManufacturingAddress TEXT,
  ContactPhone VARCHAR(20),
  Website VARCHAR(255),
  CONSTRAINT fk_manufacturers_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Retailers - stock and sell products to customers
CREATE TABLE Retailers (
  RetailerID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  StoreName VARCHAR(255) NOT NULL,
  BusinessLicense VARCHAR(100),
  StoreAddress TEXT,
  ContactPhone VARCHAR(20),
  TaxID VARCHAR(50),
  CONSTRAINT fk_retailers_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Distributors - handle logistics and delivery
CREATE TABLE Distributors (
  DistributorID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  CompanyName VARCHAR(255) NOT NULL,
  ServiceArea TEXT,
  WarehouseAddress TEXT,
  ContactPhone VARCHAR(20),
  DeliveryCapacity INT,
  CONSTRAINT fk_distributors_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Master products defined by Manufacturers; not directly sold to customers
CREATE TABLE Products (
  ProductID INT AUTO_INCREMENT PRIMARY KEY,
  ProductName VARCHAR(255) NOT NULL,
  Description TEXT,
  Category VARCHAR(100),
  ManufacturerID INT NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_products_manufacturer FOREIGN KEY (ManufacturerID)
    REFERENCES Manufacturers(ManufacturerID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A Retailer decides to stock a master product with its own price and stock
CREATE TABLE RetailerProducts (
  RetailerProductID INT AUTO_INCREMENT PRIMARY KEY,
  RetailerID INT NOT NULL,
  ProductID INT NOT NULL,
  Price DECIMAL(10, 2) NOT NULL,
  Stock INT NOT NULL DEFAULT 0,
  MinStockAlert INT DEFAULT 5,
  LastRestocked DATETIME,
  UNIQUE KEY uq_retailer_product (RetailerID, ProductID),
  CONSTRAINT fk_rp_retailer FOREIGN KEY (RetailerID) REFERENCES Retailers(RetailerID),
  CONSTRAINT fk_rp_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders are placed with a specific Retailer, and may be assigned to a Distributor
CREATE TABLE Orders (
  OrderID INT AUTO_INCREMENT PRIMARY KEY,
  CustomerID INT NOT NULL,
  RetailerID INT NOT NULL,
  DistributorID INT NULL,
  OrderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ShippingAddress TEXT NOT NULL,
  TotalAmount DECIMAL(12, 2),
  Status ENUM('Pending', 'Confirmed', 'Assigned', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  EstimatedDelivery DATE,
  CONSTRAINT fk_orders_customer FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
  CONSTRAINT fk_orders_retailer FOREIGN KEY (RetailerID) REFERENCES Retailers(RetailerID),
  CONSTRAINT fk_orders_distributor FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Line items: link to RetailerProducts since customers buy from retailers
CREATE TABLE OrderItems (
  OrderItemID INT AUTO_INCREMENT PRIMARY KEY,
  OrderID INT NOT NULL,
  RetailerProductID INT NOT NULL,
  Quantity INT NOT NULL,
  UnitPriceAtPurchase DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_orderitems_order FOREIGN KEY (OrderID)
    REFERENCES Orders(OrderID) ON DELETE CASCADE,
  CONSTRAINT fk_orderitems_rp FOREIGN KEY (RetailerProductID)
    REFERENCES RetailerProducts(RetailerProductID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger 1: Automatic Stock Deduction Trigger
-- Automatically reduces retailer stock when an order is placed
DELIMITER $$

CREATE TRIGGER trg_reduce_stock_on_order
AFTER INSERT ON OrderItems
FOR EACH ROW
BEGIN
    -- Reduce stock when order item is added
    UPDATE RetailerProducts 
    SET Stock = Stock - NEW.Quantity,
        LastRestocked = CASE 
            WHEN Stock - NEW.Quantity <= MinStockAlert 
            THEN CURRENT_TIMESTAMP 
            ELSE LastRestocked 
        END
    WHERE RetailerProductID = NEW.RetailerProductID;
    
    -- Log if stock goes below minimum alert level
    IF (SELECT Stock FROM RetailerProducts WHERE RetailerProductID = NEW.RetailerProductID) <= 
       (SELECT MinStockAlert FROM RetailerProducts WHERE RetailerProductID = NEW.RetailerProductID) THEN
        -- Could insert into a stock_alerts table if it existed
        SIGNAL SQLSTATE '01000' SET MESSAGE_TEXT = 'Stock below minimum alert level';
    END IF;
END$$

DELIMITER ;

-- Trigger 2: Order Total Calculation Triggers
-- Automatically calculates and updates order total when items are added/modified/deleted
DELIMITER $$

CREATE TRIGGER trg_update_order_total_on_insert
AFTER INSERT ON OrderItems
FOR EACH ROW
BEGIN
    -- Recalculate total amount for the order
    UPDATE Orders 
    SET TotalAmount = (
        SELECT SUM(Quantity * UnitPriceAtPurchase) 
        FROM OrderItems 
        WHERE OrderID = NEW.OrderID
    )
    WHERE OrderID = NEW.OrderID;
END$$

CREATE TRIGGER trg_update_order_total_on_update
AFTER UPDATE ON OrderItems
FOR EACH ROW
BEGIN
    -- Recalculate total amount when order items are modified
    UPDATE Orders 
    SET TotalAmount = (
        SELECT SUM(Quantity * UnitPriceAtPurchase) 
        FROM OrderItems 
        WHERE OrderID = NEW.OrderID
    )
    WHERE OrderID = NEW.OrderID;
END$$

CREATE TRIGGER trg_update_order_total_on_delete
AFTER DELETE ON OrderItems
FOR EACH ROW
BEGIN
    -- Recalculate total amount when order items are deleted
    UPDATE Orders 
    SET TotalAmount = (
        SELECT COALESCE(SUM(Quantity * UnitPriceAtPurchase), 0) 
        FROM OrderItems 
        WHERE OrderID = OLD.OrderID
    )
    WHERE OrderID = OLD.OrderID;
END$$

DELIMITER ;

-- =============================================================================
-- STORED PROCEDURES
-- =============================================================================

-- Procedure 1: Process Order Procedure
-- Complete order processing workflow
DELIMITER $$

CREATE PROCEDURE sp_process_order(
    IN p_customer_id INT,
    IN p_retailer_id INT,
    IN p_shipping_address TEXT,
    IN p_items JSON -- Format: [{"retailer_product_id": 1, "quantity": 2}, ...]
)
BEGIN
    DECLARE v_order_id INT;
    DECLARE v_item_count INT DEFAULT 0;
    DECLARE v_current_item INT DEFAULT 0;
    DECLARE v_retailer_product_id INT;
    DECLARE v_quantity INT;
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_stock INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Create the order
    INSERT INTO Orders (CustomerID, RetailerID, ShippingAddress, Status)
    VALUES (p_customer_id, p_retailer_id, p_shipping_address, 'Pending');
    
    SET v_order_id = LAST_INSERT_ID();
    SET v_item_count = JSON_LENGTH(p_items);
    
    -- Process each item
    WHILE v_current_item < v_item_count DO
        SET v_retailer_product_id = JSON_UNQUOTE(JSON_EXTRACT(p_items, CONCAT('$[', v_current_item, '].retailer_product_id')));
        SET v_quantity = JSON_UNQUOTE(JSON_EXTRACT(p_items, CONCAT('$[', v_current_item, '].quantity')));
        
        -- Get current price and check stock
        SELECT Price, Stock INTO v_price, v_stock
        FROM RetailerProducts 
        WHERE RetailerProductID = v_retailer_product_id;
        
        -- Check if sufficient stock
        IF v_stock < v_quantity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for product';
        END IF;
        
        -- Add order item
        INSERT INTO OrderItems (OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase)
        VALUES (v_order_id, v_retailer_product_id, v_quantity, v_price);
        
        SET v_current_item = v_current_item + 1;
    END WHILE;
    
    -- Update order status
    UPDATE Orders SET Status = 'Confirmed' WHERE OrderID = v_order_id;
    
    COMMIT;
    
    SELECT v_order_id as OrderID, 'Order processed successfully' as Message;
END$$

DELIMITER ;

-- Procedure 2: Restock Alert Procedure
-- Generate restock alerts for retailers
DELIMITER $$

CREATE PROCEDURE sp_generate_restock_alerts(
    IN p_retailer_id INT DEFAULT NULL
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_retailer_id INT;
    DECLARE v_product_name VARCHAR(255);
    DECLARE v_current_stock INT;
    DECLARE v_min_alert INT;
    DECLARE v_store_name VARCHAR(255);
    
    DECLARE alert_cursor CURSOR FOR
        SELECT rp.RetailerID, p.ProductName, rp.Stock, rp.MinStockAlert, r.StoreName
        FROM RetailerProducts rp
        JOIN Products p ON rp.ProductID = p.ProductID
        JOIN Retailers r ON rp.RetailerID = r.RetailerID
        WHERE rp.Stock <= rp.MinStockAlert
        AND (p_retailer_id IS NULL OR rp.RetailerID = p_retailer_id)
        AND rp.MinStockAlert > 0;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Create temporary table for results
    DROP TEMPORARY TABLE IF EXISTS temp_restock_alerts;
    CREATE TEMPORARY TABLE temp_restock_alerts (
        RetailerID INT,
        StoreName VARCHAR(255),
        ProductName VARCHAR(255),
        CurrentStock INT,
        MinStockAlert INT,
        RecommendedRestock INT,
        Priority VARCHAR(20)
    );
    
    OPEN alert_cursor;
    
    read_loop: LOOP
        FETCH alert_cursor INTO v_retailer_id, v_product_name, v_current_stock, v_min_alert, v_store_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO temp_restock_alerts VALUES (
            v_retailer_id,
            v_store_name,
            v_product_name,
            v_current_stock,
            v_min_alert,
            GREATEST(v_min_alert * 3 - v_current_stock, v_min_alert), -- Recommended restock quantity
            CASE 
                WHEN v_current_stock = 0 THEN 'CRITICAL'
                WHEN v_current_stock <= v_min_alert / 2 THEN 'HIGH'
                ELSE 'MEDIUM'
            END
        );
    END LOOP;
    
    CLOSE alert_cursor;
    
    -- Return results
    SELECT * FROM temp_restock_alerts ORDER BY 
        CASE Priority 
            WHEN 'CRITICAL' THEN 1 
            WHEN 'HIGH' THEN 2 
            WHEN 'MEDIUM' THEN 3 
        END, StoreName, ProductName;
        
    DROP TEMPORARY TABLE temp_restock_alerts;
END$$

DELIMITER ;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function 1: Customer Loyalty Score Function
-- Calculate customer loyalty based on order history
DELIMITER $$

CREATE FUNCTION fn_calculate_loyalty_score(p_customer_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_total_orders INT DEFAULT 0;
    DECLARE v_total_amount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_avg_order_value DECIMAL(10,2) DEFAULT 0;
    DECLARE v_months_active INT DEFAULT 0;
    DECLARE v_loyalty_score DECIMAL(5,2) DEFAULT 0;
    DECLARE v_first_order_date DATE;
    
    -- Get customer statistics
    SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(TotalAmount), 0) as total_spent,
        COALESCE(AVG(TotalAmount), 0) as avg_order,
        MIN(DATE(OrderDate)) as first_order
    INTO v_total_orders, v_total_amount, v_avg_order_value, v_first_order_date
    FROM Orders 
    WHERE CustomerID = p_customer_id 
    AND Status IN ('Delivered', 'Shipped');
    
    -- Calculate months active
    IF v_first_order_date IS NOT NULL THEN
        SET v_months_active = TIMESTAMPDIFF(MONTH, v_first_order_date, CURDATE()) + 1;
    END IF;
    
    -- Calculate loyalty score (0-100)
    -- Formula: (Total Orders * 10) + (Total Amount / 100) + (Months Active * 2) + (Avg Order Value / 10)
    SET v_loyalty_score = LEAST(100, 
        (v_total_orders * 10) + 
        (v_total_amount / 100) + 
        (v_months_active * 2) + 
        (v_avg_order_value / 10)
    );
    
    RETURN v_loyalty_score;
END$$

DELIMITER ;

-- Function 2: Product Performance Score Function
-- Calculate product performance based on sales and stock turnover
DELIMITER $$

CREATE FUNCTION fn_product_performance_score(p_product_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_total_sold INT DEFAULT 0;
    DECLARE v_total_revenue DECIMAL(12,2) DEFAULT 0;
    DECLARE v_avg_stock INT DEFAULT 0;
    DECLARE v_num_retailers INT DEFAULT 0;
    DECLARE v_months_available INT DEFAULT 1;
    DECLARE v_performance_score DECIMAL(5,2) DEFAULT 0;
    DECLARE v_created_date DATE;
    
    -- Get product creation date
    SELECT DATE(CreatedAt) INTO v_created_date
    FROM Products 
    WHERE ProductID = p_product_id;
    
    -- Calculate months since product creation
    SET v_months_available = GREATEST(1, TIMESTAMPDIFF(MONTH, v_created_date, CURDATE()) + 1);
    
    -- Get sales statistics
    SELECT 
        COALESCE(SUM(oi.Quantity), 0) as total_quantity,
        COALESCE(SUM(oi.Quantity * oi.UnitPriceAtPurchase), 0) as total_revenue
    INTO v_total_sold, v_total_revenue
    FROM OrderItems oi
    JOIN RetailerProducts rp ON oi.RetailerProductID = rp.RetailerProductID
    JOIN Orders o ON oi.OrderID = o.OrderID
    WHERE rp.ProductID = p_product_id
    AND o.Status IN ('Delivered', 'Shipped');
    
    -- Get retailer statistics
    SELECT 
        COUNT(*) as retailer_count,
        COALESCE(AVG(Stock + COALESCE(v_total_sold, 0)), 0) as avg_stock_level
    INTO v_num_retailers, v_avg_stock
    FROM RetailerProducts 
    WHERE ProductID = p_product_id;
    
    -- Calculate performance score (0-100)
    -- Formula considers: sales velocity, revenue, retailer adoption, stock turnover
    SET v_performance_score = LEAST(100,
        (v_total_sold / v_months_available * 2) +  -- Sales velocity
        (v_total_revenue / v_months_available / 100) +  -- Revenue velocity
        (v_num_retailers * 5) +  -- Retailer adoption
        (CASE WHEN v_avg_stock > 0 THEN (v_total_sold / v_avg_stock * 20) ELSE 0 END)  -- Stock turnover
    );
    
    RETURN v_performance_score;
END$$

DELIMITER ;