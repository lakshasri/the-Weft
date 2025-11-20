# Distributor Sales & Inventory Enhancement Guide

## Summary of Changes

I've enhanced the distributor dashboard to show:
1. **Sales to Retailers** - See who bought what from you
2. **Orders from Manufacturers** - Track your purchases  
3. **Enhanced Inventory View** - More context about products

## New API Endpoint Created

### GET `/api/distributor/:id/sales`
Returns all orders placed by retailers to this distributor.

**Response includes:**
- Order details (ID, date, status, amount)
- Retailer information (name, phone, address)
- Item count and total units
- Individual items with product details

**Query Parameters:**
- `status` (optional) - Filter by order status (Pending, Confirmed, Shipped, Received)

**Example:**
```bash
# Get all sales
curl http://localhost:3000/api/distributor/7/sales

# Get only pending sales
curl http://localhost:3000/api/distributor/7/sales?status=Pending
```

---

## How to Update Distributor Dashboard

### 1. Add New Tab for "Sales to Retailers"

In `distributor-dashboard.html`, add a new tab after the existing tabs:

```html
<!-- Add this in the tabs section -->
<button class="tab-btn" onclick="switchTab(event, 'sales')">
  Sales to Retailers
</button>

<!-- Add this tab content section -->
<div id="salesTab" class="tab-content">
  <div class="section-header">
    <h2>Sales to Retailers</h2>
    <div>
      <select id="salesFilter" onchange="loadSales()">
        <option value="">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="Confirmed">Confirmed</option>
        <option value="Shipped">Shipped</option>
        <option value="Received">Received</option>
      </select>
      <button onclick="loadSales()">Refresh</button>
    </div>
  </div>
  
  <table class="inventory-table">
    <thead>
      <tr>
        <th>Order ID</th>
        <th>Retailer</th>
        <th>Date</th>
        <th>Status</th>
        <th>Items</th>
        <th>Total Units</th>
        <th>Amount</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="salesTableBody">
      <tr><td colspan="8" style="text-align: center;">Loading...</td></tr>
    </tbody>
  </table>
  
  <div id="salesDetails" style="margin-top: 2rem;"></div>
</div>
```

### 2. Add JavaScript Function to Load Sales

