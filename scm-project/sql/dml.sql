-- DML Script for SCM Project (updated for normalized schema)

-- Base Users (authentication only)
-- Hash corresponds to password: demo123 (keep for local testing)
INSERT INTO Users (UserID, Email, Password, FullName) VALUES
  (1, 'supply@veridian-components.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Sarah Johnson'),
  (2, 'contact@atlasfab.io', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Michael Chen'),
  (3, 'retail@metro-outfitters.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Emma Rodriguez'),
  (4, 'retail@tech-hub.store', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'David Kim'),
  (5, 'ops@speedy-ship.io', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Lisa Thompson'),
  (6, 'dispatch@northline-log.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'James Wilson'),
  (7, 'amelia.rivera@example.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Amelia Rivera'),
  (8, 'liam.patel@example.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Liam Patel');

-- Manufacturers
INSERT INTO Manufacturers (ManufacturerID, UserID, CompanyName, BusinessLicense, ManufacturingAddress, ContactPhone, Website) VALUES
  (1, 1, 'Veridian Components', 'MFG-2024-001', '800 Manufacturing Plaza, Tech City, CA 94102', '+1-555-0101', 'https://veridian-components.com'),
  (2, 2, 'Atlas Fabrication Labs', 'MFG-2024-002', '455 Foundry Loop, Innovation Park, TX 75201', '+1-555-0202', 'https://atlasfab.io');

-- Retailers
INSERT INTO Retailers (RetailerID, UserID, StoreName, BusinessLicense, StoreAddress, ContactPhone, TaxID) VALUES
  (1, 3, 'Metro Outfitters', 'RTL-2024-001', '99 Market Street, Downtown, NY 10001', '+1-555-0301', 'TAX-NY-001'),
  (2, 4, 'Tech Hub Store', 'RTL-2024-002', '12 Innovation Ave, Midtown, CA 90210', '+1-555-0401', 'TAX-CA-002');

-- Distributors
INSERT INTO Distributors (DistributorID, UserID, CompanyName, ServiceArea, WarehouseAddress, ContactPhone, DeliveryCapacity) VALUES
  (1, 5, 'Speedy Ship Inc.', 'West Coast, Southwest US', '700 Logistics Park, Crossdock, NV 89101', '+1-555-0501', 500),
  (2, 6, 'NorthLine Logistics', 'East Coast, Northeast US', '400 Carrier Blvd, Industrial, NJ 07001', '+1-555-0601', 750);

-- Customers
INSERT INTO Customers (CustomerID, UserID, ShippingAddress, BillingAddress, Phone, DateOfBirth) VALUES
  (1, 7, '123 Grove Lane, City, CA 90001', '123 Grove Lane, City, CA 90001', '+1-555-0701', '1990-05-15'),
  (2, 8, '456 Lake Road, City, TX 75001', '456 Lake Road, City, TX 75001', '+1-555-0801', '1988-12-03');

-- Master Products (created by manufacturers; no price/stock here)
INSERT INTO Products (ProductID, ProductName, Description, Category, ManufacturerID) VALUES
  (1, 'Premium Leather Jacket', 'Full-grain leather, tailored fit with premium stitching.', 'Apparel', 1),
  (2, 'Carbon Trek Backpack', 'Ultra-light carbon fiber shell with ergonomic design.', 'Accessories', 1),
  (3, 'Atlas Servo X200', 'High-torque servo with digital encoder and precision control.', 'Electronics', 2),
  (4, 'Modular Control Hub', 'Edge-compute hub for automation cells with WiFi connectivity.', 'Electronics', 2),
  (5, 'Urban Messenger Bag', 'Waterproof messenger bag with laptop compartment.', 'Accessories', 1),
  (6, 'Smart Temperature Sensor', 'IoT-enabled temperature monitoring with cloud integration.', 'Electronics', 2);

-- Retailer stocks products with own price and stock
INSERT INTO RetailerProducts (RetailerProductID, RetailerID, ProductID, Price, Stock, MinStockAlert, LastRestocked) VALUES
  (1, 1, 1, 250.00, 50, 10, '2025-10-20 09:00:00'),  -- Metro Outfitters stocks Leather Jacket
  (2, 1, 2, 179.00, 30, 5, '2025-10-22 14:30:00'),   -- Metro Outfitters stocks Backpack
  (3, 1, 5, 89.99, 25, 5, '2025-10-25 11:15:00'),    -- Metro Outfitters stocks Messenger Bag
  (4, 2, 3, 329.99, 25, 8, '2025-10-18 16:45:00'),   -- Tech Hub stocks Servo X200
  (5, 2, 4, 499.00, 40, 15, '2025-10-19 10:20:00'),  -- Tech Hub stocks Control Hub
  (6, 2, 6, 149.99, 60, 20, '2025-10-21 13:10:00');  -- Tech Hub stocks Temperature Sensor

-- Example Orders flow
-- Customer 1 (Amelia) buys from Metro Outfitters, assigned to Speedy Ship
-- Customer 2 (Liam) buys from Tech Hub, no distributor assigned yet
INSERT INTO Orders (OrderID, CustomerID, RetailerID, DistributorID, OrderDate, ShippingAddress, TotalAmount, Status, EstimatedDelivery) VALUES
  (1, 1, 1, 1, '2025-10-25 09:15:00', '123 Grove Lane, City, CA 90001', 429.99, 'Shipped', '2025-11-08'),
  (2, 2, 2, NULL, '2025-10-28 14:45:00', '456 Lake Road, City, TX 75001', 998.00, 'Confirmed', '2025-11-12'),
  (3, 1, 1, 2, '2025-11-01 16:30:00', '123 Grove Lane, City, CA 90001', 89.99, 'Delivered', '2025-11-05');

-- Order line items
INSERT INTO OrderItems (OrderItemID, OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase) VALUES
  (1, 1, 1, 1, 250.00),  -- Order 1: 1x Leather Jacket
  (2, 1, 2, 1, 179.00),  -- Order 1: 1x Backpack
  (3, 2, 5, 2, 499.00),  -- Order 2: 2x Control Hub
  (4, 3, 3, 1, 89.99);   -- Order 3: 1x Messenger Bag