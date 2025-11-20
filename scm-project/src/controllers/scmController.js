const pool = require('../db/connection');

/* =========================
   Directory Endpoints
========================= */
exports.listManufacturers = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, m.CompanyName as FullName, u.Email, m.Address 
       FROM Users u 
       JOIN Manufacturers m ON u.UserID = m.UserID 
       WHERE u.Role = 'Manufacturer' 
       ORDER BY m.CompanyName ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('listManufacturers error:', e);
    res.status(500).json({ message: 'Failed to list manufacturers.' });
  }
};

exports.listRetailers = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, r.BusinessName as FullName, u.Email, r.Address 
       FROM Users u 
       JOIN Retailers r ON u.UserID = r.UserID 
       WHERE u.Role = 'Retailer' 
       ORDER BY r.BusinessName ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('listRetailers error:', e);
    res.status(500).json({ message: 'Failed to list retailers.' });
  }
};

exports.listDistributors = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT d.DistributorID, u.UserID, d.CompanyName as FullName, u.Email, d.Address 
       FROM Users u 
       JOIN Distributors d ON u.UserID = d.UserID 
       WHERE u.Role = 'Distributor' 
       ORDER BY d.CompanyName ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('listDistributors error:', e);
    res.status(500).json({ message: 'Failed to list distributors.' });
  }
};

/* =========================
   Master Products
========================= */
exports.getMasterProducts = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        p.ProductID, 
        p.ProductName, 
        p.Description, 
        p.ManufacturerID, 
        m.CompanyName AS ManufacturerName,
        AVG(ms.WholesalePrice) AS AvgManufacturerPrice,
        MIN(ms.WholesalePrice) AS MinManufacturerPrice,
        MAX(ms.WholesalePrice) AS MaxManufacturerPrice,
        COUNT(ms.SaleID) AS PriceDataPoints,
        CASE 
          WHEN COUNT(ms.SaleID) > 0 THEN 'Available'
          ELSE 'Contact Manufacturer'
        END AS PriceAvailability
       FROM Products p
       JOIN Manufacturers m ON m.ManufacturerID = p.ManufacturerID
       LEFT JOIN ManufacturerSales ms ON p.ProductID = ms.ProductID
       GROUP BY p.ProductID, p.ProductName, p.Description, p.ManufacturerID, m.CompanyName
       ORDER BY p.ProductName ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('getMasterProducts error:', e);
    res.status(500).json({ message: 'Failed to retrieve master products.' });
  }
};

exports.getMasterProductsByManufacturer = async (req, res) => {
  const { id } = req.params; // This is UserID
  try {
    // First get the ManufacturerID from the UserID
    const [manufacturerRows] = await pool.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [id]
    );
    
    if (manufacturerRows.length === 0) {
      return res.status(404).json({ message: 'Manufacturer not found.' });
    }
    
    const manufacturerID = manufacturerRows[0].ManufacturerID;
    
    const [rows] = await pool.execute(
      `SELECT ProductID, ProductName, Description, ManufacturerID, 
              ManufacturerPrice, MinOrderQuantity, ProductionCapacity, 
              LeadTimeDays, Status
       FROM Products WHERE ManufacturerID = ? ORDER BY ProductName ASC`,
      [manufacturerID]
    );
    res.json(rows);
  } catch (e) {
    console.error('getMasterProductsByManufacturer error:', e);
    res.status(500).json({ message: 'Failed to retrieve manufacturer master products.' });
  }
};

exports.createMasterProduct = async (req, res) => {
  const { ProductName, Description, ManufacturerID, ManufacturerPrice, MinOrderQuantity, ProductionCapacity, LeadTimeDays } = req.body;
  if (!ProductName || !ManufacturerID) {
    return res.status(400).json({ message: 'Product name and manufacturer ID required.' });
  }
  
  // Validate pricing and production data
  if (ManufacturerPrice !== undefined && (isNaN(ManufacturerPrice) || ManufacturerPrice < 0)) {
    return res.status(400).json({ message: 'Invalid manufacturer price.' });
  }
  if (MinOrderQuantity !== undefined && (isNaN(MinOrderQuantity) || MinOrderQuantity < 1)) {
    return res.status(400).json({ message: 'Minimum order quantity must be at least 1.' });
  }
  if (ProductionCapacity !== undefined && (isNaN(ProductionCapacity) || ProductionCapacity < 0)) {
    return res.status(400).json({ message: 'Invalid production capacity.' });
  }
  if (LeadTimeDays !== undefined && (isNaN(LeadTimeDays) || LeadTimeDays < 0)) {
    return res.status(400).json({ message: 'Invalid lead time.' });
  }
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Get the actual ManufacturerID from the UserID
    const [manufacturerRows] = await conn.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [ManufacturerID] // This is actually the UserID passed from frontend
    );
    
    if (manufacturerRows.length === 0) {
      throw new Error('Manufacturer not found.');
    }
    
    const actualManufacturerID = manufacturerRows[0].ManufacturerID;
    
    // Create the product with enhanced fields
    const [result] = await conn.execute(
      `INSERT INTO Products (
        ProductName, Description, ManufacturerID, ManufacturerPrice, 
        MinOrderQuantity, ProductionCapacity, LeadTimeDays, Status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        ProductName, 
        Description || null, 
        actualManufacturerID,
        ManufacturerPrice || null,
        MinOrderQuantity || 1,
        ProductionCapacity || null,
        LeadTimeDays || null
      ]
    );
    
    const productId = result.insertId;
    
    // Initialize manufacturer inventory
    await conn.execute(
      `INSERT INTO ManufacturerInventory (ManufacturerID, ProductID, QuantityAvailable, QuantityProduced, ProductionCost)
       VALUES (?, ?, 0, 0, ?)`,
      [actualManufacturerID, productId, ManufacturerPrice ? ManufacturerPrice * 0.6 : 0]
    );
    
    await conn.commit();
    
    res.status(201).json({
      success: true,
      product: { 
        ProductID: productId, 
        ProductName, 
        Description: Description || null, 
        ManufacturerID: actualManufacturerID,
        ManufacturerPrice: ManufacturerPrice || null,
        MinOrderQuantity: MinOrderQuantity || 1,
        ProductionCapacity: ProductionCapacity || null,
        LeadTimeDays: LeadTimeDays || null,
        Status: 'Active'
      },
    });
  } catch (e) {
    await conn.rollback();
    console.error('createMasterProduct error:', e);
    res.status(500).json({ message: e.message || 'Failed to create master product.' });
  } finally {
    conn.release();
  }
};

exports.getManufacturerProductAnalytics = async (req, res) => {
  const { id } = req.params; // This is UserID
  try {
    // First get the ManufacturerID from the UserID
    const [manufacturerRows] = await pool.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [id]
    );
    
    if (manufacturerRows.length === 0) {
      return res.status(404).json({ message: 'Manufacturer not found.' });
    }
    
    const manufacturerID = manufacturerRows[0].ManufacturerID;
    
    const [analytics] = await pool.execute(
      `SELECT 
        p.ProductID,
        p.ProductName,
        p.Description,
        COUNT(DISTINCT rp.RetailerID) AS TotalRetailers,
        SUM(rp.Stock) AS TotalStock,
        AVG(rp.Price) AS AvgPrice,
        MIN(rp.Price) AS MinPrice,
        MAX(rp.Price) AS MaxPrice,
        GROUP_CONCAT(DISTINCT r.BusinessName ORDER BY r.BusinessName SEPARATOR ', ') AS RetailerNames
       FROM Products p
       LEFT JOIN RetailerProducts rp ON rp.ProductID = p.ProductID
       LEFT JOIN Retailers r ON r.RetailerID = rp.RetailerID
       WHERE p.ManufacturerID = ?
       GROUP BY p.ProductID, p.ProductName, p.Description
       ORDER BY p.ProductName ASC`,
      [manufacturerID]
    );
    res.json(analytics);
  } catch (e) {
    console.error('getManufacturerProductAnalytics error:', e);
    res.status(500).json({ message: 'Failed to retrieve product analytics.' });
  }
};

/* =========================
   Retailer Inventory & Catalog
========================= */
exports.getCatalog = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT rp.RetailerProductID, rp.Price, rp.Stock, r.BusinessName AS RetailerName,
              rp.RetailerID,
              p.ProductID, p.ProductName, p.Description, p.ManufacturerID, m.CompanyName AS ManufacturerName
       FROM RetailerProducts rp
       JOIN Retailers r ON r.RetailerID = rp.RetailerID
       JOIN Products p ON p.ProductID = rp.ProductID
       JOIN Manufacturers m ON m.ManufacturerID = p.ManufacturerID
       ORDER BY p.ProductName ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('getCatalog error:', e);
    res.status(500).json({ message: 'Failed to retrieve catalog.' });
  }
};

exports.getRetailerInventory = async (req, res) => {
  const { id } = req.params; // This is UserID
  try {
    // Get the actual RetailerID from the UserID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [id]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const actualRetailerID = retailerRows[0].RetailerID;
    
    const [rows] = await pool.execute(
      `SELECT rp.RetailerProductID, rp.Price, rp.Stock, rp.RetailerID,
              p.ProductID, p.ProductName, p.Description, p.ManufacturerID
       FROM RetailerProducts rp
       JOIN Products p ON p.ProductID = rp.ProductID
       WHERE rp.RetailerID = ?
       ORDER BY p.ProductName ASC`,
      [actualRetailerID]
    );
    res.json(rows);
  } catch (e) {
    console.error('getRetailerInventory error:', e);
    res.status(500).json({ message: 'Failed to retrieve retailer inventory.' });
  }
};

exports.upsertRetailerProduct = async (req, res) => {
  const { RetailerID, ProductID, Price, Stock } = req.body;
  if (!RetailerID || !ProductID || Price == null || Stock == null) {
    return res.status(400).json({ message: 'Retailer, product, price, and stock required.' });
  }
  try {
    // Get the actual RetailerID from the UserID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID as ActualRetailerID FROM Retailers WHERE UserID = ?`,
      [RetailerID] // This is actually the UserID from frontend
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const actualRetailerID = retailerRows[0].ActualRetailerID;
    
    const priceNum = Number(Price);
    const stockNum = parseInt(Stock, 10);
    if (Number.isNaN(priceNum) || priceNum < 0 || Number.isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: 'Invalid price or stock values.' });
    }
    // Insert or update
    const [existing] = await pool.execute(
      `SELECT RetailerProductID FROM RetailerProducts WHERE RetailerID = ? AND ProductID = ?`,
      [actualRetailerID, ProductID]
    );
    let id;
    if (existing.length) {
      id = existing[0].RetailerProductID;
      await pool.execute(
        `UPDATE RetailerProducts SET Price = ?, Stock = ? WHERE RetailerProductID = ?`,
        [priceNum, stockNum, id]
      );
    } else {
      const [result] = await pool.execute(
        `INSERT INTO RetailerProducts (RetailerID, ProductID, Price, Stock) VALUES (?, ?, ?, ?)`,
        [actualRetailerID, ProductID, priceNum, stockNum]
      );
      id = result.insertId;
    }
    res.status(201).json({ success: true, RetailerProductID: id, Price: priceNum, Stock: stockNum });
  } catch (e) {
    console.error('upsertRetailerProduct error:', e);
    res.status(500).json({ message: 'Failed to stock product.' });
  }
};

