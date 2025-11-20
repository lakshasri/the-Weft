# Supply Chain Data Architecture Reference

This document summarizes the database layer that powers the “the-Weft” supply-chain application. It captures the core entities, relationship tables, stored programs, and the queries invoked by the UI/API so you can understand how data is modeled and accessed across manufacturer, distributor, retailer, and customer workflows.

---

## 1. Complete Table Inventory

The schema is defined in `sql/ddl_complete.sql` and consists of **21 relational objects** (18 tables and 3 views). Every table is listed below with the key attributes. Use this section as an entity/relationship catalog.

### 1.1 Entity Tables (detailed)

#### Users
- **Primary key:** `UserID`
- **Attributes:** `Email`, `Password` (bcrypt hash), `Role` (`Customer`, `Manufacturer`, `Retailer`, `Distributor`), `IsActive`, `CreatedAt`.
- **Description:** Central authentication/authorization anchor. Every role-specific table holds a `UserID` FK to this table. Deleting a user cascades to their role table entry.

#### Customers
- **Primary key:** `CustomerID`
- **Attributes:** `UserID` (FK → `Users`), `FullName`, `Address`, `Phone`, `DateOfBirth`.
- **Description:** Holds profile/contact data for consumer users. One row per `Users.UserID` with `Role='Customer'`.

#### Manufacturers
- **Primary key:** `ManufacturerID`
- **Attributes:** `UserID`, `CompanyName`, `Address`, `Phone`, `Website`, `LicenseNumber`, `EstablishedYear`.
- **Description:** Describes manufacturing organizations and ties them to `Users`. Additional compliance data (licenses, year founded) helps with verification workflows.

#### Retailers
- **Primary key:** `RetailerID`
- **Attributes:** `UserID`, `BusinessName`, `Address`, `Phone`, `Website`, `TaxID`, `BusinessLicense`.
- **Description:** Brick-and-mortar or e-commerce retailers who buy from distributors and sell to customers.

#### Distributors
- **Primary key:** `DistributorID`
- **Attributes:** `UserID`, `CompanyName`, `Address`, `ServiceAreas`, `VehicleCapacity`, `OperatingHours`, `Phone`.
- **Description:** Regional distribution centers handling logistics between manufacturers and retailers.

#### Products
- **Primary key:** `ProductID`
- **Attributes:** `ManufacturerID`, `ProductName`, `Description`, `ManufacturerPrice`, `MinOrderQuantity`, `ProductionCapacity`, `LeadTimeDays`, `Status`, `Category`, `SKU`, `CreatedAt`, `LastUpdated`.
- **Description:** Master catalog records authored by manufacturers. Downstream inventory tables reference these IDs.

#### ManufacturerInventory
- **Primary key:** `InventoryID`
- **Attributes:** `ManufacturerID`, `ProductID`, `QuantityAvailable`, `QuantityReserved`, `QuantityProduced`, `ProductionCost`, `LastRestocked`, `LastUpdated`.
- **Description:** Maintains manufacturer-side stock counts. `UNIQUE (ManufacturerID, ProductID)` ensures one record per SKU per factory.

#### DistributorInventory
- **Primary key:** `InventoryID`
- **Attributes:** `DistributorID`, `ProductID`, `QuantityAvailable`, `QuantityReserved`, `PurchasePriceFromManufacturer`, `SellPriceToRetailer`, `LastPurchaseDate`, `LastSaleDate`, `MinStockLevel`, `MaxStockLevel`, `CreatedDate`, `LastUpdated`.
- **Description:** Distributor warehouse ledger including cost and target price to retailers.

#### RetailerProducts
- **Primary key:** `RetailerProductID`
- **Attributes:** `RetailerID`, `ProductID`, `Price`, `Stock`, `PurchasePriceFromDistributor`, `LastPurchaseDate`, `DistributorID`, `ProfitMargin` (generated column), `MinStockLevel`, `AddedDate`.
- **Description:** Retailer-specific SKU definitions with local stock and margin calculations. Unique constraint on `(RetailerID, ProductID)`.

#### ManufacturerSales
- **Primary key:** `SaleID`
- **Attributes:** `ManufacturerID`, `RetailerID`, `ProductID`, `WholesalePrice`, `Quantity`, `PurchaseDate`, `InvoiceNumber`, `Notes`.
- **Description:** Historical log of wholesale direct sales (used for reporting).

#### InventoryAudit
- **Primary key:** `AuditID`
- **Attributes:** `RetailerProductID`, `RetailerID`, `ProductID`, `OldStock`, `NewStock`, `StockChange`, `ChangeReason`, `ChangedBy`, `ChangeDate`, `OrderID`.
- **Description:** Populated via trigger to track every stock adjustment event at the retailer level.

### 1.2 Relationship / Transaction Tables (detailed)

