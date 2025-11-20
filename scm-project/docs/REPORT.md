# Supply Chain Management System Report

## 1. Title of the Problem Statement with Team Details

**Project Title:** Supply Chain Management System (SCM)

**Team Details:**
*   **Team Member 1:** [Name] (Roll No: [Roll No])
*   **Team Member 2:** [Name] (Roll No: [Roll No])
*   **Team Member 3:** [Name] (Roll No: [Roll No])
*   **Team Member 4:** [Name] (Roll No: [Roll No])

---

## 2. Description about the Statement (Short Abstract)

The Supply Chain Management (SCM) System is a comprehensive database solution designed to streamline and manage the flow of goods, data, and finances related to a product or service. It encompasses all activities from the acquisition of raw materials to the delivery of the final product to the end customer.

This project aims to digitize and optimize the supply chain process by connecting key stakeholders: **Manufacturers**, **Distributors**, **Retailers**, and **Customers**. The system facilitates:
*   **Inventory Management:** Tracking stock levels across different tiers.
*   **Order Processing:** Managing purchase orders between stakeholders (Distributor -> Manufacturer, Retailer -> Distributor, Customer -> Retailer).
*   **Relationship Management:** Maintaining supplier-retailer agreements.
*   **Sales & Analytics:** Tracking sales performance and profitability.

By implementing this system, businesses can reduce inefficiencies, improve transparency, and ensure timely delivery of products.

---

## 3. User Requirement Specification

The system is designed to support four distinct user roles, each with specific functional requirements:

### 3.1. Manufacturers
*   **Product Management:** Create and manage the master catalog of products, setting wholesale prices and production details.
*   **Inventory Control:** Track manufactured stock, reserved quantities, and production costs.
*   **Order Fulfillment:** Receive and process bulk orders from Distributors.
*   **Sales Tracking:** Monitor wholesale transactions and revenue.

### 3.2. Distributors
*   **Procurement:** Place bulk orders with Manufacturers to restock inventory.
*   **Inventory Management:** Manage stock levels, track incoming shipments, and set sell prices for Retailers.
*   **Order Fulfillment:** Receive and process orders from Retailers.
*   **Logistics:** Manage service areas and delivery schedules.

### 3.3. Retailers
*   **Sourcing:** Browse distributor catalogs and place orders to restock shelves.
*   **Inventory Management:** Track store-level stock, set retail prices, and monitor profit margins.
*   **Supplier Relationships:** Manage preferred distributors and negotiate terms.
*   **Sales:** Process orders from end Customers.

### 3.4. Customers
*   **Shopping:** Browse products available at specific Retailers.
*   **Ordering:** Place orders for products and track delivery status.
*   **Profile Management:** Manage personal details and shipping addresses.

---

## 4. List of Software/Tools/Programming Languages Used

## 4. List of Software/Tools/Programming Languages Used

| Category | Technology / Tool |
| :--- | :--- |
| **Database Management System** | MySQL / MariaDB |
| **Query Language** | SQL (Structured Query Language) |
| **Design Tool** | Draw.io (for ER Diagram) |
| **Documentation** | Markdown |
| **Version Control** | Git / GitHub |

---

## 5. ER Diagram

IMAGE: Please refer to the ER Diagram file: `scm-project/docs/er-diagram.xml` (Open in Draw.io)

*(Insert Screenshot of ER Diagram Here)*

---

## 6. Relational Schema

The database consists of **18 Tables** organized by functional tiers:

## 6. Relational Schema

The database consists of **18 Tables** organized by functional tiers:

### Base Entities

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `Users` | User authentication & role management | `UserID` (PK), `Email`, `Role` |
| `Manufacturers` | Manufacturer company profiles | `ManufacturerID` (PK), `UserID` (FK) |
| `Distributors` | Distributor logistics profiles | `DistributorID` (PK), `UserID` (FK) |
| `Retailers` | Retailer business profiles | `RetailerID` (PK), `UserID` (FK) |
| `Customers` | Customer personal profiles | `CustomerID` (PK), `UserID` (FK) |

