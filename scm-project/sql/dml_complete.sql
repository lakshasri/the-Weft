-- Enhanced DML Script for SCM Project with Complete Supply Chain Data
-- Includes: Base data + Stage 1 enhancements
-- Date: November 13, 2025

-- ============================================================================
-- BASE ENTITY DATA
-- ============================================================================

-- Insert Users for authentication (passwords use same demo hash)
-- Hash corresponds to password: demo123 (keep for local testing)
INSERT INTO Users (UserID, Email, Password, Role) VALUES
  -- Manufacturers
  (1, 'supply@veridian-components.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Manufacturer'),
  (2, 'contact@atlasfab.io', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Manufacturer'),
  (3, 'sales@zenith-apparel.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Manufacturer'),
  -- Retailers
  (4, 'retail@metro-outfitters.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Retailer'),
  (5, 'retail@tech-hub.store', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Retailer'),
  (6, 'sales@urban-gear.net', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Retailer'),
  -- Distributors
  (7, 'ops@speedy-ship.io', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Distributor'),
  (8, 'dispatch@northline-log.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Distributor'),
  (9, 'fleet@express-move.co', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Distributor'),
  -- Customers
  (10, 'amelia.rivera@example.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Customer'),
  (11, 'liam.patel@example.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Customer'),
  (12, 'sophia.chen@example.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Customer'),
  (13, 'marcus.johnson@example.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Customer'),
  (14, 'isabella.santos@example.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Customer');

-- Insert Manufacturer entities
INSERT INTO Manufacturers (ManufacturerID, UserID, CompanyName, Address, Phone, Website, LicenseNumber, EstablishedYear) VALUES
  (1, 1, 'Veridian Components', '800 Manufacturing Plaza, Tech City', '+1-555-0101', 'www.veridian-components.com', 'MFG-2018-001', 2018),
  (2, 2, 'Atlas Fabrication Labs', '455 Foundry Loop, Innovation Park', '+1-555-0102', 'www.atlasfab.io', 'MFG-2015-002', 2015),
  (3, 3, 'Zenith Apparel Co.', '600 Fashion Blvd, Design District', '+1-555-0103', 'www.zenith-apparel.com', 'MFG-2020-003', 2020);

-- Insert Retailer entities
INSERT INTO Retailers (RetailerID, UserID, BusinessName, Address, Phone, Website, TaxID, BusinessLicense) VALUES
  (1, 4, 'Metro Outfitters', '99 Market Street, Downtown', '+1-555-0201', 'www.metro-outfitters.com', 'TAX-2019-001', 'BUS-2019-001'),
  (2, 5, 'Tech Hub Store', '12 Innovation Ave, Midtown', '+1-555-0202', 'www.tech-hub.store', 'TAX-2021-002', 'BUS-2021-002'),
  (3, 6, 'Urban Gear Boutique', '345 Commerce Lane, Harbor District', '+1-555-0203', 'www.urban-gear.net', 'TAX-2022-003', 'BUS-2022-003');

-- Insert Distributor entities
INSERT INTO Distributors (DistributorID, UserID, CompanyName, Address, Phone, ServiceAreas, VehicleCapacity, OperatingHours) VALUES
  (1, 7, 'Speedy Ship Inc.', '700 Logistics Park, Crossdock', '+1-555-0301', 'Metro Area, City Center', 5000, '24/7'),
  (2, 8, 'NorthLine Logistics', '400 Carrier Blvd, Industrial', '+1-555-0302', 'North Region, Suburbs', 10000, '6AM-10PM'),
  (3, 9, 'Express Move Delivery', '550 Transit Ave, Port Area', '+1-555-0303', 'Harbor District, Riverside', 3000, '8AM-8PM');

-- Insert Customer entities
INSERT INTO Customers (CustomerID, UserID, FullName, Address, Phone, DateOfBirth) VALUES
  (1, 10, 'Amelia Rivera', '123 Grove Lane, City', '+1-555-1001', '1992-03-15'),
  (2, 11, 'Liam Patel', '456 Lake Road, City', '+1-555-1002', '1988-07-22'),
  (3, 12, 'Sophia Chen', '789 Oak Street, Suburbs', '+1-555-1003', '1995-11-08'),
  (4, 13, 'Marcus Johnson', '321 Pine Ave, Downtown', '+1-555-1004', '1990-12-03'),
  (5, 14, 'Isabella Santos', '654 Elm Park, Riverside', '+1-555-1005', '1993-06-18');

-- ============================================================================
-- PRODUCT DATA (Enhanced with Stage 1 pricing and production details)
-- ============================================================================

-- Master Products with manufacturer pricing and production details
INSERT INTO Products (ProductID, ProductName, Description, ManufacturerPrice, MinOrderQuantity, ProductionCapacity, LeadTimeDays, Status, ManufacturerID, Category, SKU) VALUES
  -- Veridian Components products
  (1, 'Premium Leather Jacket', 'Full-grain leather, tailored fit, water-resistant.', 117.50, 20, 1000, 10, 'Active', 1, 'Apparel', 'VER-LJ-001'),
  (2, 'Carbon Trek Backpack', 'Ultra-light carbon fiber shell, 30L capacity.', 152.50, 15, 1000, 10, 'Active', 1, 'Accessories', 'VER-BP-002'),
  (3, 'Wireless Noise-Cancelling Headphones', 'Active noise cancellation, 40-hour battery life.', 210.00, 10, 1000, 14, 'Active', 1, 'Electronics', 'VER-HP-003'),
  (4, 'Titanium Alloy Water Bottle', 'Insulated, keeps drinks hot/cold for 24 hours.', 45.00, 15, 1000, 10, 'Active', 1, 'Accessories', 'VER-WB-004'),
  -- Atlas Fabrication Labs products
  (5, 'Atlas Servo X200', 'High-torque servo with digital encoder, 5Nm max.', 950.00, 5, 100, 21, 'Active', 2, 'Industrial', 'ATL-SV-005'),
  (6, 'Modular Control Hub', 'Edge-compute hub for automation cells, 8-core CPU.', 2800.00, 5, 100, 21, 'Active', 2, 'Industrial', 'ATL-CH-006'),
  (7, 'Industrial Motion Controller', '16-axis motion control, real-time feedback.', 1800.00, 5, 100, 21, 'Active', 2, 'Industrial', 'ATL-MC-007'),
  (8, 'Precision Robot Gripper', 'Collaborative gripper, max 50kg payload.', 4200.00, 5, 100, 21, 'Active', 2, 'Industrial', 'ATL-RG-008'),
  -- Zenith Apparel products
  (9, 'Organic Cotton T-Shirt', 'Sustainable, breathable, eco-friendly dye.', 18.00, 20, 500, 7, 'Active', 3, 'Apparel', 'ZEN-TS-009'),
  (10, 'Performance Running Shorts', 'Moisture-wicking fabric, ergonomic design.', 30.00, 20, 500, 7, 'Active', 3, 'Apparel', 'ZEN-RS-010'),
  (11, 'Merino Wool Thermal Layers', 'Temperature-regulating, naturally antimicrobial.', 52.00, 20, 500, 7, 'Active', 3, 'Apparel', 'ZEN-TL-011'),
  (12, 'Summer Linen Shirt', 'Lightweight linen, perfect for warm weather.', 42.00, 20, 500, 7, 'Active', 3, 'Apparel', 'ZEN-LS-012');

-- ============================================================================
-- MANUFACTURER TIER DATA (Stage 1)
-- ============================================================================

-- Manufacturer Inventory
INSERT INTO ManufacturerInventory (ManufacturerID, ProductID, QuantityAvailable, QuantityProduced, ProductionCost) VALUES
  -- Veridian Components inventory
  (1, 1, 1000, 1000, 70.50),   -- Premium Leather Jacket (60% of wholesale)
  (1, 2, 1000, 1000, 91.50),   -- Carbon Trek Backpack
  (1, 3, 1000, 1000, 126.00),  -- Wireless Headphones
  (1, 4, 1000, 1000, 27.00),   -- Titanium Water Bottle
  -- Atlas Fabrication inventory
  (2, 5, 200, 200, 570.00),    -- Atlas Servo X200
  (2, 6, 200, 200, 1680.00),   -- Modular Control Hub
  (2, 7, 200, 200, 1080.00),   -- Industrial Motion Controller
  (2, 8, 200, 200, 2520.00),   -- Precision Robot Gripper
  -- Zenith Apparel inventory
  (3, 9, 500, 500, 10.80),     -- Organic Cotton T-Shirt
  (3, 10, 500, 500, 18.00),    -- Performance Running Shorts
  (3, 11, 500, 500, 31.20),    -- Merino Wool Thermal Layers
  (3, 12, 500, 500, 25.20);    -- Summer Linen Shirt

-- ============================================================================
-- DISTRIBUTOR TIER DATA (Stage 1)
-- ============================================================================

-- Distributor Inventory (3 distributors × 12 products = 36 records)
INSERT INTO DistributorInventory (DistributorID, ProductID, QuantityAvailable, PurchasePriceFromManufacturer, SellPriceToRetailer, MinStockLevel) VALUES
  -- Speedy Ship Inc. (DistributorID 1)
  (1, 1, 110, 129.25, 164.50, 25),   -- Premium Leather Jacket (10% above mfg, 40% markup)
  (1, 2, 110, 167.75, 213.50, 15),   -- Carbon Trek Backpack
  (1, 3, 110, 231.00, 294.00, 15),   -- Wireless Headphones
  (1, 4, 110, 49.50, 63.00, 25),     -- Titanium Water Bottle
  (1, 5, 110, 1045.00, 1330.00, 5),  -- Atlas Servo X200
  (1, 6, 110, 3080.00, 3920.00, 5),  -- Modular Control Hub
  (1, 7, 110, 1980.00, 2520.00, 5),  -- Industrial Motion Controller
  (1, 8, 110, 4620.00, 5880.00, 5),  -- Precision Robot Gripper
  (1, 9, 110, 19.80, 25.20, 50),     -- Organic Cotton T-Shirt
  (1, 10, 110, 33.00, 42.00, 50),    -- Performance Running Shorts
  (1, 11, 110, 57.20, 72.80, 50),    -- Merino Wool Thermal Layers
  (1, 12, 110, 46.20, 58.80, 50),    -- Summer Linen Shirt
  
  -- NorthLine Logistics (DistributorID 2)
  (2, 1, 110, 129.25, 161.00, 25),   -- Slightly different pricing
  (2, 2, 110, 167.75, 210.00, 15),
  (2, 3, 110, 231.00, 290.00, 15),
  (2, 4, 110, 49.50, 62.00, 25),
  (2, 5, 110, 1045.00, 1310.00, 5),
  (2, 6, 110, 3080.00, 3850.00, 5),
  (2, 7, 110, 1980.00, 2475.00, 5),
  (2, 8, 110, 4620.00, 5775.00, 5),
  (2, 9, 110, 19.80, 24.75, 50),
  (2, 10, 110, 33.00, 44.80, 50),    -- NorthLine has better price on this
  (2, 11, 110, 57.20, 71.50, 50),
  (2, 12, 110, 46.20, 58.80, 50),
  
  -- Express Move Delivery (DistributorID 3)
  (3, 1, 110, 129.25, 168.00, 25),
  (3, 2, 110, 167.75, 217.00, 15),
  (3, 3, 110, 231.00, 294.00, 15),
  (3, 4, 110, 49.50, 64.00, 25),
  (3, 5, 110, 1045.00, 1360.00, 5),
  (3, 6, 110, 3080.00, 4000.00, 5),
  (3, 7, 110, 1980.00, 2574.00, 5),
  (3, 8, 110, 4620.00, 6006.00, 5),
  (3, 9, 110, 19.80, 25.74, 50),
  (3, 10, 110, 33.00, 42.90, 50),
  (3, 11, 110, 57.20, 74.36, 50),
  (3, 12, 110, 46.20, 60.06, 50);

-- Distributor Orders from Manufacturers
INSERT INTO DistributorOrders (DistributorID, ManufacturerID, OrderDate, Status, TotalAmount, PaymentTerms) VALUES
  -- Speedy Ship orders
  (1, 1, '2024-09-15 10:00:00', 'Received', 25000.00, 'Net 30'),
  (1, 2, '2024-10-01 14:30:00', 'Received', 15000.00, 'Net 30'),
  (1, 3, '2024-10-10 09:15:00', 'Shipped', 8000.00, 'Net 15'),
  -- NorthLine orders
  (2, 1, '2024-09-20 11:00:00', 'Received', 18000.00, 'Net 45'),
  (2, 3, '2024-10-05 16:20:00', 'Received', 12000.00, 'Net 30'),
  -- Express Move orders
  (3, 2, '2024-09-25 08:45:00', 'Received', 22000.00, 'Net 30'),
  (3, 1, '2024-10-08 13:30:00', 'Processing', 9500.00, 'Net 15');

-- Distributor Order Items
INSERT INTO DistributorOrderItems (OrderID, ProductID, Quantity, UnitPrice, DeliveredQuantity) VALUES
  -- Order 1: Speedy Ship from Veridian Components
  (1, 1, 50, 120.00, 50),
  (1, 2, 30, 150.00, 30),
  (1, 3, 40, 210.00, 40),
  (1, 4, 60, 45.00, 60),
  -- Order 2: Speedy Ship from Atlas Fabrication
  (2, 5, 10, 950.00, 10),
  (2, 6, 5, 2800.00, 5),
  (2, 7, 8, 1800.00, 8),
  -- Order 3: Speedy Ship from Zenith Apparel (currently shipped)
  (3, 9, 100, 18.00, 0),
  (3, 10, 80, 28.00, 0),
  (3, 11, 60, 52.00, 0),
  -- Order 4: NorthLine from Veridian Components
  (4, 1, 40, 115.00, 40),
  (4, 2, 25, 155.00, 25),
  (4, 4, 50, 45.00, 50),
  -- Order 5: NorthLine from Zenith Apparel
  (5, 9, 120, 18.00, 120),
  (5, 10, 90, 32.00, 90),
  (5, 12, 70, 42.00, 70),
  -- Order 6: Express Move from Atlas Fabrication
  (6, 5, 12, 950.00, 12),
  (6, 8, 4, 4200.00, 4),
  -- Order 7: Express Move from Veridian Components (currently processing)
  (7, 1, 35, 120.00, 0),
  (7, 3, 25, 210.00, 0);

-- ============================================================================
-- RETAILER TIER DATA (Base + Stage 1)
-- ============================================================================

-- Retailer-specific inventory (price + stock per retailer)
-- Enhanced with distributor relationships
INSERT INTO RetailerProducts (RetailerID, ProductID, Price, Stock, PurchasePriceFromDistributor, DistributorID, MinStockLevel) VALUES
  -- Metro Outfitters (ID 1) - apparel + accessories focus
  (1, 1, 199.99, 25, 164.50, 1, 5),   -- Premium Leather Jacket
  (1, 9, 29.99, 100, 25.20, 1, 20),   -- Organic Cotton T-Shirt
  (1, 10, 49.99, 75, 42.00, 1, 15),   -- Performance Running Shorts
  (1, 11, 89.99, 50, 72.80, 1, 10),   -- Merino Wool Thermal Layers
  (1, 4, 79.99, 40, 63.00, 1, 8),     -- Titanium Water Bottle
  -- Tech Hub Store (ID 2) - tech + equipment focus
  (2, 5, 1499.99, 8, 1330.00, 1, 2),  -- Atlas Servo X200
  (2, 6, 3999.99, 5, 3920.00, 1, 1),  -- Modular Control Hub
  (2, 3, 349.99, 20, 294.00, 1, 5),   -- Wireless Headphones
  (2, 2, 249.99, 15, 213.50, 1, 3),   -- Carbon Trek Backpack
  (2, 7, 2499.99, 6, 2520.00, 1, 2),  -- Industrial Motion Controller
  -- Urban Gear Boutique (ID 3) - mixed / outdoor focus
  (3, 1, 189.99, 30, 161.00, 2, 6),   -- Premium Leather Jacket (from NorthLine)
  (3, 2, 259.99, 18, 217.00, 3, 4),   -- Carbon Trek Backpack (from Express Move)
  (3, 12, 69.99, 60, 58.80, 1, 12),   -- Summer Linen Shirt
  (3, 10, 54.99, 80, 44.80, 2, 16),   -- Performance Running Shorts (best price from NorthLine)
  (3, 8, 5499.99, 3, 5880.00, 1, 1);  -- Precision Robot Gripper

-- Retailer Orders from Distributors
INSERT INTO RetailerOrders (RetailerID, DistributorID, OrderDate, Status, TotalAmount, PaymentTerms, PaymentStatus) VALUES
  -- Metro Outfitters orders
  (1, 1, '2024-09-20 09:30:00', 'Received', 5500.00, 'Net 30', 'Paid'),
  (1, 2, '2024-10-05 14:15:00', 'Received', 3200.00, 'Net 30', 'Paid'),
  (1, 3, '2024-10-15 11:45:00', 'Shipped', 2100.00, 'Net 15', 'Pending'),
  -- Tech Hub Store orders
  (2, 1, '2024-09-25 10:20:00', 'Received', 12500.00, 'Net 45', 'Paid'),
  (2, 3, '2024-10-08 16:30:00', 'Processing', 8900.00, 'Net 30', 'Pending'),
  -- Urban Gear Boutique orders
  (3, 2, '2024-10-01 08:15:00', 'Received', 4800.00, 'Net 30', 'Paid'),
  (3, 1, '2024-10-12 13:20:00', 'Confirmed', 3600.00, 'Net 30', 'Pending');

-- Retailer Order Items
INSERT INTO RetailerOrderItems (OrderID, ProductID, Quantity, UnitPrice, DeliveredQuantity) VALUES
  -- Order 1: Metro Outfitters from Speedy Ship
  (1, 1, 25, 168.00, 25),
  (1, 9, 100, 25.20, 100),
  (1, 4, 40, 63.00, 40),
  -- Order 2: Metro Outfitters from NorthLine
  (2, 10, 75, 39.20, 75),
  (2, 11, 50, 72.80, 50),
  -- Order 3: Metro Outfitters from Express Move (currently shipped)
  (3, 1, 20, 168.00, 0),
  (3, 2, 15, 217.00, 0),
  -- Order 4: Tech Hub from Speedy Ship
  (4, 5, 8, 1330.00, 8),
  (4, 6, 5, 3920.00, 5),
  (4, 3, 20, 294.00, 20),
  -- Order 5: Tech Hub from Express Move (currently processing)
  (5, 7, 6, 2520.00, 0),
  (5, 8, 3, 5880.00, 0),
  -- Order 6: Urban Gear from NorthLine
  (6, 1, 30, 161.00, 30),
  (6, 10, 80, 44.80, 80),
  (6, 12, 60, 58.80, 60),
  -- Order 7: Urban Gear from Speedy Ship (currently confirmed)
  (7, 2, 18, 210.00, 0),
  (7, 3, 15, 294.00, 0);

-- Retailer Supplier Relationships
INSERT INTO RetailerSupplierRelationships (RetailerID, DistributorID, PreferredSupplier, VolumeDiscountPercent, CreditLimit) VALUES
  -- Metro Outfitters relationships
  (1, 1, TRUE, 5.00, 15000.00),   -- Preferred relationship with Speedy Ship
  (1, 2, FALSE, 2.00, 8000.00),   -- Secondary relationship with NorthLine
  (1, 3, FALSE, 0.00, 5000.00),   -- Basic relationship with Express Move
  -- Tech Hub Store relationships
  (2, 1, FALSE, 3.00, 20000.00),  -- Good relationship with Speedy Ship
  (2, 3, TRUE, 7.00, 25000.00),   -- Preferred for industrial equipment
  -- Urban Gear Boutique relationships
  (3, 2, TRUE, 4.00, 12000.00),   -- Preferred with NorthLine
  (3, 1, FALSE, 2.00, 8000.00);   -- Secondary with Speedy Ship

-- ============================================================================
-- CUSTOMER TIER DATA
-- ============================================================================

-- Customer Orders
INSERT INTO Orders (OrderID, CustomerID, RetailerID, DistributorID, OrderDate, ShippingAddress, Status, TotalAmount) VALUES
  (1, 1, 1, 1, '2024-10-25 09:15:00', '123 Grove Lane, City', 'Delivered', 259.97),
  (2, 2, 2, 2, '2024-10-26 10:30:00', '456 Lake Road, City', 'Shipped', 599.98),
  (3, 3, 1, NULL, '2024-10-27 11:00:00', '789 Oak Street, Suburbs', 'Pending', 189.97),
  (4, 4, 3, 3, '2024-10-28 14:45:00', '321 Pine Ave, Downtown', 'Assigned', 259.98),
  (5, 5, 2, 1, '2024-10-29 08:20:00', '654 Elm Park, Riverside', 'Shipped', 1499.99),
  (6, 1, 3, 2, '2024-10-30 13:50:00', '123 Grove Lane, City', 'Delivered', 424.96),
  (7, 2, 1, NULL, '2024-10-31 09:00:00', '456 Lake Road, City', 'Pending', 159.98);

-- Order Items
INSERT INTO OrderItems (OrderItemID, OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase) VALUES
  -- Order 1: Amelia Rivera (Delivered) - jacket + t-shirt from Metro
  (1, 1, 1, 1, 199.99),   -- 1x Premium Leather Jacket
  (2, 1, 2, 2, 29.99),    -- 2x Organic Cotton T-Shirt
  -- Order 2: Liam Patel (Shipped) - tech items from Tech Hub
  (3, 2, 8, 1, 349.99),   -- 1x Wireless Headphones
  (4, 2, 9, 1, 249.99),   -- 1x Carbon Trek Backpack
  -- Order 3: Sophia Chen (Pending) - athletic wear from Metro
  (5, 3, 3, 2, 49.99),    -- 2x Performance Running Shorts
  (6, 3, 4, 1, 89.99),    -- 1x Merino Wool Thermal Layers
  -- Order 4: Marcus Johnson (Assigned) - mixed gear from Urban
  (7, 4, 11, 1, 189.99),  -- 1x Premium Leather Jacket
  (8, 4, 13, 1, 69.99),   -- 1x Summer Linen Shirt
  -- Order 5: Isabella Santos (Shipped) - industrial equipment from Tech Hub
  (9, 5, 6, 1, 1499.99),  -- 1x Atlas Servo X200
  -- Order 6: Amelia Rivera (Delivered) - backpack + shorts from Urban
  (10, 6, 12, 1, 259.99), -- 1x Carbon Trek Backpack
  (11, 6, 14, 3, 54.99),  -- 3x Performance Running Shorts
  -- Order 7: Liam Patel (Pending) - water bottle from Metro
  (12, 7, 5, 2, 79.99);   -- 2x Titanium Water Bottle

-- ============================================================================
-- HISTORICAL DATA
-- ============================================================================

-- Manufacturer Sales (Wholesale/Procurement transactions)
INSERT INTO ManufacturerSales (ManufacturerID, RetailerID, ProductID, WholesalePrice, Quantity, PurchaseDate, InvoiceNumber, Notes) VALUES
  -- Veridian Components sales to retailers
  (1, 1, 1, 120.00, 50, '2024-10-01 09:00:00', 'VC-2024-001', 'Premium Leather Jacket - bulk order'),
  (1, 3, 1, 115.00, 40, '2024-10-02 14:30:00', 'VC-2024-002', 'Premium Leather Jacket - standard order'),
  (1, 1, 4, 45.00, 60, '2024-10-03 11:15:00', 'VC-2024-003', 'Titanium Water Bottle - high volume'),
  (1, 2, 2, 150.00, 25, '2024-10-05 16:20:00', 'VC-2024-004', 'Carbon Trek Backpack - tech store order'),
  (1, 3, 2, 155.00, 30, '2024-10-06 10:45:00', 'VC-2024-005', 'Carbon Trek Backpack - boutique pricing'),
  (1, 2, 3, 210.00, 35, '2024-10-08 13:30:00', 'VC-2024-006', 'Wireless Headphones - electronics order'),
  -- Atlas Fabrication Labs sales to retailers
  (2, 2, 5, 950.00, 15, '2024-09-15 08:00:00', 'AF-2024-001', 'Atlas Servo X200 - industrial equipment'),
  (2, 2, 6, 2800.00, 8, '2024-09-18 09:30:00', 'AF-2024-002', 'Modular Control Hub - high-end tech'),
  (2, 2, 7, 1800.00, 12, '2024-09-20 14:15:00', 'AF-2024-003', 'Industrial Motion Controller'),
  (2, 3, 8, 4200.00, 5, '2024-09-25 11:00:00', 'AF-2024-004', 'Precision Robot Gripper - specialty order'),
  -- Zenith Apparel Co. sales to retailers
  (3, 1, 9, 18.00, 150, '2024-10-10 07:30:00', 'ZA-2024-001', 'Organic Cotton T-Shirt - bulk clothing'),
  (3, 1, 10, 28.00, 100, '2024-10-12 12:00:00', 'ZA-2024-002', 'Performance Running Shorts - activewear'),
  (3, 3, 10, 32.00, 120, '2024-10-14 15:45:00', 'ZA-2024-003', 'Performance Running Shorts - boutique'),
  (3, 1, 11, 52.00, 80, '2024-10-16 10:20:00', 'ZA-2024-004', 'Merino Wool Thermal Layers - winter prep'),
  (3, 3, 12, 42.00, 90, '2024-10-18 16:30:00', 'ZA-2024-005', 'Summer Linen Shirt - seasonal order');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Enhanced DML Data Loaded Successfully' as Status;
SELECT 'Complete Supply Chain Data: Manufacturers → Distributors → Retailers → Customers' as Details;
SELECT 
    (SELECT COUNT(*) FROM Users) as Users,
    (SELECT COUNT(*) FROM Products) as Products,
    (SELECT COUNT(*) FROM ManufacturerInventory) as MfgInventory,
    (SELECT COUNT(*) FROM DistributorInventory) as DistInventory,
    (SELECT COUNT(*) FROM RetailerProducts) as RetailerProducts,
    (SELECT COUNT(*) FROM Orders) as CustomerOrders;
