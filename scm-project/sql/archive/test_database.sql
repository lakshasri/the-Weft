-- Comprehensive Database Testing Script
-- Tests all aspects of the enhanced supply chain database
-- Date: November 13, 2025

SET @test_count = 0;
SET @pass_count = 0;
SET @fail_count = 0;

SELECT '===========================================' AS '';
SELECT 'SUPPLY CHAIN DATABASE COMPREHENSIVE TESTS' AS '';
SELECT '===========================================' AS '';
SELECT '' AS '';

-- ============================================================================
-- TEST SECTION 1: TABLE EXISTENCE AND STRUCTURE
-- ============================================================================

SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 1: TABLE EXISTENCE' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 1.1: Verify all base tables exist
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Base Tables Existence' AS TestName;
SELECT COUNT(*) INTO @table_count 
FROM information_schema.tables 
WHERE table_schema = 'scm_db_roles' 
AND table_name IN ('Users', 'Customers', 'Manufacturers', 'Retailers', 'Distributors', 'Products');

SELECT CASE 
    WHEN @table_count = 6 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result, 
CONCAT(@table_count, '/6 base tables found') AS Details;

SET @pass_count = @pass_count + IF(@table_count = 6, 1, 0);
SET @fail_count = @fail_count + IF(@table_count = 6, 0, 1);

-- Test 1.2: Verify Stage 1 supply chain tables exist
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Stage 1 Supply Chain Tables' AS TestName;
SELECT COUNT(*) INTO @sc_table_count 
FROM information_schema.tables 
WHERE table_schema = 'scm_db_roles' 
AND table_name IN ('ManufacturerInventory', 'DistributorInventory', 'DistributorOrders', 
                   'DistributorOrderItems', 'RetailerOrders', 'RetailerOrderItems', 
                   'RetailerSupplierRelationships');

SELECT CASE 
    WHEN @sc_table_count = 7 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@sc_table_count, '/7 supply chain tables found') AS Details;

SET @pass_count = @pass_count + IF(@sc_table_count = 7, 1, 0);
SET @fail_count = @fail_count + IF(@sc_table_count = 7, 0, 1);

-- Test 1.3: Verify views exist
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Database Views' AS TestName;
SELECT COUNT(*) INTO @view_count 
FROM information_schema.views 
WHERE table_schema = 'scm_db_roles' 
AND table_name IN ('SupplyChainPricing', 'InventoryStatus', 'RetailerPurchaseHistory');

SELECT CASE 
    WHEN @view_count = 3 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@view_count, '/3 views found') AS Details;

SET @pass_count = @pass_count + IF(@view_count = 3, 1, 0);
SET @fail_count = @fail_count + IF(@view_count = 3, 0, 1);

-- ============================================================================
-- TEST SECTION 2: DATA INTEGRITY AND POPULATION
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 2: DATA INTEGRITY' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 2.1: User data population
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'User Data Population' AS TestName;
SELECT COUNT(*) INTO @user_count FROM Users;

SELECT CASE 
    WHEN @user_count >= 14 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@user_count, ' users found (expected >= 14)') AS Details;

SET @pass_count = @pass_count + IF(@user_count >= 14, 1, 0);
SET @fail_count = @fail_count + IF(@user_count >= 14, 0, 1);

-- Test 2.2: Product data with pricing
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Product Data with Manufacturer Pricing' AS TestName;
SELECT COUNT(*) INTO @product_count FROM Products WHERE ManufacturerPrice IS NOT NULL;

SELECT CASE 
    WHEN @product_count >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@product_count, ' products with pricing found (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@product_count >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@product_count >= 12, 0, 1);

-- Test 2.3: Manufacturer inventory
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Manufacturer Inventory Population' AS TestName;
SELECT COUNT(*) INTO @mfg_inv_count FROM ManufacturerInventory;

SELECT CASE 
    WHEN @mfg_inv_count >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@mfg_inv_count, ' manufacturer inventory records (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@mfg_inv_count >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@mfg_inv_count >= 12, 0, 1);

-- Test 2.4: Distributor inventory
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Distributor Inventory Population' AS TestName;
SELECT COUNT(*) INTO @dist_inv_count FROM DistributorInventory;

