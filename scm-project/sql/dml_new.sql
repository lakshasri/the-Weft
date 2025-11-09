-- DML Script for SCM Project with Separate Entity Tables

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

-- Master Products (manufacturers only; no price/stock here)
INSERT INTO Products (ProductID, ProductName, Description, ManufacturerID, Category, SKU) VALUES
  -- Veridian Components products
  (1, 'Premium Leather Jacket', 'Full-grain leather, tailored fit, water-resistant.', 1, 'Apparel', 'VER-LJ-001'),
  (2, 'Carbon Trek Backpack', 'Ultra-light carbon fiber shell, 30L capacity.', 1, 'Accessories', 'VER-BP-002'),
  (3, 'Wireless Noise-Cancelling Headphones', 'Active noise cancellation, 40-hour battery life.', 1, 'Electronics', 'VER-HP-003'),
  (4, 'Titanium Alloy Water Bottle', 'Insulated, keeps drinks hot/cold for 24 hours.', 1, 'Accessories', 'VER-WB-004'),
  -- Atlas Fabrication Labs products
  (5, 'Atlas Servo X200', 'High-torque servo with digital encoder, 5Nm max.', 2, 'Industrial', 'ATL-SV-005'),
  (6, 'Modular Control Hub', 'Edge-compute hub for automation cells, 8-core CPU.', 2, 'Industrial', 'ATL-CH-006'),
  (7, 'Industrial Motion Controller', '16-axis motion control, real-time feedback.', 2, 'Industrial', 'ATL-MC-007'),
  (8, 'Precision Robot Gripper', 'Collaborative gripper, max 50kg payload.', 2, 'Industrial', 'ATL-RG-008'),
  -- Zenith Apparel products
  (9, 'Organic Cotton T-Shirt', 'Sustainable, breathable, eco-friendly dye.', 3, 'Apparel', 'ZEN-TS-009'),
  (10, 'Performance Running Shorts', 'Moisture-wicking fabric, ergonomic design.', 3, 'Apparel', 'ZEN-RS-010'),
  (11, 'Merino Wool Thermal Layers', 'Temperature-regulating, naturally antimicrobial.', 3, 'Apparel', 'ZEN-TL-011'),
  (12, 'Summer Linen Shirt', 'Lightweight linen, perfect for warm weather.', 3, 'Apparel', 'ZEN-LS-012');

-- Retailer-specific inventory (price + stock per retailer)
INSERT INTO RetailerProducts (RetailerID, ProductID, Price, Stock, MinStockLevel) VALUES
  -- Metro Outfitters (ID 1) - apparel + accessories focus
  (1, 1, 199.99, 25, 5),   -- Premium Leather Jacket
  (1, 9, 29.99, 100, 20),  -- Organic Cotton T-Shirt
  (1, 10, 49.99, 75, 15),  -- Performance Running Shorts
  (1, 11, 89.99, 50, 10),  -- Merino Wool Thermal Layers
  (1, 4, 79.99, 40, 8),    -- Titanium Water Bottle
  -- Tech Hub Store (ID 2) - tech + equipment focus
  (2, 5, 1499.99, 8, 2),   -- Atlas Servo X200
  (2, 6, 3999.99, 5, 1),   -- Modular Control Hub
  (2, 3, 349.99, 20, 5),   -- Wireless Headphones
  (2, 2, 249.99, 15, 3),   -- Carbon Trek Backpack
  (2, 7, 2499.99, 6, 2),   -- Industrial Motion Controller
  -- Urban Gear Boutique (ID 3) - mixed / outdoor focus
  (3, 1, 189.99, 30, 6),   -- Premium Leather Jacket
  (3, 2, 259.99, 18, 4),   -- Carbon Trek Backpack
  (3, 12, 69.99, 60, 12),  -- Summer Linen Shirt
  (3, 10, 54.99, 80, 16),  -- Performance Running Shorts
  (3, 8, 5499.99, 3, 1);   -- Precision Robot Gripper

-- Orders with new entity IDs
INSERT INTO Orders (OrderID, CustomerID, RetailerID, DistributorID, OrderDate, ShippingAddress, Status, TotalAmount) VALUES
  (1, 1, 1, 1, '2025-10-25 09:15:00', '123 Grove Lane, City', 'Delivered', 259.97),
  (2, 2, 2, 2, '2025-10-26 10:30:00', '456 Lake Road, City', 'Shipped', 599.98),
  (3, 3, 1, NULL, '2025-10-27 11:00:00', '789 Oak Street, Suburbs', 'Pending', 189.97),
  (4, 4, 3, 3, '2025-10-28 14:45:00', '321 Pine Ave, Downtown', 'Assigned', 259.98),
  (5, 5, 2, 1, '2025-10-29 08:20:00', '654 Elm Park, Riverside', 'Shipped', 1499.99),
  (6, 1, 3, 2, '2025-10-30 13:50:00', '123 Grove Lane, City', 'Delivered', 424.96),
  (7, 2, 1, NULL, '2025-10-31 09:00:00', '456 Lake Road, City', 'Pending', 159.98);

-- Order Items detailing what each customer ordered
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
