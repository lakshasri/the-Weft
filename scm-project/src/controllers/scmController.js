const pool = require('../db/connection');

/* =========================
   Directory Endpoints
========================= */
exports.listManufacturers = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT UserID, FullName, Email, Address FROM Users WHERE Role = 'Manufacturer' ORDER BY FullName ASC`
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
      `SELECT UserID, FullName, Email, Address FROM Users WHERE Role = 'Retailer' ORDER BY FullName ASC`
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
      `SELECT UserID, FullName, Email, Address FROM Users WHERE Role = 'Distributor' ORDER BY FullName ASC`
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
      `SELECT p.ProductID, p.ProductName, p.Description, p.ManufacturerID, u.FullName AS ManufacturerName
       FROM Products p
       JOIN Users u ON u.UserID = p.ManufacturerID
       ORDER BY p.ProductName ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('getMasterProducts error:', e);
    res.status(500).json({ message: 'Failed to retrieve master products.' });
  }
};

exports.getMasterProductsByManufacturer = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT ProductID, ProductName, Description, ManufacturerID
       FROM Products WHERE ManufacturerID = ? ORDER BY ProductName ASC`,
      [id]
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
    const [result] = await pool.execute(
      `INSERT INTO Products (ProductName, Description, ManufacturerID) VALUES (?, ?, ?)`,
      [ProductName, Description || null, ManufacturerID]
    );
    res.status(201).json({
      success: true,
      product: { ProductID: result.insertId, ProductName, Description: Description || null, ManufacturerID },
    });
  } catch (e) {
    console.error('createMasterProduct error:', e);
    res.status(500).json({ message: 'Failed to create master product.' });
  }
};

exports.getManufacturerProductAnalytics = async (req, res) => {
  const { id } = req.params; // manufacturer id
  try {
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
        GROUP_CONCAT(DISTINCT u.FullName ORDER BY u.FullName SEPARATOR ', ') AS RetailerNames
       FROM Products p
       LEFT JOIN RetailerProducts rp ON rp.ProductID = p.ProductID
       LEFT JOIN Users u ON u.UserID = rp.RetailerID
       WHERE p.ManufacturerID = ?
       GROUP BY p.ProductID, p.ProductName, p.Description
       ORDER BY p.ProductName ASC`,
      [id]
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
      `SELECT rp.RetailerProductID, rp.Price, rp.Stock, r.FullName AS RetailerName,
              rp.RetailerID,
              p.ProductID, p.ProductName, p.Description, p.ManufacturerID, m.FullName AS ManufacturerName
       FROM RetailerProducts rp
       JOIN Users r ON r.UserID = rp.RetailerID
       JOIN Products p ON p.ProductID = rp.ProductID
       JOIN Users m ON m.UserID = p.ManufacturerID
       ORDER BY p.ProductName ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('getCatalog error:', e);
    res.status(500).json({ message: 'Failed to retrieve catalog.' });
  }
};

exports.getRetailerInventory = async (req, res) => {
  const { id } = req.params; // retailer id
  try {
    const [rows] = await pool.execute(
      `SELECT rp.RetailerProductID, rp.Price, rp.Stock, rp.RetailerID,
              p.ProductID, p.ProductName, p.Description, p.ManufacturerID
       FROM RetailerProducts rp
       JOIN Products p ON p.ProductID = rp.ProductID
       WHERE rp.RetailerID = ?
       ORDER BY p.ProductName ASC`,
      [id]
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
    const priceNum = Number(Price);
    const stockNum = parseInt(Stock, 10);
    if (Number.isNaN(priceNum) || priceNum < 0 || Number.isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: 'Invalid price or stock values.' });
    }
    // Insert or update
    const [existing] = await pool.execute(
      `SELECT RetailerProductID FROM RetailerProducts WHERE RetailerID = ? AND ProductID = ?`,
      [RetailerID, ProductID]
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
        [RetailerID, ProductID, priceNum, stockNum]
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
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT o.OrderID, o.OrderDate, o.ShippingAddress, o.Status,
              o.RetailerID, r.FullName AS RetailerName, o.DistributorID, d.FullName AS DistributorName,
              oi.OrderItemID, oi.Quantity, oi.UnitPriceAtPurchase,
              rp.RetailerProductID, p.ProductName
       FROM Orders o
       JOIN Users r ON r.UserID = o.RetailerID
       LEFT JOIN Users d ON d.UserID = o.DistributorID
       JOIN OrderItems oi ON oi.OrderID = o.OrderID
       JOIN RetailerProducts rp ON rp.RetailerProductID = oi.RetailerProductID
       JOIN Products p ON p.ProductID = rp.ProductID
       WHERE o.CustomerID = ?
       ORDER BY o.OrderDate DESC, oi.OrderItemID ASC`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error('getOrdersByCustomer error:', e);
    res.status(500).json({ message: 'Failed to retrieve customer orders.' });
  }
};

exports.getOrdersByRetailer = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT o.OrderID, o.OrderDate, o.ShippingAddress, o.Status,
              c.FullName AS CustomerName, o.DistributorID, d.FullName AS DistributorName,
              oi.OrderItemID, oi.Quantity, oi.UnitPriceAtPurchase,
              rp.RetailerProductID, p.ProductName
       FROM Orders o
       JOIN Users c ON c.UserID = o.CustomerID
       LEFT JOIN Users d ON d.UserID = o.DistributorID
       JOIN OrderItems oi ON oi.OrderID = o.OrderID
       JOIN RetailerProducts rp ON rp.RetailerProductID = oi.RetailerProductID
       JOIN Products p ON p.ProductID = rp.ProductID
       WHERE o.RetailerID = ?
       ORDER BY o.OrderDate DESC, oi.OrderItemID ASC`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error('getOrdersByRetailer error:', e);
    res.status(500).json({ message: 'Failed to retrieve retailer orders.' });
  }
};

exports.getOrdersByDistributor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT o.OrderID, o.OrderDate, o.ShippingAddress, o.Status,
              c.FullName AS CustomerName, r.FullName AS RetailerName,
              oi.OrderItemID, oi.Quantity, oi.UnitPriceAtPurchase,
              p.ProductName
       FROM Orders o
       JOIN Users c ON c.UserID = o.CustomerID
       JOIN Users r ON r.UserID = o.RetailerID
       JOIN OrderItems oi ON oi.OrderID = o.OrderID
       JOIN RetailerProducts rp ON rp.RetailerProductID = oi.RetailerProductID
       JOIN Products p ON p.ProductID = rp.ProductID
       WHERE o.DistributorID = ?
       ORDER BY o.OrderDate DESC, oi.OrderItemID ASC`,
      [id]
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
    const [orderResult] = await conn.execute(
      `INSERT INTO Orders (CustomerID, RetailerID, ShippingAddress) VALUES (?, ?, ?)`,
      [CustomerID, RetailerID, ShippingAddress]
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
