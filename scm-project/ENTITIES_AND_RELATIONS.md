# SCM Database - Entities and Relations

## ENTITIES

### Users
- UserID (PK, INT, AUTO_INCREMENT)
- Email (VARCHAR(255), UNIQUE, NOT NULL)
- Password (VARCHAR(255), NOT NULL)
- FullName (VARCHAR(100))
- CreatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- IsActive (BOOLEAN, DEFAULT TRUE)

### Customers
- CustomerID (PK, INT, AUTO_INCREMENT)
- UserID (FK, INT, UNIQUE, NOT NULL)
- ShippingAddress (TEXT)
- BillingAddress (TEXT)
- Phone (VARCHAR(20))
- DateOfBirth (DATE)

### Manufacturers
- ManufacturerID (PK, INT, AUTO_INCREMENT)
- UserID (FK, INT, UNIQUE, NOT NULL)
- CompanyName (VARCHAR(255), NOT NULL)
- BusinessLicense (VARCHAR(100))
- ManufacturingAddress (TEXT)
- ContactPhone (VARCHAR(20))
- Website (VARCHAR(255))

### Retailers
- RetailerID (PK, INT, AUTO_INCREMENT)
- UserID (FK, INT, UNIQUE, NOT NULL)
- StoreName (VARCHAR(255), NOT NULL)
- BusinessLicense (VARCHAR(100))
- StoreAddress (TEXT)
- ContactPhone (VARCHAR(20))
- TaxID (VARCHAR(50))

### Distributors
- DistributorID (PK, INT, AUTO_INCREMENT)
- UserID (FK, INT, UNIQUE, NOT NULL)
- CompanyName (VARCHAR(255), NOT NULL)
- ServiceArea (TEXT)
- WarehouseAddress (TEXT)
- ContactPhone (VARCHAR(20))
- DeliveryCapacity (INT)

### Products
- ProductID (PK, INT, AUTO_INCREMENT)
- ProductName (VARCHAR(255), NOT NULL)
- Description (TEXT)
- Category (VARCHAR(100))
- ManufacturerID (FK, INT, NOT NULL)
- CreatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- IsActive (BOOLEAN, DEFAULT TRUE)

### RetailerProducts
- RetailerProductID (PK, INT, AUTO_INCREMENT)
- RetailerID (FK, INT, NOT NULL)
- ProductID (FK, INT, NOT NULL)
- Price (DECIMAL(10,2), NOT NULL)
- Stock (INT, DEFAULT 0)
- MinStockAlert (INT, DEFAULT 5)
- LastRestocked (DATETIME)

### Orders
- OrderID (PK, INT, AUTO_INCREMENT)
- CustomerID (FK, INT, NOT NULL)
- RetailerID (FK, INT, NOT NULL)
- DistributorID (FK, INT, NULLABLE)
- OrderDate (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- ShippingAddress (TEXT, NOT NULL)
- TotalAmount (DECIMAL(12,2))
- Status (ENUM: 'Pending', 'Confirmed', 'Assigned', 'Shipped', 'Delivered', 'Cancelled')
- EstimatedDelivery (DATE)

### OrderItems
- OrderItemID (PK, INT, AUTO_INCREMENT)
- OrderID (FK, INT, NOT NULL)
- RetailerProductID (FK, INT, NOT NULL)
- Quantity (INT, NOT NULL)
- UnitPriceAtPurchase (DECIMAL(10,2), NOT NULL)

---

## RELATIONS TABLE

| Relation Name | Parent Entity | Parent Key | Child Entity | Child Key | Relationship Type | Cardinality | Delete Rule |
|---------------|---------------|------------|--------------|-----------|------------------|-------------|-------------|
| fk_customers_user | Users | UserID | Customers | UserID | One-to-One | 1:1 | CASCADE |
| fk_manufacturers_user | Users | UserID | Manufacturers | UserID | One-to-One | 1:1 | CASCADE |
| fk_retailers_user | Users | UserID | Retailers | UserID | One-to-One | 1:1 | CASCADE |
| fk_distributors_user | Users | UserID | Distributors | UserID | One-to-One | 1:1 | CASCADE |
| fk_products_manufacturer | Manufacturers | ManufacturerID | Products | ManufacturerID | One-to-Many | 1:M | RESTRICT |
| fk_rp_retailer | Retailers | RetailerID | RetailerProducts | RetailerID | One-to-Many | 1:M | RESTRICT |
| fk_rp_product | Products | ProductID | RetailerProducts | ProductID | One-to-Many | 1:M | RESTRICT |
| fk_orders_customer | Customers | CustomerID | Orders | CustomerID | One-to-Many | 1:M | RESTRICT |
| fk_orders_retailer | Retailers | RetailerID | Orders | RetailerID | One-to-Many | 1:M | RESTRICT |
| fk_orders_distributor | Distributors | DistributorID | Orders | DistributorID | One-to-Many | 1:M | RESTRICT |
| fk_orderitems_order | Orders | OrderID | OrderItems | OrderID | One-to-Many | 1:M | CASCADE |
| fk_orderitems_rp | RetailerProducts | RetailerProductID | OrderItems | RetailerProductID | One-to-Many | 1:M | RESTRICT |

---

## UNIQUE CONSTRAINTS

| Table | Constraint Name | Columns | Purpose |
|-------|----------------|---------|---------|
| Users | - | Email | Unique login credentials |
| Customers | - | UserID | One customer per user |
| Manufacturers | - | UserID | One manufacturer per user |
| Retailers | - | UserID | One retailer per user |
| Distributors | - | UserID | One distributor per user |
| RetailerProducts | uq_retailer_product | (RetailerID, ProductID) | One entry per retailer-product combo |

---

## BUSINESS FLOW SUMMARY

1. **User Registration**: Users register → Role-specific profile created
2. **Product Creation**: Manufacturers create Products
3. **Inventory Setup**: Retailers stock Products as RetailerProducts with own pricing
4. **Order Placement**: Customers place Orders with specific Retailers
5. **Order Processing**: Orders contain OrderItems referencing RetailerProducts
6. **Fulfillment**: Distributors (optionally) assigned to handle delivery
