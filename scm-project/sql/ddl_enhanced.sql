-- Enhanced DDL Script for SCM Project with Complete Supply Chain Management
-- Includes: Base schema + Stage 1 enhancements
-- Date: November 13, 2025

-- Ensure legacy FKs don't block drops when upgrading schema
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they already exist
DROP TABLE IF EXISTS RetailerOrderItems;
DROP TABLE IF EXISTS RetailerOrders;
DROP TABLE IF EXISTS RetailerSupplierRelationships;
DROP TABLE IF EXISTS DistributorOrderItems;
DROP TABLE IF EXISTS DistributorOrders;
DROP TABLE IF EXISTS DistributorInventory;
DROP TABLE IF EXISTS ManufacturerInventory;
DROP TABLE IF EXISTS InventoryAudit;
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS RetailerProducts;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS ManufacturerSales;
DROP TABLE IF EXISTS Distributors;
DROP TABLE IF EXISTS Retailers;
DROP TABLE IF EXISTS Manufacturers;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Users;

-- Drop views if they exist
DROP VIEW IF EXISTS RetailerPurchaseHistory;
DROP VIEW IF EXISTS SupplyChainPricing;
DROP VIEW IF EXISTS InventoryStatus;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- BASE ENTITY TABLES
-- ============================================================================