```javascript
// Add this function to the distributor-dashboard.html script section

async function loadSales() {
  try {
    const filterStatus = document.getElementById('salesFilter').value;
    const url = filterStatus 
      ? `/api/distributor/${currentUser.UserID}/sales?status=${filterStatus}`
      : `/api/distributor/${currentUser.UserID}/sales`;
      
    const response = await fetch(url);
    const sales = await response.json();
    
    const tbody = document.getElementById('salesTableBody');
    
    if (!sales || sales.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No sales orders found.</td></tr>';
      return;
    }
    
    tbody.innerHTML = sales.map(order => `
      <tr>
        <td><strong>#${order.OrderID}</strong></td>
        <td>
          <strong>${order.RetailerName}</strong><br>
          <small>${order.RetailerPhone || ''}</small>
        </td>
        <td>${new Date(order.OrderDate).toLocaleDateString()}</td>
        <td><strong>${order.Status}</strong></td>
        <td>${order.ItemCount} items</td>
        <td>${order.TotalUnits} units</td>
        <td><strong>$${parseFloat(order.TotalAmount).toFixed(2)}</strong></td>
        <td>
          <button onclick="viewSaleDetails(${order.OrderID})">View Details</button>
          ${order.Status === 'Pending' ? 
            `<button onclick="confirmSale(${order.OrderID})">Confirm</button>` : ''}
        </td>
      </tr>
    `).join('');
    
    // Store for details view
    window.salesOrders = sales;
    
  } catch (error) {
    console.error('Error loading sales:', error);
    document.getElementById('salesTableBody').innerHTML = 
      '<tr><td colspan="8" style="text-align: center;" class="error">Error loading sales orders.</td></tr>';
  }
}

function viewSaleDetails(orderId) {
  const order = window.salesOrders.find(o => o.OrderID === orderId);
  if (!order) return;
  
  const detailsDiv = document.getElementById('salesDetails');
  detailsDiv.innerHTML = `
    <div style="border: 2px solid black; padding: 1rem; background: white;">
      <h3>Order #${order.OrderID} Details</h3>
      <div style="margin: 1rem 0;">
        <p><strong>Retailer:</strong> ${order.RetailerName}</p>
        <p><strong>Address:</strong> ${order.RetailerAddress || 'N/A'}</p>
        <p><strong>Phone:</strong> ${order.RetailerPhone || 'N/A'}</p>
        <p><strong>Order Date:</strong> ${new Date(order.OrderDate).toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${order.Status}</p>
        <p><strong>Payment Terms:</strong> ${order.PaymentTerms}</p>
        ${order.Notes ? `<p><strong>Notes:</strong> ${order.Notes}</p>` : ''}
      </div>
      
      <h4>Items:</h4>
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Manufacturer</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.Items.map(item => `
            <tr>
              <td><strong>${item.ProductName}</strong></td>
              <td>${item.ManufacturerName}</td>
              <td>${item.Quantity} units</td>
              <td>$${parseFloat(item.UnitPrice).toFixed(2)}</td>
              <td><strong>$${parseFloat(item.LineTotal).toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 1rem; text-align: right;">
        <strong>Total: $${parseFloat(order.TotalAmount).toFixed(2)}</strong>
      </div>
      
      <button onclick="document.getElementById('salesDetails').innerHTML = ''">Close Details</button>
    </div>
  `;
}

// Update tab switching to include sales
function switchTab(event, tabName) {
  // ...existing code...
  
  // Add this line
  if (tabName === 'sales') loadSales();
}
```

### 3. Enhance Inventory View with Sales Information

Update the inventory table to show reserved quantities and sales information:

```javascript
// Modify loadInventory() function to show more details

tbody.innerHTML = inventory.map((item, index) => {
  const profitMargin = item.ProfitMargin ? parseFloat(item.ProfitMargin).toFixed(1) + '%' : 'Not Set';
  const profitClass = item.ProfitMargin && parseFloat(item.ProfitMargin) > 0 ? 'profit-positive' : '';
  const available = item.AvailableForSale;
  const reserved = item.QuantityReserved;
  
  return `
    <tr>
      <td><strong>${item.ProductName}</strong></td>
      <td>${item.ManufacturerName}</td>
      <td>
        <strong>${available}</strong> available<br>
        <small>${reserved > 0 ? `(${reserved} reserved)` : ''}</small>
      </td>
      <td>${item.QuantityReserved}</td>
      <td>$${parseFloat(item.PurchasePriceFromManufacturer).toFixed(2)}</td>
      <td>${item.SellPriceToRetailer ? '$' + parseFloat(item.SellPriceToRetailer).toFixed(2) : 'Not Set'}</td>
      <td><span class="${profitClass}">${profitMargin}</span></td>
      <td>
        <button class="btn" onclick="openPricingModal(${index})">Set Price</button>
        <button class="btn" onclick="viewProductSales(${item.ProductID})">View Sales</button>
      </td>
    </tr>
  `;
}).join('');
```

### 4. Add Product-Specific Sales View

```javascript
async function viewProductSales(productId) {
  try {
    const response = await fetch(`/api/distributor/${currentUser.UserID}/sales`);
    const allSales = await response.json();
    
    // Filter sales that include this product
    const productSales = allSales.filter(order => 
      order.Items.some(item => item.ProductID === productId)
    );
    
    if (productSales.length === 0) {
      alert('No sales found for this product yet.');
      return;
    }
    
    const product = window.inventoryItems.find(i => i.ProductID === productId);
    
    let html = `
      <div style="border: 2px solid black; padding: 1rem; background: white; margin-top: 1rem;">
        <h3>Sales History: ${product.ProductName}</h3>
        <table class="inventory-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Retailer</th>
              <th>Date</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>`;
    
    productSales.forEach(order => {
      const item = order.Items.find(i => i.ProductID === productId);
      html += `
        <tr>
          <td>#${order.OrderID}</td>
          <td>${order.RetailerName}</td>
          <td>${new Date(order.OrderDate).toLocaleDateString()}</td>
          <td>${item.Quantity} units</td>
          <td>$${parseFloat(item.UnitPrice).toFixed(2)}</td>
          <td>${order.Status}</td>
        </tr>`;
    });
    
    html += `
          </tbody>
        </table>
        <button onclick="this.parentElement.remove()">Close</button>
      </div>`;
    
    document.getElementById('inventoryTab').insertAdjacentHTML('beforeend', html);
    
  } catch (error) {
    console.error('Error loading product sales:', error);
    alert('Failed to load sales history');
  }
}
```

---

## Testing the Changes

1. **Start the server:**
```bash
cd /home/kshitij/kshitij/LABS/DBMS/weft/the-Weft/scm-project
npm start
```

2. **Test the API:**
```bash
# Test sales endpoint
curl http://localhost:3000/api/distributor/7/sales | python3 -m json.tool

# Test with status filter
curl "http://localhost:3000/api/distributor/7/sales?status=Pending" | python3 -m json.tool
```

3. **Test in browser:**
- Login as distributor: `ops@speedy-ship.io` / `password`
- Click "Sales to Retailers" tab
- View order details
- Filter by status
- Check inventory view for reserved quantities

---

## Benefits of This Enhancement

### For Distributors:
✅ **See who is buying** - Know which retailers are ordering
✅ **Track sales** - Monitor order status and amounts  
✅ **Inventory context** - See how much is reserved vs available
✅ **Product performance** - View sales history per product
✅ **Better planning** - Know when to reorder from manufacturers

### Dashboard Views:
1. **Orders Tab** - Shows purchases FROM manufacturers
2. **Sales Tab** - Shows sales TO retailers  
3. **Inventory Tab** - Shows current stock with reservations
4. **Analytics Tab** - Overview of all operations

---

## Sample Data Structure

**Sales API Response:**
```json
[
  {
    "OrderID": 42,
    "OrderDate": "2025-11-13T10:30:00.000Z",
    "Status": "Pending",
    "TotalAmount": "1543.00",
    "RetailerName": "Metro Outfitters",
    "RetailerPhone": "555-0102",
    "ItemCount": 3,
    "TotalUnits": 25,
    "Items": [
      {
        "ProductName": "Atlas Servo X200",
        "Quantity": 10,
        "UnitPrice": "133.00",
        "LineTotal": "1330.00"
      }
    ]
  }
]
```

---

## Next Steps

1. ✅ API endpoint created (`/api/distributor/:id/sales`)
2. ⏳ Update distributor-dashboard.html with new tab
3. ⏳ Add JavaScript functions for loading sales
4. ⏳ Enhance inventory view with reserved quantities
5. ⏳ Test complete workflow
6. ⏳ Optional: Add sales analytics dashboard

The backend is ready! Just need to update the frontend HTML/JS to display the sales data.
