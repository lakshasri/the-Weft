# Customer Orders Tab - Visual Reference

## Tab Navigation
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Distributor Catalog] [My Orders] [My Inventory] [Pricing] [Customer Orders]│
└─────────────────────────────────────────────────────────────────────────┘
                                                                    ^^^^^^^^
                                                                    NEW TAB
```

## Filter Section
```
┌────────────────────────────────────────────────────────────────────────┐
│ Customer Orders                    [All] [Pending] [Assigned] [Shipped]│
│                                    [Delivered] [Refresh]               │
└────────────────────────────────────────────────────────────────────────┘
```

## Orders Table
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Order ID │ Customer           │ Date       │ Items        │ Total    │ Address    │ Status  │ Action      │
├──────────┼────────────────────┼────────────┼──────────────┼──────────┼────────────┼─────────┼─────────────┤
│ #123     │ John Doe           │ 11/14/2025 │ 3 items      │ $299.99  │ 123 Main   │ Pending │ [Ship Order]│
│          │ john@example.com   │            │ (10 units)   │          │ Street     │         │             │
│          │ 555-1234           │            │ [View Items] │          │            │         │             │
├──────────┼────────────────────┼────────────┼──────────────┼──────────┼────────────┼─────────┼─────────────┤
│ #124     │ Jane Smith         │ 11/13/2025 │ 2 items      │ $150.00  │ 456 Oak    │ Shipped │ ✓ Shipped   │
│          │ jane@example.com   │            │ (5 units)    │          │ Avenue     │         │             │
│          │ 555-5678           │            │ [View Items] │          │            │         │             │
└──────────┴────────────────────┴────────────┴──────────────┴──────────┴────────────┴─────────┴─────────────┘
```

## View Items Dialog
```
┌────────────────────────────────────┐
│ Order #123 Items:                  │
│                                    │
│ • Product A: 2 units @ $50.00      │
│   = $100.00                        │
│                                    │
│ • Product B: 5 units @ $30.00      │
│   = $150.00                        │
│                                    │
│ • Product C: 3 units @ $16.66      │
│   = $49.99                         │
│                                    │
│              [OK]                  │
└────────────────────────────────────┘
```

## Ship Confirmation
```
┌────────────────────────────────────┐
│ Mark this order as shipped?        │
│ The customer will be notified.     │
│                                    │
│        [Cancel]   [OK]             │
└────────────────────────────────────┘
```

## Status Flow
```
Customer Order Lifecycle:

    [Customer Places Order]
             ↓
    ┌────────────────┐
    │ Pending        │  ← Retailer can ship
    └────────────────┘
             ↓
    ┌────────────────┐
    │ Assigned       │  ← Retailer can ship
    └────────────────┘
             ↓
    [Retailer Clicks "Ship Order"]
             ↓
    ┌────────────────┐
    │ Shipped        │  ← No action needed
    └────────────────┘
             ↓
    [Customer Receives Order]
             ↓
    ┌────────────────┐
    │ Delivered      │  ← Order complete
    └────────────────┘
```

## Button States

### Ship Order Button Visibility:
```
Status: Pending   → [Ship Order] ← Button visible
Status: Assigned  → [Ship Order] ← Button visible
Status: Shipped   → ✓ Shipped    ← No button
Status: Delivered → ✓ Delivered  ← No button
```

### Filter Button States:
```
Active:   [All] ← Black border-bottom
Inactive: [Pending] [Assigned] [Shipped] [Delivered] ← No border
```

## API Flow Diagram
```
Frontend                    Backend                    Database
   │                          │                           │
   │  GET customer-orders     │                           │
   ├─────────────────────────>│                           │
   │                          │  SELECT FROM Orders       │
   │                          ├──────────────────────────>│
   │                          │<──────────────────────────┤
   │                          │  SELECT FROM OrderItems   │
   │                          ├──────────────────────────>│
   │                          │<──────────────────────────┤
   │<─────────────────────────┤                           │
   │  Display orders          │                           │
   │                          │                           │
   │  [User clicks Ship]      │                           │
   │  PATCH ship order        │                           │
   ├─────────────────────────>│                           │
   │                          │  UPDATE Orders Status     │
   │                          ├──────────────────────────>│
   │                          │<──────────────────────────┤
   │<─────────────────────────┤                           │
   │  Show success ✅         │                           │
   │  Refresh list            │                           │
   │                          │                           │
```

