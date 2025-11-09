# Supply Chain Management (SCM) Database Schema Documentation

## Overview
This database implements a multi-tier supply chain management system where manufacturers create products, retailers stock them with their own pricing, customers place orders through retailers, and distributors handle fulfillment.

---

## ENTITIES & ATTRIBUTES

### 1. **Users** (Base Authentication Entity)
**Purpose**: Central authentication table for all system users

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| UserID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| Email | VARCHAR(255) | NOT NULL, UNIQUE | User's email address for login |
| Password | VARCHAR(255) | NOT NULL | Hashed password for authentication |
| FullName | VARCHAR(100) | - | User's full name |
| CreatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| IsActive | BOOLEAN | NOT NULL, DEFAULT TRUE | Account status flag |

### 2. **Customers** (End Users)
**Purpose**: Individuals who purchase products from retailers

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| CustomerID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique customer identifier |
| UserID | INT | NOT NULL, UNIQUE, FK → Users.UserID | Reference to base user record |
| ShippingAddress | TEXT | - | Default shipping address |
| BillingAddress | TEXT | - | Billing address for payments |
| Phone | VARCHAR(20) | - | Contact phone number |
| DateOfBirth | DATE | - | Customer's birth date |

### 3. **Manufacturers** (Product Creators)
**Purpose**: Companies that design and create products

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| ManufacturerID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique manufacturer identifier |
| UserID | INT | NOT NULL, UNIQUE, FK → Users.UserID | Reference to base user record |
| CompanyName | VARCHAR(255) | NOT NULL | Official company name |
| BusinessLicense | VARCHAR(100) | - | Business license number |
| ManufacturingAddress | TEXT | - | Manufacturing facility address |
| ContactPhone | VARCHAR(20) | - | Business contact phone |
| Website | VARCHAR(255) | - | Company website URL |

### 4. **Retailers** (Product Sellers)
**Purpose**: Businesses that stock and sell products to customers

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| RetailerID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique retailer identifier |
| UserID | INT | NOT NULL, UNIQUE, FK → Users.UserID | Reference to base user record |
| StoreName | VARCHAR(255) | NOT NULL | Store/business name |
| BusinessLicense | VARCHAR(100) | - | Business license number |
| StoreAddress | TEXT | - | Physical store address |
| ContactPhone | VARCHAR(20) | - | Store contact phone |
| TaxID | VARCHAR(50) | - | Tax identification number |

### 5. **Distributors** (Logistics Providers)
**Purpose**: Companies that handle order fulfillment and delivery

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| DistributorID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique distributor identifier |
| UserID | INT | NOT NULL, UNIQUE, FK → Users.UserID | Reference to base user record |
| CompanyName | VARCHAR(255) | NOT NULL | Distribution company name |
| ServiceArea | TEXT | - | Geographic service coverage |
| WarehouseAddress | TEXT | - | Main warehouse location |
| ContactPhone | VARCHAR(20) | - | Business contact phone |
| DeliveryCapacity | INT | - | Maximum delivery capacity |

### 6. **Products** (Master Product Catalog)
**Purpose**: Master products created by manufacturers (templates)

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| ProductID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique product identifier |
| ProductName | VARCHAR(255) | NOT NULL | Product name/title |
| Description | TEXT | - | Detailed product description |
| Category | VARCHAR(100) | - | Product category classification |
| ManufacturerID | INT | NOT NULL, FK → Manufacturers.ManufacturerID | Product creator reference |
| CreatedAt | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Product creation timestamp |
| IsActive | BOOLEAN | NOT NULL, DEFAULT TRUE | Product availability status |

### 7. **RetailerProducts** (Retailer Inventory)
**Purpose**: Retailer-specific product listings with pricing and stock

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| RetailerProductID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique retailer product identifier |
| RetailerID | INT | NOT NULL, FK → Retailers.RetailerID | Retailer reference |
| ProductID | INT | NOT NULL, FK → Products.ProductID | Master product reference |
| Price | DECIMAL(10,2) | NOT NULL | Retailer's selling price |
| Stock | INT | NOT NULL, DEFAULT 0 | Current inventory level |
| MinStockAlert | INT | DEFAULT 5 | Minimum stock alert threshold |
| LastRestocked | DATETIME | - | Last inventory replenishment date |

**Unique Constraint**: (RetailerID, ProductID) - One entry per retailer-product combination

