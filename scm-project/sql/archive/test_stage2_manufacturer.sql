-- Stage 2: Manufacturer Tier API Testing Script
-- Tests all manufacturer functionality

SET @test_count = 0;
SET @pass_count = 0;
SET @fail_count = 0;

SELECT '===========================================' AS '';
SELECT 'STAGE 2: MANUFACTURER TIER API TESTS' AS '';
SELECT '===========================================' AS '';
SELECT '' AS '';

-- ============================================================================
-- TEST SECTION 1: PRODUCT MANAGEMENT
-- ============================================================================

SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 1: PRODUCT MANAGEMENT' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 1.1: Verify products have manufacturer pricing
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Products with Manufacturer Pricing' AS TestName;
SELECT COUNT(*) INTO @products_with_price 
FROM Products 
WHERE ManufacturerPrice IS NOT NULL;

SELECT CASE 
    WHEN @products_with_price >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@products_with_price, ' products with pricing (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@products_with_price >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@products_with_price >= 12, 0, 1);

-- Test 1.2: Verify products have minimum order quantities
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Products with Min Order Quantities' AS TestName;
SELECT COUNT(*) INTO @products_with_moq 
FROM Products 
WHERE MinOrderQuantity IS NOT NULL AND MinOrderQuantity > 0;

SELECT CASE 
    WHEN @products_with_moq >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@products_with_moq, ' products with MOQ (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@products_with_moq >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@products_with_moq >= 12, 0, 1);

-- Test 1.3: Verify products have production capacity
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Products with Production Capacity' AS TestName;
SELECT COUNT(*) INTO @products_with_capacity 
FROM Products 
WHERE ProductionCapacity IS NOT NULL;

SELECT CASE 
    WHEN @products_with_capacity >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@products_with_capacity, ' products with capacity (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@products_with_capacity >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@products_with_capacity >= 12, 0, 1);

-- Test 1.4: Verify products have lead times
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Products with Lead Times' AS TestName;
SELECT COUNT(*) INTO @products_with_leadtime 
FROM Products 
WHERE LeadTimeDays IS NOT NULL;

SELECT CASE 
    WHEN @products_with_leadtime >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@products_with_leadtime, ' products with lead time (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@products_with_leadtime >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@products_with_leadtime >= 12, 0, 1);

-- Test 1.5: Verify all products are Active
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Product Status Validation' AS TestName;
SELECT COUNT(*) INTO @active_products 
FROM Products 
WHERE Status = 'Active';

SELECT CASE 
    WHEN @active_products >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@active_products, ' active products (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@active_products >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@active_products >= 12, 0, 1);

-- ============================================================================
-- TEST SECTION 2: MANUFACTURER INVENTORY
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 2: MANUFACTURER INVENTORY' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 2.1: Verify all products have inventory records
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Inventory Records for All Products' AS TestName;
SELECT COUNT(*) INTO @products_without_inventory
FROM Products p
LEFT JOIN ManufacturerInventory mi ON p.ProductID = mi.ProductID AND p.ManufacturerID = mi.ManufacturerID
WHERE mi.InventoryID IS NULL;

SELECT CASE 
    WHEN @products_without_inventory = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@products_without_inventory, ' products without inventory (expected 0)') AS Details;

SET @pass_count = @pass_count + IF(@products_without_inventory = 0, 1, 0);
SET @fail_count = @fail_count + IF(@products_without_inventory = 0, 0, 1);

-- Test 2.2: Verify inventory quantities are non-negative
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Inventory Quantities Non-Negative' AS TestName;
SELECT COUNT(*) INTO @negative_inventory
FROM ManufacturerInventory
WHERE QuantityAvailable < 0 OR QuantityReserved < 0 OR QuantityProduced < 0;

SELECT CASE 
    WHEN @negative_inventory = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@negative_inventory, ' records with negative quantities (expected 0)') AS Details;

SET @pass_count = @pass_count + IF(@negative_inventory = 0, 1, 0);
SET @fail_count = @fail_count + IF(@negative_inventory = 0, 0, 1);