/* =========================
   Orders & Fulfillment
========================= */
exports.getOrdersByCustomer = async (req, res) => {
  const { id } = req.params; // This is UserID
  try {
    // Get the actual CustomerID from the UserID
    const [customerRows] = await pool.execute(
      `SELECT CustomerID FROM Customers WHERE UserID = ?`,
      [id]
    );
    
    if (customerRows.length === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    
    const actualCustomerID = customerRows[0].CustomerID;
    
    const [rows] = await pool.execute(
      `SELECT o.OrderID, o.OrderDate, o.ShippingAddress, o.Status,
              o.RetailerID, ret.BusinessName AS RetailerName, o.DistributorID, d.CompanyName AS DistributorName,
              oi.OrderItemID, oi.Quantity, oi.UnitPriceAtPurchase,
              rp.RetailerProductID, p.ProductName
       FROM Orders o
       JOIN Retailers ret ON ret.RetailerID = o.RetailerID
       LEFT JOIN Distributors d ON d.DistributorID = o.DistributorID
       JOIN OrderItems oi ON oi.OrderID = o.OrderID
       JOIN RetailerProducts rp ON rp.RetailerProductID = oi.RetailerProductID
       JOIN Products p ON p.ProductID = rp.ProductID
       WHERE o.CustomerID = ?
       ORDER BY o.OrderDate DESC, oi.OrderItemID ASC`,
      [actualCustomerID]
    );
    res.json(rows);
  } catch (e) {
    console.error('getOrdersByCustomer error:', e);
    res.status(500).json({ message: 'Failed to retrieve customer orders.' });
  }
};

exports.getOrdersByRetailer = async (req, res) => {
  const { id } = req.params; // This is UserID
  try {
    // Get the actual RetailerID from the UserID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [id]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const actualRetailerID = retailerRows[0].RetailerID;
    
    const [rows] = await pool.execute(
      `SELECT o.OrderID, o.OrderDate, o.ShippingAddress, o.Status,
              c.FullName AS CustomerName, o.DistributorID, d.CompanyName AS DistributorName,
              oi.OrderItemID, oi.Quantity, oi.UnitPriceAtPurchase,
              rp.RetailerProductID, p.ProductName
       FROM Orders o
       JOIN Customers c ON c.CustomerID = o.CustomerID
       LEFT JOIN Distributors d ON d.DistributorID = o.DistributorID
       JOIN OrderItems oi ON oi.OrderID = o.OrderID
       JOIN RetailerProducts rp ON rp.RetailerProductID = oi.RetailerProductID
       JOIN Products p ON p.ProductID = rp.ProductID
       WHERE o.RetailerID = ?
       ORDER BY o.OrderDate DESC, oi.OrderItemID ASC`,
      [actualRetailerID]
    );
    res.json(rows);
  } catch (e) {
    console.error('getOrdersByRetailer error:', e);
    res.status(500).json({ message: 'Failed to retrieve retailer orders.' });
  }
};

exports.getOrdersByDistributor = async (req, res) => {
  const { id } = req.params; // This is UserID
  try {
    // Get the actual DistributorID from the UserID
    const [distributorRows] = await pool.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [id]
    );
    
    if (distributorRows.length === 0) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }
    
    const actualDistributorID = distributorRows[0].DistributorID;
    
    const [rows] = await pool.execute(
      `SELECT o.OrderID, o.OrderDate, o.ShippingAddress, o.Status,
              cust.FullName AS CustomerName, ret.BusinessName AS RetailerName,
              oi.OrderItemID, oi.Quantity, oi.UnitPriceAtPurchase,
              p.ProductName
       FROM Orders o
       JOIN Customers c ON c.CustomerID = o.CustomerID
       JOIN Users cust ON cust.UserID = c.UserID
       JOIN Retailers r ON r.RetailerID = o.RetailerID
       JOIN Users ret ON ret.UserID = r.UserID
       JOIN OrderItems oi ON oi.OrderID = o.OrderID
       JOIN RetailerProducts rp ON rp.RetailerProductID = oi.RetailerProductID
       JOIN Products p ON p.ProductID = rp.ProductID
       WHERE o.DistributorID = ?
       ORDER BY o.OrderDate DESC, oi.OrderItemID ASC`,
      [actualDistributorID]
    );
    res.json(rows);
  } catch (e) {
    console.error('getOrdersByDistributor error:', e);
    res.status(500).json({ message: 'Failed to retrieve distributor orders.' });
  }
};

exports.createOrder = async (req, res) => {
  const { CustomerID, RetailerID, ShippingAddress, items } = req.body;
  if (!CustomerID || !RetailerID || !ShippingAddress || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Customer, retailer, shipping address, and items required.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // CustomerID from frontend is UserID, RetailerID from frontend is actual RetailerID
    const [customerRows] = await conn.execute(
      `SELECT CustomerID as ActualCustomerID FROM Customers WHERE UserID = ?`,
      [CustomerID] // This is UserID from frontend
    );
    const [retailerRows] = await conn.execute(
      `SELECT RetailerID as ActualRetailerID FROM Retailers WHERE RetailerID = ?`,
      [RetailerID] // This is actual RetailerID from frontend
    );
    
    if (customerRows.length === 0) {
      throw new Error('Customer not found.');
    }
    if (retailerRows.length === 0) {
      throw new Error('Retailer not found.');
    }
    
    const actualCustomerID = customerRows[0].ActualCustomerID;
    const actualRetailerID = retailerRows[0].ActualRetailerID;
    
    const [orderResult] = await conn.execute(
      `INSERT INTO Orders (CustomerID, RetailerID, ShippingAddress) VALUES (?, ?, ?)`,
      [actualCustomerID, actualRetailerID, ShippingAddress]
    );
    const orderId = orderResult.insertId;
    for (const item of items) {
      const { RetailerProductID, Quantity } = item;
      if (!RetailerProductID || !Quantity || Quantity <= 0) {
        throw new Error('Invalid item provided.');
      }
      const [rpRows] = await conn.execute(
        `SELECT RetailerProductID, Stock, Price FROM RetailerProducts WHERE RetailerProductID = ? FOR UPDATE`,
        [RetailerProductID]
      );
      if (!rpRows.length) throw new Error(`Retailer product ${RetailerProductID} not found.`);
      const rp = rpRows[0];
      if (rp.Stock < Quantity) throw new Error(`Insufficient stock for item ${RetailerProductID}.`);
      await conn.execute(
        `UPDATE RetailerProducts SET Stock = Stock - ? WHERE RetailerProductID = ?`,
        [Quantity, RetailerProductID]
      );
      await conn.execute(
        `INSERT INTO OrderItems (OrderID, RetailerProductID, Quantity, UnitPriceAtPurchase)
         VALUES (?, ?, ?, ?)`,
        [orderId, RetailerProductID, Quantity, rp.Price]
      );
    }
    await conn.commit();
    res.status(201).json({ success: true, OrderID: orderId });
  } catch (e) {
    await conn.rollback();
    console.error('createOrder error:', e);
    res.status(400).json({ message: e.message || 'Failed to create order.' });
  } finally {
    conn.release();
  }
};