### Product & Inventory

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `Products` | Master product catalog | `ProductID` (PK), `ManufacturerID` (FK) |
| `ManufacturerInventory` | Stock at manufacturing level | `InventoryID` (PK), `ManufacturerID` (FK) |
| `DistributorInventory` | Stock at distributor level | `InventoryID` (PK), `DistributorID` (FK) |
| `RetailerProducts` | Stock at retailer level (with pricing) | `RetailerProductID` (PK), `RetailerID` (FK) |
| `InventoryAudit` | History of stock changes | `AuditID` (PK), `RetailerProductID` (FK) |

### Orders & Transactions

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `DistributorOrders` | Orders: Distributor -> Manufacturer | `OrderID` (PK), `DistributorID` (FK) |
| `DistributorOrderItems` | Line items for Distributor orders | `OrderItemID` (PK), `OrderID` (FK) |
| `RetailerOrders` | Orders: Retailer -> Distributor | `OrderID` (PK), `RetailerID` (FK) |
| `RetailerOrderItems` | Line items for Retailer orders | `OrderItemID` (PK), `OrderID` (FK) |
| `Orders` | Orders: Customer -> Retailer | `OrderID` (PK), `CustomerID` (FK) |
| `OrderItems` | Line items for Customer orders | `OrderItemID` (PK), `OrderID` (FK) |
| `ManufacturerSales` | Wholesale transactions log | `SaleID` (PK), `ManufacturerID` (FK) |

### Relationships

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `RetailerSupplierRelationships` | Retailer-Distributor agreements | `RelationshipID` (PK), `RetailerID` (FK) |

---

## 7. DDL Commands

```sql
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
-- PRODUCT TABLES
-- ============================================================================

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
-- INVENTORY & ORDERS (Selected Key Tables)
-- ============================================================================

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
    UNIQUE KEY unique_manufacturer_product (ManufacturerID, ProductID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE RetailerProducts (
  RetailerProductID INT AUTO_INCREMENT PRIMARY KEY,
  RetailerID INT NOT NULL,
  ProductID INT NOT NULL,
  Price DECIMAL(10, 2) NOT NULL,
  Stock INT NOT NULL DEFAULT 0,
  PurchasePriceFromDistributor DECIMAL(10,2),
  LastPurchaseDate TIMESTAMP,
  DistributorID INT,
  ProfitMargin DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
        WHEN PurchasePriceFromDistributor > 0 
        THEN ((Price - PurchasePriceFromDistributor) / PurchasePriceFromDistributor) * 100
        ELSE NULL
    END
  ) STORED,
  MinStockLevel INT DEFAULT 10,
  AddedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_retailer_product (RetailerID, ProductID),
  CONSTRAINT fk_rp_retailer FOREIGN KEY (RetailerID) REFERENCES Retailers(RetailerID) ON DELETE CASCADE,
  CONSTRAINT fk_rp_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
  CONSTRAINT fk_retailer_distributor FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  CONSTRAINT fk_orders_distributor FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE OrderItems (
  OrderItemID INT AUTO_INCREMENT PRIMARY KEY,
  OrderID INT NOT NULL,
  RetailerProductID INT NOT NULL,
  Quantity INT NOT NULL,
  UnitPriceAtPurchase DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_orderitems_order FOREIGN KEY (OrderID)
    REFERENCES Orders(OrderID) ON DELETE CASCADE,
  CONSTRAINT fk_orderitems_rp FOREIGN KEY (RetailerProductID)
    REFERENCES RetailerProducts(RetailerProductID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (Refer to ddl_complete.sql for full schema including Distributor tables and Audit logs)
```

---

## 8. CRUD Operation Screenshots

*(Insert Screenshots of Create, Read, Update, Delete operations here)*

*   **Create:** Inserting a new User/Product.
*   **Read:** Selecting products/orders.
*   **Update:** Updating stock levels/order status.
*   **Delete:** Removing an item (if applicable).

---

