-- DML Script for SCM Project (expanded roles and flows)

-- Users across all roles (passwords use same demo hash)
-- Hash corresponds to password: demo123 (keep for local testing)
INSERT INTO Users (UserID, Email, Password, FullName, Address, Role) VALUES
  (1, 'supply@veridian-components.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Veridian Components', '800 Manufacturing Plaza, Tech City', 'Manufacturer'),
  (2, 'contact@atlasfab.io',        '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Atlas Fabrication Labs', '455 Foundry Loop, Innovation Park', 'Manufacturer'),
  (3, 'retail@metro-outfitters.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Metro Outfitters', '99 Market Street, Downtown', 'Retailer'),
  (4, 'retail@tech-hub.store',      '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Tech Hub Store', '12 Innovation Ave, Midtown', 'Retailer'),
  (5, 'ops@speedy-ship.io',         '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Speedy Ship Inc.', '700 Logistics Park, Crossdock', 'Distributor'),
  (6, 'dispatch@northline-log.com', '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'NorthLine Logistics', '400 Carrier Blvd, Industrial', 'Distributor'),
  (7, 'amelia.rivera@example.com',  '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Amelia Rivera', '123 Grove Lane, City', 'Customer'),
  (8, 'liam.patel@example.com',     '$2a$10$.dtHzQF2nNdUodeu6daRTuDwttJYLCEEgC0eVjqBeDkzKlYpgrY.a', 'Liam Patel', '456 Lake Road, City', 'Customer');

-- Master Products (manufacturers only; no price/stock here)
INSERT INTO Products (ProductID, ProductName, Description, ManufacturerID) VALUES
  (1, 'Premium Leather Jacket', 'Full-grain leather, tailored fit.', 1),
  (2, 'Carbon Trek Backpack', 'Ultra-light carbon fiber shell.', 1),
  (3, 'Atlas Servo X200', 'High-torque servo with digital encoder.', 2),
  (4, 'Modular Control Hub', 'Edge-compute hub for automation cells.', 2);

-- Retailer stocks products with own price and stock
INSERT INTO RetailerProducts (RetailerProductID, RetailerID, ProductID, Price, Stock) VALUES
  (1, 3, 1, 250.00, 50),
  (2, 3, 2, 179.00, 30),
  (3, 4, 3, 329.99, 25),
  (4, 4, 4, 499.00, 40);

-- Example Orders flow
-- Customer 7 buys one jacket (RetailerProductID=1) from Retailer 3, assigned to Distributor 5
INSERT INTO Orders (OrderID, CustomerID, RetailerID, DistributorID, OrderDate, ShippingAddress, Status) VALUES
  (1, 7, 3, 5, '2025-10-25 09:15:00', '123 Grove Lane, City', 'Assigned'),
  (2, 8, 4, NULL, '2025-10-28 14:45:00', '456 Lake Road, City', 'Pending');

INSERT INTO OrderItems (OrderItemID, OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase) VALUES
  (1, 1, 1, 1, 250.00),
  (2, 2, 4, 2, 499.00);