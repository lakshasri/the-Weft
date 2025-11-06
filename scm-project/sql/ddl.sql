-- DDL Script for SCM Project

-- Ensure legacy FKs don't block drops when upgrading schema
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they already exist
DROP TABLE IF EXISTS OrderDetails; -- legacy table from previous schema
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS RetailerProducts;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Users (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Email VARCHAR(255) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  FullName VARCHAR(100),
  Address TEXT,
  Role ENUM('Customer', 'Manufacturer', 'Retailer', 'Distributor') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Master products defined by Manufacturers; not directly sold to customers
CREATE TABLE Products (
  ProductID INT AUTO_INCREMENT PRIMARY KEY,
  ProductName VARCHAR(255) NOT NULL,
  Description TEXT,
  ManufacturerID INT NOT NULL,
  CONSTRAINT fk_products_manufacturer FOREIGN KEY (ManufacturerID)
    REFERENCES Users(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A Retailer decides to stock a master product with its own price and stock
CREATE TABLE RetailerProducts (
  RetailerProductID INT AUTO_INCREMENT PRIMARY KEY,
  RetailerID INT NOT NULL,
  ProductID INT NOT NULL,
  Price DECIMAL(10, 2) NOT NULL,
  Stock INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_retailer_product (RetailerID, ProductID),
  CONSTRAINT fk_rp_retailer FOREIGN KEY (RetailerID) REFERENCES Users(UserID),
  CONSTRAINT fk_rp_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders are placed with a specific Retailer, and may be assigned to a Distributor
CREATE TABLE Orders (
  OrderID INT AUTO_INCREMENT PRIMARY KEY,
  CustomerID INT NOT NULL,
  RetailerID INT NOT NULL,
  DistributorID INT NULL,
  OrderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ShippingAddress VARCHAR(255) NOT NULL,
  Status ENUM('Pending', 'Assigned', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  CONSTRAINT fk_orders_customer FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
  CONSTRAINT fk_orders_retailer FOREIGN KEY (RetailerID) REFERENCES Users(UserID),
  CONSTRAINT fk_orders_distributor FOREIGN KEY (DistributorID) REFERENCES Users(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Line items: link to RetailerProducts since customers buy from retailers
CREATE TABLE OrderItems (
  OrderItemID INT AUTO_INCREMENT PRIMARY KEY,
  OrderID INT NOT NULL,
  RetailerProductID INT NOT NULL,
  Quantity INT NOT NULL,
  UnitPriceAtPurchase DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_orderitems_order FOREIGN KEY (OrderID)
    REFERENCES Orders(OrderID) ON DELETE CASCADE,
  CONSTRAINT fk_orderitems_rp FOREIGN KEY (RetailerProductID)
    REFERENCES RetailerProducts(RetailerProductID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;