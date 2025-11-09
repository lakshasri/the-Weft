# Supply Chain Management (SCM) Database Documentation

## Database Overview
**Database Name:** `scm_db_roles`  
**Type:** Relational Database (MySQL)  
**Purpose:** Multi-role supply chain management system supporting manufacturers, retailers, distributors, and customers.

---

## Summary Statistics
- **Total Tables:** 9
- **Entity Tables:** 6 (Users, Customers, Manufacturers, Retailers, Distributors, Products)
- **Relation Tables:** 3 (RetailerProducts, Orders, OrderItems)

---

## Entity Tables

### 1. Users Entity (Authentication Base)
**Table Name:** `Users`  
**Description:** Base authentication entity storing login credentials and role information for all system users.

#### Attributes:
| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| UserID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each user |
| Email | VARCHAR(255) | NOT NULL, UNIQUE | User's email address (login credential) |
| Password | VARCHAR(255) | NOT NULL | Hashed password for authentication |
| Role | ENUM | NOT NULL | User role: 'Customer', 'Manufacturer', 'Retailer', 'Distributor' |
| CreatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| IsActive | BOOLEAN | NOT NULL, DEFAULT TRUE | Account status flag |

#### Business Rules:
- Each user must have a unique email address
- All users must be assigned one of the four defined roles
- Password is stored in hashed format for security
- Users table serves as authentication base; detailed info stored in role-specific tables

---

### 2. Customers Entity
**Table Name:** `Customers`  
**Description:** Individual customers who purchase products through the platform.

#### Attributes:
| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| CustomerID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each customer |
| UserID | INT | NOT NULL, UNIQUE, FOREIGN KEY | Reference to Users table for authentication |
| FullName | VARCHAR(100) | NOT NULL | Customer's full name |
| Address | TEXT | NULL | Customer's shipping address |
| Phone | VARCHAR(20) | NULL | Contact phone number |
| DateOfBirth | DATE | NULL | Customer's date of birth |

#### Business Rules:
- One-to-one relationship with Users table
- Each customer must have authentication credentials in Users table
- Personal information stored separately from authentication data

---

### 3. Manufacturers Entity
**Table Name:** `Manufacturers`  
**Description:** Companies that produce and supply products to the supply chain.

#### Attributes:
| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| ManufacturerID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each manufacturer |
| UserID | INT | NOT NULL, UNIQUE, FOREIGN KEY | Reference to Users table for authentication |
| CompanyName | VARCHAR(100) | NOT NULL | Official company name |
| Address | TEXT | NULL | Company headquarters address |
| Phone | VARCHAR(20) | NULL | Business contact number |
| Website | VARCHAR(255) | NULL | Company website URL |
| LicenseNumber | VARCHAR(50) | NULL | Manufacturing license number |
| EstablishedYear | YEAR | NULL | Year company was established |

#### Business Rules:
- One-to-one relationship with Users table
- Must have valid manufacturing credentials
- Can create multiple products in the system

---

### 4. Retailers Entity
**Table Name:** `Retailers`  
**Description:** Businesses that stock and sell products to customers.

#### Attributes:
| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| RetailerID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each retailer |
| UserID | INT | NOT NULL, UNIQUE, FOREIGN KEY | Reference to Users table for authentication |
| BusinessName | VARCHAR(100) | NOT NULL | Retail business name |
| Address | TEXT | NULL | Business location address |
| Phone | VARCHAR(20) | NULL | Business contact number |
| Website | VARCHAR(255) | NULL | Business website URL |
| TaxID | VARCHAR(50) | NULL | Tax identification number |
| BusinessLicense | VARCHAR(50) | NULL | Business license number |

#### Business Rules:
- One-to-one relationship with Users table
- Must have valid business credentials
- Can stock multiple products with custom pricing

---

### 5. Distributors Entity
**Table Name:** `Distributors`  
**Description:** Logistics companies that handle order fulfillment and delivery.

#### Attributes:
| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| DistributorID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each distributor |
| UserID | INT | NOT NULL, UNIQUE, FOREIGN KEY | Reference to Users table for authentication |
| CompanyName | VARCHAR(100) | NOT NULL | Distribution company name |
| Address | TEXT | NULL | Distribution center address |
| Phone | VARCHAR(20) | NULL | Business contact number |
| ServiceAreas | TEXT | NULL | Geographic areas served |
| VehicleCapacity | INT | NULL | Maximum delivery capacity |
| OperatingHours | VARCHAR(50) | NULL | Business operating hours |

