-- DML Script for SCM Project (expanded roles and flows)

-- Users across all roles (passwords use same demo hash)
-- Hash corresponds to password: demo123 (keep for local testing)
INSERT INTO Users (UserID, Email, Password, FullName, Address, Role) VALUES
  -- Manufacturers
  (1, 'supply@veridian-components.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Veridian Components', '800 Manufacturing Plaza, Tech City', 'Manufacturer'),
  (2, 'contact@atlasfab.io',        '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Atlas Fabrication Labs', '455 Foundry Loop, Innovation Park', 'Manufacturer'),
  (3, 'sales@zenith-apparel.com',   '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Zenith Apparel Co.', '600 Fashion Blvd, Design District', 'Manufacturer'),
  -- Retailers
  (4, 'retail@metro-outfitters.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Metro Outfitters', '99 Market Street, Downtown', 'Retailer'),
  (5, 'retail@tech-hub.store',      '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Tech Hub Store', '12 Innovation Ave, Midtown', 'Retailer'),
  (6, 'sales@urban-gear.net',       '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Urban Gear Boutique', '345 Commerce Lane, Harbor District', 'Retailer'),
  -- Distributors
  (7, 'ops@speedy-ship.io',         '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Speedy Ship Inc.', '700 Logistics Park, Crossdock', 'Distributor'),
  (8, 'dispatch@northline-log.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'NorthLine Logistics', '400 Carrier Blvd, Industrial', 'Distributor'),
  (9, 'fleet@express-move.co',      '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Express Move Delivery', '550 Transit Ave, Port Area', 'Distributor'),
  -- Customers
  (10, 'amelia.rivera@example.com',  '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Amelia Rivera', '123 Grove Lane, City', 'Customer'),
  (11, 'liam.patel@example.com',     '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Liam Patel', '456 Lake Road, City', 'Customer'),
  (12, 'sophia.chen@example.com',    '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Sophia Chen', '789 Oak Street, Suburbs', 'Customer'),
  (13, 'marcus.johnson@example.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Marcus Johnson', '321 Pine Ave, Downtown', 'Customer'),
  (14, 'isabella.santos@example.com','$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Isabella Santos', '654 Elm Park, Riverside', 'Customer');

-- Master Products (manufacturers only; no price/stock here)
INSERT INTO Products (ProductID, ProductName, Description, ManufacturerID) VALUES
  -- Veridian Components products
  (1, 'Premium Leather Jacket', 'Full-grain leather, tailored fit, water-resistant.', 1),
  (2, 'Carbon Trek Backpack', 'Ultra-light carbon fiber shell, 30L capacity.', 1),
  (3, 'Wireless Noise-Cancelling Headphones', 'Active noise cancellation, 40-hour battery life.', 1),
  (4, 'Titanium Alloy Water Bottle', 'Insulated, keeps drinks hot/cold for 24 hours.', 1),
  -- Atlas Fabrication Labs products
  (5, 'Atlas Servo X200', 'High-torque servo with digital encoder, 5Nm max.', 2),
  (6, 'Modular Control Hub', 'Edge-compute hub for automation cells, 8-core CPU.', 2),
  (7, 'Industrial Motion Controller', '16-axis motion control, real-time feedback.', 2),
  (8, 'Precision Robot Gripper', 'Collaborative gripper, max 50kg payload.', 2),
  -- Zenith Apparel products
  (9, 'Organic Cotton T-Shirt', 'Sustainable, breathable, eco-friendly dye.', 3),
  (10, 'Performance Running Shorts', 'Moisture-wicking fabric, ergonomic design.', 3),
  (11, 'Merino Wool Thermal Layers', 'Temperature-regulating, naturally antimicrobial.', 3),
  (12, 'Summer Linen Shirt', 'Lightweight linen, perfect for warm weather.', 3);

-- Retailer-specific inventory (price + stock per retailer)
INSERT INTO RetailerProducts (RetailerID, ProductID, Price, Stock) VALUES
  -- Metro Outfitters (ID 4) - apparel + accessories focus
  (4, 1, 199.99, 25),   -- Premium Leather Jacket
  (4, 9, 29.99, 100),   -- Organic Cotton T-Shirt
  (4, 10, 49.99, 75),   -- Performance Running Shorts
  (4, 11, 89.99, 50),   -- Merino Wool Thermal Layers
  (4, 4, 79.99, 40),    -- Titanium Water Bottle
  -- Tech Hub Store (ID 5) - tech + equipment focus
  (5, 5, 1499.99, 8),   -- Atlas Servo X200
  (5, 6, 3999.99, 5),   -- Modular Control Hub
  (5, 3, 349.99, 20),   -- Wireless Headphones
  (5, 2, 249.99, 15),   -- Carbon Trek Backpack
  (5, 7, 2499.99, 6),   -- Industrial Motion Controller
  -- Urban Gear Boutique (ID 6) - mixed / outdoor focus
  (6, 1, 189.99, 30),   -- Premium Leather Jacket
  (6, 2, 259.99, 18),   -- Carbon Trek Backpack
  (6, 12, 69.99, 60),   -- Summer Linen Shirt
  (6, 10, 54.99, 80),   -- Performance Running Shorts
  (6, 8, 5499.99, 3)    -- Precision Robot Gripper
;
INSERT INTO Orders (OrderID, CustomerID, RetailerID, DistributorID, OrderDate, ShippingAddress, Status) VALUES
  (1, 10, 4, 7, '2025-10-25 09:15:00', '123 Grove Lane, City', 'Delivered'),
  (2, 11, 5, 8, '2025-10-26 10:30:00', '456 Lake Road, City', 'Shipped'),
  (3, 12, 4, NULL, '2025-10-27 11:00:00', '789 Oak Street, Suburbs', 'Pending'),
  (4, 13, 6, 9, '2025-10-28 14:45:00', '321 Pine Ave, Downtown', 'Assigned'),
  (5, 14, 5, 7, '2025-10-29 08:20:00', '654 Elm Park, Riverside', 'Shipped'),
  (6, 10, 6, 8, '2025-10-30 13:50:00', '123 Grove Lane, City', 'Delivered'),
  (7, 11, 4, NULL, '2025-10-31 09:00:00', '456 Lake Road, City', 'Pending');

-- Order Items detailing what each customer ordered
-- RetailerProductID mapping:
-- RetailerProducts auto-increments from 1:
-- 1-5: Metro (4) with products 1,9,10,11,4
-- 6-10: Tech Hub (5) with products 5,6,3,2,7
-- 11-16: Urban (6) with products 1,2,12,10,8
INSERT INTO OrderItems (OrderItemID, OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase) VALUES
  -- Order 1: Amelia Rivera (Delivered) - jacket + t-shirt from Metro (RetailerProductID 1, 2)
  (1, 1, 1, 1, 199.99),   -- 1x Premium Leather Jacket
  (2, 1, 2, 2, 29.99),    -- 2x Organic Cotton T-Shirt
  -- Order 2: Liam Patel (Shipped) - tech items from Tech Hub (RetailerProductID 8, 9)
  (3, 2, 8, 1, 349.99),   -- 1x Wireless Headphones
  (4, 2, 9, 1, 249.99),   -- 1x Carbon Trek Backpack
  -- Order 3: Sophia Chen (Pending) - athletic wear from Metro (RetailerProductID 3, 4)
  (5, 3, 3, 2, 49.99),    -- 2x Performance Running Shorts
  (6, 3, 4, 1, 89.99),    -- 1x Merino Wool Thermal Layers
  -- Order 4: Marcus Johnson (Assigned) - mixed gear from Urban (RetailerProductID 11, 13)
  (7, 4, 11, 1, 189.99),  -- 1x Premium Leather Jacket
  (8, 4, 13, 1, 69.99),   -- 1x Summer Linen Shirt
  -- Order 5: Isabella Santos (Shipped) - industrial equipment from Tech Hub (RetailerProductID 6)
  (9, 5, 6, 1, 1499.99),  -- 1x Atlas Servo X200
  -- Order 6: Amelia Rivera (Delivered) - backpack + shorts from Urban (RetailerProductID 12, 14)
  (10, 6, 12, 1, 259.99), -- 1x Carbon Trek Backpack
  (11, 6, 14, 3, 54.99),  -- 3x Performance Running Shorts
  -- Order 7: Liam Patel (Pending) - water bottle from Metro (RetailerProductID 5)
  (12, 7, 5, 2, 79.99)    -- 2x Titanium Water Bottle