#### DistributorOrders
- **Nature:** Distributor ↔ Manufacturer purchase orders.
- **Key columns:** `OrderID`, `DistributorID`, `ManufacturerID`, `OrderDate`, `ExpectedDeliveryDate`, `Status`, `TotalAmount`, `ShippingCost`, `PaymentTerms`, `Notes`, `CreatedBy`, `LastUpdated`.
- **Use:** Drives the manufacturer dashboard’s confirm/ship flows and controls updates to `ManufacturerInventory`.

#### DistributorOrderItems
- **Nature:** Child rows for distributor orders.
- **Key columns:** `OrderItemID`, `OrderID` (FK → `DistributorOrders`), `ProductID`, `Quantity`, `UnitPrice`, `LineTotal` (generated), `DeliveredQuantity`, `BackorderedQuantity`, `ItemStatus`.
- **Use:** Provides per-product detail when confirming or shipping distributor orders.

#### RetailerOrders
- **Nature:** Retailer ↔ Distributor purchase orders.
- **Key columns:** `OrderID`, `RetailerID`, `DistributorID`, `OrderDate`, `ExpectedDeliveryDate`, `Status`, `TotalAmount`, `ShippingCost`, `PaymentTerms`, `PaymentStatus`, `InvoiceNumber`, `Notes`, `CreatedBy`, `LastUpdated`.
- **Use:** Mirrors distributor sales pipeline; statuses change via distributor dashboard actions.

#### RetailerOrderItems
- **Nature:** Child rows for retailer purchase orders.
- **Key columns:** `OrderItemID`, `OrderID`, `ProductID`, `Quantity`, `UnitPrice`, `LineTotal`, `DeliveredQuantity`, `BackorderedQuantity`, `ItemStatus`, `DiscountPercent`, `DiscountAmount`.
- **Use:** Feeds distributor “Sales to Retailers” view and updates stock when shipped/received.

#### RetailerSupplierRelationships
- **Nature:** Junction table describing preferred supplier terms.
- **Key columns:** `RelationshipID`, `RetailerID`, `DistributorID`, `ProductID`, `PreferredSupplier`, `PaymentTerms`, `VolumeDiscountPercent`, `MinOrderAmount`, `CreditLimit`, `RelationshipStartDate`, `Status`, `Notes`.
- **Use:** Enables analytics around preferred supplier networks and supports future automation (not heavily exercised yet).

#### Orders
- **Nature:** Customer ↔ Retailer order headers.
- **Key columns:** `OrderID`, `CustomerID`, `RetailerID`, `DistributorID` (optional), `OrderDate`, `ShippingAddress`, `Status`, `TotalAmount`, `EstimatedDelivery`.
- **Use:** Powers customer dashboard order history and retailer customer-orders view.

#### OrderItems
- **Nature:** Customer order line items.
- **Key columns:** `OrderItemID`, `OrderID`, `RetailerProductID`, `Quantity`, `UnitPriceAtPurchase`.
- **Use:** Input for `CalculateOrderTotal` function and for the customer “View Items” modals.

---

---

## 2. Relationships & Integrity

- Every role-specific table (`Customers`, `Manufacturers`, `Retailers`, `Distributors`) has a `UserID` foreign key to `Users` with `ON DELETE CASCADE` to enforce lifecycle alignment.
- **Product → Inventory**: `Products` ↔ `ManufacturerInventory` and `DistributorInventory` (`ManufacturerID` + `ProductID` pairs). Enforced via FK + unique composite indexes to prevent duplicate inventory rows per owner/product.
- **Supply chain chain-of-custody**:
  - Manufacturer sells SKUs to distributors via `DistributorOrders`/`DistributorOrderItems`; when marked `Shipped`/`Received`, `ManufacturerInventory` and `DistributorInventory` are updated.
  - Distributors sell via `DistributorSales` (and `RetailerOrders`/`RetailerOrderItems`), populating `RetailerProducts` and adjusting stock.
  - Retailers sell to customers, storing header/line items in `Orders`/`OrderItems`.
- **Audit trail**: `InventoryAudit` records every stock delta on `RetailerProducts` via the `AuditInventoryChanges` trigger.

---

## 3. Views, Functions, Procedures & Triggers

Every object below is defined verbatim in `sql/ddl_complete.sql`. The code listings include the exact SQL so you can reproduce or modify them confidently.

### 3.1 Views (Full SQL)

```sql
CREATE VIEW SupplyChainPricing AS
SELECT 
    p.ProductID,
    p.ProductName,
    p.Category,
    m.CompanyName as ManufacturerName,
    p.ManufacturerPrice,
    AVG(di.PurchasePriceFromManufacturer) as AvgDistributorCost,
    AVG(di.SellPriceToRetailer) as AvgDistributorPrice,
    AVG(CASE 
        WHEN di.PurchasePriceFromManufacturer > 0 
        THEN ((di.SellPriceToRetailer - di.PurchasePriceFromManufacturer) / di.PurchasePriceFromManufacturer) * 100
        ELSE NULL
    END) as AvgDistributorMargin,
    AVG(rp.PurchasePriceFromDistributor) as AvgRetailerCost,
    AVG(rp.Price) as AvgRetailPrice,
    AVG(rp.ProfitMargin) as AvgRetailerMargin,
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
```