## Color Scheme (Black & White Theme)
```
Background:      White (#FFFFFF)
Text:            Black (#000000)
Borders:         Black (#000000)
Hover:           Light Gray (#F5F5F5)
Active Tab:      Black bottom border (3px)
Buttons:         White bg, Black border
Primary Button:  Black bg, White text
Status Badges:   White bg, Black border, Bold text
```

## Responsive Design
```
Desktop (1200px+):
┌────────────────────────────────────────┐
│         Full table with all columns    │
└────────────────────────────────────────┘

Tablet (768px - 1199px):
┌─────────────────────────────┐
│    Table scrolls horizontally│
└─────────────────────────────┘

Mobile (< 768px):
┌──────────────────┐
│  Table scrolls   │
│  Buttons stack   │
└──────────────────┘
```

## File Structure
```
scm-project/
├── public/
│   ├── retailer-dashboard.html  ← MODIFIED (added ~100 lines)
│   │   ├── <button> Customer Orders tab
│   │   ├── <div id="customer-orders"> content
│   │   ├── loadCustomerOrders() function
│   │   ├── filterCustomerOrders() function
│   │   ├── viewOrderItems() function
│   │   └── shipCustomerOrder() function
│   └── style.css  ← NO CHANGES (reused existing styles)
├── src/
│   ├── controllers/
│   │   └── scmController.js  ← NO CHANGES (already implemented)
│   └── routes/
│       └── api.js  ← NO CHANGES (already implemented)
└── server.js  ← NO CHANGES
```

## Key Code Snippets

### Tab Button:
```html
<button class="tab" onclick="switchTab('customer-orders')">
  Customer Orders
</button>
```

### Tab Content:
```html
<div id="customer-orders" class="tab-content">
  <div class="section">
    <div class="section-header">
      <h2>Customer Orders</h2>
      <div><!-- Filter buttons --></div>
    </div>
    <div id="customer-orders-list">
      <!-- Table rendered here -->
    </div>
  </div>
</div>
```

### Main Function:
```javascript
async function loadCustomerOrders(status = null) {
  const url = status 
    ? `${API}/retailer/${currentUser.UserID}/customer-orders?status=${status}`
    : `${API}/retailer/${currentUser.UserID}/customer-orders`;
  
  const response = await fetch(url);
  const orders = await response.json();
  
  // Render table with orders
  container.innerHTML = `<table>...</table>`;
}
```

### Ship Function:
```javascript
async function shipCustomerOrder(orderId) {
  if (!confirm('Mark this order as shipped?')) return;
  
  const response = await fetch(
    `${API}/retailer/${currentUser.UserID}/customer-orders/${orderId}/ship`,
    { method: 'PATCH' }
  );
  
  if (response.ok) {
    alert('✅ Order shipped successfully!');
    loadCustomerOrders(currentStatusFilter);
  }
}
```

---

## Testing Quick Reference

### Test Scenarios:

1. **Load tab** → Should show all orders
2. **Click Pending** → Should show only pending orders
3. **Click View Items** → Should show popup with items
4. **Click Ship Order** → Should confirm, then ship
5. **Click Refresh** → Should reload current filter
6. **Switch tabs** → Should preserve state

### Expected Behaviors:

- Empty state shows "No customer orders found"
- Error shows "Failed to load customer orders"
- Ship success shows "✅ Order shipped successfully!"
- Ship error shows "❌ Failed to ship order"
- Only Pending/Assigned orders have Ship button
- Filter buttons highlight when active
- Table refreshes after successful ship

---

This visual reference shows exactly what was implemented and how it looks!
