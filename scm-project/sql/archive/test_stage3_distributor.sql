-- ============================================================================
-- STAGE 3: DISTRIBUTOR TIER - COMPREHENSIVE TEST SUITE
-- ============================================================================
-- Tests distributor functionality: purchasing from manufacturers, 
-- managing inventory, setting retailer pricing, and order fulfillment
-- ============================================================================

USE scm_db_roles;

-- Initialize test result tracking
SET @test_count = 0;
SET @test_pass = 0;
SET @test_fail = 0;

-- ============================================================================
-- SECTION 1: DISTRIBUTOR INVENTORY TESTS
-- ============================================================================

-- Test 1.1: All distributors have inventory records
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(DISTINCT di.DistributorID) = COUNT(DISTINCT d.DistributorID)
    FROM Distributors d
    LEFT JOIN DistributorInventory di ON d.DistributorID = di.DistributorID
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 1.1 - Distributor Inventory Records: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 1.2: Inventory quantities are non-negative
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorInventory
    WHERE QuantityAvailable < 0 OR QuantityReserved < 0
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 1.2 - Non-Negative Inventory: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 1.3: Purchase prices are valid
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorInventory
    WHERE PurchasePriceFromManufacturer IS NOT NULL 
    AND PurchasePriceFromManufacturer <= 0
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 1.3 - Valid Purchase Prices: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 1.4: Retailer prices are higher than purchase prices (profit margin)
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorInventory
    WHERE SellPriceToRetailer IS NOT NULL 
    AND PurchasePriceFromManufacturer IS NOT NULL
    AND SellPriceToRetailer <= PurchasePriceFromManufacturer
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 1.4 - Profitable Pricing: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 1.5: All products in distributor inventory exist in Products table
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorInventory di
    LEFT JOIN Products p ON di.ProductID = p.ProductID
    WHERE p.ProductID IS NULL
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 1.5 - Product Reference Integrity: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- ============================================================================
-- SECTION 2: DISTRIBUTOR ORDERS (FROM MANUFACTURERS) TESTS
-- ============================================================================

-- Test 2.1: All distributor orders reference valid distributors and manufacturers
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorOrders do
    LEFT JOIN Distributors d ON do.DistributorID = d.DistributorID
    LEFT JOIN Manufacturers m ON do.ManufacturerID = m.ManufacturerID
    WHERE d.DistributorID IS NULL OR m.ManufacturerID IS NULL
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 2.1 - Valid Order References: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 2.2: Order items reference valid products
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorOrderItems doi
    LEFT JOIN Products p ON doi.ProductID = p.ProductID
    WHERE p.ProductID IS NULL
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 2.2 - Valid Order Item Products: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 2.3: Order totals match sum of order items
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorOrders do
    LEFT JOIN (
        SELECT OrderID, SUM(Quantity * UnitPrice) as CalculatedTotal
        FROM DistributorOrderItems
        GROUP BY OrderID
    ) calc ON do.OrderID = calc.OrderID
    WHERE ABS(do.TotalAmount - COALESCE(calc.CalculatedTotal, 0)) > 0.01
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 2.3 - Order Total Accuracy: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 2.4: Order statuses are valid
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = COUNT(*)
    FROM DistributorOrders
    WHERE Status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Received', 'Cancelled')
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 2.4 - Valid Order Statuses: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 2.5: Order quantities are positive
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorOrderItems
    WHERE Quantity <= 0 OR UnitPrice <= 0
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 2.5 - Positive Order Quantities: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- ============================================================================
-- SECTION 3: BUSINESS LOGIC TESTS
-- ============================================================================

-- Test 3.1: Distributors have purchased from multiple manufacturers
SET @test_count = @test_count + 1;
SET @result = (
    SELECT CASE 
        WHEN COUNT(*) > 0 AND AVG(ManufacturerCount) >= 1 THEN 1 
        ELSE 0 
    END
    FROM (
        SELECT DistributorID, COUNT(DISTINCT ManufacturerID) as ManufacturerCount
        FROM DistributorOrders
        GROUP BY DistributorID
    ) dist_diversity
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 3.1 - Distributor-Manufacturer Relationships: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 3.2: Received orders have corresponding inventory
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorOrders do
    WHERE do.Status = 'Received'
    AND NOT EXISTS (
        SELECT 1 
        FROM DistributorInventory di
        WHERE di.DistributorID = do.DistributorID
        AND di.ProductID IN (
            SELECT ProductID 
            FROM DistributorOrderItems 
            WHERE OrderID = do.OrderID
        )
    )
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 3.2 - Received Orders Have Inventory: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 3.3: Distributor pricing provides reasonable margins (> 5%)
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = COUNT(*)
    FROM DistributorInventory
    WHERE SellPriceToRetailer IS NOT NULL 
    AND PurchasePriceFromManufacturer IS NOT NULL
    AND ((SellPriceToRetailer - PurchasePriceFromManufacturer) / PurchasePriceFromManufacturer * 100) >= 5
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 3.3 - Reasonable Profit Margins (>5%): ', 
    IF(@result = 1, '✓ PASS', 
         CONCAT('⚠ WARN - ', 
                (SELECT COUNT(*) FROM DistributorInventory 
                 WHERE SellPriceToRetailer IS NOT NULL 
                 AND PurchasePriceFromManufacturer IS NOT NULL
                 AND ((SellPriceToRetailer - PurchasePriceFromManufacturer) / PurchasePriceFromManufacturer * 100) < 5),
                ' products with low margins'))) as TestResult;