```sql
CREATE VIEW InventoryStatus AS
SELECT 
    p.ProductID,
    p.ProductName,
    p.Category,
    m.CompanyName as ManufacturerName,
    mi.QuantityAvailable as ManufacturerStock,
    mi.QuantityReserved as ManufacturerReserved,
    COALESCE(SUM(di.QuantityAvailable), 0) as TotalDistributorStock,
    COALESCE(SUM(di.QuantityReserved), 0) as TotalDistributorReserved,
    COUNT(DISTINCT di.DistributorID) as DistributorCount,
    COALESCE(SUM(rp.Stock), 0) as TotalRetailerStock,
    COUNT(DISTINCT rp.RetailerID) as RetailerCount,
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
```

```sql
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
```

### 3.2 Functions

```sql
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
```

**Description:** Re-computes the order total whenever called. Used by triggers to ensure `Orders.TotalAmount` always equals the sum of line items. Since it reads from `OrderItems` only, it is deterministic and safe for repeated invocation.

```sql
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
```

**Description:** Returns the total retail valuation for a given retailer’s inventory (stock * price). The retailer dashboard’s analytics cards call an endpoint that wraps this function.

### 3.3 Procedures

```sql
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
```

**Description:** Accepts a retailer ID, scans their `RetailerProducts`, and populates a temporary `LowStockReport` table for downstream consumption (e.g., alerting or exports). Cursor/loop pattern ensures every qualifying product is captured along with the computed restock quantity.

```sql
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
```

**Description:** Full transactional pipeline for creating a customer order with stock validation. Inputs include customer/retailer/product IDs and order quantity; outputs are `order_id` (newly created) and a result message. It prevents overselling by verifying stock before inserting `Orders` and `OrderItems`, then atomically decrementing `RetailerProducts.Stock`.

### 3.4 Triggers

```sql
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
```

**Description:** The trio of `UpdateOrderTotal...` triggers fire after inserts, updates, or deletes on `OrderItems`, ensuring order totals never drift from their line items. They simply delegate the recalculation to `CalculateOrderTotal`.

```sql
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
```

**Description:** `AuditInventoryChanges` records every stock delta on `RetailerProducts`. It categorizes the change reason (`ORDER` when stock decreases, `RESTOCK` when stock increases, `ADJUSTMENT` otherwise) and inserts a row into `InventoryAudit`. This supports retailer-facing audit UIs and compliance reporting.

---

## 4. UI & API Query Map

Below are the key REST endpoints the front-end dashboards call, with the underlying SQL patterns (from `src/controllers/scmController.js` unless noted).

### Authentication & User Setup
- `POST /api/auth/register` → inserts into `Users`, then role-specific table (`Customers`, `Retailers`, `Manufacturers`, or `Distributors`). Uses straightforward `INSERT ... VALUES`.
- `POST /api/auth/login` → `SELECT * FROM Users WHERE Email = ? AND IsActive = TRUE`, followed by role-specific `SELECT ... FROM Customers/Retailers/... WHERE UserID = ?` to hydrate profile info.

### Manufacturer Dashboard
- `GET /api/products/master` → `SELECT ... FROM Products p JOIN Manufacturers m ON ... LEFT JOIN ManufacturerSales` for catalog listing/analytics.
- `GET /api/products/master/manufacturer/:id` → `SELECT ProductID, ProductName, ... FROM Products WHERE ManufacturerID = ?`.
- `POST /api/products/master` → `INSERT INTO Products (...) VALUES (...)` + seed `ManufacturerInventory`.
- `GET /api/manufacturer/:id/inventory` → `SELECT QuantityAvailable, Reserved, ProductionCost FROM ManufacturerInventory JOIN Products`.
- `PATCH /manufacturer/:id/inventory/:productId` → `UPDATE ManufacturerInventory SET QuantityAvailable = ?, QuantityProduced = ?, ...`.
- `GET /manufacturer/:id/orders[?status]` → `SELECT ... FROM DistributorOrders JOIN Distributors JOIN DistributorOrderItems ... WHERE ManufacturerID = ?`.
- `PATCH /manufacturer/:id/orders/:orderId/confirm|ship` → `UPDATE DistributorOrders SET Status = ...` plus downstream adjustments to `ManufacturerInventory` and `DistributorInventory`.
- `GET /manufacturer/:id/orders/:orderId/items` style queries inside `loadManufacturerOrders` – `SELECT ... FROM DistributorOrderItems WHERE OrderID = ?`.