## 9. List of Functionalities & Screenshots

*(Insert Screenshots of the application frontend/CLI here)*

## 9. List of Functionalities & Screenshots

*(Insert Screenshots of the application frontend/CLI here)*

| # | Feature | Description |
| :--- | :--- | :--- |
| 1 | **Login/Registration** | Secure user authentication and role-based access control. |
| 2 | **Dashboard** | Customized views for Manufacturers, Distributors, and Retailers. |
| 3 | **Product Catalog** | Browsing, searching, and filtering products. |
| 4 | **Order Placement** | Shopping cart functionality and checkout process. |
| 5 | **Order History** | Tracking past orders and viewing current status. |

---

## 10. Triggers, Procedures, Functions, Nested Queries, Joins

### 10.1. Triggers

```sql
-- Trigger: Auto-Update Order Total on Item Changes
DELIMITER //
CREATE TRIGGER UpdateOrderTotalAfterItem
AFTER INSERT ON OrderItems
FOR EACH ROW
BEGIN
    UPDATE Orders 
    SET TotalAmount = CalculateOrderTotal(NEW.OrderID)
    WHERE OrderID = NEW.OrderID;
END //
DELIMITER ;

-- Trigger: Inventory Audit Trail
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
            RetailerProductID, RetailerID, ProductID, 
            OldStock, NewStock, StockChange, ChangeReason
        ) VALUES (
            NEW.RetailerProductID, NEW.RetailerID, NEW.ProductID,
            OLD.Stock, NEW.Stock, NEW.Stock - OLD.Stock, change_reason
        );
    END IF;
END //
DELIMITER ;
```

### 10.2. Procedures

```sql
-- Procedure: Check Low Stock Products
DELIMITER //
CREATE PROCEDURE CheckLowStockProducts(IN retailer_id INT)
BEGIN
    -- Cursor to find products below min stock level
    SELECT p.ProductName, rp.Stock, rp.MinStockLevel, r.BusinessName
    FROM RetailerProducts rp
    JOIN Products p ON rp.ProductID = p.ProductID
    JOIN Retailers r ON rp.RetailerID = r.RetailerID
    WHERE rp.RetailerID = retailer_id 
    AND rp.Stock <= rp.MinStockLevel;
END //
DELIMITER ;

-- Procedure: Process Order with Validation
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
    -- Transactional order processing with stock check
    START TRANSACTION;
    
    SELECT RetailerProductID, Stock, Price 
    INTO @retailer_product_id, @current_stock, @product_price
    FROM RetailerProducts 
    WHERE RetailerID = retailer_id AND ProductID = product_id;
    
    IF @current_stock < quantity THEN
        SET result_message = 'Error: Insufficient stock';
        ROLLBACK;
    ELSE
        INSERT INTO Orders (CustomerID, RetailerID, ShippingAddress, Status, TotalAmount)
        VALUES (customer_id, retailer_id, shipping_address, 'Pending', quantity * @product_price);
        
        SET order_id = LAST_INSERT_ID();
        
        INSERT INTO OrderItems (OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase)
        VALUES (order_id, @retailer_product_id, quantity, @product_price);
        
        UPDATE RetailerProducts SET Stock = Stock - quantity 
        WHERE RetailerProductID = @retailer_product_id;
        
        SET result_message = 'Success: Order created';
        COMMIT;
    END IF;
END //
DELIMITER ;
```

### 10.3. Functions

```sql
-- Function: Calculate Order Total
DELIMITER //
CREATE FUNCTION CalculateOrderTotal(order_id INT) 
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(10,2) DEFAULT 0.00;
    SELECT COALESCE(SUM(Quantity * UnitPriceAtPurchase), 0.00) INTO total
    FROM OrderItems WHERE OrderID = order_id;
    RETURN total;
END //
DELIMITER ;
```

### 10.4. Views (Joins & Aggregations)