exports.assignOrderDistributor = async (req, res) => {
  const { orderId } = req.params;
  const { DistributorID } = req.body;
  if (!DistributorID) return res.status(400).json({ message: 'DistributorID required.' });
  try {
    const [result] = await pool.execute(
      `UPDATE Orders SET DistributorID = ?, Status = 'Assigned' WHERE OrderID = ?`,
      [DistributorID, orderId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Order not found.' });
    res.json({ success: true });
  } catch (e) {
    console.error('assignOrderDistributor error:', e);
    res.status(500).json({ message: 'Failed to assign distributor.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { Status } = req.body;
  const allowed = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(Status)) return res.status(400).json({ message: 'Invalid status.' });
  try {
    const [result] = await pool.execute(
      `UPDATE Orders SET Status = ? WHERE OrderID = ?`,
      [Status, orderId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Order not found.' });
    res.json({ success: true });
  } catch (e) {
    console.error('updateOrderStatus error:', e);
    res.status(500).json({ message: 'Failed to update status.' });
  }
};

// (legacy createOrder removed; new version above)

/* =========================
   Advanced Database Features
========================= */

// Get retailer's total stock value using database function
exports.getRetailerStockValue = async (req, res) => {
  const { id: userId } = req.params; // This is UserID
  try {
    // Get the actual RetailerID from the UserID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [userId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const actualRetailerID = retailerRows[0].RetailerID;
    
    const [result] = await pool.execute(
      'SELECT GetRetailerStockValue(?) as StockValue',
      [actualRetailerID]
    );
    res.json({ 
      retailerId: parseInt(userId),
      stockValue: result[0].StockValue || 0
    });
  } catch (e) {
    console.error('getRetailerStockValue error:', e);
    res.status(500).json({ message: 'Failed to get stock value.' });
  }
};

// Get low stock products using stored procedure
exports.getLowStockProducts = async (req, res) => {
  const { id: userId } = req.params; // This is UserID
  try {
    // Get the actual RetailerID from the UserID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [userId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const actualRetailerID = retailerRows[0].RetailerID;
    
    const [results] = await pool.execute(
      'CALL CheckLowStockProducts(?)',
      [actualRetailerID]
    );
    // Results from stored procedure are in results[0]
    res.json(results[0] || []);
  } catch (e) {
    console.error('getLowStockProducts error:', e);
    res.status(500).json({ message: 'Failed to check low stock.' });
  }
};



// Create order using validated stored procedure
exports.createValidatedOrder = async (req, res) => {
  const { customerId, retailerId, shippingAddress, productId, quantity } = req.body;
  
  if (!customerId || !retailerId || !shippingAddress || !productId || !quantity) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  
  try {
    // Convert UserIDs to actual entity IDs
    const [customerRows] = await pool.execute(
      `SELECT CustomerID FROM Customers WHERE UserID = ?`,
      [customerId] // This is actually UserID from frontend
    );
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE RetailerID = ?`,
      [retailerId] // This is actual RetailerID from frontend
    );
    
    if (customerRows.length === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const actualCustomerID = customerRows[0].CustomerID;
    const actualRetailerID = retailerRows[0].RetailerID;
    
    const [results] = await pool.execute(
      'CALL ProcessOrderWithValidation(?, ?, ?, ?, ?, @order_id, @result_message)',
      [actualCustomerID, actualRetailerID, shippingAddress, productId, quantity]
    );
    
    // Get the output parameters
    const [outputs] = await pool.execute(
      'SELECT @order_id as orderId, @result_message as message'
    );
    
    const { orderId, message } = outputs[0];
    
    if (orderId === -1) {
      return res.status(400).json({ message: message });
    }
    
    res.json({ 
      success: true,
      orderId: orderId,
      message: message
    });
    
  } catch (e) {
    console.error('createValidatedOrder error:', e);
    res.status(500).json({ message: 'Failed to create validated order.' });
  }
};

// New functions for wholesale pricing and profit analysis
exports.getRetailerProfitAnalysis = async (req, res) => {
  try {
    const retailerId = req.params.id;
    
    // Get actual RetailerID from UserID if needed
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ? OR RetailerID = ?`,
      [retailerId, retailerId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const actualRetailerID = retailerRows[0].RetailerID;
    
    const [results] = await pool.execute(`
      SELECT 
        p.ProductName,
        p.ProductID,
        rp.Price as RetailPrice,
        ms.WholesalePrice as ManufacturerSellingPrice,
        COALESCE(ms.WholesalePrice, rp.Price * 0.7) as CostBasis,
        rp.Stock,
        (rp.Price - COALESCE(ms.WholesalePrice, rp.Price * 0.7)) as ProfitPerUnit,
        CASE 
          WHEN COALESCE(ms.WholesalePrice, rp.Price * 0.7) > 0 
          THEN ((rp.Price - COALESCE(ms.WholesalePrice, rp.Price * 0.7)) / COALESCE(ms.WholesalePrice, rp.Price * 0.7) * 100)
          ELSE 0 
        END as ProfitMargin,
        (rp.Stock * (rp.Price - COALESCE(ms.WholesalePrice, rp.Price * 0.7))) as TotalPotentialProfit,
        ms.PurchaseDate,
        m.CompanyName as ManufacturerName,
        CASE 
          WHEN ms.WholesalePrice IS NOT NULL THEN 'Actual Purchase'
          ELSE 'Estimated (70% of retail)'
        END as PriceSource
      FROM Products p
      JOIN RetailerProducts rp ON p.ProductID = rp.ProductID
      JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
      LEFT JOIN ManufacturerSales ms ON p.ProductID = ms.ProductID AND ms.RetailerID = ?
      WHERE rp.RetailerID = ?
      ORDER BY ProfitMargin DESC
    `, [actualRetailerID, actualRetailerID]);
    
    res.json(results);
  } catch (error) {
    console.error('Error getting profit analysis:', error);
    res.status(500).json({ error: 'Failed to get profit analysis' });
  }
};

/* =========================
   STAGE 2: MANUFACTURER TIER IMPLEMENTATION
========================= */

// Update manufacturer pricing for a product
exports.updateManufacturerPrice = async (req, res) => {
  const { productId } = req.params;
  const { ManufacturerPrice } = req.body;
  const userId = req.params.id; // From route parameter
  
  if (!ManufacturerPrice || isNaN(ManufacturerPrice) || ManufacturerPrice < 0) {
    return res.status(400).json({ message: 'Valid manufacturer price required.' });
  }
  
  try {
    // Get the actual ManufacturerID from UserID
    const [manufacturerRows] = await pool.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [userId]
    );
    
    if (manufacturerRows.length === 0) {
      return res.status(404).json({ message: 'Manufacturer not found.' });
    }
    
    const actualManufacturerID = manufacturerRows[0].ManufacturerID;
    
    // Update the product price (only if it belongs to this manufacturer)
    const [result] = await pool.execute(
      `UPDATE Products 
       SET ManufacturerPrice = ?, LastUpdated = NOW()
       WHERE ProductID = ? AND ManufacturerID = ?`,
      [ManufacturerPrice, productId, actualManufacturerID]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found or unauthorized.' });
    }
    
    // Update production cost in inventory (typically 60% of wholesale price)
    await pool.execute(
      `UPDATE ManufacturerInventory 
       SET ProductionCost = ?
       WHERE ManufacturerID = ? AND ProductID = ?`,
      [ManufacturerPrice * 0.6, actualManufacturerID, productId]
    );
    
    res.json({ 
      success: true, 
      message: 'Price updated successfully',
      ManufacturerPrice: ManufacturerPrice
    });
  } catch (e) {
    console.error('updateManufacturerPrice error:', e);
    res.status(500).json({ message: 'Failed to update price.' });
  }
};

// Update manufacturer inventory (add production)
exports.updateManufacturerInventory = async (req, res) => {
  const { productId } = req.params;
  const { QuantityProduced } = req.body;
  const userId = req.params.id;
  
  if (!QuantityProduced || isNaN(QuantityProduced) || QuantityProduced <= 0) {
    return res.status(400).json({ message: 'Valid quantity produced required.' });
  }
  
  try {
    const [manufacturerRows] = await pool.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [userId]
    );
    
    if (manufacturerRows.length === 0) {
      return res.status(404).json({ message: 'Manufacturer not found.' });
    }
    
    const actualManufacturerID = manufacturerRows[0].ManufacturerID;
    
    // Verify the product belongs to this manufacturer
    const [productCheck] = await pool.execute(
      `SELECT ProductID FROM Products WHERE ProductID = ? AND ManufacturerID = ?`,
      [productId, actualManufacturerID]
    );
    
    if (productCheck.length === 0) {
      return res.status(404).json({ message: 'Product not found or unauthorized.' });
    }
    
    // Update inventory
    const [result] = await pool.execute(
      `UPDATE ManufacturerInventory 
       SET QuantityAvailable = QuantityAvailable + ?,
           QuantityProduced = QuantityProduced + ?,
           LastRestocked = NOW()
       WHERE ManufacturerID = ? AND ProductID = ?`,
      [QuantityProduced, QuantityProduced, actualManufacturerID, productId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }
    
    // Get updated inventory
    const [inventory] = await pool.execute(
      `SELECT QuantityAvailable, QuantityProduced, QuantityReserved 
       FROM ManufacturerInventory 
       WHERE ManufacturerID = ? AND ProductID = ?`,
      [actualManufacturerID, productId]
    );
    
    res.json({ 
      success: true, 
      message: 'Inventory updated successfully',
      inventory: inventory[0]
    });
  } catch (e) {
    console.error('updateManufacturerInventory error:', e);
    res.status(500).json({ message: 'Failed to update inventory.' });
  }
};

// Get manufacturer inventory
exports.getManufacturerInventory = async (req, res) => {
  const userId = req.params.id;
  
  try {
    const [manufacturerRows] = await pool.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [userId]
    );
    
    if (manufacturerRows.length === 0) {
      return res.status(404).json({ message: 'Manufacturer not found.' });
    }
    
    const actualManufacturerID = manufacturerRows[0].ManufacturerID;
    
    const [inventory] = await pool.execute(
      `SELECT 
        mi.InventoryID,
        mi.ProductID,
        p.ProductName,
        p.Description,
        p.ManufacturerPrice,
        p.MinOrderQuantity,
        p.ProductionCapacity,
        p.LeadTimeDays,
        p.Status as ProductStatus,
        mi.QuantityAvailable,
        mi.QuantityReserved,
        mi.QuantityProduced,
        mi.ProductionCost,
        mi.LastRestocked,
        (mi.QuantityAvailable - mi.QuantityReserved) as AvailableForSale
       FROM ManufacturerInventory mi
       JOIN Products p ON mi.ProductID = p.ProductID
       WHERE mi.ManufacturerID = ?
       ORDER BY p.ProductName ASC`,
      [actualManufacturerID]
    );
    
    res.json(inventory);
  } catch (e) {
    console.error('getManufacturerInventory error:', e);
    res.status(500).json({ message: 'Failed to retrieve inventory.' });
  }
};

// Get orders placed by distributors to this manufacturer
exports.getManufacturerOrders = async (req, res) => {
  const userId = req.params.id;
  const { status } = req.query; // Optional filter by status
  
  try {
    const [manufacturerRows] = await pool.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [userId]
    );
    
    if (manufacturerRows.length === 0) {
      return res.status(404).json({ message: 'Manufacturer not found.' });
    }
    
    const actualManufacturerID = manufacturerRows[0].ManufacturerID;
    
    let query = `
      SELECT 
        do.OrderID,
        do.DistributorID,
        d.CompanyName as DistributorName,
        do.OrderDate,
        do.Status,
        do.TotalAmount,
        do.PaymentTerms,
        COUNT(doi.OrderItemID) as ItemCount,
        SUM(doi.Quantity) as TotalQuantity
      FROM DistributorOrders do
      JOIN Distributors d ON do.DistributorID = d.DistributorID
      LEFT JOIN DistributorOrderItems doi ON do.OrderID = doi.OrderID
      WHERE do.ManufacturerID = ?`;
    
    const params = [actualManufacturerID];
    
    if (status) {
      query += ` AND do.Status = ?`;
      params.push(status);
    }
    
    query += `
      GROUP BY do.OrderID, do.DistributorID, d.CompanyName, do.OrderDate, do.Status, do.TotalAmount, do.PaymentTerms
      ORDER BY do.OrderDate DESC`;
    
    const [orders] = await pool.execute(query, params);
    
    // Get order items for each order
    for (let order of orders) {
      const [items] = await pool.execute(
        `SELECT 
          doi.OrderItemID,
          doi.ProductID,
          p.ProductName,
          doi.Quantity,
          doi.UnitPrice,
          doi.DeliveredQuantity,
          doi.ItemStatus,
          (doi.Quantity * doi.UnitPrice) as LineTotal
         FROM DistributorOrderItems doi
         JOIN Products p ON doi.ProductID = p.ProductID
         WHERE doi.OrderID = ?
         ORDER BY doi.OrderItemID ASC`,
        [order.OrderID]
      );
      order.items = items;
    }
    
    res.json(orders);
  } catch (e) {
    console.error('getManufacturerOrders error:', e);
    res.status(500).json({ message: 'Failed to retrieve orders.' });
  }
};

// Confirm a distributor order
// Manufacturer confirms distributor order
exports.confirmDistributorOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.params.id;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Get manufacturer ID
    const [manufacturerRows] = await conn.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [userId]
    );
    
    if (manufacturerRows.length === 0) {
      throw new Error('Manufacturer not found.');
    }
    
    const actualManufacturerID = manufacturerRows[0].ManufacturerID;
    
    // Verify order belongs to this manufacturer and is pending
    const [orderRows] = await conn.execute(
      `SELECT OrderID, Status FROM DistributorOrders 
       WHERE OrderID = ? AND ManufacturerID = ? AND Status = 'Pending'`,
      [orderId, actualManufacturerID]
    );
    
    if (orderRows.length === 0) {
      throw new Error('Order not found, unauthorized, or not in pending status.');
    }
    
    // Get order items to check inventory
    const [items] = await conn.execute(
      `SELECT ProductID, Quantity FROM DistributorOrderItems WHERE OrderID = ?`,
      [orderId]
    );
    
    // Check inventory availability
    for (const item of items) {
      const [inventory] = await conn.execute(
        `SELECT QuantityAvailable FROM ManufacturerInventory 
         WHERE ManufacturerID = ? AND ProductID = ?`,
        [actualManufacturerID, item.ProductID]
      );
      
      if (inventory.length === 0 || inventory[0].QuantityAvailable < item.Quantity) {
        throw new Error(`Insufficient inventory for product ${item.ProductID}`);
      }
    }
    
    // Reserve inventory
    for (const item of items) {
      await conn.execute(
        `UPDATE ManufacturerInventory 
         SET QuantityReserved = QuantityReserved + ?,
             QuantityAvailable = QuantityAvailable - ?
         WHERE ManufacturerID = ? AND ProductID = ?`,
        [item.Quantity, item.Quantity, actualManufacturerID, item.ProductID]
      );
    }
    
    // Update order status
    await conn.execute(
      `UPDATE DistributorOrders SET Status = 'Confirmed' WHERE OrderID = ?`,
      [orderId]
    );
    
    // Update order items status
    await conn.execute(
      `UPDATE DistributorOrderItems SET ItemStatus = 'Confirmed' WHERE OrderID = ?`,
      [orderId]
    );
    
    await conn.commit();
    
    res.json({ 
      success: true, 
      message: 'Order confirmed and inventory reserved'
    });
  } catch (e) {
    await conn.rollback();
    console.error('confirmDistributorOrder error:', e);
    res.status(400).json({ message: e.message || 'Failed to confirm order.' });
  } finally {
    conn.release();
  }
};

// Manufacturer ships distributor order
exports.shipDistributorOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.params.id;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Get manufacturer ID
    const [manufacturerRows] = await conn.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [userId]
    );
    
    if (manufacturerRows.length === 0) {
      throw new Error('Manufacturer not found.');
    }
    
    const actualManufacturerID = manufacturerRows[0].ManufacturerID;
    
    // Verify order belongs to this manufacturer and is confirmed
    const [orderRows] = await conn.execute(
      `SELECT OrderID, Status FROM DistributorOrders 
       WHERE OrderID = ? AND ManufacturerID = ? AND Status = 'Confirmed'`,
      [orderId, actualManufacturerID]
    );
    
    if (orderRows.length === 0) {
      throw new Error('Order not found, unauthorized, or not confirmed.');
    }
    
    // Get order items
    const [items] = await conn.execute(
      `SELECT ProductID, Quantity FROM DistributorOrderItems WHERE OrderID = ?`,
      [orderId]
    );
    
    // Release reserved inventory (already deducted from available when confirmed)
    for (const item of items) {
      await conn.execute(
        `UPDATE ManufacturerInventory 
         SET QuantityReserved = QuantityReserved - ?
         WHERE ManufacturerID = ? AND ProductID = ?`,
        [item.Quantity, actualManufacturerID, item.ProductID]
      );
    }
    
    // Update order status
    await conn.execute(
      `UPDATE DistributorOrders SET Status = 'Shipped' WHERE OrderID = ?`,
      [orderId]
    );
    
    // Update order items status
    await conn.execute(
      `UPDATE DistributorOrderItems SET ItemStatus = 'Shipped' WHERE OrderID = ?`,
      [orderId]
    );
    
    await conn.commit();
    
    res.json({ 
      success: true, 
      message: 'Order shipped successfully'
    });
  } catch (e) {
    await conn.rollback();
    console.error('shipDistributorOrder error:', e);
    res.status(400).json({ message: e.message || 'Failed to ship order.' });
  } finally {
    conn.release();
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { Status } = req.body;
  const allowed = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(Status)) return res.status(400).json({ message: 'Invalid status.' });
  try {
    const [result] = await pool.execute(
      `UPDATE Orders SET Status = ? WHERE OrderID = ?`,
      [Status, orderId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Order not found.' });
    res.json({ success: true });
  } catch (e) {
    console.error('updateOrderStatus error:', e);
    res.status(500).json({ message: 'Failed to update status.' });
  }
};

/* =========================
   STAGE 3: DISTRIBUTOR TIER IMPLEMENTATION
================================================ */

// 1. Browse Available Products from Manufacturers
exports.getManufacturerCatalog = async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT 
        p.ProductID, 
        p.ProductName, 
        p.Description, 
        p.ManufacturerPrice,
        p.MinOrderQuantity, 
        p.ProductionCapacity,
        p.LeadTimeDays,
        p.Status,
        m.ManufacturerID,
        m.CompanyName as ManufacturerName,
        COALESCE(mi.QuantityAvailable, 0) as ManufacturerStock,
        COALESCE(mi.QuantityReserved, 0) as QuantityReserved,
        mi.LastRestocked
      FROM Products p
      JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
      LEFT JOIN ManufacturerInventory mi ON p.ProductID = mi.ProductID AND p.ManufacturerID = mi.ManufacturerID
      WHERE p.Status = 'Active'
      ORDER BY m.CompanyName, p.ProductName
    `);
    
    res.json(products);
  } catch (e) {
    console.error('getManufacturerCatalog error:', e);
    res.status(500).json({ message: 'Failed to fetch manufacturer catalog.' });
  }
};

// 2. Create Purchase Order from Manufacturer
exports.createDistributorOrder = async (req, res) => {
  const { ManufacturerID, items, PaymentTerms, Notes } = req.body;
  const distributorUserId = req.params.id;
  
  if (!ManufacturerID || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'ManufacturerID and items are required.' });
  }
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Get distributor ID
    const [distributorRows] = await connection.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [distributorUserId]
    );
    
    if (distributorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Distributor not found.' });
    }
    
    const distributorID = distributorRows[0].DistributorID;
    
    // Calculate total and validate inventory
    let totalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      // Get product details and check manufacturer inventory
      const [productRows] = await connection.execute(
        `SELECT p.ProductID, p.ManufacturerPrice, p.MinOrderQuantity, mi.QuantityAvailable
         FROM Products p
         JOIN ManufacturerInventory mi ON p.ProductID = mi.ProductID
         WHERE p.ProductID = ? AND p.ManufacturerID = ? AND p.Status = 'Active'`,
        [item.ProductID, ManufacturerID]
      );
      
      if (productRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: `Product ${item.ProductID} not found for this manufacturer.` });
      }
      
      const product = productRows[0];
      
      // Check minimum order quantity
      if (item.Quantity < product.MinOrderQuantity) {
        await connection.rollback();
        return res.status(400).json({ 
          message: `Product ${item.ProductID} requires minimum order of ${product.MinOrderQuantity} units.` 
        });
      }
      
      // Check inventory availability
      if (item.Quantity > product.QuantityAvailable) {
        await connection.rollback();
        return res.status(400).json({ 
          message: `Insufficient inventory for product ${item.ProductID}. Available: ${product.QuantityAvailable}, Requested: ${item.Quantity}` 
        });
      }
      
      validatedItems.push({
        ProductID: item.ProductID,
        Quantity: item.Quantity,
        UnitPrice: product.ManufacturerPrice
      });
      
      totalAmount += product.ManufacturerPrice * item.Quantity;
    }
    
    // Calculate expected delivery (assume lead time from first product)
    const [leadTimeRow] = await connection.execute(
      `SELECT LeadTimeDays FROM Products WHERE ProductID = ? AND ManufacturerID = ?`,
      [validatedItems[0].ProductID, ManufacturerID]
    );
    
    const expectedDelivery = new Date();
    const leadTimeDays = (leadTimeRow[0] && leadTimeRow[0].LeadTimeDays) ? leadTimeRow[0].LeadTimeDays : 7;
    expectedDelivery.setDate(expectedDelivery.getDate() + leadTimeDays);
    const expectedDeliveryStr = expectedDelivery.toISOString().split('T')[0];
    
    // Create distributor order
    const [orderResult] = await connection.execute(
      `INSERT INTO DistributorOrders (DistributorID, ManufacturerID, TotalAmount, PaymentTerms, Notes, ExpectedDeliveryDate) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [distributorID, ManufacturerID, totalAmount, PaymentTerms || 'Net 30', Notes || null, expectedDeliveryStr]
    );
    const orderId = orderResult.insertId;
    
    // Add order items
    for (const item of validatedItems) {
      await connection.execute(
        `INSERT INTO DistributorOrderItems (OrderID, ProductID, Quantity, UnitPrice) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.ProductID, item.Quantity, item.UnitPrice]
      );
    }
    
    // Note: Inventory is NOT reserved yet - it will be reserved when manufacturer confirms the order
    
    await connection.commit();
    res.json({ 
      success: true, 
      OrderID: orderId,
      TotalAmount: totalAmount,
      ExpectedDeliveryDate: expectedDeliveryStr,
      message: 'Order created successfully. Waiting for manufacturer confirmation.'
    });
    
  } catch (e) {
    await connection.rollback();
    console.error('createDistributorOrder error:', e);
    res.status(500).json({ message: 'Failed to create order.' });
  } finally {
    connection.release();
  }
};

// 3. Get Distributor's Orders from Manufacturers
exports.getDistributorOrders = async (req, res) => {
  const distributorUserId = req.params.id;
  const status = req.query.status;
  
  try {
    // Get distributor ID
    const [distributorRows] = await pool.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [distributorUserId]
    );
    
    if (distributorRows.length === 0) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }
    
    const distributorID = distributorRows[0].DistributorID;
    
    // Build query with optional status filter
    let query = `
      SELECT 
        dorder.OrderID,
        dorder.OrderDate,
        dorder.Status,
        dorder.TotalAmount,
        dorder.PaymentTerms,
        dorder.Notes,
        dorder.ExpectedDeliveryDate,
        m.ManufacturerID,
        m.CompanyName as ManufacturerName,
        m.Phone as ManufacturerPhone,
        COUNT(doi.OrderItemID) as ItemCount,
        SUM(doi.Quantity) as TotalQuantity
      FROM DistributorOrders dorder
      JOIN Manufacturers m ON dorder.ManufacturerID = m.ManufacturerID
      LEFT JOIN DistributorOrderItems doi ON dorder.OrderID = doi.OrderID
      WHERE dorder.DistributorID = ?`;
    
    const params = [distributorID];
    
    if (status) {
      query += ` AND dorder.Status = ?`;
      params.push(status);
    }
    
    query += `
      GROUP BY dorder.OrderID, dorder.OrderDate, dorder.Status, dorder.TotalAmount, dorder.PaymentTerms, 
               dorder.Notes, dorder.ExpectedDeliveryDate,
               m.ManufacturerID, m.CompanyName, m.Phone
      ORDER BY dorder.OrderDate DESC`;
    
    const [orders] = await pool.execute(query, params);
    
    // Get items for each order
    for (let order of orders) {
      const [items] = await pool.execute(`
        SELECT 
          doi.OrderItemID,
          doi.ProductID,
          p.ProductName,
          doi.Quantity,
          doi.UnitPrice,
          doi.DeliveredQuantity,
          doi.ItemStatus,
          m.CompanyName as ManufacturerName
        FROM DistributorOrderItems doi
        JOIN Products p ON doi.ProductID = p.ProductID
        JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
        WHERE doi.OrderID = ?
        ORDER BY doi.OrderItemID
      `, [order.OrderID]);
      
      order.Items = items;
    }
    
    res.json(orders);
  } catch (e) {
    console.error('getDistributorOrders error:', e);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
};

// 3b. Get Distributor's Sales to Retailers
exports.getDistributorSales = async (req, res) => {
  const distributorUserId = req.params.id;
  const { status } = req.query;
  
  try {
    // Get distributor ID
    const [distributorRows] = await pool.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [distributorUserId]
    );
    
    if (distributorRows.length === 0) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }
    
    const distributorID = distributorRows[0].DistributorID;
    
    // Build query with optional status filter
    let query = `
      SELECT 
        ro.OrderID,
        ro.OrderDate,
        ro.Status,
        ro.TotalAmount,
        ro.PaymentTerms,
        ro.PaymentStatus,
        ro.Notes,
        ro.ExpectedDeliveryDate,
        r.RetailerID,
        r.BusinessName as RetailerName,
        r.Phone as RetailerPhone,
        r.Address as RetailerAddress,
        COUNT(roi.OrderItemID) as ItemCount,
        SUM(roi.Quantity) as TotalUnits
      FROM RetailerOrders ro
      JOIN Retailers r ON ro.RetailerID = r.RetailerID
      LEFT JOIN RetailerOrderItems roi ON ro.OrderID = roi.OrderID
      WHERE ro.DistributorID = ?`;
    
    const params = [distributorID];
    
    if (status) {
      query += ` AND ro.Status = ?`;
      params.push(status);
    }
    
    query += `
      GROUP BY ro.OrderID, ro.OrderDate, ro.Status, ro.TotalAmount, ro.PaymentTerms, 
               ro.PaymentStatus, ro.Notes, ro.ExpectedDeliveryDate,
               r.RetailerID, r.BusinessName, r.Phone, r.Address
      ORDER BY ro.OrderDate DESC`;
    
    const [orders] = await pool.execute(query, params);
    
    // Get items for each order
    for (let order of orders) {
      const [items] = await pool.execute(`
        SELECT 
          roi.OrderItemID,
          roi.ProductID,
          roi.Quantity,
          roi.UnitPrice,
          roi.LineTotal,
          roi.DeliveredQuantity,
          roi.ItemStatus,
          p.ProductName,
          p.Description,
          m.CompanyName as ManufacturerName
        FROM RetailerOrderItems roi
        JOIN Products p ON roi.ProductID = p.ProductID
        JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
        WHERE roi.OrderID = ?
        ORDER BY roi.OrderItemID
      `, [order.OrderID]);
      
      order.Items = items;
    }
    
    res.json(orders);
  } catch (e) {
    console.error('getDistributorSales error:', e);
    res.status(500).json({ message: 'Failed to fetch sales orders.' });
  }
};

// 3c. Receive Distributor Order (from Manufacturer)
exports.receiveDistributorOrder = async (req, res) => {
  const { orderId } = req.params;
  const distributorUserId = req.params.id;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Get distributor ID
    const [distributorRows] = await connection.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [distributorUserId]
    );
    
    if (distributorRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Distributor not found.' });
    }
    
    const distributorID = distributorRows[0].DistributorID;
    
    // Get order details - must be in 'Shipped' status
    const [orderRows] = await connection.execute(
      `SELECT do.OrderID, do.ManufacturerID, do.DistributorID
       FROM DistributorOrders do
       WHERE do.OrderID = ? AND do.DistributorID = ? AND do.Status = 'Shipped'`,
      [orderId, distributorID]
    );
    
    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Order not found, not authorized, or not shipped.' });
    }
    
    const { ManufacturerID } = orderRows[0];
    
    // Get order items
    const [items] = await connection.execute(
      `SELECT ProductID, Quantity, UnitPrice FROM DistributorOrderItems WHERE OrderID = ?`,
      [orderId]
    );
    
    // Update distributor inventory for each item
    for (const item of items) {
      // Insert or update DistributorInventory
      await connection.execute(
        `INSERT INTO DistributorInventory 
         (DistributorID, ProductID, QuantityAvailable, QuantityReserved, PurchasePriceFromManufacturer, SellPriceToRetailer, LastPurchaseDate)
         VALUES (?, ?, ?, 0, ?, NULL, NOW())
         ON DUPLICATE KEY UPDATE 
           QuantityAvailable = QuantityAvailable + VALUES(QuantityAvailable),
           PurchasePriceFromManufacturer = VALUES(PurchasePriceFromManufacturer),
           LastPurchaseDate = VALUES(LastPurchaseDate)`,
        [distributorID, item.ProductID, item.Quantity, item.UnitPrice]
      );
      
      // Update item status
      await connection.execute(
        `UPDATE DistributorOrderItems SET ItemStatus = 'Received', DeliveredQuantity = Quantity WHERE OrderID = ? AND ProductID = ?`,
        [orderId, item.ProductID]
      );
    }
    
    // Update order status
    await connection.execute(
      `UPDATE DistributorOrders SET Status = 'Received' WHERE OrderID = ?`,
      [orderId]
    );
    
    await connection.commit();
    res.json({ success: true, message: 'Order received and inventory updated successfully.' });
    
  } catch (e) {
    await connection.rollback();
    console.error('receiveDistributorOrder error:', e);
    res.status(500).json({ message: 'Failed to receive distributor order.', error: e.message });
  } finally {
    connection.release();
  }
};

// 3d. Confirm Retailer Order (as Distributor)
exports.confirmRetailerOrder = async (req, res) => {
  const { orderId } = req.params;
  const distributorUserId = req.params.id;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Get distributor ID
    const [distributorRows] = await conn.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [distributorUserId]
    );
    
    if (distributorRows.length === 0) {
      throw new Error('Distributor not found.');
    }
    
    const distributorID = distributorRows[0].DistributorID;
    
    // Verify order belongs to this distributor and is pending
    const [orderRows] = await conn.execute(
      `SELECT OrderID, Status FROM RetailerOrders 
       WHERE OrderID = ? AND DistributorID = ? AND Status = 'Pending'`,
      [orderId, distributorID]
    );
    
    if (orderRows.length === 0) {
      throw new Error('Order not found, unauthorized, or not in pending status.');
    }
    
    // Get order items to check inventory
    const [items] = await conn.execute(
      `SELECT ProductID, Quantity FROM RetailerOrderItems WHERE OrderID = ?`,
      [orderId]
    );
    
    // Check inventory availability
    for (const item of items) {
      const [inventory] = await conn.execute(
        `SELECT QuantityAvailable FROM DistributorInventory 
         WHERE DistributorID = ? AND ProductID = ?`,
        [distributorID, item.ProductID]
      );
      
      if (inventory.length === 0 || inventory[0].QuantityAvailable < item.Quantity) {
        throw new Error(`Insufficient inventory for product ${item.ProductID}`);
      }
    }
    
    // Reserve inventory
    for (const item of items) {
      await conn.execute(
        `UPDATE DistributorInventory 
         SET QuantityReserved = QuantityReserved + ?,
             QuantityAvailable = QuantityAvailable - ?
         WHERE DistributorID = ? AND ProductID = ?`,
        [item.Quantity, item.Quantity, distributorID, item.ProductID]
      );
    }
    
    // Update order status
    await conn.execute(
      `UPDATE RetailerOrders SET Status = 'Confirmed' WHERE OrderID = ?`,
      [orderId]
    );
    
    // Update order items status
    await conn.execute(
      `UPDATE RetailerOrderItems SET ItemStatus = 'Confirmed' WHERE OrderID = ?`,
      [orderId]
    );
    
    await conn.commit();
    
    res.json({ 
      success: true, 
      message: 'Order confirmed and inventory reserved'
    });
  } catch (e) {
    await conn.rollback();
    console.error('confirmRetailerOrder error:', e);
    res.status(400).json({ message: e.message || 'Failed to confirm order.' });
  } finally {
    conn.release();
  }
};

// 3e. Ship Retailer Order (as Distributor)
exports.shipRetailerOrder = async (req, res) => {
  const { orderId } = req.params;
  const distributorUserId = req.params.id;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Get distributor ID
    const [distributorRows] = await conn.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [distributorUserId]
    );
    
    if (distributorRows.length === 0) {
      throw new Error('Distributor not found.');
    }
    
    const distributorID = distributorRows[0].DistributorID;
    
    // Verify order belongs to this distributor and is confirmed
    const [orderRows] = await conn.execute(
      `SELECT OrderID, Status FROM RetailerOrders 
       WHERE OrderID = ? AND DistributorID = ? AND Status = 'Confirmed'`,
      [orderId, distributorID]
    );
    
    if (orderRows.length === 0) {
      throw new Error('Order not found, unauthorized, or not confirmed.');
    }
    
    // Get order items
    const [items] = await conn.execute(
      `SELECT ProductID, Quantity FROM RetailerOrderItems WHERE OrderID = ?`,
      [orderId]
    );
    
    // Release reserved inventory (already deducted from available when confirmed)
    for (const item of items) {
      await conn.execute(
        `UPDATE DistributorInventory 
         SET QuantityReserved = QuantityReserved - ?
         WHERE DistributorID = ? AND ProductID = ?`,
        [item.Quantity, distributorID, item.ProductID]
      );
    }
    
    // Update order status
    await conn.execute(
      `UPDATE RetailerOrders SET Status = 'Shipped' WHERE OrderID = ?`,
      [orderId]
    );
    
    // Update order items status
    await conn.execute(
      `UPDATE RetailerOrderItems SET ItemStatus = 'Shipped' WHERE OrderID = ?`,
      [orderId]
    );
    
    await conn.commit();
    
    res.json({ 
      success: true, 
      message: 'Order shipped successfully'
    });
  } catch (e) {
    await conn.rollback();
    console.error('shipRetailerOrder error:', e);
    res.status(400).json({ message: e.message || 'Failed to ship order.' });
  } finally {
    conn.release();
  }
};

// 3f. Get Distributor Inventory
exports.getDistributorInventory = async (req, res) => {
  const distributorUserId = req.params.id;
  
  try {
    // Get distributor ID from user ID
    const [distributorRows] = await pool.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [distributorUserId]
    );
    
    if (distributorRows.length === 0) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }
    
    const distributorID = distributorRows[0].DistributorID;
    
    // Get inventory with product and manufacturer details
    const [inventory] = await pool.execute(
      `SELECT 
        di.InventoryID,
        di.ProductID,
        p.ProductName,
        p.Description,
        m.CompanyName as ManufacturerName,
        di.QuantityAvailable,
        di.QuantityReserved,
        di.PurchasePriceFromManufacturer,
        di.SellPriceToRetailer,
        di.LastPurchaseDate,
        di.LastSaleDate,
        di.MinStockLevel,
        di.MaxStockLevel,
        (di.QuantityAvailable - di.QuantityReserved) as AvailableForSale,
        CASE 
          WHEN di.SellPriceToRetailer IS NOT NULL AND di.PurchasePriceFromManufacturer IS NOT NULL
          THEN ((di.SellPriceToRetailer - di.PurchasePriceFromManufacturer) / di.PurchasePriceFromManufacturer * 100)
          ELSE NULL
        END as ProfitMargin
       FROM DistributorInventory di
       JOIN Products p ON di.ProductID = p.ProductID
       JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
       WHERE di.DistributorID = ?
       ORDER BY p.ProductName ASC`,
      [distributorID]
    );
    
    res.json(inventory);
  } catch (e) {
    console.error('getDistributorInventory error:', e);
    res.status(500).json({ message: 'Failed to retrieve inventory.' });
  }
};

// 3e. Set Distributor Pricing
exports.setDistributorPricing = async (req, res) => {
  const distributorUserId = req.params.id;
  const productId = req.params.productId;
  const { sellPrice, SellPriceToRetailer } = req.body;
  
  // Accept either parameter name
  const price = sellPrice || SellPriceToRetailer;
  
  if (!price || isNaN(price) || price <= 0) {
    return res.status(400).json({ message: 'Valid sell price required.' });
  }
  
  try {
    // Get distributor ID
    const [distributorRows] = await pool.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [distributorUserId]
    );
    
    if (distributorRows.length === 0) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }
    
    const distributorID = distributorRows[0].DistributorID;
    
    // Get current purchase price to calculate profit margin
    const [inventoryRows] = await pool.execute(
      `SELECT PurchasePriceFromManufacturer 
       FROM DistributorInventory 
       WHERE DistributorID = ? AND ProductID = ?`,
      [distributorID, productId]
    );
    
    if (inventoryRows.length === 0) {
      return res.status(404).json({ message: 'Product not found in inventory.' });
    }
    
    const purchasePrice = parseFloat(inventoryRows[0].PurchasePriceFromManufacturer);
    
    // Calculate profit margin
    const profitMargin = purchasePrice > 0 
      ? ((price - purchasePrice) / purchasePrice * 100).toFixed(2) + '%'
      : 'N/A';
    
    // Update pricing
    const [result] = await pool.execute(
      `UPDATE DistributorInventory 
       SET SellPriceToRetailer = ? 
       WHERE DistributorID = ? AND ProductID = ?`,
      [price, distributorID, productId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Failed to update pricing.' });
    }
    
    res.json({ 
      message: 'Pricing updated successfully.',
      ProfitMargin: profitMargin,
      SellPrice: parseFloat(price).toFixed(2),
      PurchasePrice: purchasePrice.toFixed(2)
    });
  } catch (e) {
    console.error('setDistributorPricing error:', e);
    res.status(500).json({ message: 'Failed to update pricing.' });
  }
};

// 3f. Get Distributor Analytics
exports.getDistributorAnalytics = async (req, res) => {
  const distributorUserId = req.params.id;
  
  try {
    // Get distributor ID
    const [distributorRows] = await pool.execute(
      `SELECT DistributorID FROM Distributors WHERE UserID = ?`,
      [distributorUserId]
    );
    
    if (distributorRows.length === 0) {
      return res.status(404).json({ message: 'Distributor not found.' });
    }
    
    const distributorID = distributorRows[0].DistributorID;
    
    // Get purchase analytics (orders from manufacturers)
    const [purchaseStats] = await pool.execute(
      `SELECT 
        COUNT(*) as TotalOrders,
        SUM(TotalAmount) as TotalSpent,
        AVG(TotalAmount) as AvgOrderValue,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as PendingOrders,
        SUM(CASE WHEN Status = 'Confirmed' THEN 1 ELSE 0 END) as ConfirmedOrders,
        SUM(CASE WHEN Status = 'Shipped' THEN 1 ELSE 0 END) as ShippedOrders,
        SUM(CASE WHEN Status = 'Received' THEN 1 ELSE 0 END) as ReceivedOrders
       FROM DistributorOrders
       WHERE DistributorID = ?`,
      [distributorID]
    );
    
    // Get sales analytics (orders to retailers)
    const [salesStats] = await pool.execute(
      `SELECT 
        COUNT(*) as TotalSales,
        SUM(TotalAmount) as TotalRevenue,
        AVG(TotalAmount) as AvgSaleValue,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as PendingSales,
        SUM(CASE WHEN Status = 'Confirmed' THEN 1 ELSE 0 END) as ConfirmedSales,
        SUM(CASE WHEN Status = 'Shipped' THEN 1 ELSE 0 END) as ShippedSales,
        SUM(CASE WHEN Status = 'Received' THEN 1 ELSE 0 END) as CompletedSales
       FROM RetailerOrders
       WHERE DistributorID = ?`,
      [distributorID]
    );
    
    // Get inventory stats
    const [inventoryStats] = await pool.execute(
      `SELECT 
        COUNT(*) as TotalProducts,
        SUM(QuantityAvailable) as TotalStock,
        SUM(QuantityReserved) as TotalReserved,
        SUM(QuantityAvailable - QuantityReserved) as TotalAvailable,
        SUM(CASE WHEN QuantityAvailable < MinStockLevel THEN 1 ELSE 0 END) as LowStockItems
       FROM DistributorInventory
       WHERE DistributorID = ?`,
      [distributorID]
    );
    
    res.json({
      purchases: purchaseStats[0],
      sales: salesStats[0],
      inventory: inventoryStats[0]
    });
  } catch (e) {
    console.error('getDistributorAnalytics error:', e);
    res.status(500).json({ message: 'Failed to retrieve analytics.' });
  }
};

/* =========================
   STAGE 4: RETAILER TIER IMPLEMENTATION
========================= */

// 1. Browse Available Products from Distributors (Catalog)
exports.getDistributorCatalogForRetailer = async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT 
        di.InventoryID,
        di.ProductID,
        p.ProductName,
        p.Description,
        m.CompanyName as ManufacturerName,
        di.DistributorID,
        d.CompanyName as DistributorName,
        d.Phone as DistributorPhone,
        di.SellPriceToRetailer,
        di.QuantityAvailable,
        di.QuantityReserved,
        (di.QuantityAvailable - di.QuantityReserved) as AvailableForOrder,
        di.LastSaleDate
      FROM DistributorInventory di
      JOIN Products p ON di.ProductID = p.ProductID
      JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
      JOIN Distributors d ON di.DistributorID = d.DistributorID
      WHERE di.SellPriceToRetailer IS NOT NULL 
        AND (di.QuantityAvailable - di.QuantityReserved) > 0
      ORDER BY p.ProductName, di.SellPriceToRetailer ASC
    `);
    
    res.json(products);
  } catch (e) {
    console.error('getDistributorCatalogForRetailer error:', e);
    res.status(500).json({ message: 'Failed to fetch distributor catalog.' });
  }
};