### Distributor Dashboard
- `GET /distributor/catalog` → `SELECT Products.* + Manufacturers metadata` (via `getManufacturerCatalog`).
- `POST /distributor/:id/orders` → Validates manufacturer stock then inserts into `DistributorOrders` and `DistributorOrderItems`, updates `ManufacturerInventory`.
- `GET /distributor/:id/orders[?status]` → `SELECT DO.*, SUM(...) AS totals FROM DistributorOrders JOIN Manufacturer table` (see `getDistributorOrders` in controller).
- `PATCH /distributor/:id/orders/:orderId/receive` → `UPDATE DistributorOrders SET Status='Received'`, updates `DistributorInventory`.
- `GET /distributor/:id/inventory` → `SELECT * FROM DistributorInventory JOIN Products`.
- `PATCH /distributor/:id/inventory/:productId/pricing` → `UPDATE DistributorInventory SET SellPriceToRetailer=?`.
- `GET /distributor/:id/sales` and `/sales/:orderId/confirm|ship` → operate on `RetailerOrders`/`RetailerOrderItems`, mirroring what the retailer dashboard sees but from the supplier perspective.
- `GET /distributor/:id/analytics` → multiple `SELECT` statements aggregating purchases, sales, inventory status (see `getDistributorAnalytics`).

### Retailer Dashboard
- `GET /retailer/distributor-catalog` → `SELECT di.InventoryID, di.SellPriceToRetailer, p.ProductName, d.CompanyName ... FROM DistributorInventory di JOIN Products p JOIN Distributors d WHERE QuantityAvailable > 0`.
- `POST /retailer/:id/orders` → Creates `RetailerOrders` + `RetailerOrderItems`, decrements `DistributorInventory`.
- `GET /retailer/:id/orders` / `PATCH /orders/:orderId/receive` → `SELECT ... FROM RetailerOrders JOIN Distributors` and `UPDATE RetailerOrders SET Status='Received'` with subsequent stock adjustments.
- `GET /retailer/:id/inventory` / `/inventory-costs` → `SELECT rp.*, p.ProductName, m.CompanyName, cost calculations (AVG from RetailerOrders)`; results feed the “Inventory & Pricing” table.
- `PATCH /retailer/inventory` → `INSERT ... ON DUPLICATE KEY UPDATE` into `RetailerProducts` to set price/stock.
- `PATCH /retailer/:id/products/:productId/price` → `UPDATE RetailerProducts SET Price = ?` plus warning if below cost.
- `GET /retailer/:id/customer-orders` / `PATCH .../confirm|ship` → `SELECT Orders` (customer-facing) joined with `OrderItems` & customer contact data; updates `Orders.Status`.
- `POST /orders/validated` → controller calls `CALL ProcessOrderWithValidation` stored procedure to wrap creation + stock deduction.

### Customer Dashboard
- `GET /products` → `SELECT rp.RetailerProductID, p.ProductName, rp.Price, rp.Stock, r.BusinessName` (for the catalog cards).
- `POST /orders` → `INSERT INTO Orders` & `OrderItems` for checkout (`createOrder` in controller).
- `GET /orders/customer/:id` → `SELECT o.*, r.BusinessName, SUM(oi.Quantity) ... FROM Orders o JOIN OrderItems oi`.
- `PATCH /customer/:id/orders/:orderId/receive` → `UPDATE Orders SET Status='Delivered'`.

### Shared / Admin
- `GET /manufacturers`, `/retailers`, `/distributors` → simple directory `SELECT ... ORDER BY Name`.
- `GET /retailer/:id/stock-value`, `/low-stock`, `/profit-analysis` → `SELECT` that wrap the `GetRetailerStockValue` function and `CheckLowStockProducts` procedure.
- `GET /orders/validated` (if enabled) – uses stored procedure for atomic order creation.

Each of these queries is visible in `src/controllers/scmController.js` (grouped by section headers: “Master Products”, “Retailer Inventory & Catalog”, “Orders & Fulfillment”, “Stage 2/3/4”).

---

## 5. How the Pieces Fit Together

1. **User Onboarding** creates `Users` + role rows. The UI uses `authController` which in turn writes to the proper entity table, so the database enforces referential integrity.
2. **Manufacturers** define SKUs (`Products`) and manage factory stock (`ManufacturerInventory`). Confirming distributor orders immediately reserves/reduces inventory via the REST handlers backed by `connection.execute` updates.
3. **Distributors** pull the available manufacturer catalog, create `DistributorOrders`, and once received, populate `DistributorInventory`. Retailers buy from this inventory; the distributor dashboard updates `RetailerOrders` and `DistributorInventory`.
4. **Retailers** curate their local `RetailerProducts` (pricing & stock), place `RetailerOrders`, and service customer orders. Retailer analytics use the provided SQL functions and views.
5. **Customers** browse the aggregated retailer catalog (via `/api/products`), place `Orders`, and track their order history through the new customer dashboard endpoints.
6. **Auditing & Analytics** rely on stored views/functions to report on margins, stock health, purchase histories, and to feed the UI stats cards (manufacturer/distributor/retailer dashboards call consolidated stats queries).

