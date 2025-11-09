const express = require('express');

const { registerUser, loginUser } = require('../controllers/authController');
const {
  // Master products
  getMasterProducts,
  getMasterProductsByManufacturer,
  createMasterProduct,
  getManufacturerProductAnalytics,
  // Catalog / retailer inventory
  getCatalog,
  getRetailerInventory,
  upsertRetailerProduct,
  // Directory
  listManufacturers,
  listRetailers,
  listDistributors,
  // Orders
  createOrder,
  getOrdersByCustomer,
  getOrdersByRetailer,
  getOrdersByDistributor,
  assignOrderDistributor,
  updateOrderStatus,
  // Advanced Database Features
  getRetailerStockValue,
  getLowStockProducts,
  getInventoryAuditTrail,
  createValidatedOrder,
} = require('../controllers/scmController');

const router = express.Router();

// Authentication
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

// Master products (Manufacturers)
router.get('/products/master', getMasterProducts);
router.get('/products/master/manufacturer/:id', getMasterProductsByManufacturer);
router.get('/products/master/analytics/:id', getManufacturerProductAnalytics);
router.post('/products/master', createMasterProduct);

// Catalog / Retailer inventory
router.get('/products', getCatalog); // public catalog
router.get('/retailer/:id/inventory', getRetailerInventory);
router.post('/retailer/inventory', upsertRetailerProduct);

// Directory endpoints
router.get('/manufacturers', listManufacturers);
router.get('/retailers', listRetailers);
router.get('/distributors', listDistributors);

// Orders
router.post('/orders', createOrder);
router.get('/orders/customer/:id', getOrdersByCustomer);
router.get('/orders/retailer/:id', getOrdersByRetailer);
router.get('/orders/distributor/:id', getOrdersByDistributor);
router.patch('/orders/:orderId/assign', assignOrderDistributor);
router.patch('/orders/:orderId/status', updateOrderStatus);

// Advanced Database Features
router.get('/retailer/:id/stock-value', getRetailerStockValue);
router.get('/retailer/:id/low-stock', getLowStockProducts);
router.get('/retailer/:id/audit-trail', getInventoryAuditTrail);
router.post('/orders/validated', createValidatedOrder);

module.exports = router;