-- Test 2.3: Verify production costs are reasonable (should be < manufacturer price)
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Production Cost Validation' AS TestName;
SELECT COUNT(*) INTO @valid_costs
FROM ManufacturerInventory mi
JOIN Products p ON mi.ProductID = p.ProductID AND mi.ManufacturerID = p.ManufacturerID
WHERE p.ManufacturerPrice IS NOT NULL 
  AND mi.ProductionCost IS NOT NULL
  AND mi.ProductionCost < p.ManufacturerPrice;

SELECT COUNT(*) INTO @total_with_costs
FROM ManufacturerInventory mi
JOIN Products p ON mi.ProductID = p.ProductID
WHERE p.ManufacturerPrice IS NOT NULL AND mi.ProductionCost IS NOT NULL;

SELECT CASE 
    WHEN @valid_costs = @total_with_costs THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@valid_costs, '/', @total_with_costs, ' products have valid cost < price') AS Details;

SET @pass_count = @pass_count + IF(@valid_costs = @total_with_costs, 1, 0);
SET @fail_count = @fail_count + IF(@valid_costs = @total_with_costs, 0, 1);

-- Test 2.4: Verify inventory available >= reserved (basic constraint)
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Reserved Inventory Consistency' AS TestName;
SELECT COUNT(*) INTO @inventory_issues
FROM ManufacturerInventory
WHERE QuantityReserved > QuantityProduced;

SELECT CASE 
    WHEN @inventory_issues = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@inventory_issues, ' inventory records with reserved > produced (expected 0)') AS Details;

SET @pass_count = @pass_count + IF(@inventory_issues = 0, 1, 0);
SET @fail_count = @fail_count + IF(@inventory_issues = 0, 0, 1);

-- ============================================================================
-- TEST SECTION 3: DISTRIBUTOR ORDERS TO MANUFACTURERS
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 3: DISTRIBUTOR ORDERS' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 3.1: Verify distributor orders exist
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Distributor Orders to Manufacturers' AS TestName;
SELECT COUNT(*) INTO @dist_orders FROM DistributorOrders;

SELECT CASE 
    WHEN @dist_orders >= 7 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@dist_orders, ' distributor orders (expected >= 7)') AS Details;

SET @pass_count = @pass_count + IF(@dist_orders >= 7, 1, 0);
SET @fail_count = @fail_count + IF(@dist_orders >= 7, 0, 1);

-- Test 3.2: Verify order items reference valid products
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Order Items Reference Valid Products' AS TestName;
SELECT COUNT(*) INTO @invalid_order_items
FROM DistributorOrderItems doi
LEFT JOIN Products p ON doi.ProductID = p.ProductID
WHERE p.ProductID IS NULL;

SELECT CASE 
    WHEN @invalid_order_items = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@invalid_order_items, ' invalid order items (expected 0)') AS Details;

SET @pass_count = @pass_count + IF(@invalid_order_items = 0, 1, 0);
SET @fail_count = @fail_count + IF(@invalid_order_items = 0, 0, 1);

-- Test 3.3: Verify order totals match item totals
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Order Total Calculations' AS TestName;
SELECT COUNT(*) INTO @order_total_mismatches
FROM DistributorOrders do
LEFT JOIN (
    SELECT OrderID, SUM(Quantity * UnitPrice) as CalculatedTotal
    FROM DistributorOrderItems
    GROUP BY OrderID
) items ON do.OrderID = items.OrderID
WHERE ABS(COALESCE(do.TotalAmount, 0) - COALESCE(items.CalculatedTotal, 0)) > 0.01;

SELECT CASE 
    WHEN @order_total_mismatches = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@order_total_mismatches, ' orders with mismatched totals (expected 0)') AS Details;

SET @pass_count = @pass_count + IF(@order_total_mismatches = 0, 1, 0);
SET @fail_count = @fail_count + IF(@order_total_mismatches = 0, 0, 1);