Use this reference as the authoritative guide when evolving the schema, debugging API queries, or building BI/reporting on top of the existing data model. If you need the full SQL definition for any object, see `sql/ddl_complete.sql` and `sql/dml_complete.sql` in the repo root.

---

## 6. UI SQL Query Catalog

The SPA calls into `src/controllers/authController.js` and `src/controllers/scmController.js`. Each endpoint issues specific SQL statements; the most important ones are enumerated below so you can see exactly what reaches MySQL from the UI.

### 6.1 Directory & Authentication

- `GET /api/manufacturers`

```sql
SELECT u.UserID, m.CompanyName AS FullName, u.Email, m.Address
FROM Users u
JOIN Manufacturers m ON u.UserID = m.UserID
WHERE u.Role = 'Manufacturer'
ORDER BY m.CompanyName ASC;
```

- `GET /api/retailers`

```sql
SELECT u.UserID, r.BusinessName AS FullName, u.Email, r.Address
FROM Users u
JOIN Retailers r ON u.UserID = r.UserID
WHERE u.Role = 'Retailer'
ORDER BY r.BusinessName ASC;
```

- `GET /api/distributors`

```sql
SELECT d.DistributorID, u.UserID, d.CompanyName AS FullName, u.Email, d.Address
FROM Users u
JOIN Distributors d ON u.UserID = d.UserID
WHERE u.Role = 'Distributor'
ORDER BY d.CompanyName ASC;
```

- `POST /api/auth/register`

```sql
INSERT INTO Users (Email, Password, Role) VALUES (?, ?, ?);
-- followed by one of:
INSERT INTO Customers (UserID, FullName, Address, Phone) VALUES (?, ?, ?, ?);
INSERT INTO Manufacturers (UserID, CompanyName, Address, Phone) VALUES (?, ?, ?, ?);
INSERT INTO Retailers (UserID, BusinessName, Address, Phone) VALUES (?, ?, ?, ?);
INSERT INTO Distributors (UserID, CompanyName, Address, Phone) VALUES (?, ?, ?, ?);
```

- `POST /api/auth/login`

```sql
SELECT * FROM Users WHERE Email = ? AND IsActive = TRUE;
```

### 6.2 Customer Dashboard

- `GET /api/products` (catalog cards)

```sql
SELECT rp.RetailerProductID,
       rp.Price,
       rp.Stock,
       r.BusinessName AS RetailerName,
       rp.RetailerID,
       p.ProductID,
       p.ProductName,
       p.Description,
       p.ManufacturerID,
       m.CompanyName AS ManufacturerName
FROM RetailerProducts rp
JOIN Retailers r ON r.RetailerID = rp.RetailerID
JOIN Products p ON p.ProductID = rp.ProductID
JOIN Manufacturers m ON m.ManufacturerID = p.ManufacturerID
ORDER BY p.ProductName ASC;
```

- `GET /api/orders/customer/:id`

```sql
SELECT o.OrderID,
       o.OrderDate,
       o.ShippingAddress,
       o.Status,
       o.RetailerID,
       ret.BusinessName AS RetailerName,
       o.DistributorID,
       d.CompanyName AS DistributorName,
       oi.OrderItemID,
       oi.Quantity,
       oi.UnitPriceAtPurchase,
       rp.RetailerProductID,
       p.ProductName
FROM Orders o
JOIN Retailers ret ON ret.RetailerID = o.RetailerID
LEFT JOIN Distributors d ON d.DistributorID = o.DistributorID
JOIN OrderItems oi ON oi.OrderID = o.OrderID
JOIN RetailerProducts rp ON rp.RetailerProductID = oi.RetailerProductID
JOIN Products p ON p.ProductID = rp.ProductID
WHERE o.CustomerID = ?
ORDER BY o.OrderDate DESC, oi.OrderItemID ASC;
```

- `POST /api/orders` (customer checkout)

```sql
INSERT INTO Orders (CustomerID, RetailerID, ShippingAddress)
VALUES (?, ?, ?);

SELECT RetailerProductID, Stock, Price
FROM RetailerProducts
WHERE RetailerProductID = ?
FOR UPDATE;

UPDATE RetailerProducts
SET Stock = Stock - ?
WHERE RetailerProductID = ?;

INSERT INTO OrderItems (OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase)
VALUES (?, ?, ?, ?);
```

- `PATCH /api/customer/:id/orders/:orderId/receive`