```sql
-- View: Supply Chain Pricing Analysis
CREATE VIEW SupplyChainPricing AS
SELECT 
    p.ProductID, p.ProductName, m.CompanyName as ManufacturerName,
    p.ManufacturerPrice,
    AVG(rp.Price) as AvgRetailPrice,
    -- Complex calculation for markup
    ((AVG(rp.Price) - p.ManufacturerPrice) / p.ManufacturerPrice) * 100 as TotalMarkup
FROM Products p
JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
LEFT JOIN RetailerProducts rp ON p.ProductID = rp.ProductID
GROUP BY p.ProductID, p.ProductName, m.CompanyName;

-- View: Inventory Status Across Tiers
CREATE VIEW InventoryStatus AS
SELECT 
    p.ProductName,
    mi.QuantityAvailable as ManufacturerStock,
    COALESCE(SUM(di.QuantityAvailable), 0) as DistributorStock,
    COALESCE(SUM(rp.Stock), 0) as RetailerStock
FROM Products p
LEFT JOIN ManufacturerInventory mi ON p.ProductID = mi.ProductID
LEFT JOIN DistributorInventory di ON p.ProductID = di.ProductID
LEFT JOIN RetailerProducts rp ON p.ProductID = rp.ProductID
GROUP BY p.ProductID, mi.QuantityAvailable;
```

---

## 11. Code Snippets

**Invoking a Procedure:**
```sql
-- Check low stock for Retailer ID 1
CALL CheckLowStockProducts(1);

-- Process a new order
CALL ProcessOrderWithValidation(101, 5, '123 Main St', 55, 2, @order_id, @msg);
SELECT @order_id, @msg;
```

**Invoking a Function:**
```sql
-- Get total for Order ID 500
SELECT CalculateOrderTotal(500);
```

**Trigger Effect (Automatic):**
```sql
-- Updating an order item will automatically update the Orders table total
UPDATE OrderItems SET Quantity = 5 WHERE OrderItemID = 10;
-- (Trigger fires automatically)
```

---

## 12. SQL Queries (Create, Insert, Select, Join, Aggregate)

### 12.1. Data Manipulation (Insert)

```sql
-- Insert a new User
INSERT INTO Users (Email, Password, Role) 
VALUES ('john.doe@example.com', 'hashed_password_123', 'Customer');

-- Insert a new Customer Profile
INSERT INTO Customers (UserID, FullName, Address, Phone)
VALUES (LAST_INSERT_ID(), 'John Doe', '123 Maple St, Cityville', '555-0199');

-- Insert a new Product (Manufacturer)
INSERT INTO Products (ProductName, ManufacturerPrice, ManufacturerID, Category)
VALUES ('Smart Widget X1', 450.00, 1, 'Electronics');
```

### 12.2. Complex Queries (Nested, Join, Aggregate)

**Nested Query:** Find products that are priced higher than the average price of all products in the same category.
```sql
SELECT ProductName, ManufacturerPrice, Category
FROM Products p1
WHERE ManufacturerPrice > (
    SELECT AVG(ManufacturerPrice)
    FROM Products p2
    WHERE p2.Category = p1.Category
);
```

**Join Query:** List all orders with customer name and retailer name.
```sql
SELECT 
    o.OrderID,
    o.OrderDate,
    c.FullName as CustomerName,
    r.BusinessName as RetailerName,
    o.TotalAmount,
    o.Status
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID
JOIN Retailers r ON o.RetailerID = r.RetailerID
ORDER BY o.OrderDate DESC;
```

**Aggregate Query:** Calculate total sales revenue per retailer.
```sql
SELECT 
    r.BusinessName,
    COUNT(o.OrderID) as TotalOrders,
    SUM(o.TotalAmount) as TotalRevenue
FROM Retailers r
JOIN Orders o ON r.RetailerID = o.RetailerID
WHERE o.Status = 'Delivered'
GROUP BY r.RetailerID, r.BusinessName;
```

**Full DDL Script:**
Please refer to the attached `scm-project/sql/ddl_complete.sql` file for the complete database schema definition.

---

## 13. GitHub Repo Link

**Repository:** [Insert GitHub Link Here]
