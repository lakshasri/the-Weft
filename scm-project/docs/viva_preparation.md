# Database Viva Preparation Guide: SCM Project

This guide explains the advanced SQL components used in your project. Use this to understand the *logic* behind your code for your viva.

---

## 1. Triggers (Automation)

**Definition:** Code that automatically runs (fires) in response to specific events (INSERT, UPDATE, DELETE) on a table.

### A. `UpdateOrderTotalAfterItem`
*   **Event:** Runs `AFTER INSERT`, `AFTER UPDATE`, or `AFTER DELETE` on the `OrderItems` table.
*   **Logic:** It calls the function `CalculateOrderTotal` for the specific `OrderID` and updates the `TotalAmount` in the parent `Orders` table.
*   **Why use it?** To ensure data consistency. If you add an item to an order, the total price of the order *must* increase automatically. You shouldn't have to remember to update the `Orders` table manually every time.
*   **Viva Question:** *Why didn't you just calculate the total on the fly using `SUM()`?*
    *   **Answer:** "Storing the total improves read performance. If we have millions of orders, calculating the sum every time we view the order list would be slow. The trigger keeps the stored value accurate."

### B. `AuditInventoryChanges`
*   **Event:** Runs `AFTER UPDATE` on the `RetailerProducts` table.
*   **Logic:** It compares `OLD.Stock` (value before update) with `NEW.Stock` (value after update).
    *   If `NEW < OLD`, it assumes a sale (`ORDER`).
    *   If `NEW > OLD`, it assumes a restock (`RESTOCK`).
    *   It inserts a record into `InventoryAudit` with the old value, new value, and timestamp.
*   **Why use it?** For security and tracking. If stock goes missing, we can look at the audit table to see exactly when it changed and why.
*   **Viva Question:** *What is the difference between `OLD` and `NEW` keywords?*
    *   **Answer:** "`OLD` refers to the row data *before* the update, and `NEW` refers to the row data *after* the update. They are only available in Triggers."

---

## 2. Stored Procedures (Complex Logic)

**Definition:** A set of SQL statements that can be saved and reused. They can accept inputs, return outputs, and handle transactions.

### A. `ProcessOrderWithValidation`
*   **Input:** CustomerID, RetailerID, ProductID, Quantity.
*   **Output:** OrderID (if successful), Message (Success/Error).
*   **Logic (The "ACID" Test):**
    1.  **`START TRANSACTION`**: Begins a block of operations that must succeed or fail together.
    2.  **Check Stock**: Checks if the retailer has enough `Stock`.
    3.  **If Insufficient:** `ROLLBACK` (Undo everything) and return error.
    4.  **If Sufficient:**
        *   `INSERT` into `Orders`.
        *   `INSERT` into `OrderItems`.
        *   `UPDATE` `RetailerProducts` (decrease stock).
        *   **`COMMIT`**: Save all changes permanently.
*   **Why use it?** To prevent "race conditions" and invalid data. We don't want to create an order if there is no stock, and we definitely don't want to create an order but fail to decrease the stock.
*   **Viva Question:** *Why did you use a Transaction here?*
    *   **Answer:** "To ensure Atomicity. Creating an order involves multiple tables (Orders, OrderItems, Inventory). Either all steps must happen, or none of them should, to prevent data corruption."

### B. `CheckLowStockProducts`
*   **Input:** RetailerID.
*   **Logic:**
    *   Uses a **Cursor** (a loop) to iterate through products.
    *   Checks if `Stock <= MinStockLevel`.
    *   If yes, it adds the product to a temporary report.
*   **Why use it?** To generate a report of items that need restocking.
*   **Viva Question:** *What is a Cursor?*
    *   **Answer:** "A Cursor allows us to iterate through query results row-by-row, similar to a `for` loop in programming, allowing for complex row-level processing."

---

## 3. Functions (Calculations)

**Definition:** Reusable code that returns a single value. Used inside queries.

### A. `CalculateOrderTotal`
*   **Input:** OrderID.
*   **Logic:** Runs `SELECT SUM(Quantity * UnitPrice) FROM OrderItems WHERE OrderID = ...`
*   **Returns:** The total decimal value.
*   **Why use it?** To avoid rewriting the multiplication logic `(Quantity * Price)` in every single query. It follows the DRY (Don't Repeat Yourself) principle.

### B. `GetRetailerStockValue`
*   **Input:** RetailerID.
*   **Logic:** Calculates the total monetary value of all goods sitting in a retailer's warehouse.
*   **Returns:** Total value.

---

## 4. Views (Virtual Tables)

**Definition:** A saved query that looks like a table. It doesn't store data itself; it fetches it dynamically.

### A. `SupplyChainPricing`
*   **Logic:** Joins `Products`, `Manufacturers`, `DistributorInventory`, and `RetailerProducts`.
*   **Why use it?** To simplify complex joins. Instead of writing a 4-table join every time we want to compare prices, we just do `SELECT * FROM SupplyChainPricing`.
*   **Viva Question:** *Does a View store data?*
    *   **Answer:** "No, a standard View is just a stored query. The data is fetched from the underlying tables every time the View is accessed."

---

## Quick Cheat Sheet for Viva

| Concept | Keyword | Key Usage in Project |
| :--- | :--- | :--- |
| **Trigger** | `CREATE TRIGGER` | Auto-updating order totals, Audit logging. |
| **Procedure** | `CREATE PROCEDURE`, `CALL` | Handling complex Order placement (Transaction). |
| **Function** | `CREATE FUNCTION`, `RETURN` | Calculating totals (math). |
| **Transaction** | `START TRANSACTION`, `COMMIT`, `ROLLBACK` | Ensuring Order + Inventory update happens together. |
| **Cursor** | `DECLARE CURSOR`, `FETCH` | Looping through low-stock items. |