```sql
SELECT CustomerID FROM Customers WHERE UserID = ?;

SELECT OrderID, Status
FROM Orders
WHERE OrderID = ? AND CustomerID = ? AND Status = 'Shipped';

UPDATE Orders SET Status = 'Delivered' WHERE OrderID = ?;
```

### 6.3 Retailer Dashboard

- `GET /api/retailer/distributor-catalog`

```sql
SELECT di.InventoryID,
       di.ProductID,
       p.ProductName,
       p.Description,
       m.CompanyName AS ManufacturerName,
       di.DistributorID,
       d.CompanyName AS DistributorName,
       d.Phone AS DistributorPhone,
       di.SellPriceToRetailer,
       di.QuantityAvailable,
       di.QuantityReserved,
       (di.QuantityAvailable - di.QuantityReserved) AS AvailableForOrder,
       di.LastSaleDate
FROM DistributorInventory di
JOIN Products p ON di.ProductID = p.ProductID
JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
JOIN Distributors d ON di.DistributorID = d.DistributorID
WHERE di.SellPriceToRetailer IS NOT NULL
  AND (di.QuantityAvailable - di.QuantityReserved) > 0
ORDER BY p.ProductName, di.SellPriceToRetailer ASC;
```

- `GET /api/retailer/:id/inventory`

```sql
SELECT rp.RetailerProductID,
       rp.Price,
       rp.Stock,
       rp.RetailerID,
       p.ProductID,
       p.ProductName,
       p.Description,
       p.ManufacturerID
FROM RetailerProducts rp
JOIN Products p ON p.ProductID = rp.ProductID
WHERE rp.RetailerID = ?
ORDER BY p.ProductName ASC;
```

- `PATCH /api/retailer/inventory` (upsert from “Inventory & Pricing” tab)

```sql
SELECT RetailerProductID
FROM RetailerProducts
WHERE RetailerID = ? AND ProductID = ?;

UPDATE RetailerProducts SET Price = ?, Stock = ? WHERE RetailerProductID = ?;
-- or, if new:
INSERT INTO RetailerProducts (RetailerID, ProductID, Price, Stock)
VALUES (?, ?, ?, ?);
```

- `POST /api/retailer/:id/orders` (retailer purchase order to distributor – key statements)

```sql
SELECT RetailerID FROM Retailers WHERE UserID = ?;

SELECT di.InventoryID,
       di.ProductID,
       di.SellPriceToRetailer,
       di.QuantityAvailable,
       di.QuantityReserved
FROM DistributorInventory di
WHERE di.ProductID = ? AND di.DistributorID = ? AND di.SellPriceToRetailer IS NOT NULL;

INSERT INTO RetailerOrders (
  RetailerID, DistributorID, OrderDate, Status, TotalAmount, PaymentTerms, Notes
) VALUES (?, ?, NOW(), 'Pending', ?, ?, ?);

INSERT INTO RetailerOrderItems (OrderID, ProductID, Quantity, UnitPrice)
VALUES (?, ?, ?, ?);

UPDATE DistributorInventory
SET QuantityReserved = QuantityReserved + ?
WHERE DistributorID = ? AND ProductID = ?;
```

- `GET /api/retailer/:id/orders`

```sql
SELECT ro.OrderID,
       ro.OrderDate,
       ro.Status,
       ro.TotalAmount,
       ro.PaymentTerms,
       ro.PaymentStatus,
       ro.Notes,
       ro.ExpectedDeliveryDate,
       d.DistributorID,
       d.CompanyName AS DistributorName,
       d.Phone AS DistributorPhone,
       COUNT(roi.OrderItemID) AS ItemCount,
       SUM(roi.Quantity) AS TotalUnits
FROM RetailerOrders ro
JOIN Distributors d ON ro.DistributorID = d.DistributorID
LEFT JOIN RetailerOrderItems roi ON ro.OrderID = roi.OrderID
WHERE ro.RetailerID = ?
[AND ro.Status = ?]
GROUP BY ro.OrderID, d.DistributorID
ORDER BY ro.OrderDate DESC;
```

- `GET /api/retailer/:id/customer-orders`

```sql
SELECT o.OrderID,
       o.OrderDate,
       o.Status,
       o.TotalAmount,
       o.ShippingAddress,
       c.CustomerID,
       cust.FullName AS CustomerName,
       cust.Email AS CustomerEmail,
       COUNT(oi.OrderItemID) AS ItemCount,
       SUM(oi.Quantity) AS TotalUnits
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID
JOIN Users cust ON cust.UserID = c.UserID
LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
WHERE o.RetailerID = ?
[AND o.Status = ?]
GROUP BY o.OrderID, c.CustomerID
ORDER BY o.OrderDate DESC;
```

- `PATCH /api/retailer/:id/customer-orders/:orderId/confirm|ship`