// 2. Create Purchase Order from Distributor
exports.createRetailerOrder = async (req, res) => {
  const { DistributorID, items, PaymentTerms, Notes } = req.body;
  const retailerUserId = req.params.id;
  
  if (!DistributorID || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'DistributorID and items are required.' });
  }
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Get retailer ID
    const [retailerRows] = await connection.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerUserId]
    );
    
    if (retailerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const retailerID = retailerRows[0].RetailerID;
    
    // Calculate total and validate inventory
    let totalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      // Get product details and check distributor inventory
      const [inventoryRows] = await connection.execute(
        `SELECT di.InventoryID, di.ProductID, di.SellPriceToRetailer, di.QuantityAvailable, di.QuantityReserved
         FROM DistributorInventory di
         WHERE di.ProductID = ? AND di.DistributorID = ? AND di.SellPriceToRetailer IS NOT NULL`,
        [item.ProductID, DistributorID]
      );
      
      if (inventoryRows.length === 0) {
        throw new Error(`Product ${item.ProductID} not available from this distributor.`);
      }
      
      const inventory = inventoryRows[0];
      const availableQuantity = inventory.QuantityAvailable - inventory.QuantityReserved;
      
      // Check inventory availability
      if (item.Quantity > availableQuantity) {
        throw new Error(`Insufficient inventory for product ${item.ProductID}. Available: ${availableQuantity}`);
      }
      
      validatedItems.push({
        ProductID: item.ProductID,
        Quantity: item.Quantity,
        UnitPrice: inventory.SellPriceToRetailer
      });
      
      totalAmount += inventory.SellPriceToRetailer * item.Quantity;
    }
    
    // Set expected delivery (assume 3-5 days for distributor delivery)
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 5);
    const expectedDeliveryStr = expectedDelivery.toISOString().split('T')[0];
    
    // Create retailer order
    const [orderResult] = await connection.execute(
      `INSERT INTO RetailerOrders (RetailerID, DistributorID, TotalAmount, PaymentTerms, Notes, ExpectedDeliveryDate) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [retailerID, DistributorID, totalAmount, PaymentTerms || 'Net 30', Notes || null, expectedDeliveryStr]
    );
    const orderId = orderResult.insertId;
    
    // Add order items
    for (const item of validatedItems) {
      await connection.execute(
        `INSERT INTO RetailerOrderItems (OrderID, ProductID, Quantity, UnitPrice) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.ProductID, item.Quantity, item.UnitPrice]
      );
    }
    
    await connection.commit();
    res.json({ 
      success: true, 
      OrderID: orderId,
      TotalAmount: totalAmount,
      ExpectedDeliveryDate: expectedDeliveryStr,
      message: 'Order created successfully. Waiting for distributor confirmation.'
    });
    
  } catch (e) {
    await connection.rollback();
    console.error('createRetailerOrder error:', e);
    res.status(500).json({ message: e.message || 'Failed to create order.' });
  } finally {
    connection.release();
  }
};