#### Business Rules:
- One-to-one relationship with Users table
- Must have logistics capabilities
- Can be assigned to handle multiple orders

---

### 6. Products Entity
**Table Name:** `Products`  
**Description:** Master catalog of products created by manufacturers.

#### Attributes:
| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| ProductID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each product |
| ProductName | VARCHAR(255) | NOT NULL | Name of the product |
| Description | TEXT | NULL | Detailed description of the product |
| ManufacturerID | INT | NOT NULL, FOREIGN KEY | Reference to manufacturer who created this product |
| Category | VARCHAR(100) | NULL | Product category classification |
| SKU | VARCHAR(50) | UNIQUE | Stock Keeping Unit identifier |
| CreatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Product creation timestamp |

#### Business Rules:
- Only manufacturers can create products
- Products serve as templates that retailers can stock with their own pricing
- Each product must be associated with exactly one manufacturer
- SKU must be unique across all products

---

## Relation Tables

### 1. RetailerProducts Relation
**Table Name:** `RetailerProducts`  
**Description:** Many-to-many relationship between retailers and products, representing retailer inventory with custom pricing.

#### Relationship: 
**Retailers** ↔ **Products** (M:N)

#### Attributes:
| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| RetailerProductID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for retailer-product combination |
| RetailerID | INT | NOT NULL, FOREIGN KEY | Reference to retailer entity |
| ProductID | INT | NOT NULL, FOREIGN KEY | Reference to master product |
| Price | DECIMAL(10,2) | NOT NULL | Retailer's selling price for this product |
| Stock | INT | NOT NULL, DEFAULT 0 | Current inventory level |
| MinStockLevel | INT | DEFAULT 10 | Minimum stock threshold for reordering |
| AddedDate | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date when product was added to inventory |

#### Constraints:
- **UNIQUE KEY:** `uq_retailer_product (RetailerID, ProductID)` - Ensures one entry per retailer-product pair
- **FOREIGN KEY:** `RetailerID` → `Retailers(RetailerID)`
- **FOREIGN KEY:** `ProductID` → `Products(ProductID)`

#### Business Rules:
- Each retailer can stock multiple products
- Each product can be stocked by multiple retailers
- Each retailer sets their own price and maintains their own stock levels
- A retailer cannot stock the same product twice (enforced by unique constraint)

---

### 2. Orders Relation
**Table Name:** `Orders`  
**Description:** Represents customer orders placed with specific retailers, optionally assigned to distributors for fulfillment.

#### Relationships:
- **Customers** → **Orders** (1:M)
- **Retailers** → **Orders** (1:M) 
- **Distributors** → **Orders** (1:M, Optional)

#### Attributes:
| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| OrderID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each order |
| CustomerID | INT | NOT NULL, FOREIGN KEY | Reference to customer who placed the order |
| RetailerID | INT | NOT NULL, FOREIGN KEY | Reference to retailer fulfilling the order |
| DistributorID | INT | NULL, FOREIGN KEY | Reference to distributor (optional, assigned later) |
| OrderDate | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp when order was placed |
| ShippingAddress | VARCHAR(255) | NOT NULL | Delivery address for the order |
| Status | ENUM | NOT NULL, DEFAULT 'Pending' | Order status: 'Pending', 'Assigned', 'Shipped', 'Delivered', 'Cancelled' |
| TotalAmount | DECIMAL(10,2) | NULL | Total order value |
| EstimatedDelivery | DATE | NULL | Estimated delivery date |

#### Foreign Key Constraints:
- **FOREIGN KEY:** `CustomerID` → `Customers(CustomerID)`
- **FOREIGN KEY:** `RetailerID` → `Retailers(RetailerID)`
- **FOREIGN KEY:** `DistributorID` → `Distributors(DistributorID)`

#### Business Rules:
- Customers place orders with specific retailers
- Orders start in 'Pending' status
- Retailers assign distributors to handle shipping
- Orders progress through defined status workflow
- DistributorID is optional until retailer assigns one

---

### 3. OrderItems Relation
**Table Name:** `OrderItems`  
**Description:** Line items within orders, linking orders to specific retailer products with quantities and pricing.

#### Relationships:
- **Orders** → **OrderItems** (1:M)
- **RetailerProducts** → **OrderItems** (1:M)