```sql
UPDATE Orders SET Status = 'Confirmed' WHERE OrderID = ? AND RetailerID = ? AND Status = 'Pending';
UPDATE Orders SET Status = 'Shipped'   WHERE OrderID = ? AND RetailerID = ? AND Status = 'Confirmed';
```

### 6.4 Distributor Dashboard

- `GET /api/distributor/catalog` (manufacturer catalog)

```sql
SELECT p.ProductID,
       p.ProductName,
       p.Description,
       p.ManufacturerPrice,
       p.MinOrderQuantity,
       p.ProductionCapacity,
       p.LeadTimeDays,
       p.Status,
       m.ManufacturerID,
       m.CompanyName AS ManufacturerName
FROM Products p
JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
WHERE p.Status = 'Active'
ORDER BY p.ProductName ASC;
```

- `POST /api/distributor/:id/orders` (manufacturer purchase order)

```sql
SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?;
SELECT DistributorID  FROM Distributors  WHERE UserID = ?;

SELECT di.ProductID, di.QuantityAvailable, di.QuantityReserved
FROM ManufacturerInventory di
WHERE di.ProductID = ? AND di.ManufacturerID = ?;

INSERT INTO DistributorOrders (
  DistributorID, ManufacturerID, OrderDate, Status, TotalAmount, PaymentTerms, Notes
) VALUES (?, ?, NOW(), 'Pending', ?, ?, ?);

INSERT INTO DistributorOrderItems (OrderID, ProductID, Quantity, UnitPrice)
VALUES (?, ?, ?, ?);
```

- `GET /api/distributor/:id/orders`

```sql
SELECT do.OrderID,
       do.ManufacturerID,
       m.CompanyName AS ManufacturerName,
       do.OrderDate,
       do.Status,
       do.TotalAmount,
       do.PaymentTerms,
       COUNT(doi.OrderItemID) AS ItemCount,
       SUM(doi.Quantity) AS TotalUnits
FROM DistributorOrders do
JOIN Manufacturers m ON do.ManufacturerID = m.ManufacturerID
LEFT JOIN DistributorOrderItems doi ON do.OrderID = doi.OrderID
WHERE do.DistributorID = ?
[AND do.Status = ?]
GROUP BY do.OrderID, do.ManufacturerID
ORDER BY do.OrderDate DESC;
```

- `GET /api/distributor/:id/sales` (orders from retailers to this distributor)

```sql
SELECT ro.OrderID,
       ro.RetailerID,
       r.BusinessName AS RetailerName,
       ro.OrderDate,
       ro.Status,
       ro.TotalAmount,
       ro.PaymentTerms,
       COUNT(roi.OrderItemID) AS ItemCount,
       SUM(roi.Quantity) AS TotalUnits
FROM RetailerOrders ro
JOIN Retailers r ON ro.RetailerID = r.RetailerID
LEFT JOIN RetailerOrderItems roi ON ro.OrderID = roi.OrderID
WHERE ro.DistributorID = ?
[AND ro.Status = ?]
GROUP BY ro.OrderID, ro.RetailerID
ORDER BY ro.OrderDate DESC;
```

- `GET /api/distributor/:id/inventory`

```sql
SELECT di.InventoryID,
       di.ProductID,
       p.ProductName,
       p.Description,
       m.CompanyName AS ManufacturerName,
       di.QuantityAvailable,
       di.QuantityReserved,
       di.PurchasePriceFromManufacturer,
       di.SellPriceToRetailer,
       di.LastPurchaseDate,
       di.LastSaleDate,
       di.MinStockLevel,
       di.MaxStockLevel,
       (di.QuantityAvailable - di.QuantityReserved) AS AvailableForSale,
       CASE
         WHEN di.SellPriceToRetailer IS NOT NULL AND di.PurchasePriceFromManufacturer IS NOT NULL
         THEN ((di.SellPriceToRetailer - di.PurchasePriceFromManufacturer) / di.PurchasePriceFromManufacturer * 100)
       END AS ProfitMargin
FROM DistributorInventory di
JOIN Products p ON di.ProductID = p.ProductID
JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
WHERE di.DistributorID = ?
ORDER BY p.ProductName ASC;
```

- Distributor order status transitions (Confirm/Ship/Receive) execute `UPDATE DistributorOrders SET Status = ? WHERE OrderID = ?` plus the associated inventory adjustments shown earlier.

### 6.5 Manufacturer Dashboard

- `GET /api/products/master`

```sql
SELECT p.ProductID,
       p.ProductName,
       p.Description,
       p.ManufacturerID,
       m.CompanyName AS ManufacturerName,
       AVG(ms.WholesalePrice) AS AvgManufacturerPrice,
       MIN(ms.WholesalePrice) AS MinManufacturerPrice,
       MAX(ms.WholesalePrice) AS MaxManufacturerPrice,
       COUNT(ms.SaleID) AS PriceDataPoints,
       CASE WHEN COUNT(ms.SaleID) > 0 THEN 'Available' ELSE 'Contact Manufacturer' END AS PriceAvailability
FROM Products p
JOIN Manufacturers m ON m.ManufacturerID = p.ManufacturerID
LEFT JOIN ManufacturerSales ms ON p.ProductID = ms.ProductID
GROUP BY p.ProductID, p.ProductName, p.Description, p.ManufacturerID, m.CompanyName
ORDER BY p.ProductName ASC;
```