// 3. Get Retailer's Orders from Distributors
exports.getRetailerOrders = async (req, res) => {
  const retailerUserId = req.params.id;
  const { status } = req.query;
  
  try {
    // Get retailer ID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerUserId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const retailerID = retailerRows[0].RetailerID;
    
    // Build query with optional status filter
    let query = `
      SELECT 
        ro.OrderID,
        ro.OrderDate,
        ro.Status,
        ro.TotalAmount,
        ro.PaymentTerms,
        ro.PaymentStatus,
        ro.Notes,
        ro.ExpectedDeliveryDate,
        d.DistributorID,
        d.CompanyName as DistributorName,
        d.Phone as DistributorPhone,
        COUNT(roi.OrderItemID) as ItemCount,
        SUM(roi.Quantity) as TotalUnits
      FROM RetailerOrders ro
      JOIN Distributors d ON ro.DistributorID = d.DistributorID
      LEFT JOIN RetailerOrderItems roi ON ro.OrderID = roi.OrderID
      WHERE ro.RetailerID = ?`;
    
    const params = [retailerID];
    
    if (status) {
      query += ` AND ro.Status = ?`;
      params.push(status);
    }
    
    query += `
      GROUP BY ro.OrderID, ro.OrderDate, ro.Status, ro.TotalAmount, ro.PaymentTerms, 
               ro.PaymentStatus, ro.Notes, ro.ExpectedDeliveryDate,
               d.DistributorID, d.CompanyName, d.Phone
      ORDER BY ro.OrderDate DESC`;
    
    const [orders] = await pool.execute(query, params);
    
    // Get items for each order
    for (let order of orders) {
      const [items] = await pool.execute(
        `SELECT 
          roi.OrderItemID,
          roi.ProductID,
          p.ProductName,
          roi.Quantity,
          roi.UnitPrice,
          roi.DeliveredQuantity,
          roi.ItemStatus,
          (roi.Quantity * roi.UnitPrice) as LineTotal
         FROM RetailerOrderItems roi
         JOIN Products p ON roi.ProductID = p.ProductID
         WHERE roi.OrderID = ?
         ORDER BY roi.OrderItemID ASC`,
        [order.OrderID]
      );
      order.items = items;
    }
    
    res.json(orders);
  } catch (e) {
    console.error('getRetailerOrders error:', e);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
};

// 4. Receive Retailer Order (from Distributor)
exports.receiveRetailerOrder = async (req, res) => {
  const { orderId } = req.params;
  const retailerUserId = req.params.id;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Get retailer ID
    const [retailerRows] = await connection.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerUserId]
    );
    
    if (retailerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const retailerID = retailerRows[0].RetailerID;
    
    // Get order details - must be in 'Shipped' status
    const [orderRows] = await connection.execute(
      `SELECT ro.OrderID, ro.DistributorID, ro.RetailerID
       FROM RetailerOrders ro
       WHERE ro.OrderID = ? AND ro.RetailerID = ? AND ro.Status = 'Shipped'`,
      [orderId, retailerID]
    );
    
    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Order not found, not authorized, or not shipped.' });
    }
    
    // Get order items
    const [items] = await connection.execute(
      `SELECT ProductID, Quantity, UnitPrice FROM RetailerOrderItems WHERE OrderID = ?`,
      [orderId]
    );
    
    // Update retailer inventory for each item (using RetailerProducts table)
    for (const item of items) {
      // Check if product already exists in retailer inventory
      const [existingProduct] = await connection.execute(
        `SELECT RetailerProductID, Stock FROM RetailerProducts 
         WHERE RetailerID = ? AND ProductID = ?`,
        [retailerID, item.ProductID]
      );
      
      if (existingProduct.length > 0) {
        // Update existing product - add to stock and update price
        await connection.execute(
          `UPDATE RetailerProducts 
           SET Stock = Stock + ?, Price = ?
           WHERE RetailerProductID = ?`,
          [item.Quantity, item.UnitPrice * 1.3, existingProduct[0].RetailerProductID] // 30% markup
        );
      } else {
        // Insert new product
        await connection.execute(
          `INSERT INTO RetailerProducts (RetailerID, ProductID, Stock, Price)
           VALUES (?, ?, ?, ?)`,
          [retailerID, item.ProductID, item.Quantity, item.UnitPrice * 1.3] // 30% markup
        );
      }
      
      // Update item status
      await connection.execute(
        `UPDATE RetailerOrderItems SET ItemStatus = 'Received', DeliveredQuantity = Quantity 
         WHERE OrderID = ? AND ProductID = ?`,
        [orderId, item.ProductID]
      );
    }
    
    // Update order status
    await connection.execute(
      `UPDATE RetailerOrders SET Status = 'Received' WHERE OrderID = ?`,
      [orderId]
    );
    
    await connection.commit();
    res.json({ success: true, message: 'Order received and inventory updated successfully.' });
    
  } catch (e) {
    await connection.rollback();
    console.error('receiveRetailerOrder error:', e);
    res.status(500).json({ message: 'Failed to receive retailer order.', error: e.message });
  } finally {
    connection.release();
  }
};