### 8. **Orders** (Customer Purchase Orders)
**Purpose**: Customer orders placed with specific retailers

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| OrderID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique order identifier |
| CustomerID | INT | NOT NULL, FK → Customers.CustomerID | Customer who placed order |
| RetailerID | INT | NOT NULL, FK → Retailers.RetailerID | Retailer fulfilling order |
| DistributorID | INT | NULLABLE, FK → Distributors.DistributorID | Assigned distributor (optional) |
| OrderDate | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Order placement timestamp |
| ShippingAddress | TEXT | NOT NULL | Delivery address for this order |
| TotalAmount | DECIMAL(12,2) | - | Total order value |
| Status | ENUM | NOT NULL, DEFAULT 'Pending' | Order processing status |
| EstimatedDelivery | DATE | - | Expected delivery date |

**Status Values**: 'Pending', 'Confirmed', 'Assigned', 'Shipped', 'Delivered', 'Cancelled'

### 9. **OrderItems** (Order Line Items)
**Purpose**: Individual products within an order

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| OrderItemID | INT | PRIMARY KEY, AUTO_INCREMENT | Unique order item identifier |
| OrderID | INT | NOT NULL, FK → Orders.OrderID | Parent order reference |
| RetailerProductID | INT | NOT NULL, FK → RetailerProducts.RetailerProductID | Product being purchased |
| Quantity | INT | NOT NULL | Number of units ordered |
| UnitPriceAtPurchase | DECIMAL(10,2) | NOT NULL | Price per unit at time of order |

---

## RELATIONSHIPS

### 1. **User Role Hierarchy** (1:1 Relationships)
- **Users → Customers**: One user can be one customer
- **Users → Manufacturers**: One user can be one manufacturer  
- **Users → Retailers**: One user can be one retailer
- **Users → Distributors**: One user can be one distributor

**Implementation**: Each role table has a unique UserID foreign key with CASCADE DELETE

### 2. **Product Management** (1:Many Relationships)
- **Manufacturers → Products**: One manufacturer creates many products
- **Products → RetailerProducts**: One master product can be stocked by many retailers
- **Retailers → RetailerProducts**: One retailer can stock many products

### 3. **Order Processing** (1:Many & Many:1 Relationships)
- **Customers → Orders**: One customer can place many orders
- **Retailers → Orders**: One retailer can receive many orders  
- **Distributors → Orders**: One distributor can handle many orders (optional assignment)
- **Orders → OrderItems**: One order contains many line items
- **RetailerProducts → OrderItems**: One retailer product can appear in many order items

### 4. **Supply Chain Flow**
```
Manufacturers → Products → RetailerProducts → OrderItems ← Orders ← Customers
                    ↑                                        ↑
                Retailers                              Distributors
```

---

## BUSINESS RULES & CONSTRAINTS

### 1. **Data Integrity Rules**
- Every role-specific entity must have a corresponding Users record
- Products can only be created by Manufacturers
- Orders can only reference products that the retailer actually stocks
- Order items must reference valid retailer products with sufficient stock

### 2. **Business Logic Constraints**
- Customers buy from Retailers, not directly from Manufacturers
- Retailers set their own prices for manufacturer products
- Distributors are optionally assigned to orders for fulfillment
- Order status follows a logical progression (Pending → Confirmed → Assigned → Shipped → Delivered)

### 3. **Referential Integrity**
- CASCADE DELETE: Deleting a user removes all their role-specific data
- CASCADE DELETE: Deleting an order removes all its line items
- RESTRICT: Cannot delete products or retailers that have active orders

---

## INDEXES & PERFORMANCE

### 1. **Primary Keys** (Automatic Indexes)
- All tables have auto-incrementing integer primary keys

### 2. **Foreign Key Indexes** (Automatic)
- All foreign key relationships create automatic indexes

### 3. **Unique Constraints**
- `Users.Email` - Ensures unique login credentials
- `(RetailerID, ProductID)` in RetailerProducts - Prevents duplicate retailer product entries

### 4. **Recommended Additional Indexes**
- `Orders.OrderDate` - For date-based queries
- `Products.Category` - For category filtering
- `Orders.Status` - For status-based reporting
- `RetailerProducts.Stock` - For inventory queries

---

## SAMPLE DATA SUMMARY

### Users & Roles
- **2 Manufacturers**: Veridian Components, Atlas Fabrication Labs
- **2 Retailers**: Metro Outfitters, Tech Hub Store  
- **2 Distributors**: Speedy Ship Inc., NorthLine Logistics
- **2 Customers**: Amelia Rivera, Liam Patel

### Products & Inventory
- **6 Master Products**: Apparel, accessories, and electronics
- **6 Retailer Product Listings**: With realistic pricing and stock levels

### Orders & Transactions
- **3 Sample Orders**: Various statuses from delivered to confirmed
- **4 Order Line Items**: Different product combinations and quantities

This schema provides a robust foundation for a supply chain management system with proper normalization, clear relationships, and scalable design patterns.