- `GET /api/products/master/manufacturer/:id`

```sql
SELECT ProductID,
       ProductName,
       Description,
       ManufacturerID,
       ManufacturerPrice,
       MinOrderQuantity,
       ProductionCapacity,
       LeadTimeDays,
       Status
FROM Products
WHERE ManufacturerID = ?
ORDER BY ProductName ASC;
```

- `GET /api/manufacturer/:id/inventory`

```sql
SELECT mi.InventoryID,
       mi.ProductID,
       p.ProductName,
       p.Description,
       p.ManufacturerPrice,
       p.MinOrderQuantity,
       p.ProductionCapacity,
       p.LeadTimeDays,
       p.Status AS ProductStatus,
       mi.QuantityAvailable,
       mi.QuantityReserved,
       mi.QuantityProduced,
       mi.ProductionCost,
       mi.LastRestocked,
       (mi.QuantityAvailable - mi.QuantityReserved) AS AvailableForSale
FROM ManufacturerInventory mi
JOIN Products p ON mi.ProductID = p.ProductID
WHERE mi.ManufacturerID = ?
ORDER BY p.ProductName ASC;
```

- `GET /api/manufacturer/:id/orders`

```sql
SELECT do.OrderID,
       do.DistributorID,
       d.CompanyName AS DistributorName,
       do.OrderDate,
       do.Status,
       do.TotalAmount,
       do.PaymentTerms,
       COUNT(doi.OrderItemID) AS ItemCount,
       SUM(doi.Quantity) AS TotalQuantity
FROM DistributorOrders do
JOIN Distributors d ON do.DistributorID = d.DistributorID
LEFT JOIN DistributorOrderItems doi ON do.OrderID = doi.OrderID
WHERE do.ManufacturerID = ?
[AND do.Status = ?]
GROUP BY do.OrderID, do.DistributorID, d.CompanyName, do.OrderDate, do.Status, do.TotalAmount, do.PaymentTerms
ORDER BY do.OrderDate DESC;
```

- Order item expansion inside the same endpoint:

```sql
SELECT doi.OrderItemID,
       doi.ProductID,
       p.ProductName,
       doi.Quantity,
       doi.UnitPrice,
       doi.DeliveredQuantity,
       doi.ItemStatus,
       (doi.Quantity * doi.UnitPrice) AS LineTotal
FROM DistributorOrderItems doi
JOIN Products p ON doi.ProductID = p.ProductID
WHERE doi.OrderID = ?
ORDER BY doi.OrderItemID ASC;
```

- `PATCH /api/manufacturer/:id/orders/:orderId/confirm`

```sql
SELECT OrderID, Status
FROM DistributorOrders
WHERE OrderID = ? AND ManufacturerID = ? AND Status = 'Pending';

SELECT ProductID, Quantity
FROM DistributorOrderItems
WHERE OrderID = ?;

SELECT QuantityAvailable
FROM ManufacturerInventory
WHERE ManufacturerID = ? AND ProductID = ?;

UPDATE ManufacturerInventory
SET QuantityReserved = QuantityReserved + ?,
    QuantityAvailable = QuantityAvailable - ?
WHERE ManufacturerID = ? AND ProductID = ?;

UPDATE DistributorOrders      SET Status = 'Confirmed' WHERE OrderID = ?;
UPDATE DistributorOrderItems  SET ItemStatus = 'Confirmed' WHERE OrderID = ?;
```

- `PATCH /api/manufacturer/:id/orders/:orderId/ship`

```sql
SELECT OrderID, Status
FROM DistributorOrders
WHERE OrderID = ? AND ManufacturerID = ? AND Status = 'Confirmed';

SELECT ProductID, Quantity
FROM DistributorOrderItems
WHERE OrderID = ?;

UPDATE ManufacturerInventory
SET QuantityReserved = QuantityReserved - ?
WHERE ManufacturerID = ? AND ProductID = ?;

UPDATE DistributorOrders     SET Status = 'Shipped' WHERE OrderID = ?;
UPDATE DistributorOrderItems SET ItemStatus = 'Shipped' WHERE OrderID = ?;
```

These statements cover the interactive queries issued by the retailer, distributor, manufacturer, and customer dashboards, as well as the shared directory/auth flows. For any specialized analytics or helper endpoints not listed above, refer to their definitions in `src/controllers/scmController.js`, which follow the same pattern of explicit SQL passed to `pool.execute`.