SELECT CASE 
    WHEN @dist_inv_count >= 36 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@dist_inv_count, ' distributor inventory records (expected >= 36)') AS Details;

SET @pass_count = @pass_count + IF(@dist_inv_count >= 36, 1, 0);
SET @fail_count = @fail_count + IF(@dist_inv_count >= 36, 0, 1);

-- Test 2.5: Retailer products
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Retailer Product Listings' AS TestName;
SELECT COUNT(*) INTO @retailer_prod_count FROM RetailerProducts;

SELECT CASE 
    WHEN @retailer_prod_count >= 15 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@retailer_prod_count, ' retailer products (expected >= 15)') AS Details;

SET @pass_count = @pass_count + IF(@retailer_prod_count >= 15, 1, 0);
SET @fail_count = @fail_count + IF(@retailer_prod_count >= 15, 0, 1);

-- ============================================================================
-- TEST SECTION 3: FOREIGN KEY RELATIONSHIPS
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 3: FOREIGN KEY INTEGRITY' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 3.1: Products reference valid manufacturers
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Products-Manufacturers Relationship' AS TestName;
SELECT COUNT(*) INTO @orphan_products 
FROM Products p 
LEFT JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID 
WHERE m.ManufacturerID IS NULL;

SELECT CASE 
    WHEN @orphan_products = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@orphan_products, ' orphaned products found') AS Details;

SET @pass_count = @pass_count + IF(@orphan_products = 0, 1, 0);
SET @fail_count = @fail_count + IF(@orphan_products = 0, 0, 1);

-- Test 3.2: DistributorInventory references valid distributors and products
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Distributor Inventory Relationships' AS TestName;
SELECT COUNT(*) INTO @orphan_dist_inv 
FROM DistributorInventory di
LEFT JOIN Distributors d ON di.DistributorID = d.DistributorID
LEFT JOIN Products p ON di.ProductID = p.ProductID
WHERE d.DistributorID IS NULL OR p.ProductID IS NULL;

SELECT CASE 
    WHEN @orphan_dist_inv = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@orphan_dist_inv, ' invalid distributor inventory records') AS Details;

SET @pass_count = @pass_count + IF(@orphan_dist_inv = 0, 1, 0);
SET @fail_count = @fail_count + IF(@orphan_dist_inv = 0, 0, 1);

-- Test 3.3: RetailerProducts with distributor relationships
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Retailer-Distributor Relationships' AS TestName;
SELECT COUNT(*) INTO @retailer_with_dist 
FROM RetailerProducts 
WHERE DistributorID IS NOT NULL;

SELECT CASE 
    WHEN @retailer_with_dist >= 15 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@retailer_with_dist, ' retailer products with distributor links (expected >= 15)') AS Details;

SET @pass_count = @pass_count + IF(@retailer_with_dist >= 15, 1, 0);
SET @fail_count = @fail_count + IF(@retailer_with_dist >= 15, 0, 1);

-- ============================================================================
-- TEST SECTION 4: SUPPLY CHAIN PRICING LOGIC
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 4: PRICING LOGIC' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 4.1: Distributor pricing markup validation
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Distributor Pricing Markup' AS TestName;
SELECT COUNT(*) INTO @valid_dist_markup
FROM DistributorInventory di
JOIN Products p ON di.ProductID = p.ProductID
WHERE di.PurchasePriceFromManufacturer > p.ManufacturerPrice * 0.95
  AND di.SellPriceToRetailer > di.PurchasePriceFromManufacturer;

SELECT COUNT(*) INTO @total_dist_inv FROM DistributorInventory 
WHERE PurchasePriceFromManufacturer IS NOT NULL 
  AND SellPriceToRetailer IS NOT NULL;

SELECT CASE 
    WHEN @valid_dist_markup = @total_dist_inv THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@valid_dist_markup, '/', @total_dist_inv, ' distributors have valid pricing markup') AS Details;

SET @pass_count = @pass_count + IF(@valid_dist_markup = @total_dist_inv, 1, 0);
SET @fail_count = @fail_count + IF(@valid_dist_markup = @total_dist_inv, 0, 1);