#### Attributes:
| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| OrderItemID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each line item |
| OrderID | INT | NOT NULL, FOREIGN KEY | Reference to the parent order |
| RetailerProductID | INT | NOT NULL, FOREIGN KEY | Reference to specific retailer's product |
| Quantity | INT | NOT NULL | Number of units ordered |
| UnitPriceAtPurchase | DECIMAL(10,2) | NOT NULL | Price per unit at time of purchase (frozen price) |

#### Foreign Key Constraints:
- **FOREIGN KEY:** `OrderID` → `Orders(OrderID)` ON DELETE CASCADE
- **FOREIGN KEY:** `RetailerProductID` → `RetailerProducts(RetailerProductID)`

#### Business Rules:
- Each order can contain multiple line items
- Line items reference retailer products (not master products)
- Price is frozen at time of purchase to preserve transaction integrity
- If an order is deleted, all its line items are automatically deleted (CASCADE)

---

## Entity-Relationship Diagram (Textual)

```
Users (Auth Base)
├── 1:1 → Customers (Entity) → Places → Orders (1:M Relation)
├── 1:1 → Manufacturers (Entity) → Creates → Products (Entity) (1:M)
├── 1:1 → Retailers (Entity) → Stocks → RetailerProducts (M:N) ← Links ← Products
├── 1:1 → Distributors (Entity) → Assigned → Orders (1:M, Optional)
└── 
    Orders ← Fulfills ← Retailers
    Orders → Contains → OrderItems (1:M) ← References ← RetailerProducts
```

## Key Relationships Summary

### Authentication Relationships (1:1):
1. **Users** → **Customers** (1:1)
   - Each customer has exactly one authentication record
2. **Users** → **Manufacturers** (1:1)
   - Each manufacturer has exactly one authentication record  
3. **Users** → **Retailers** (1:1)
   - Each retailer has exactly one authentication record
4. **Users** → **Distributors** (1:1)
   - Each distributor has exactly one authentication record

### Business Entity Relationships:
5. **Manufacturers** → **Products** (1:M)
   - One manufacturer creates many products

6. **Retailers** ↔ **Products** via **RetailerProducts** (M:N)
   - Many retailers can stock many products with individual pricing

7. **Customers** → **Orders** (1:M)
   - One customer can place many orders

8. **Retailers** → **Orders** (1:M)
   - One retailer can fulfill many orders

9. **Distributors** → **Orders** (1:M, Optional)
   - One distributor can handle many orders (assigned by retailers)

10. **Orders** → **OrderItems** (1:M)
    - One order contains many line items

11. **RetailerProducts** → **OrderItems** (1:M)
    - One retailer product can appear in many order line items

---

## Database Constraints & Integrity

### Primary Keys:
- All tables have auto-incrementing integer primary keys

### Foreign Key Constraints:

#### Authentication Links:
- **Customers.UserID** → **Users.UserID** (CASCADE DELETE)
- **Manufacturers.UserID** → **Users.UserID** (CASCADE DELETE)
- **Retailers.UserID** → **Users.UserID** (CASCADE DELETE)
- **Distributors.UserID** → **Users.UserID** (CASCADE DELETE)

#### Business Logic Links:
- **Products.ManufacturerID** → **Manufacturers.ManufacturerID**
- **RetailerProducts.RetailerID** → **Retailers.RetailerID**
- **RetailerProducts.ProductID** → **Products.ProductID**
- **Orders.CustomerID** → **Customers.CustomerID**
- **Orders.RetailerID** → **Retailers.RetailerID**
- **Orders.DistributorID** → **Distributors.DistributorID**
- **OrderItems.OrderID** → **Orders.OrderID** (CASCADE DELETE)
- **OrderItems.RetailerProductID** → **RetailerProducts.RetailerProductID**

### Unique Constraints:
- **Users.Email** - Ensures unique login credentials
- **RetailerProducts(RetailerID, ProductID)** - Prevents duplicate retailer-product combinations

### Business Logic Constraints:
- **ENUM** constraints enforce valid user roles and order statuses
- **NOT NULL** constraints ensure data integrity for critical fields
- **DEFAULT** values provide sensible starting states

---

## Supply Chain Workflow

1. **Manufacturers** create products in the master catalog
2. **Retailers** choose products to stock with their own pricing and inventory
3. **Customers** browse retailer catalogs and place orders
4. **Retailers** assign **Distributors** to handle order fulfillment
5. **Distributors** update order status through the shipping workflow
6. **Orders** progress: Pending → Assigned → Shipped → Delivered

This database design supports a complete multi-role supply chain management system with clear separation of concerns and flexible business relationships.
