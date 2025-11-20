# SQL Database Setup Guide

## Overview
This directory contains all SQL scripts needed to set up and manage the SCM (Supply Chain Management) database.

## Quick Start

### Complete Database Setup (Recommended)
Run these two files in order to set up the entire database from scratch:

```bash
# 1. Create all tables, functions, procedures, triggers, and views
sudo mysql -u root < ddl_complete.sql

# 2. Populate with sample data
sudo mysql -u root < dml_complete.sql
```

## File Structure

### Core Files (Use These)
- **`ddl_complete.sql`** - Complete Data Definition Language
  - All table structures
  - Foreign key relationships
  - Indexes for performance
  - Database functions
  - Stored procedures
  - Triggers
  - Views
  - **Status**: Includes updated order workflow (Pending → Confirmed → Shipped → Delivered)

- **`dml_complete.sql`** - Complete Data Manipulation Language
  - Sample users for all roles (Customer, Manufacturer, Distributor, Retailer)
  - Sample products
  - Sample inventory data
  - Sample orders
  - Complete supply chain test data

### Legacy/Archive Files (For Reference Only)
- `ddl.sql` - Original DDL (empty/deprecated)
- `dml.sql` - Original DML (deprecated)
- `ddl_enhanced.sql` - Previous version (same as ddl_complete.sql)
- `dml_enhanced.sql` - Previous version (same as dml_complete.sql)
- `enhanced_test_data.sql` - Additional test data (optional)

### Migration Files (Already Applied)
These files were used during development and are now integrated into `ddl_complete.sql`:
- `add_confirmed_status.sql` - Added 'Confirmed' status to Orders
- `remove_assigned_status.sql` - Removed 'Assigned' status from Orders
- `migrations/` - Historical migration files
- `rollback/` - Rollback scripts (use with caution)

### Test/Validation Files
- `test_database.sql` - Database validation queries
- `test_stage2_manufacturer.sql` - Manufacturer tier tests
- `test_stage3_distributor.sql` - Distributor tier tests
- `validate_stage1.sql` - Stage 1 validation

## Database Schema

### Entity Relationship Overview

```
Users (Authentication)
├── Customers (Places orders from retailers)
├── Retailers (Sells to customers, buys from distributors)
├── Distributors (Sells to retailers, buys from manufacturers)
└── Manufacturers (Produces products, sells to distributors)

Supply Chain Flow:
Manufacturer → Distributor → Retailer → Customer
```

### Key Tables

#### User Management
- **Users** - Authentication and role management
- **Customers** - Customer profile and shipping info
- **Retailers** - Retailer business information
- **Distributors** - Distributor company details
- **Manufacturers** - Manufacturing company details

#### Product & Inventory
- **Products** - Product catalog (managed by manufacturers)
- **ManufacturerInventory** - Manufacturer stock levels
- **DistributorInventory** - Distributor stock and pricing
- **RetailerProducts** - Retailer catalog and customer pricing

#### Orders & Transactions
- **Orders** - Customer orders from retailers
  - **Status Flow**: Pending → Confirmed (retailer) → Shipped (retailer) → Delivered (customer)
- **OrderItems** - Line items for customer orders
- **RetailerOrders** - Retailer purchase orders from distributors
- **RetailerOrderItems** - Line items for retailer orders
- **DistributorOrders** - Distributor purchase orders from manufacturers
- **DistributorOrderItems** - Line items for distributor orders

### Advanced Features

#### Database Functions
1. **`CalculateOrderTotal(order_id)`** - Calculates total amount for an order
2. **`GetRetailerStockValue(retailer_id)`** - Returns total inventory value for retailer

#### Stored Procedures
1. **`CheckLowStockProducts(retailer_id)`** - Lists products below reorder threshold
2. **`ProcessOrderWithValidation(...)`** - Creates validated customer orders with stock checks

#### Triggers
1. **`UpdateOrderTotalAfterItem`** - Auto-updates order total when item added
2. **`UpdateOrderTotalAfterItemUpdate`** - Auto-updates order total when item modified
3. **`UpdateOrderTotalAfterItemDelete`** - Auto-updates order total when item deleted
4. **`AuditInventoryChanges`** - Logs all inventory modifications to audit table

#### Views
1. **`SupplyChainPricing`** - Complete pricing chain from manufacturer to customer
2. **`InventoryStatus`** - Current inventory status across all retailers
3. **`RetailerPurchaseHistory`** - Retailer purchase analytics

## Order Status Workflow

### Customer Orders (Orders table)
1. **Pending** - Order placed by customer (default)
2. **Confirmed** - Retailer confirms they can fulfill the order
3. **Shipped** - Retailer ships the order
4. **Delivered** - Customer confirms receipt
5. **Cancelled** - Order cancelled

### Retailer Orders (RetailerOrders table)
1. **Pending** - Order placed with distributor
2. **Confirmed** - Distributor confirms and reserves inventory
3. **Shipped** - Distributor ships the order
4. **Received** - Retailer receives and updates inventory

### Distributor Orders (DistributorOrders table)
1. **Pending** - Order placed with manufacturer
2. **Confirmed** - Manufacturer confirms and reserves inventory
3. **Shipped** - Manufacturer ships the order
4. **Received** - Distributor receives and updates inventory

## Sample Users

After running `dml_complete.sql`, you can log in with these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Customer | alice@example.com | password123 |
| Customer | bob@example.com | password123 |
| Retailer | retailer1@example.com | password123 |
| Retailer | retailer2@example.com | password123 |
| Distributor | distributor1@example.com | password123 |
| Distributor | distributor2@example.com | password123 |
| Manufacturer | manufacturer1@example.com | password123 |
| Manufacturer | manufacturer2@example.com | password123 |

## Database Reset

To completely reset the database:

```bash
# Drop and recreate everything
sudo mysql -u root < ddl_complete.sql
sudo mysql -u root < dml_complete.sql
```

## Troubleshooting

### Foreign Key Errors
If you get foreign key constraint errors:
```sql
SET FOREIGN_KEY_CHECKS = 0;
-- Run your SQL commands
SET FOREIGN_KEY_CHECKS = 1;
```

### Permission Errors
Make sure you're running with sufficient privileges:
```bash
sudo mysql -u root < script.sql
```

### Check Database Status
```sql
USE scm_db_roles;
SHOW TABLES;
SELECT COUNT(*) FROM Users;
SELECT COUNT(*) FROM Orders;
```

## Development Notes

- All tables use InnoDB engine for transaction support
- Charset: utf8mb4 for full Unicode support
- Timestamps use DATETIME with DEFAULT CURRENT_TIMESTAMP
- All monetary values use DECIMAL(10,2)
- Comprehensive indexes for query performance
- Cascading deletes for data integrity

## Version History

- **v1.0** - Initial base schema
- **v2.0** - Added manufacturer tier and inventory management
- **v3.0** - Added distributor tier and multi-tier ordering
- **v4.0** - Added retailer enhanced inventory and pricing
- **v5.0** - Added customer order confirmation workflow (Current)
  - Changed order status from Pending→Assigned→Shipped→Delivered
  - To: Pending→Confirmed→Shipped→Delivered
  - Allows retailer confirmation before shipping
  - Allows customer delivery confirmation

## Support

For issues or questions, check:
1. Server logs: `scm-project/server.log`
2. Database constraints: `SHOW CREATE TABLE table_name;`
3. Trigger status: `SHOW TRIGGERS;`
4. Function/Procedure: `SHOW CREATE FUNCTION function_name;`