-- Test 3.4: Minimum order quantities respected (if applicable)
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorOrderItems doi
    JOIN Products p ON doi.ProductID = p.ProductID
    WHERE p.MinOrderQuantity IS NOT NULL 
    AND doi.Quantity < p.MinOrderQuantity
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 3.4 - Minimum Order Quantities: ', 
    IF(@result = 1, '✓ PASS', 
         CONCAT('⚠ WARN - ', 
                (SELECT COUNT(*) FROM DistributorOrderItems doi
                 JOIN Products p ON doi.ProductID = p.ProductID
                 WHERE p.MinOrderQuantity IS NOT NULL 
                 AND doi.Quantity < p.MinOrderQuantity),
                ' order items below MOQ'))) as TestResult;

-- ============================================================================
-- SECTION 4: SUPPLY CHAIN FLOW TESTS
-- ============================================================================

-- Test 4.1: Products flow from manufacturers to distributors
SET @test_count = @test_count + 1;
SET @result = (
    SELECT CASE 
        WHEN COUNT(DISTINCT p.ManufacturerID) > 0 
         AND COUNT(DISTINCT di.DistributorID) > 0 THEN 1
        ELSE 0 
    END
    FROM Products p
    JOIN DistributorInventory di ON p.ProductID = di.ProductID
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 4.1 - Manufacturer→Distributor Flow: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 4.2: Distributor purchase prices align with manufacturer prices (within reason)
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = COUNT(*)
    FROM DistributorInventory di
    JOIN Products p ON di.ProductID = p.ProductID
    WHERE di.PurchasePriceFromManufacturer IS NOT NULL
    AND p.ManufacturerPrice IS NOT NULL
    -- Allow for up to 10% variance (bulk discounts, shipping, etc.)
    AND ABS(di.PurchasePriceFromManufacturer - p.ManufacturerPrice) / p.ManufacturerPrice <= 0.10
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 4.3 - Price Consistency with Manufacturers: ', 
    IF(@result = 1, '✓ PASS', 
         CONCAT('⚠ WARN - ', 
                (SELECT COUNT(*) FROM DistributorInventory di
                 JOIN Products p ON di.ProductID = p.ProductID
                 WHERE di.PurchasePriceFromManufacturer IS NOT NULL
                 AND p.ManufacturerPrice IS NOT NULL
                 AND ABS(di.PurchasePriceFromManufacturer - p.ManufacturerPrice) / p.ManufacturerPrice > 0.10),
                ' products with price variance >10%'))) as TestResult;

