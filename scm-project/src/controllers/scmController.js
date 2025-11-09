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
      `SELECT u.UserID, d.CompanyName as FullName, u.Email, d.Address 
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
      `SELECT p.ProductID, p.ProductName, p.Description, p.ManufacturerID, m.CompanyName AS ManufacturerName
       FROM Products p
       JOIN Manufacturers m ON m.ManufacturerID = p.ManufacturerID
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
      `SELECT ProductID, ProductName, Description, ManufacturerID
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
  const { ProductName, Description, ManufacturerID } = req.body;
  if (!ProductName || !ManufacturerID) {
    return res.status(400).json({ message: 'Product name and manufacturer ID required.' });
  }
  try {
    // First, get the actual ManufacturerID from the Manufacturers table using the UserID
    const [manufacturerRows] = await pool.execute(
      `SELECT ManufacturerID FROM Manufacturers WHERE UserID = ?`,
      [ManufacturerID] // This is actually the UserID passed from frontend
    );
    
    if (manufacturerRows.length === 0) {
      return res.status(404).json({ message: 'Manufacturer not found.' });
    }
    
    const actualManufacturerID = manufacturerRows[0].ManufacturerID;
    
    const [result] = await pool.execute(
      `INSERT INTO Products (ProductName, Description, ManufacturerID) VALUES (?, ?, ?)`,
      [ProductName, Description || null, actualManufacturerID]
    );
    res.status(201).json({
      success: true,
      product: { ProductID: result.insertId, ProductName, Description: Description || null, ManufacturerID: actualManufacturerID },
    });
  } catch (e) {
    console.error('createMasterProduct error:', e);
    res.status(500).json({ message: 'Failed to create master product.' });
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
              p.ProductID, p.ProductName, p.Description, p.ManufacturerID, m.BusinessName AS ManufacturerName
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
              o.RetailerID, r.BusinessName AS RetailerName, o.DistributorID, d.CompanyName AS DistributorName,
              oi.OrderItemID, oi.Quantity, oi.UnitPriceAtPurchase,
              rp.RetailerProductID, p.ProductName
       FROM Orders o
       JOIN Retailers ret ON ret.RetailerID = o.RetailerID
       JOIN Users r ON r.UserID = ret.UserID
       LEFT JOIN Distributors dist ON dist.DistributorID = o.DistributorID
       LEFT JOIN Users d ON d.UserID = dist.UserID
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
              cust.FullName AS CustomerName, o.DistributorID, dist.CompanyName AS DistributorName,
              oi.OrderItemID, oi.Quantity, oi.UnitPriceAtPurchase,
              rp.RetailerProductID, p.ProductName
       FROM Orders o
       JOIN Customers c ON c.CustomerID = o.CustomerID
       JOIN Users cust ON cust.UserID = c.UserID
       LEFT JOIN Distributors d ON d.DistributorID = o.DistributorID
       LEFT JOIN Users dist ON dist.UserID = d.UserID
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
    
    // Convert UserIDs to actual entity IDs
    const [customerRows] = await conn.execute(
      `SELECT CustomerID as ActualCustomerID FROM Customers WHERE UserID = ?`,
      [CustomerID] // This is actually UserID from frontend
    );
    const [retailerRows] = await conn.execute(
      `SELECT RetailerID as ActualRetailerID FROM Retailers WHERE UserID = ?`,
      [RetailerID] // This is actually UserID from frontend
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
  const allowed = ['Pending', 'Assigned', 'Shipped', 'Delivered', 'Cancelled'];
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

// Get inventory audit trail
exports.getInventoryAuditTrail = async (req, res) => {
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
      `SELECT 
        ia.AuditID,
        p.ProductName,
        ia.OldStock,
        ia.NewStock,
        ia.StockChange,
        ia.ChangeReason,
        ia.ChangeDate,
        ia.OrderID
      FROM InventoryAudit ia
      JOIN Products p ON ia.ProductID = p.ProductID
      WHERE ia.RetailerID = ?
      ORDER BY ia.ChangeDate DESC
      LIMIT 50`,
      [actualRetailerID]
    );
    res.json(results);
  } catch (e) {
    console.error('getInventoryAuditTrail error:', e);
    res.status(500).json({ message: 'Failed to get audit trail.' });
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
      `SELECT RetailerID FROM Retailers WHERE UserID = ?`,
      [retailerId] // This is actually UserID from frontend
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