// 5. Get Retailer Inventory with Cost Information
exports.getRetailerInventoryWithCosts = async (req, res) => {
  const retailerUserId = req.params.id;
  
  try {
    // Get retailer ID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerUserId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const retailerID = retailerRows[0].RetailerID;
    
    // Get inventory with cost and pricing information
    const [inventory] = await pool.execute(
      `SELECT 
        rp.RetailerProductID,
        rp.ProductID,
        p.ProductName,
        p.Description,
        m.CompanyName as ManufacturerName,
        rp.Stock,
        rp.Price as CustomerPrice,
        -- Get average purchase price from recent orders
        (SELECT AVG(roi.UnitPrice) 
         FROM RetailerOrderItems roi
         JOIN RetailerOrders ro ON roi.OrderID = ro.OrderID
         WHERE roi.ProductID = rp.ProductID AND ro.RetailerID = rp.RetailerID
         AND ro.Status = 'Received'
        ) as CostPrice,
        -- Calculate profit per unit
        CASE 
          WHEN (SELECT AVG(roi.UnitPrice) 
                FROM RetailerOrderItems roi
                JOIN RetailerOrders ro ON roi.OrderID = ro.OrderID
                WHERE roi.ProductID = rp.ProductID AND ro.RetailerID = rp.RetailerID
                AND ro.Status = 'Received') > 0
          THEN (rp.Price - (SELECT AVG(roi.UnitPrice) 
                           FROM RetailerOrderItems roi
                           JOIN RetailerOrders ro ON roi.OrderID = ro.OrderID
                           WHERE roi.ProductID = rp.ProductID AND ro.RetailerID = rp.RetailerID
                           AND ro.Status = 'Received'))
          ELSE NULL
        END as ProfitPerUnit,
        -- Calculate profit margin percentage
        CASE 
          WHEN rp.Price > 0 AND (SELECT AVG(roi.UnitPrice) 
                FROM RetailerOrderItems roi
                JOIN RetailerOrders ro ON roi.OrderID = ro.OrderID
                WHERE roi.ProductID = rp.ProductID AND ro.RetailerID = rp.RetailerID
                AND ro.Status = 'Received') > 0
          THEN (((rp.Price - (SELECT AVG(roi.UnitPrice) 
                             FROM RetailerOrderItems roi
                             JOIN RetailerOrders ro ON roi.OrderID = ro.OrderID
                             WHERE roi.ProductID = rp.ProductID AND ro.RetailerID = rp.RetailerID
                             AND ro.Status = 'Received')) / rp.Price) * 100)
          ELSE NULL
        END as ProfitMarginPercent,
        -- Calculate inventory value (cost * stock)
        CASE 
          WHEN (SELECT AVG(roi.UnitPrice) 
                FROM RetailerOrderItems roi
                JOIN RetailerOrders ro ON roi.OrderID = ro.OrderID
                WHERE roi.ProductID = rp.ProductID AND ro.RetailerID = rp.RetailerID
                AND ro.Status = 'Received') > 0
          THEN (rp.Stock * (SELECT AVG(roi.UnitPrice) 
                           FROM RetailerOrderItems roi
                           JOIN RetailerOrders ro ON roi.OrderID = ro.OrderID
                           WHERE roi.ProductID = rp.ProductID AND ro.RetailerID = rp.RetailerID
                           AND ro.Status = 'Received'))
          ELSE 0
        END as InventoryValue,
        -- Stock status
        CASE 
          WHEN rp.Stock = 0 THEN 'Out of Stock'
          WHEN rp.Stock < 10 THEN 'Low Stock'
          ELSE 'In Stock'
        END as StockStatus,
        -- Get supplier name from most recent order
        (SELECT d.CompanyName 
         FROM RetailerOrders ro
         JOIN Distributors d ON ro.DistributorID = d.DistributorID
         WHERE ro.RetailerID = rp.RetailerID
         AND ro.OrderID IN (
           SELECT roi.OrderID 
           FROM RetailerOrderItems roi 
           WHERE roi.ProductID = rp.ProductID
         )
         ORDER BY ro.OrderDate DESC
         LIMIT 1
        ) as SupplierName
       FROM RetailerProducts rp
       JOIN Products p ON rp.ProductID = p.ProductID
       JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
       WHERE rp.RetailerID = ?
       ORDER BY p.ProductName ASC`,
      [retailerID]
    );
    
    res.json(inventory);
  } catch (e) {
    console.error('getRetailerInventoryWithCosts error:', e);
    res.status(500).json({ message: 'Failed to retrieve inventory.' });
  }
};

