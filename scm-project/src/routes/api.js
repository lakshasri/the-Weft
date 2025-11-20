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
  getRetailerProfitAnalysis,
  createValidatedOrder,
  // Stage 2: Manufacturer Tier
  updateManufacturerPrice,
  updateManufacturerInventory,
  getManufacturerInventory,
  getManufacturerOrders,
  confirmDistributorOrder,
  shipDistributorOrder,
  getManufacturerSalesAnalytics,
  updateManufacturerProduct,
  // Stage 3: Distributor Tier
  getManufacturerCatalog,
  createDistributorOrder,
  getDistributorOrders,
  receiveDistributorOrder,
  getDistributorInventory,
  setDistributorPricing,
  getDistributorAnalytics,
  getDistributorSales,
  confirmRetailerOrder,
  shipRetailerOrder,
  // Stage 4: Retailer Tier
  getDistributorCatalogForRetailer,
  createRetailerOrder,
  getRetailerOrders,
  receiveRetailerOrder,
  getRetailerInventoryWithCosts,
  setRetailerPricing,
  updateRetailerInventoryItem,
  getRetailerAnalytics,
  // Retailer - Customer Orders Management
  getRetailerCustomerOrders,
  confirmCustomerOrder,
  shipCustomerOrder,
  receiveCustomerOrder,
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
router.get('/retailer/:id/profit-analysis', getRetailerProfitAnalysis);
router.post('/orders/validated', createValidatedOrder);

// Stage 2: Manufacturer Tier API Routes
router.get('/manufacturer/:id/inventory', getManufacturerInventory);
router.patch('/manufacturer/:id/inventory/:productId', updateManufacturerInventory);
router.patch('/manufacturer/:id/products/:productId/price', updateManufacturerPrice);
// router.put('/manufacturer/:id/products/:productId', updateManufacturerProduct); // TODO: Not implemented
router.get('/manufacturer/:id/orders', getManufacturerOrders);
router.patch('/manufacturer/:id/orders/:orderId/confirm', confirmDistributorOrder);
router.patch('/manufacturer/:id/orders/:orderId/ship', shipDistributorOrder);
// router.get('/manufacturer/:id/analytics', getManufacturerSalesAnalytics); // TODO: Not implemented

// Stage 3: Distributor Tier API Routes
router.get('/distributor/catalog', getManufacturerCatalog);
router.post('/distributor/:id/orders', createDistributorOrder);
router.get('/distributor/:id/orders', getDistributorOrders);
router.patch('/distributor/:id/orders/:orderId/receive', receiveDistributorOrder);
router.get('/distributor/:id/inventory', getDistributorInventory);
router.patch('/distributor/:id/inventory/:productId/pricing', setDistributorPricing);
router.get('/distributor/:id/analytics', getDistributorAnalytics);
router.get('/distributor/:id/sales', getDistributorSales);
router.patch('/distributor/:id/sales/:orderId/confirm', confirmRetailerOrder);
router.patch('/distributor/:id/sales/:orderId/ship', shipRetailerOrder);

// Stage 4: Retailer Tier API Routes  
router.get('/retailer/distributor-catalog', getDistributorCatalogForRetailer);
router.post('/retailer/:id/orders', createRetailerOrder);
router.get('/retailer/:id/orders', getRetailerOrders);
router.patch('/retailer/:id/orders/:orderId/receive', receiveRetailerOrder);
router.get('/retailer/:id/inventory-costs', getRetailerInventoryWithCosts);
router.patch('/retailer/:id/products/:productId/price', setRetailerPricing);
router.patch('/retailer/:id/products/:productId', updateRetailerInventoryItem);
router.get('/retailer/:id/analytics', getRetailerAnalytics);

// Retailer - Customer Orders Management
router.get('/retailer/:id/customer-orders', getRetailerCustomerOrders);
router.patch('/retailer/:id/customer-orders/:orderId/confirm', confirmCustomerOrder);
router.patch('/retailer/:id/customer-orders/:orderId/ship', shipCustomerOrder);

// Customer - Order Management
router.patch('/customer/:id/orders/:orderId/receive', receiveCustomerOrder);

module.exports = router;