-- Base Users table for authentication
CREATE TABLE Users (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Email VARCHAR(255) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  Role ENUM('Customer', 'Manufacturer', 'Retailer', 'Distributor') NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_role (Role),
  INDEX idx_email (Email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User authentication and role management';

-- Customer Entity
CREATE TABLE Customers (
  CustomerID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  FullName VARCHAR(100) NOT NULL,
  Address TEXT,
  Phone VARCHAR(20),
  DateOfBirth DATE,
  CONSTRAINT fk_customers_user FOREIGN KEY (UserID) 
    REFERENCES Users(UserID) ON DELETE CASCADE,
  INDEX idx_customer_name (FullName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Customer profile information';

-- Manufacturer Entity
CREATE TABLE Manufacturers (
  ManufacturerID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  CompanyName VARCHAR(100) NOT NULL,
  Address TEXT,
  Phone VARCHAR(20),
  Website VARCHAR(255),
  LicenseNumber VARCHAR(50),
  EstablishedYear YEAR,
  CONSTRAINT fk_manufacturers_user FOREIGN KEY (UserID) 
    REFERENCES Users(UserID) ON DELETE CASCADE,
  INDEX idx_manufacturer_name (CompanyName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Manufacturer company information';

-- Retailer Entity
CREATE TABLE Retailers (
  RetailerID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  BusinessName VARCHAR(100) NOT NULL,
  Address TEXT,
  Phone VARCHAR(20),
  Website VARCHAR(255),
  TaxID VARCHAR(50),
  BusinessLicense VARCHAR(50),
  CONSTRAINT fk_retailers_user FOREIGN KEY (UserID) 
    REFERENCES Users(UserID) ON DELETE CASCADE,
  INDEX idx_retailer_name (BusinessName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Retailer business information';

-- Distributor Entity
CREATE TABLE Distributors (
  DistributorID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  CompanyName VARCHAR(100) NOT NULL,
  Address TEXT,
  Phone VARCHAR(20),
  ServiceAreas TEXT,
  VehicleCapacity INT,
  OperatingHours VARCHAR(50),
  CONSTRAINT fk_distributors_user FOREIGN KEY (UserID) 
    REFERENCES Users(UserID) ON DELETE CASCADE,
  INDEX idx_distributor_name (CompanyName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Distributor logistics information';

-- ============================================================================
-- PRODUCT TABLES (Enhanced with Stage 1 features)
-- ============================================================================

-- Master products defined by Manufacturers with pricing and production details
CREATE TABLE Products (
  ProductID INT AUTO_INCREMENT PRIMARY KEY,
  ProductName VARCHAR(255) NOT NULL,
  Description TEXT,
  ManufacturerPrice DECIMAL(10,2) COMMENT 'Wholesale price set by manufacturer for distributors',
  MinOrderQuantity INT DEFAULT 1 COMMENT 'Minimum quantity required for orders from distributors',
  ProductionCapacity INT COMMENT 'Monthly production capacity at manufacturer',
  LeadTimeDays INT COMMENT 'Production lead time in days',
  Status ENUM('Active', 'Discontinued', 'OutOfProduction') DEFAULT 'Active',
  ManufacturerID INT NOT NULL,
  Category VARCHAR(100),
  SKU VARCHAR(50) UNIQUE,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_manufacturer FOREIGN KEY (ManufacturerID)
    REFERENCES Manufacturers(ManufacturerID) ON DELETE CASCADE,
  INDEX idx_manufacturer_product (ManufacturerID, Status),
  INDEX idx_category (Category),
  INDEX idx_pricing (ManufacturerPrice, MinOrderQuantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Enhanced master products with manufacturer pricing and production details';

-- ============================================================================
-- MANUFACTURER TIER TABLES (Stage 1)
-- ============================================================================

-- Manufacturer Inventory Management
CREATE TABLE ManufacturerInventory (
    InventoryID INT PRIMARY KEY AUTO_INCREMENT,
    ManufacturerID INT NOT NULL,
    ProductID INT NOT NULL,
    QuantityAvailable INT DEFAULT 0,
    QuantityReserved INT DEFAULT 0,
    QuantityProduced INT DEFAULT 0,
    ProductionCost DECIMAL(10,2),
    LastRestocked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ManufacturerID) REFERENCES Manufacturers(ManufacturerID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    UNIQUE KEY unique_manufacturer_product (ManufacturerID, ProductID),
    INDEX idx_manufacturer_inventory (ManufacturerID, QuantityAvailable),
    INDEX idx_product_availability (ProductID, QuantityAvailable),
    INDEX idx_manufacturer_low_stock (ManufacturerID, QuantityAvailable)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks inventory at manufacturer level - production and availability';

-- ============================================================================
-- DISTRIBUTOR TIER TABLES (Stage 1)
-- ============================================================================

-- Distributor Inventory Management
CREATE TABLE DistributorInventory (
    InventoryID INT PRIMARY KEY AUTO_INCREMENT,
    DistributorID INT NOT NULL,
    ProductID INT NOT NULL,
    QuantityAvailable INT DEFAULT 0,
    QuantityReserved INT DEFAULT 0,
    PurchasePriceFromManufacturer DECIMAL(10,2),
    SellPriceToRetailer DECIMAL(10,2),
    LastPurchaseDate TIMESTAMP,
    LastSaleDate TIMESTAMP,
    MinStockLevel INT DEFAULT 10,
    MaxStockLevel INT DEFAULT 1000,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    UNIQUE KEY unique_distributor_product (DistributorID, ProductID),
    INDEX idx_distributor_inventory (DistributorID, QuantityAvailable),
    INDEX idx_product_distributor (ProductID, QuantityAvailable),
    INDEX idx_low_stock (DistributorID, QuantityAvailable, MinStockLevel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Distributor inventory with pricing from manufacturers and to retailers';

-- Distributor Orders from Manufacturers
CREATE TABLE DistributorOrders (
    OrderID INT PRIMARY KEY AUTO_INCREMENT,
    DistributorID INT NOT NULL,
    ManufacturerID INT NOT NULL,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpectedDeliveryDate DATE,
    Status ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Received', 'Cancelled') DEFAULT 'Pending',
    TotalAmount DECIMAL(12,2) DEFAULT 0.00,
    ShippingCost DECIMAL(8,2) DEFAULT 0.00,
    PaymentTerms VARCHAR(100),
    Notes TEXT,
    CreatedBy VARCHAR(100),
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID) ON DELETE CASCADE,
    FOREIGN KEY (ManufacturerID) REFERENCES Manufacturers(ManufacturerID) ON DELETE CASCADE,
    INDEX idx_distributor_orders (DistributorID, OrderDate),
    INDEX idx_manufacturer_orders (ManufacturerID, OrderDate),
    INDEX idx_order_status (Status, OrderDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Purchase orders placed by distributors to manufacturers';

-- Distributor Order Items
CREATE TABLE DistributorOrderItems (
    OrderItemID INT PRIMARY KEY AUTO_INCREMENT,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(10,2) NOT NULL,
    LineTotal DECIMAL(12,2) GENERATED ALWAYS AS (Quantity * UnitPrice) STORED,
    DeliveredQuantity INT DEFAULT 0,
    BackorderedQuantity INT DEFAULT 0,
    ItemStatus ENUM('Pending', 'Confirmed', 'Shipped', 'Received', 'Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (OrderID) REFERENCES DistributorOrders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    INDEX idx_order_items (OrderID),
    INDEX idx_product_orders (ProductID, OrderID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Line items for distributor purchase orders';

-- ============================================================================
-- RETAILER TIER TABLES (Base + Stage 1 enhancements)
-- ============================================================================

-- Retailer decides to stock a master product with its own price and stock (Enhanced)
CREATE TABLE RetailerProducts (
  RetailerProductID INT AUTO_INCREMENT PRIMARY KEY,
  RetailerID INT NOT NULL,
  ProductID INT NOT NULL,
  Price DECIMAL(10, 2) NOT NULL,
  Stock INT NOT NULL DEFAULT 0,
  PurchasePriceFromDistributor DECIMAL(10,2) COMMENT 'Cost paid by retailer to distributor',
  LastPurchaseDate TIMESTAMP,
  DistributorID INT,
  ProfitMargin DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
        WHEN PurchasePriceFromDistributor > 0 
        THEN ((Price - PurchasePriceFromDistributor) / PurchasePriceFromDistributor) * 100
        ELSE NULL
    END
  ) STORED COMMENT 'Calculated profit margin percentage based on purchase vs sell price',
  MinStockLevel INT DEFAULT 10,
  AddedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_retailer_product (RetailerID, ProductID),
  CONSTRAINT fk_rp_retailer FOREIGN KEY (RetailerID) REFERENCES Retailers(RetailerID) ON DELETE CASCADE,
  CONSTRAINT fk_rp_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
  CONSTRAINT fk_retailer_distributor FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID),
  INDEX idx_retailer_products_profit (ProfitMargin),
  INDEX idx_retailer_products_distributor (DistributorID, LastPurchaseDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Retailer product inventory with cost tracking and profit margins';

-- Retailer Orders from Distributors
CREATE TABLE RetailerOrders (
    OrderID INT PRIMARY KEY AUTO_INCREMENT,
    RetailerID INT NOT NULL,
    DistributorID INT NOT NULL,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpectedDeliveryDate DATE,
    Status ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Received', 'Cancelled') DEFAULT 'Pending',
    TotalAmount DECIMAL(12,2) DEFAULT 0.00,
    ShippingCost DECIMAL(8,2) DEFAULT 0.00,
    PaymentTerms VARCHAR(100) DEFAULT 'Net 30',
    PaymentStatus ENUM('Pending', 'Paid', 'Overdue') DEFAULT 'Pending',
    InvoiceNumber VARCHAR(50),
    Notes TEXT,
    CreatedBy VARCHAR(100),
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (RetailerID) REFERENCES Retailers(RetailerID) ON DELETE CASCADE,
    FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID) ON DELETE CASCADE,
    INDEX idx_retailer_orders (RetailerID, OrderDate),
    INDEX idx_distributor_sales (DistributorID, OrderDate),
    INDEX idx_order_status (Status, OrderDate),
    INDEX idx_payment_status (PaymentStatus, OrderDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Purchase orders placed by retailers to distributors';

-- Retailer Order Items
CREATE TABLE RetailerOrderItems (
    OrderItemID INT PRIMARY KEY AUTO_INCREMENT,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(10,2) NOT NULL,
    LineTotal DECIMAL(12,2) GENERATED ALWAYS AS (Quantity * UnitPrice) STORED,
    DeliveredQuantity INT DEFAULT 0,
    BackorderedQuantity INT DEFAULT 0,
    ItemStatus ENUM('Pending', 'Confirmed', 'Shipped', 'Received', 'Cancelled') DEFAULT 'Pending',
    DiscountPercent DECIMAL(5,2) DEFAULT 0.00,
    DiscountAmount DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (OrderID) REFERENCES RetailerOrders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    INDEX idx_order_items (OrderID),
    INDEX idx_product_orders (ProductID, OrderID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Line items for retailer purchase orders from distributors';

-- Retailer Supplier Relationships
CREATE TABLE RetailerSupplierRelationships (
    RelationshipID INT PRIMARY KEY AUTO_INCREMENT,
    RetailerID INT NOT NULL,
    DistributorID INT NOT NULL,
    ProductID INT,
    PreferredSupplier BOOLEAN DEFAULT FALSE,
    PaymentTerms VARCHAR(100) DEFAULT 'Net 30',
    VolumeDiscountPercent DECIMAL(5,2) DEFAULT 0.00,
    MinOrderAmount DECIMAL(10,2) DEFAULT 0.00,
    CreditLimit DECIMAL(12,2) DEFAULT 10000.00,
    RelationshipStartDate DATE DEFAULT (CURRENT_DATE),
    Status ENUM('Active', 'Suspended', 'Terminated') DEFAULT 'Active',
    Notes TEXT,
    FOREIGN KEY (RetailerID) REFERENCES Retailers(RetailerID) ON DELETE CASCADE,
    FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    UNIQUE KEY unique_retailer_distributor_product (RetailerID, DistributorID, ProductID),
    INDEX idx_retailer_relationships (RetailerID, Status),
    INDEX idx_distributor_relationships (DistributorID, Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Manages relationships between retailers and their distributor suppliers';

-- ============================================================================
-- CUSTOMER TIER TABLES
-- ============================================================================

-- Orders are placed by Customers with specific Retailers
CREATE TABLE Orders (
  OrderID INT AUTO_INCREMENT PRIMARY KEY,
  CustomerID INT NOT NULL,
  RetailerID INT NOT NULL,
  DistributorID INT NULL,
  OrderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ShippingAddress VARCHAR(255) NOT NULL,
  Status ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  TotalAmount DECIMAL(10, 2),
  EstimatedDelivery DATE,
  CONSTRAINT fk_orders_customer FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID) ON DELETE CASCADE,
  CONSTRAINT fk_orders_retailer FOREIGN KEY (RetailerID) REFERENCES Retailers(RetailerID) ON DELETE CASCADE,
  CONSTRAINT fk_orders_distributor FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID),
  INDEX idx_customer_orders (CustomerID, OrderDate),
  INDEX idx_retailer_orders (RetailerID, OrderDate),
  INDEX idx_order_status (Status, OrderDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Customer orders from retailers';

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
    REFERENCES RetailerProducts(RetailerProductID) ON DELETE CASCADE,
  INDEX idx_order_items (OrderID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Line items for customer orders';

-- ============================================================================
-- ADDITIONAL TABLES
-- ============================================================================

-- Manufacturer Sales (Wholesale/Procurement transactions between Manufacturers and Retailers)
CREATE TABLE ManufacturerSales (
  SaleID INT AUTO_INCREMENT PRIMARY KEY,
  ManufacturerID INT NOT NULL,
  RetailerID INT NOT NULL,
  ProductID INT NOT NULL,
  WholesalePrice DECIMAL(10,2) NOT NULL,
  Quantity INT NOT NULL,
  PurchaseDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  InvoiceNumber VARCHAR(50),
  Notes TEXT,
  CONSTRAINT fk_ms_manufacturer FOREIGN KEY (ManufacturerID) REFERENCES Manufacturers(ManufacturerID) ON DELETE CASCADE,
  CONSTRAINT fk_ms_retailer FOREIGN KEY (RetailerID) REFERENCES Retailers(RetailerID) ON DELETE CASCADE,
  CONSTRAINT fk_ms_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
  INDEX idx_retailer_purchases (RetailerID, ProductID),
  INDEX idx_manufacturer_sales (ManufacturerID, ProductID),
  INDEX idx_purchase_date (PurchaseDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historical wholesale transactions';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Audit trail for inventory changes';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Supply Chain Pricing View
CREATE VIEW SupplyChainPricing AS
SELECT 
    p.ProductID,
    p.ProductName,
    p.Category,
    m.CompanyName as ManufacturerName,
    p.ManufacturerPrice,
    
    -- Distributor pricing
    AVG(di.PurchasePriceFromManufacturer) as AvgDistributorCost,
    AVG(di.SellPriceToRetailer) as AvgDistributorPrice,
    AVG(CASE 
        WHEN di.PurchasePriceFromManufacturer > 0 
        THEN ((di.SellPriceToRetailer - di.PurchasePriceFromManufacturer) / di.PurchasePriceFromManufacturer) * 100
        ELSE NULL
    END) as AvgDistributorMargin,
    
    -- Retailer pricing
    AVG(rp.PurchasePriceFromDistributor) as AvgRetailerCost,
    AVG(rp.Price) as AvgRetailPrice,
    AVG(rp.ProfitMargin) as AvgRetailerMargin,
    
    -- Supply chain markup
    CASE 
        WHEN p.ManufacturerPrice > 0 
        THEN ((AVG(rp.Price) - p.ManufacturerPrice) / p.ManufacturerPrice) * 100
        ELSE NULL
    END as TotalSupplyChainMarkup

FROM Products p
JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
LEFT JOIN DistributorInventory di ON p.ProductID = di.ProductID
LEFT JOIN RetailerProducts rp ON p.ProductID = rp.ProductID
WHERE p.Status = 'Active'
GROUP BY p.ProductID, p.ProductName, p.Category, m.CompanyName, p.ManufacturerPrice;

-- Inventory Status View
CREATE VIEW InventoryStatus AS
SELECT 
    p.ProductID,
    p.ProductName,
    p.Category,
    m.CompanyName as ManufacturerName,
    
    -- Manufacturer inventory
    mi.QuantityAvailable as ManufacturerStock,
    mi.QuantityReserved as ManufacturerReserved,
    
    -- Distributor inventory totals
    COALESCE(SUM(di.QuantityAvailable), 0) as TotalDistributorStock,
    COALESCE(SUM(di.QuantityReserved), 0) as TotalDistributorReserved,
    COUNT(DISTINCT di.DistributorID) as DistributorCount,
    
    -- Retailer inventory totals
    COALESCE(SUM(rp.Stock), 0) as TotalRetailerStock,
    COUNT(DISTINCT rp.RetailerID) as RetailerCount,
    
    -- Low stock alerts
    CASE 
        WHEN mi.QuantityAvailable < 50 THEN 'LOW_MANUFACTURER_STOCK'
        WHEN COALESCE(SUM(di.QuantityAvailable), 0) < 20 THEN 'LOW_DISTRIBUTOR_STOCK'
        WHEN COALESCE(SUM(rp.Stock), 0) < 10 THEN 'LOW_RETAILER_STOCK'
        ELSE 'ADEQUATE'
    END as StockStatus

FROM Products p
JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
LEFT JOIN ManufacturerInventory mi ON p.ProductID = mi.ProductID AND p.ManufacturerID = mi.ManufacturerID
LEFT JOIN DistributorInventory di ON p.ProductID = di.ProductID
LEFT JOIN RetailerProducts rp ON p.ProductID = rp.ProductID
WHERE p.Status = 'Active'
GROUP BY p.ProductID, p.ProductName, p.Category, m.CompanyName, mi.QuantityAvailable, mi.QuantityReserved;

-- Retailer Purchase History View
CREATE VIEW RetailerPurchaseHistory AS
SELECT 
    ro.RetailerID,
    r.BusinessName as RetailerName,
    ro.DistributorID,
    d.CompanyName as DistributorName,
    COUNT(ro.OrderID) as TotalOrders,
    SUM(ro.TotalAmount) as TotalSpent,
    AVG(ro.TotalAmount) as AvgOrderValue,
    MAX(ro.OrderDate) as LastOrderDate,
    SUM(CASE WHEN ro.Status = 'Received' THEN ro.TotalAmount ELSE 0 END) as CompletedOrdersValue
FROM RetailerOrders ro
JOIN Retailers r ON ro.RetailerID = r.RetailerID
JOIN Distributors d ON ro.DistributorID = d.DistributorID
GROUP BY ro.RetailerID, ro.DistributorID;

-- ============================================================================
-- FUNCTIONS, PROCEDURES, AND TRIGGERS
-- ============================================================================

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
            min_stock - current_stock + 10
        );
    END LOOP;
    
    CLOSE stock_cursor;
    
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
    
    SELECT RetailerProductID, Stock, Price 
    INTO retailer_product_id, current_stock, product_price
    FROM RetailerProducts 
    WHERE RetailerID = retailer_id AND ProductID = product_id;
    
    IF retailer_product_id = 0 THEN
        SET result_message = 'Error: Product not available from this retailer';
        SET order_id = -1;
        ROLLBACK;
    ELSEIF current_stock < quantity THEN
        SET result_message = CONCAT('Error: Insufficient stock. Available: ', current_stock);
        SET order_id = -1;
        ROLLBACK;
    ELSE
        INSERT INTO Orders (CustomerID, RetailerID, ShippingAddress, Status, TotalAmount)
        VALUES (customer_id, retailer_id, shipping_address, 'Pending', quantity * product_price);
        
        SET order_id = LAST_INSERT_ID();
        
        INSERT INTO OrderItems (OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase)
        VALUES (order_id, retailer_product_id, quantity, product_price);
        
        UPDATE RetailerProducts 
        SET Stock = Stock - quantity 
        WHERE RetailerProductID = retailer_product_id;
        
        SET result_message = CONCAT('Success: Order #', order_id, ' created successfully');
        COMMIT;
    END IF;
    
END //
DELIMITER ;

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
    
    IF OLD.Stock != NEW.Stock THEN
        IF NEW.Stock < OLD.Stock THEN
            SET change_reason = 'ORDER';
        ELSEIF NEW.Stock > OLD.Stock THEN
            SET change_reason = 'RESTOCK';
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

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Enhanced DDL Schema Created Successfully' as Status;
SELECT 'Includes: Base Schema + Stage 1 Supply Chain Enhancements' as Details;