-- Test 4.2: Retailer pricing markup validation
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Retailer Pricing Markup' AS TestName;
SELECT COUNT(*) INTO @valid_retail_markup
FROM RetailerProducts rp
WHERE rp.PurchasePriceFromDistributor IS NOT NULL
  AND rp.Price > rp.PurchasePriceFromDistributor;

SELECT COUNT(*) INTO @total_retail_priced FROM RetailerProducts 
WHERE PurchasePriceFromDistributor IS NOT NULL;

SELECT CASE 
    WHEN @valid_retail_markup = @total_retail_priced THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@valid_retail_markup, '/', @total_retail_priced, ' retailers have valid pricing markup') AS Details;

SET @pass_count = @pass_count + IF(@valid_retail_markup = @total_retail_priced, 1, 0);
SET @fail_count = @fail_count + IF(@valid_retail_markup = @total_retail_priced, 0, 1);

-- Test 4.3: End-to-end pricing flow (Manufacturer → Distributor → Retailer)
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Complete Pricing Chain Validation' AS TestName;
SELECT COUNT(*) INTO @complete_pricing_chain
FROM Products p
JOIN DistributorInventory di ON p.ProductID = di.ProductID
JOIN RetailerProducts rp ON p.ProductID = rp.ProductID AND di.DistributorID = rp.DistributorID
WHERE p.ManufacturerPrice < di.SellPriceToRetailer
  AND di.SellPriceToRetailer < rp.Price;

SELECT CASE 
    WHEN @complete_pricing_chain >= 10 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@complete_pricing_chain, ' complete pricing chains validated (expected >= 10)') AS Details;

SET @pass_count = @pass_count + IF(@complete_pricing_chain >= 10, 1, 0);
SET @fail_count = @fail_count + IF(@complete_pricing_chain >= 10, 0, 1);

-- ============================================================================
-- TEST SECTION 5: ORDER MANAGEMENT
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 5: ORDER MANAGEMENT' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 5.1: Distributor orders from manufacturers
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Distributor Orders Population' AS TestName;
SELECT COUNT(*) INTO @dist_orders FROM DistributorOrders;
SELECT COUNT(*) INTO @dist_order_items FROM DistributorOrderItems;

SELECT CASE 
    WHEN @dist_orders >= 7 AND @dist_order_items >= 20 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@dist_orders, ' orders with ', @dist_order_items, ' items (expected >= 7 orders, >= 20 items)') AS Details;

SET @pass_count = @pass_count + IF(@dist_orders >= 7 AND @dist_order_items >= 20, 1, 0);
SET @fail_count = @fail_count + IF(@dist_orders >= 7 AND @dist_order_items >= 20, 0, 1);

-- Test 5.2: Retailer orders from distributors
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Retailer Orders Population' AS TestName;
SELECT COUNT(*) INTO @retailer_orders FROM RetailerOrders;
SELECT COUNT(*) INTO @retailer_order_items FROM RetailerOrderItems;

SELECT CASE 
    WHEN @retailer_orders >= 7 AND @retailer_order_items >= 17 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@retailer_orders, ' orders with ', @retailer_order_items, ' items (expected >= 7 orders, >= 17 items)') AS Details;

SET @pass_count = @pass_count + IF(@retailer_orders >= 7 AND @retailer_order_items >= 17, 1, 0);
SET @fail_count = @fail_count + IF(@retailer_orders >= 7 AND @retailer_order_items >= 17, 0, 1);

-- Test 5.3: Customer orders
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Customer Orders Population' AS TestName;
SELECT COUNT(*) INTO @customer_orders FROM Orders;
SELECT COUNT(*) INTO @customer_order_items FROM OrderItems;

SELECT CASE 
    WHEN @customer_orders >= 7 AND @customer_order_items >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@customer_orders, ' orders with ', @customer_order_items, ' items (expected >= 7 orders, >= 12 items)') AS Details;

SET @pass_count = @pass_count + IF(@customer_orders >= 7 AND @customer_order_items >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@customer_orders >= 7 AND @customer_order_items >= 12, 0, 1);

-- ============================================================================
-- TEST SECTION 6: VIEWS FUNCTIONALITY
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 6: VIEWS FUNCTIONALITY' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 6.1: SupplyChainPricing view
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'SupplyChainPricing View' AS TestName;
SELECT COUNT(*) INTO @scp_rows FROM SupplyChainPricing;