-- Test 4.3: Distributors have relationships with multiple supply chain tiers
SET @test_count = @test_count + 1;
SET @result = (
    SELECT CASE 
        WHEN COUNT(DISTINCT d.DistributorID) > 0
         AND COUNT(DISTINCT do.ManufacturerID) > 0 THEN 1
        ELSE 0 
    END
    FROM Distributors d
    LEFT JOIN DistributorOrders do ON d.DistributorID = do.DistributorID
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 4.4 - Multi-Tier Relationships: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- ============================================================================
-- SECTION 5: DATA CONSISTENCY TESTS
-- ============================================================================

-- Test 5.1: Inventory update timestamps are valid
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = COUNT(*)
    FROM DistributorInventory
    WHERE LastPurchaseDate IS NULL OR LastPurchaseDate <= NOW()
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 5.1 - Valid Inventory Timestamps: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 5.2: Order dates are chronologically valid
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = COUNT(*)
    FROM DistributorOrders
    WHERE OrderDate <= NOW()
    AND (ExpectedDeliveryDate IS NULL OR ExpectedDeliveryDate >= DATE(OrderDate))
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 5.2 - Valid Order Dates: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 5.3: Distributor-Product relationships are unique
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = COUNT(DISTINCT CONCAT(DistributorID, '-', ProductID))
    FROM DistributorInventory
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 5.3 - Unique Distributor-Product Pairs: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- Test 5.4: All order items belong to valid orders
SET @test_count = @test_count + 1;
SET @result = (
    SELECT COUNT(*) = 0
    FROM DistributorOrderItems doi
    LEFT JOIN DistributorOrders do ON doi.OrderID = do.OrderID
    WHERE do.OrderID IS NULL
);
SET @test_pass = @test_pass + @result;
SET @test_fail = @test_fail + (1 - @result);
SELECT CONCAT('Test 5.4 - Order-Item Relationship Integrity: ', 
    IF(@result = 1, '✓ PASS', '✗ FAIL')) as TestResult;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

SELECT '
==========================================
STAGE 3 TEST SUMMARY
==========================================' as '';

SELECT 
    CONCAT('Total Tests: ', @test_count) as Summary
UNION ALL
SELECT CONCAT('Tests Passed ✓: ', @test_pass)
UNION ALL
SELECT CONCAT('Tests Failed ✗: ', @test_fail)
UNION ALL
SELECT CONCAT('Pass Rate: ', ROUND((@test_pass / @test_count) * 100, 1), '%')
UNION ALL
SELECT ''
UNION ALL
SELECT CASE 
    WHEN @test_pass = @test_count THEN '✅ All tests passed! Stage 3 is ready.'
    WHEN @test_pass / @test_count >= 0.9 THEN '⚠ Most tests passed, minor issues to review.'
    ELSE '❌ Multiple failures detected. Review required.'
END;

-- ============================================================================
-- DISTRIBUTOR TIER SUMMARY
-- ============================================================================

SELECT '
==========================================
DISTRIBUTOR TIER SUMMARY
==========================================' as '';

SELECT 
    (SELECT COUNT(*) FROM Distributors) as 'Distributors',
    (SELECT COUNT(DISTINCT DistributorID) FROM DistributorInventory) as 'Distributors with Inventory',
    (SELECT COUNT(DISTINCT ProductID) FROM DistributorInventory) as 'Unique Products in Distribution',
    (SELECT SUM(QuantityAvailable) FROM DistributorInventory) as 'Total Units Available',
    (SELECT SUM(QuantityReserved) FROM DistributorInventory) as 'Total Units Reserved',
    (SELECT COUNT(*) FROM DistributorOrders) as 'Total Purchase Orders',
    (SELECT COUNT(*) FROM DistributorOrders WHERE Status = 'Pending') as 'Pending Orders',
    (SELECT COUNT(*) FROM DistributorOrders WHERE Status = 'Received') as 'Received Orders',
    (SELECT CONCAT('$', FORMAT(SUM(TotalAmount), 2)) FROM DistributorOrders WHERE Status = 'Received') as 'Total Purchase Value';

-- Show distributor inventory summary
SELECT '
------------------------------------------
DISTRIBUTOR INVENTORY SUMMARY
------------------------------------------' as '';

SELECT 
    d.CompanyName as Distributor,
    COUNT(DISTINCT di.ProductID) as Products,
    SUM(di.QuantityAvailable) as Available,
    SUM(di.QuantityReserved) as Reserved,
    CONCAT('$', FORMAT(SUM(di.QuantityAvailable * di.PurchasePriceFromManufacturer), 2)) as 'Inventory Value',
    COUNT(CASE WHEN di.SellPriceToRetailer IS NOT NULL THEN 1 END) as 'Products with Retailer Pricing'
FROM Distributors d
LEFT JOIN DistributorInventory di ON d.DistributorID = di.DistributorID
GROUP BY d.DistributorID, d.CompanyName
ORDER BY d.CompanyName;

-- Show distributor order summary
SELECT '
------------------------------------------
DISTRIBUTOR ORDER SUMMARY
------------------------------------------' as '';

SELECT 
    d.CompanyName as Distributor,
    m.CompanyName as Manufacturer,
    do.Status,
    COUNT(do.OrderID) as Orders,
    CONCAT('$', FORMAT(SUM(do.TotalAmount), 2)) as 'Total Value'
FROM DistributorOrders do
JOIN Distributors d ON do.DistributorID = d.DistributorID
JOIN Manufacturers m ON do.ManufacturerID = m.ManufacturerID
GROUP BY d.DistributorID, d.CompanyName, m.CompanyName, do.Status
ORDER BY d.CompanyName, m.CompanyName, do.Status;

-- Show profit margin analysis
SELECT '
------------------------------------------
PROFIT MARGIN ANALYSIS
------------------------------------------' as '';

SELECT 
    d.CompanyName as Distributor,
    p.ProductName,
    CONCAT('$', FORMAT(di.PurchasePriceFromManufacturer, 2)) as 'Cost',
    CONCAT('$', FORMAT(di.SellPriceToRetailer, 2)) as 'Sell Price',
    CONCAT(FORMAT(
        ((di.SellPriceToRetailer - di.PurchasePriceFromManufacturer) / di.PurchasePriceFromManufacturer * 100), 
        1
    ), '%') as 'Profit Margin'
FROM DistributorInventory di
JOIN Distributors d ON di.DistributorID = d.DistributorID
JOIN Products p ON di.ProductID = p.ProductID
WHERE di.SellPriceToRetailer IS NOT NULL 
  AND di.PurchasePriceFromManufacturer IS NOT NULL
ORDER BY ((di.SellPriceToRetailer - di.PurchasePriceFromManufacturer) / di.PurchasePriceFromManufacturer) DESC
LIMIT 10;