// 6. Set Retailer Pricing
exports.setRetailerPricing = async (req, res) => {
  const retailerUserId = req.params.id;
  const productId = req.params.productId;
  const { CustomerPrice, price } = req.body; // Accept both field names
  const newPrice = CustomerPrice || price;
  
  if (!newPrice || isNaN(newPrice) || newPrice < 0) {
    return res.status(400).json({ message: 'Valid price required.' });
  }
  
  try {
    // Get retailer ID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerUserId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const retailerID = retailerRows[0].RetailerID;
    
    // Get cost price to check if selling at a loss
    const [costRows] = await pool.execute(
      `SELECT AVG(roi.UnitPrice) as CostPrice
       FROM RetailerOrderItems roi
       JOIN RetailerOrders ro ON roi.OrderID = ro.OrderID
       WHERE roi.ProductID = ? AND ro.RetailerID = ? AND ro.Status = 'Received'`,
      [productId, retailerID]
    );
    
    const costPrice = (costRows[0] && costRows[0].CostPrice) ? costRows[0].CostPrice : 0;
    let warning = null;
    
    if (costPrice > 0 && newPrice < costPrice) {
      warning = `Warning: Price is below your cost ($${costPrice.toFixed(2)}). You will lose $${(costPrice - newPrice).toFixed(2)} per unit.`;
    }
    
    // Update pricing in RetailerProducts
    const [result] = await pool.execute(
      `UPDATE RetailerProducts 
       SET Price = ? 
       WHERE RetailerID = ? AND ProductID = ?`,
      [newPrice, retailerID, productId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found in inventory.' });
    }
    
    res.json({ 
      success: true, 
      message: 'Pricing updated successfully.',
      warning: warning
    });
  } catch (e) {
    console.error('setRetailerPricing error:', e);
    res.status(500).json({ message: 'Failed to update pricing.' });
  }
};

// 7. Get Retailer Analytics
exports.getRetailerAnalytics = async (req, res) => {
  const retailerUserId = req.params.id;
  
  try {
    // Get retailer ID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerUserId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const retailerID = retailerRows[0].RetailerID;
    
    // Get purchase analytics (orders from distributors)
    const [purchaseStats] = await pool.execute(
      `SELECT 
        COUNT(*) as TotalOrders,
        SUM(TotalAmount) as TotalSpent,
        AVG(TotalAmount) as AvgOrderValue,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as PendingOrders,
        SUM(CASE WHEN Status = 'Confirmed' THEN 1 ELSE 0 END) as ConfirmedOrders,
        SUM(CASE WHEN Status = 'Shipped' THEN 1 ELSE 0 END) as ShippedOrders,
        SUM(CASE WHEN Status = 'Received' THEN 1 ELSE 0 END) as ReceivedOrders
       FROM RetailerOrders
       WHERE RetailerID = ?`,
      [retailerID]
    );
    
    // Get sales analytics (orders from customers)
    const [salesStats] = await pool.execute(
      `SELECT 
        COUNT(*) as TotalSales,
        SUM(oi.Quantity * oi.UnitPriceAtPurchase) as TotalRevenue,
        AVG(oi.Quantity * oi.UnitPriceAtPurchase) as AvgSaleValue,
        SUM(CASE WHEN o.Status = 'Pending' THEN 1 ELSE 0 END) as PendingSales,
        SUM(CASE WHEN o.Status = 'Shipped' THEN 1 ELSE 0 END) as ShippedSales,
        SUM(CASE WHEN o.Status = 'Delivered' THEN 1 ELSE 0 END) as DeliveredSales
       FROM Orders o
       JOIN OrderItems oi ON o.OrderID = oi.OrderID
       WHERE o.RetailerID = ?`,
      [retailerID]
    );
    
    // Get inventory stats
    const [inventoryStats] = await pool.execute(
      `SELECT 
        COUNT(*) as TotalProducts,
        SUM(Stock) as TotalStock,
        SUM(Stock * Price) as TotalInventoryValue,
        AVG(Price) as AvgPrice
       FROM RetailerProducts
       WHERE RetailerID = ?`,
      [retailerID]
    );
    
    res.json({
      purchases: purchaseStats[0],
      sales: salesStats[0],
      inventory: inventoryStats[0]
    });
  } catch (e) {
    console.error('getRetailerAnalytics error:', e);
    res.status(500).json({ message: 'Failed to retrieve analytics.' });
  }
};

/* =========================
   RETAILER - CUSTOMER ORDERS MANAGEMENT
========================= */

// Get Customer Orders for Retailer (orders placed by customers with this retailer)
exports.getRetailerCustomerOrders = async (req, res) => {
  const retailerUserId = req.params.id;
  const { status } = req.query;
  
  try {
    // Get retailer ID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerUserId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const retailerID = retailerRows[0].RetailerID;
    
    // Build query with optional status filter
    let query = `
      SELECT 
        o.OrderID,
        o.OrderDate,
        o.ShippingAddress,
        o.Status,
        o.TotalAmount,
        o.EstimatedDelivery,
        c.CustomerID,
        c.FullName as CustomerName,
        u.Email as CustomerEmail,
        c.Phone as CustomerPhone,
        COUNT(oi.OrderItemID) as ItemCount,
        SUM(oi.Quantity) as TotalUnits
      FROM Orders o
      JOIN Customers c ON o.CustomerID = c.CustomerID
      JOIN Users u ON c.UserID = u.UserID
      LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
      WHERE o.RetailerID = ?`;
    
    const params = [retailerID];
    
    if (status) {
      query += ` AND o.Status = ?`;
      params.push(status);
    }
    
    query += `
      GROUP BY o.OrderID, o.OrderDate, o.ShippingAddress, o.Status, o.TotalAmount, 
               o.EstimatedDelivery, c.CustomerID, c.FullName, u.Email, c.Phone
      ORDER BY o.OrderDate DESC`;
    
    const [orders] = await pool.execute(query, params);
    
    // Get items for each order
    for (let order of orders) {
      const [items] = await pool.execute(`
        SELECT 
          oi.OrderItemID,
          oi.RetailerProductID,
          p.ProductID,
          p.ProductName,
          oi.Quantity,
          oi.UnitPriceAtPurchase,
          (oi.Quantity * oi.UnitPriceAtPurchase) as LineTotal
        FROM OrderItems oi
        JOIN RetailerProducts rp ON oi.RetailerProductID = rp.RetailerProductID
        JOIN Products p ON rp.ProductID = p.ProductID
        WHERE oi.OrderID = ?
        ORDER BY oi.OrderItemID
      `, [order.OrderID]);
      
      order.Items = items;
    }
    
    res.json(orders);
  } catch (e) {
    console.error('getRetailerCustomerOrders error:', e);
    res.status(500).json({ message: 'Failed to fetch customer orders.' });
  }
};

// Confirm Customer Order (as Retailer)
exports.confirmCustomerOrder = async (req, res) => {
  const { orderId } = req.params;
  const retailerUserId = req.params.id;
  
  try {
    // Get retailer ID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerUserId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const retailerID = retailerRows[0].RetailerID;
    
    // Verify order belongs to this retailer and is pending
    const [orderRows] = await pool.execute(
      `SELECT OrderID, Status FROM Orders 
       WHERE OrderID = ? AND RetailerID = ? AND Status = 'Pending'`,
      [orderId, retailerID]
    );
    
    if (orderRows.length === 0) {
      return res.status(400).json({ 
        message: 'Order not found, unauthorized, or not in pending status.' 
      });
    }
    
    // Update order status to Confirmed
    const [result] = await pool.execute(
      `UPDATE Orders SET Status = 'Confirmed' WHERE OrderID = ?`,
      [orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Failed to update order status.' });
    }
    
    res.json({ 
      success: true, 
      message: 'Order confirmed successfully.' 
    });
  } catch (e) {
    console.error('confirmCustomerOrder error:', e);
    res.status(500).json({ message: 'Failed to confirm order.' });
  }
};

// Ship Customer Order (as Retailer)
exports.shipCustomerOrder = async (req, res) => {
  const { orderId } = req.params;
  const retailerUserId = req.params.id;
  
  try {
    // Get retailer ID
    const [retailerRows] = await pool.execute(
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerUserId]
    );
    
    if (retailerRows.length === 0) {
      return res.status(404).json({ message: 'Retailer not found.' });
    }
    
    const retailerID = retailerRows[0].RetailerID;
    
    // Verify order belongs to this retailer and is confirmed
    const [orderRows] = await pool.execute(
      `SELECT OrderID, Status FROM Orders 
       WHERE OrderID = ? AND RetailerID = ? AND Status = 'Confirmed'`,
      [orderId, retailerID]
    );
    
    if (orderRows.length === 0) {
      return res.status(400).json({ 
        message: 'Order not found, unauthorized, or not confirmed yet.' 
      });
    }
    
    // Update order status to Shipped
    const [result] = await pool.execute(
      `UPDATE Orders SET Status = 'Shipped' WHERE OrderID = ?`,
      [orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Failed to update order status.' });
    }
    
    res.json({ 
      success: true, 
      message: 'Order marked as shipped successfully.' 
    });
  } catch (e) {
    console.error('shipCustomerOrder error:', e);
    res.status(500).json({ message: 'Failed to ship order.' });
  }
};

// Receive/Deliver Customer Order (as Customer)
exports.receiveCustomerOrder = async (req, res) => {
  const { orderId } = req.params;
  const customerUserId = req.params.id;
  
  try {
    // Get customer ID
    const [customerRows] = await pool.execute(
      `SELECT CustomerID FROM Customers WHERE UserID = ?`,
      [customerUserId]
    );
    
    if (customerRows.length === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    
    const customerID = customerRows[0].CustomerID;
    
    // Verify order belongs to this customer and is shipped
    const [orderRows] = await pool.execute(
      `SELECT OrderID, Status FROM Orders 
       WHERE OrderID = ? AND CustomerID = ? AND Status = 'Shipped'`,
      [orderId, customerID]
    );
    
    if (orderRows.length === 0) {
      return res.status(400).json({ 
        message: 'Order not found, unauthorized, or not shipped yet.' 
      });
    }
    
    // Update order status to Delivered
    const [result] = await pool.execute(
      `UPDATE Orders SET Status = 'Delivered' WHERE OrderID = ?`,
      [orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Failed to update order status.' });
    }
    
    res.json({ 
      success: true, 
      message: 'Order marked as delivered successfully.' 
    });
  } catch (e) {
    console.error('receiveCustomerOrder error:', e);
    res.status(500).json({ message: 'Failed to mark order as delivered.' });
  }
};
