const express = require('express');

const { registerUser, loginUser } = require('../controllers/authController');
const {
  // Master products
  getMasterProducts,
  getMasterProductsByManufacturer,
  createMasterProduct,
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
} = require('../controllers/scmController');

const router = express.Router();

// Authentication
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

// Master products (Manufacturers)
router.get('/products/master', getMasterProducts);
router.get('/products/master/manufacturer/:id', getMasterProductsByManufacturer);
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

module.exports = router;