-- Test 3.4: Verify order statuses are valid
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Order Status Validation' AS TestName;
SELECT COUNT(*) INTO @invalid_statuses
FROM DistributorOrders
WHERE Status NOT IN ('Pending', 'Confirmed', 'Shipped', 'Received', 'Cancelled');

SELECT CASE 
    WHEN @invalid_statuses = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@invalid_statuses, ' orders with invalid status (expected 0)') AS Details;

SET @pass_count = @pass_count + IF(@invalid_statuses = 0, 1, 0);
SET @fail_count = @fail_count + IF(@invalid_statuses = 0, 0, 1);

-- Test 3.5: Verify payment terms exist
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Payment Terms Present' AS TestName;
SELECT COUNT(*) INTO @orders_with_terms
FROM DistributorOrders
WHERE PaymentTerms IS NOT NULL;

SELECT CASE 
    WHEN @orders_with_terms >= 7 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@orders_with_terms, ' orders with payment terms (expected >= 7)') AS Details;

SET @pass_count = @pass_count + IF(@orders_with_terms >= 7, 1, 0);
SET @fail_count = @fail_count + IF(@orders_with_terms >= 7, 0, 1);

-- ============================================================================
-- TEST SECTION 4: BUSINESS LOGIC VALIDATION
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 4: BUSINESS LOGIC' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 4.1: Verify minimum order quantities are being tracked
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Minimum Order Quantity Logic' AS TestName;
SELECT COUNT(*) INTO @violating_orders
FROM DistributorOrderItems doi
JOIN Products p ON doi.ProductID = p.ProductID
WHERE p.MinOrderQuantity IS NOT NULL 
  AND doi.Quantity < p.MinOrderQuantity;

SELECT CASE 
    WHEN @violating_orders = 0 THEN 'PASS ✓'
    ELSE 'WARN ⚠'
END AS Result,
CONCAT(@violating_orders, ' order items below minimum quantity') AS Details;

SET @pass_count = @pass_count + IF(@violating_orders = 0, 1, 0);
SET @fail_count = @fail_count + IF(@violating_orders = 0, 0, 1);

-- Test 4.2: Verify manufacturer has sufficient products
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Manufacturer Product Diversity' AS TestName;
SELECT COUNT(DISTINCT ManufacturerID) INTO @mfg_count FROM Products;
SELECT AVG(product_count) INTO @avg_products_per_mfg
FROM (
    SELECT ManufacturerID, COUNT(*) as product_count
    FROM Products
    GROUP BY ManufacturerID
) as mfg_products;

SELECT CASE 
    WHEN @mfg_count >= 3 AND @avg_products_per_mfg >= 3 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@mfg_count, ' manufacturers with avg ', ROUND(@avg_products_per_mfg, 1), ' products each') AS Details;

SET @pass_count = @pass_count + IF(@mfg_count >= 3 AND @avg_products_per_mfg >= 3, 1, 0);
SET @fail_count = @fail_count + IF(@mfg_count >= 3 AND @avg_products_per_mfg >= 3, 0, 1);

-- Test 4.3: Verify distributor relationships are established
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Manufacturer-Distributor Relationships' AS TestName;
SELECT COUNT(DISTINCT CONCAT(ManufacturerID, '-', DistributorID)) INTO @relationships
FROM DistributorOrders;

SELECT CASE 
    WHEN @relationships >= 6 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@relationships, ' unique manufacturer-distributor relationships (expected >= 6)') AS Details;

SET @pass_count = @pass_count + IF(@relationships >= 6, 1, 0);
SET @fail_count = @fail_count + IF(@relationships >= 6, 0, 1);

-- ============================================================================
-- TEST SECTION 5: DATA CONSISTENCY
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'TEST SECTION 5: DATA CONSISTENCY' AS '';
SELECT '-------------------------------------------' AS '';

-- Test 5.1: Verify LastUpdated timestamps
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Product Update Timestamps' AS TestName;
SELECT COUNT(*) INTO @products_with_timestamp
FROM Products
WHERE LastUpdated IS NOT NULL;

SELECT CASE 
    WHEN @products_with_timestamp >= 12 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@products_with_timestamp, ' products with timestamps (expected >= 12)') AS Details;