SELECT CASE 
    WHEN @scp_rows >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@scp_rows, ' rows in SupplyChainPricing view (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@scp_rows >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@scp_rows >= 12, 0, 1);

-- Test 6.2: InventoryStatus view
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'InventoryStatus View' AS TestName;
SELECT COUNT(*) INTO @inv_status_rows FROM InventoryStatus;

SELECT CASE 
    WHEN @inv_status_rows >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@inv_status_rows, ' rows in InventoryStatus view (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@inv_status_rows >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@inv_status_rows >= 12, 0, 1);

-- Test 6.3: RetailerPurchaseHistory view
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'RetailerPurchaseHistory View' AS TestName;
SELECT COUNT(*) INTO @rph_rows FROM RetailerPurchaseHistory;

SELECT CASE 
    WHEN @rph_rows >= 7 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@rph_rows, ' rows in RetailerPurchaseHistory view (expected >= 7)') AS Details;

SET @pass_count = @pass_count + IF(@rph_rows >= 7, 1, 0);
SET @fail_count = @fail_count + IF(@rph_rows >= 7, 0, 1);

-- ============================================================================
-- TEST SECTION 7: FUNCTIONS AND PROCEDURES
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 7: FUNCTIONS & PROCEDURES' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 7.1: Functions exist
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Database Functions' AS TestName;
SELECT COUNT(*) INTO @function_count
FROM information_schema.routines
WHERE routine_schema = 'scm_db_roles'
  AND routine_type = 'FUNCTION'
  AND routine_name IN ('CalculateOrderTotal', 'GetRetailerStockValue');

SELECT CASE 
    WHEN @function_count = 2 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@function_count, '/2 functions found') AS Details;

SET @pass_count = @pass_count + IF(@function_count = 2, 1, 0);
SET @fail_count = @fail_count + IF(@function_count = 2, 0, 1);

-- Test 7.2: Procedures exist
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Database Procedures' AS TestName;
SELECT COUNT(*) INTO @procedure_count
FROM information_schema.routines
WHERE routine_schema = 'scm_db_roles'
  AND routine_type = 'PROCEDURE'
  AND routine_name IN ('CheckLowStockProducts', 'ProcessOrderWithValidation');

SELECT CASE 
    WHEN @procedure_count = 2 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@procedure_count, '/2 procedures found') AS Details;

SET @pass_count = @pass_count + IF(@procedure_count = 2, 1, 0);
SET @fail_count = @fail_count + IF(@procedure_count = 2, 0, 1);

-- Test 7.3: Triggers exist
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Database Triggers' AS TestName;
SELECT COUNT(*) INTO @trigger_count
FROM information_schema.triggers
WHERE trigger_schema = 'scm_db_roles';

SELECT CASE 
    WHEN @trigger_count >= 4 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@trigger_count, ' triggers found (expected >= 4)') AS Details;

SET @pass_count = @pass_count + IF(@trigger_count >= 4, 1, 0);
SET @fail_count = @fail_count + IF(@trigger_count >= 4, 0, 1);

-- ============================================================================
-- TEST SECTION 8: BUSINESS LOGIC VALIDATION
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 8: BUSINESS LOGIC' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 8.1: Retailer supplier relationships
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Retailer-Supplier Relationships' AS TestName;
SELECT COUNT(*) INTO @supplier_rels FROM RetailerSupplierRelationships;

SELECT CASE 
    WHEN @supplier_rels >= 7 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@supplier_rels, ' supplier relationships (expected >= 7)') AS Details;

SET @pass_count = @pass_count + IF(@supplier_rels >= 7, 1, 0);
SET @fail_count = @fail_count + IF(@supplier_rels >= 7, 0, 1);

-- Test 8.2: Historical sales data
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Historical Manufacturer Sales' AS TestName;
SELECT COUNT(*) INTO @historical_sales FROM ManufacturerSales;

SELECT CASE 
    WHEN @historical_sales >= 15 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@historical_sales, ' historical sales records (expected >= 15)') AS Details;