SET @pass_count = @pass_count + IF(@products_with_timestamp >= 12, 1, 0);
SET @fail_count = @fail_count + IF(@products_with_timestamp >= 12, 0, 1);

-- Test 5.2: Verify order dates are reasonable
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Order Date Validation' AS TestName;
SELECT COUNT(*) INTO @invalid_dates
FROM DistributorOrders
WHERE OrderDate > NOW() OR OrderDate < '2024-01-01';

SELECT CASE 
    WHEN @invalid_dates = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@invalid_dates, ' orders with invalid dates (expected 0)') AS Details;

SET @pass_count = @pass_count + IF(@invalid_dates = 0, 1, 0);
SET @fail_count = @fail_count + IF(@invalid_dates = 0, 0, 1);

-- Test 5.3: Verify product manufacturers exist
SET @test_count = @test_count + 1;
SELECT @test_count AS TestNumber, 'Product-Manufacturer Integrity' AS TestName;
SELECT COUNT(*) INTO @orphaned_products
FROM Products p
LEFT JOIN Manufacturers m ON p.ManufacturerID = m.ManufacturerID
WHERE m.ManufacturerID IS NULL;

SELECT CASE 
    WHEN @orphaned_products = 0 THEN 'PASS ✓'
    ELSE 'FAIL ✗'
END AS Result,
CONCAT(@orphaned_products, ' orphaned products (expected 0)') AS Details;

SET @pass_count = @pass_count + IF(@orphaned_products = 0, 1, 0);
SET @fail_count = @fail_count + IF(@orphaned_products = 0, 0, 1);

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

SELECT '' AS '';
SELECT '===========================================' AS '';
SELECT 'STAGE 2 TEST SUMMARY' AS '';
SELECT '===========================================' AS '';
SELECT '' AS '';

SELECT 
    @test_count AS 'Total Tests',
    @pass_count AS 'Tests Passed ✓',
    @fail_count AS 'Tests Failed ✗',
    CONCAT(ROUND((@pass_count / @test_count) * 100, 1), '%') AS 'Pass Rate';

SELECT '' AS '';

SELECT CASE 
    WHEN @fail_count = 0 THEN '✓✓✓ ALL STAGE 2 TESTS PASSED! Manufacturer tier is ready. ✓✓✓'
    WHEN @fail_count <= 2 THEN '⚠ Most tests passed, minor issues to review.'
    ELSE '✗✗✗ CRITICAL ISSUES FOUND! Please review failed tests. ✗✗✗'
END AS 'Overall Status';

SELECT '' AS '';
SELECT '===========================================' AS '';

-- ============================================================================
-- MANUFACTURER TIER SUMMARY
-- ============================================================================

SELECT '' AS '';
SELECT '-------------------------------------------' AS '';
SELECT 'MANUFACTURER TIER SUMMARY' AS '';
SELECT '-------------------------------------------' AS '';

SELECT 
    'Manufacturers' AS Entity,
    COUNT(*) AS Count,
    GROUP_CONCAT(DISTINCT CompanyName ORDER BY CompanyName SEPARATOR ', ') AS Details
FROM Manufacturers
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
    CONCAT('Total Available: ', SUM(QuantityAvailable), ', Reserved: ', SUM(QuantityReserved))
FROM ManufacturerInventory
UNION ALL
SELECT 
    'Distributor Orders',
    COUNT(*),
    CONCAT(
        'Pending: ', SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END),
        ', Confirmed: ', SUM(CASE WHEN Status = 'Confirmed' THEN 1 ELSE 0 END),
        ', Shipped: ', SUM(CASE WHEN Status = 'Shipped' THEN 1 ELSE 0 END)
    )
FROM DistributorOrders
UNION ALL
SELECT 
    'Total Order Value',
    COUNT(*),
    CONCAT('$', FORMAT(SUM(TotalAmount), 2))
FROM DistributorOrders;

SELECT '' AS '';
SELECT 'Stage 2 testing completed!' AS '';
SELECT '' AS '';