SET @pass_count = @pass_count + IF(@historical_sales >= 15, 1, 0);
SET @fail_count = @fail_count + IF(@historical_sales >= 15, 0, 1);

-- Test 8.3: Product variety across manufacturers
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Product Distribution Across Manufacturers' AS TestName;
SELECT COUNT(DISTINCT ManufacturerID) INTO @mfg_with_products 
FROM Products;

SELECT CASE 
    WHEN @mfg_with_products >= 3 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@mfg_with_products, ' manufacturers with products (expected >= 3)') AS Details;

SET @pass_count = @pass_count + IF(@mfg_with_products >= 3, 1, 0);
SET @fail_count = @fail_count + IF(@mfg_with_products >= 3, 0, 1);

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

SELECT '' AS '';
SELECT '===========================================' AS '';
SELECT 'TEST SUMMARY' AS '';
SELECT '===========================================' AS '';
SELECT '' AS '';

SELECT 
    @test_count AS 'Total Tests',
    @pass_count AS 'Tests Passed ✓',
    @fail_count AS 'Tests Failed ✗',
    CONCAT(ROUND((@pass_count / @test_count) * 100, 1), '%') AS 'Pass Rate';

SELECT '' AS '';

SELECT CASE 
    WHEN @fail_count = 0 THEN '✓✓✓ ALL TESTS PASSED! Database is ready for Stage 2. ✓✓✓'
    WHEN @fail_count <= 2 THEN '⚠ Most tests passed, minor issues to review.'
    ELSE '✗✗✗ CRITICAL ISSUES FOUND! Please review failed tests. ✗✗✗'
END AS 'Overall Status';

SELECT '' AS '';
SELECT '===========================================' AS '';

-- ============================================================================
-- DETAILED DATA SUMMARY
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'DETAILED DATA SUMMARY' AS '';
SELECT '-------------------------------------------' AS '';

SELECT 
    'Users' AS Entity,
    COUNT(*) AS Count,
    GROUP_CONCAT(DISTINCT Role ORDER BY Role) AS Breakdown
FROM Users
UNION ALL
SELECT 
    'Manufacturers',
    COUNT(*),
    GROUP_CONCAT(DISTINCT CompanyName ORDER BY CompanyName SEPARATOR ', ')
FROM Manufacturers
UNION ALL
SELECT 
    'Distributors',
    COUNT(*),
    GROUP_CONCAT(DISTINCT CompanyName ORDER BY CompanyName SEPARATOR ', ')
FROM Distributors
UNION ALL
SELECT 
    'Retailers',
    COUNT(*),
    GROUP_CONCAT(DISTINCT BusinessName ORDER BY BusinessName SEPARATOR ', ')
FROM Retailers
UNION ALL
SELECT 
    'Customers',
    COUNT(*),
    CONCAT(COUNT(*), ' customer accounts')
FROM Customers
UNION ALL
SELECT 
    'Products',
    COUNT(*),
    CONCAT('Across ', COUNT(DISTINCT ManufacturerID), ' manufacturers')
FROM Products
UNION ALL
SELECT 
    'Manufacturer Inventory',
    COUNT(*),
    CONCAT('Total Stock: ', SUM(QuantityAvailable))
FROM ManufacturerInventory
UNION ALL
SELECT 
    'Distributor Inventory',
    COUNT(*),
    CONCAT('Total Stock: ', SUM(QuantityAvailable))
FROM DistributorInventory
UNION ALL
SELECT 
    'Retailer Products',
    COUNT(*),
    CONCAT('Total Stock: ', SUM(Stock))
FROM RetailerProducts
UNION ALL
SELECT 
    'Distributor Orders',
    COUNT(*),
    CONCAT('Total Value: $', FORMAT(SUM(TotalAmount), 2))
FROM DistributorOrders
UNION ALL
SELECT 
    'Retailer Orders',
    COUNT(*),
    CONCAT('Total Value: $', FORMAT(SUM(TotalAmount), 2))
FROM RetailerOrders
UNION ALL
SELECT 
    'Customer Orders',
    COUNT(*),
    CONCAT('Total Value: $', FORMAT(SUM(TotalAmount), 2))
FROM Orders;

SELECT '' AS '';
SELECT 'Test completed successfully!' AS '';
SELECT '' AS '';
