'use strict';

const API = '/api';
let currentUser = null;
let cart = [];

const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const signupForm = document.getElementById('signup-form');
const signupError = document.getElementById('signup-error');
const toggleFormBtn = document.getElementById('toggle-form');
const logoutBtn = document.getElementById('logout-btn');
const userName = document.getElementById('user-name');
const userRole = document.getElementById('user-role');

const productForm = document.getElementById('product-form');
const productError = document.getElementById('product-error');
const productList = document.getElementById('product-list');
const productAnalytics = document.getElementById('product-analytics');

const availableProducts = document.getElementById('available-products');
const retailerInventory = document.getElementById('retailer-inventory');
const retailerOrders = document.getElementById('retailer-orders');

const catalog = document.getElementById('catalog');
const cartDiv = document.getElementById('cart');
const checkoutForm = document.getElementById('checkout-form');
const checkoutError = document.getElementById('checkout-error');
const customerOrders = document.getElementById('customer-orders');

const distributorOrders = document.getElementById('distributor-orders');

document.addEventListener('DOMContentLoaded', () => {
  // Clear any existing user data to force login
  localStorage.removeItem('user');
  currentUser = null;
  
  // Always show login form initially
  authView.hidden = false;
  dashboardView.hidden = true;
  logoutBtn.hidden = true;

  loginForm.addEventListener('submit', handleLogin);
  signupForm.addEventListener('submit', handleSignup);
  toggleFormBtn.addEventListener('click', toggleForms);
  logoutBtn.addEventListener('click', handleLogout);
  if (productForm) productForm.addEventListener('submit', handleCreateProduct);
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);
});

async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = '';
  const fd = new FormData(loginForm);
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Email: fd.get('email'),
        Password: fd.get('password'),
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    showDashboard();
  } catch (e) {
    console.error('Login error:', e);
    loginError.textContent = e.message;
  }
}

async function handleSignup(e) {
  e.preventDefault();
  signupError.textContent = '';
  const fd = new FormData(signupForm);
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        FullName: fd.get('FullName'),
        Email: fd.get('Email'),
        Password: fd.get('Password'),
        Role: fd.get('Role'),
        Address: fd.get('Address'),
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Signup failed');
    }
    
    currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    showDashboard();
  } catch (e) {
    console.error('Signup error:', e);
    signupError.textContent = e.message;
  }
}

function toggleForms() {
  const isSignup = loginForm.hidden;
  loginForm.hidden = !isSignup;
  signupForm.hidden = isSignup;
  document.getElementById('auth-title').textContent = isSignup ? 'Sign In' : 'Create Account';
  toggleFormBtn.textContent = isSignup ? 'Create account' : 'Sign in';
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('user');
  cart = [];
  authView.hidden = false;
  dashboardView.hidden = true;
  loginForm.hidden = false;
  signupForm.hidden = true;
  loginForm.reset();
  logoutBtn.hidden = true;
}

function showDashboard() {
  authView.hidden = true;
  dashboardView.hidden = false;
  logoutBtn.hidden = false;
  userName.textContent = `Welcome, ${currentUser.FullName}`;
  userRole.textContent = `Role: ${currentUser.Role}`;

  // Hide all panels first
  document.getElementById('manufacturer-panel').hidden = true;
  document.getElementById('retailer-panel').hidden = true;
  document.getElementById('customer-panel').hidden = true;
  document.getElementById('distributor-panel').hidden = true;

  // Show only the relevant panel
  const role = currentUser.Role;
  if (role === 'Manufacturer') {
    document.getElementById('manufacturer-panel').hidden = false;
    loadManufacturerData();
  } else if (role === 'Retailer') {
    document.getElementById('retailer-panel').hidden = false;
    loadRetailerData();
  } else if (role === 'Customer') {
    document.getElementById('customer-panel').hidden = false;
    loadCustomerData();
  } else if (role === 'Distributor') {
    document.getElementById('distributor-panel').hidden = false;
    loadDistributorData();
  }
}

async function loadManufacturerData() {
  try {
    const res = await fetch(`${API}/products/master/manufacturer/${currentUser.UserID}`);
    const products = await res.json();
    productList.innerHTML = products.length
      ? products.map(p => `<div class="list-item"><h4>${p.ProductName}</h4><p>${p.Description || 'N/A'}</p></div>`).join('')
      : '<p class="empty">No products yet.</p>';

    // Load analytics
    const resAnalytics = await fetch(`${API}/products/master/analytics/${currentUser.UserID}`);
    const analytics = await resAnalytics.json();
    productAnalytics.innerHTML = analytics.length
      ? analytics.map(a => `
          <div class="list-item analytics-card">
            <h4>${a.ProductName}</h4>
            <div class="analytics-grid">
              <div class="metric">
                <span class="label">Retailers Stocking:</span>
                <span class="value">${a.TotalRetailers || 0}</span>
              </div>
              <div class="metric">
                <span class="label">Total Stock:</span>
                <span class="value">${a.TotalStock || 0} units</span>
              </div>
              <div class="metric">
                <span class="label">Avg Price:</span>
                <span class="value">$${a.AvgPrice ? parseFloat(a.AvgPrice).toFixed(2) : 'N/A'}</span>
              </div>
              <div class="metric">
                <span class="label">Price Range:</span>
                <span class="value">$${a.MinPrice ? parseFloat(a.MinPrice).toFixed(2) : 'N/A'} - $${a.MaxPrice ? parseFloat(a.MaxPrice).toFixed(2) : 'N/A'}</span>
              </div>
            </div>
            <div class="retailers-list">
              <span class="label">Stocked by:</span>
              <p>${a.RetailerNames || 'Not yet stocked'}</p>
            </div>
          </div>
        `).join('')
      : '<p class="empty">No products or distribution data yet.</p>';
  } catch (e) {
    productList.innerHTML = '<p class="empty">Error loading.</p>';
    productAnalytics.innerHTML = '<p class="empty">Error loading analytics.</p>';
  }
}

async function handleCreateProduct(e) {
  e.preventDefault();
  productError.textContent = '';
  const fd = new FormData(productForm);
  try {
    const res = await fetch(`${API}/products/master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ProductName: fd.get('ProductName'),
        Description: fd.get('Description'),
        ManufacturerID: currentUser.UserID,
      }),
    });
    if (!res.ok) throw new Error('Failed to create');
    productForm.reset();
    loadManufacturerData();
  } catch (e) {
    productError.textContent = e.message;
  }
}

async function loadRetailerData() {
  try {
    const res1 = await fetch(`${API}/products/master`);
    const products = await res1.json();
    availableProducts.innerHTML = products.length
      ? products.map(p => `<div class="list-item">
          <h4>${p.ProductName}</h4>
          <p>${p.Description || 'N/A'} - By ${p.ManufacturerName}</p>
          <form class="stock-form" data-pid="${p.ProductID}" style="margin-top: 0.5rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem;">
              <input type="number" name="Price" placeholder="Price" min="0" step="0.01" required>
              <input type="number" name="Stock" placeholder="Stock" min="0" step="1" required>
              <button type="submit" class="btn">Add</button>
            </div>
          </form>
        </div>`).join('')
      : '<p class="empty">No products.</p>';

    availableProducts.querySelectorAll('.stock-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        try {
          const res = await fetch(`${API}/retailer/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              RetailerID: currentUser.UserID,
              ProductID: form.getAttribute('data-pid'),
              Price: fd.get('Price'),
              Stock: fd.get('Stock'),
            }),
          });
          if (!res.ok) throw new Error('Failed');
          loadRetailerData();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    const res2 = await fetch(`${API}/retailer/${currentUser.UserID}/inventory`);
    const inv = await res2.json();
    
    // Get stock value using database function
    const stockValueRes = await fetch(`${API}/retailer/${currentUser.UserID}/stock-value`);
    const stockValueData = await stockValueRes.json();
    
    // Get low stock alerts
    const lowStockRes = await fetch(`${API}/retailer/${currentUser.UserID}/low-stock`);
    const lowStockData = await lowStockRes.json();
    
    retailerInventory.innerHTML = `
      <div class="dashboard-stats" style="margin-bottom: 1rem;">
        <div class="stat-card" style="background: #4CAF50; color: white; padding: 1rem; border-radius: 5px; margin-bottom: 0.5rem;">
          <h4>Total Stock Value: $${parseFloat(stockValueData.stockValue || 0).toFixed(2)}</h4>
        </div>
        ${lowStockData.length > 0 ? `
          <div class="stat-card" style="background: #ff9800; color: white; padding: 1rem; border-radius: 5px; margin-bottom: 0.5rem;">
            <h4>⚠️ Low Stock Alert: ${lowStockData.length} products need restocking</h4>
            <button class="btn" onclick="showLowStockDetails()" style="background: rgba(255,255,255,0.2); border: 1px solid white; margin-top: 0.5rem;">View Details</button>
          </div>
        ` : ''}
      </div>
      ${inv.length
        ? inv.map(i => `<div class="list-item">
            <h4>${i.ProductName}</h4>
            <p>$${parseFloat(i.Price).toFixed(2)} | Stock: ${i.Stock}</p>
          </div>`).join('')
        : '<p class="empty">Empty.</p>'
      }
    `;

    const res3 = await fetch(`${API}/orders/retailer/${currentUser.UserID}`);
    const orders = await res3.json();
    const grouped = groupOrdersByID(orders);
    retailerOrders.innerHTML = grouped.length
      ? grouped.map(o => `<div class="list-item">
          <h4>Order #${o.OrderID}</h4>
          <p>Customer: ${o.CustomerName} | Status: ${o.Status}</p>
          <p>Items: ${o.items.map(i => `${i.ProductName} x${i.Quantity}`).join(', ')}</p>
          ${o.Status === 'Pending' ? `<select class="distributor-select" data-oid="${o.OrderID}"><option>Assign distributor...</option></select>` : ''}
        </div>`).join('')
      : '<p class="empty">No orders.</p>';

    const selects = retailerOrders.querySelectorAll('.distributor-select');
    if (selects.length) {
      const res = await fetch(`${API}/distributors`);
      const dists = await res.json();
      selects.forEach(sel => {
        sel.innerHTML += dists.map(d => `<option value="${d.UserID}">${d.FullName}</option>`).join('');
        sel.addEventListener('change', async (e) => {
          if (e.target.value) {
            await assignDistributor(e.target.getAttribute('data-oid'), e.target.value);
            loadRetailerData();
          }
        });
      });
    }
  } catch (e) {
    console.error(e);
  }
}

async function assignDistributor(oid, did) {
  try {
    const res = await fetch(`${API}/orders/${oid}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ DistributorID: did }),
    });
    if (!res.ok) throw new Error('Failed');
  } catch (e) {
    alert(e.message);
  }
}

async function loadCustomerData() {
  try {
    const res1 = await fetch(`${API}/products`);
    const prods = await res1.json();
    catalog.innerHTML = prods.length
      ? prods.map(p => `<div class="list-item">
          <h4>${p.ProductName}</h4>
          <p>$${parseFloat(p.Price).toFixed(2)} | Stock: ${p.Stock} - ${p.RetailerName}</p>
          <button class="btn" onclick="addToCart('${p.RetailerProductID}', '${p.RetailerID}', '${p.ProductName}', ${parseFloat(p.Price)}, ${p.Stock})" ${p.Stock <= 0 ? 'disabled' : ''}>
            ${p.Stock <= 0 ? 'Out of Stock' : 'Add'}
          </button>
        </div>`).join('')
      : '<p class="empty">No products.</p>';

    const res2 = await fetch(`${API}/orders/customer/${currentUser.UserID}`);
    const orders = await res2.json();
    const grouped = groupOrdersByID(orders);
    customerOrders.innerHTML = grouped.length
      ? grouped.map(o => `<div class="list-item">
          <h4>Order #${o.OrderID}</h4>
          <p>Retailer: ${o.RetailerName} | Status: ${o.Status}</p>
          <p>Items: ${o.items.map(i => `${i.ProductName} x${i.Quantity}`).join(', ')}</p>
        </div>`).join('')
      : '<p class="empty">No orders.</p>';
  } catch (e) {
    console.error(e);
  }
}

function addToCart(rpid, rid, name, price, maxStock) {
  const existing = cart.find(i => i.RetailerProductID === rpid);
  const currentQty = existing ? existing.Quantity : 0;
  
  if (currentQty >= maxStock) {
    alert(`Cannot add more. Maximum stock available: ${maxStock}`);
    return;
  }
  
  if (existing) existing.Quantity += 1;
  else cart.push({ RetailerProductID: rpid, RetailerID: rid, Quantity: 1, name, price, maxStock });
  renderCart();
}

function renderCart() {
  if (!cart.length) {
    cartDiv.innerHTML = '<p class="empty">Empty.</p>';
    return;
  }
  cartDiv.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div>
        <span>${i.name}</span>
        <div style="margin-top: 8px; font-size: 0.9em;">
          <input type="number" min="1" max="${i.maxStock}" value="${i.Quantity}" 
            onchange="updateCartQuantity('${i.RetailerProductID}', this.value, ${i.maxStock})"
            style="width: 60px; padding: 4px;">
          <span> / ${i.maxStock} available</span>
        </div>
        <p style="margin-top: 4px; font-weight: bold;">$${(i.price * i.Quantity).toFixed(2)}</p>
      </div>
      <button class="btn" onclick="removeFromCart('${i.RetailerProductID}')">Remove</button>
    </div>
  `).join('');
}

function updateCartQuantity(rpid, newQty, maxStock) {
  newQty = parseInt(newQty);
  if (newQty < 1) {
    removeFromCart(rpid);
    return;
  }
  if (newQty > maxStock) {
    alert(`Cannot exceed available stock: ${maxStock}`);
    renderCart();
    return;
  }
  const item = cart.find(i => i.RetailerProductID === rpid);
  if (item) item.Quantity = newQty;
  renderCart();
}

function removeFromCart(rpid) {
  cart = cart.filter(i => i.RetailerProductID !== rpid);
  renderCart();
}

async function handleCheckout(e) {
  e.preventDefault();
  checkoutError.textContent = '';
  if (!cart.length) {
    checkoutError.textContent = 'Cart empty';
    return;
  }
  const rid = cart[0].RetailerID;
  if (!cart.every(i => i.RetailerID === rid)) {
    checkoutError.textContent = 'All items from same retailer';
    return;
  }
  const fd = new FormData(checkoutForm);
  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CustomerID: currentUser.UserID,
        RetailerID: rid,
        ShippingAddress: fd.get('ShippingAddress'),
        items: cart.map(i => ({ RetailerProductID: i.RetailerProductID, Quantity: i.Quantity })),
      }),
    });
    if (!res.ok) throw new Error('Failed');
    cart = [];
    renderCart();
    checkoutForm.reset();
    loadCustomerData();
  } catch (e) {
    checkoutError.textContent = e.message;
  }
}

async function loadDistributorData() {
  try {
    const res = await fetch(`${API}/orders/distributor/${currentUser.UserID}`);
    const orders = await res.json();
    const grouped = groupOrdersByID(orders);
    distributorOrders.innerHTML = grouped.length
      ? grouped.map(o => `<div class="list-item">
          <h4>Order #${o.OrderID}</h4>
          <p>Customer: ${o.CustomerName} | Retailer: ${o.RetailerName} | Status: ${o.Status}</p>
          <p>Items: ${o.items.map(i => `${i.ProductName} x${i.Quantity}`).join(', ')}</p>
          ${o.Status === 'Assigned' ? `<button class="btn" onclick="updateOrderStatus('${o.OrderID}', 'Shipped')">Ship</button>` : ''}
          ${o.Status === 'Shipped' ? `<button class="btn" onclick="updateOrderStatus('${o.OrderID}', 'Delivered')">Deliver</button>` : ''}
        </div>`).join('')
      : '<p class="empty">No orders.</p>';
  } catch (e) {
    console.error(e);
  }
}

async function updateOrderStatus(oid, status) {
  try {
    const res = await fetch(`${API}/orders/${oid}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Status: status }),
    });
    if (!res.ok) throw new Error('Failed');
    loadDistributorData();
  } catch (e) {
    alert(e.message);
  }
}

function groupOrdersByID(orders) {
  const map = {};
  for (const o of orders) {
    if (!map[o.OrderID]) {
      map[o.OrderID] = { ...o, items: [] };
    }
    map[o.OrderID].items.push({
      ProductName: o.ProductName,
      Quantity: o.Quantity,
    });
  }
  return Object.values(map);
}

// Advanced Database Features

async function showLowStockDetails() {
  try {
    const res = await fetch(`${API}/retailer/${currentUser.UserID}/low-stock`);
    const lowStockData = await res.json();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; 
      z-index: 1000;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 600px; max-height: 80%; overflow-y: auto;">
        <h2 style="color: #ff9800;">⚠️ Low Stock Products</h2>
        <div style="margin: 1rem 0;">
          ${lowStockData.map(item => `
            <div style="border: 1px solid #ddd; padding: 1rem; margin: 0.5rem 0; border-radius: 5px;">
              <h4>${item.ProductName}</h4>
              <p><strong>Current Stock:</strong> ${item.CurrentStock}</p>
              <p><strong>Minimum Required:</strong> ${item.MinStockLevel}</p>
              <p><strong>Suggested Restock:</strong> ${item.RestockNeeded} units</p>
            </div>
          `).join('')}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button class="btn" onclick="showAuditTrail()" style="background: #2196F3;">View Audit Trail</button>
          <button class="btn" onclick="this.closest('div[style*=fixed]').remove()">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
  } catch (e) {
    alert('Failed to load low stock details: ' + e.message);
  }
}

async function showAuditTrail() {
  try {
    const res = await fetch(`${API}/retailer/${currentUser.UserID}/audit-trail`);
    const auditData = await res.json();
    
    // Close existing modal if any
    const existingModal = document.querySelector('div[style*="position: fixed"]');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; 
      z-index: 1000;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 800px; max-height: 80%; overflow-y: auto;">
        <h2 style="color: #2196F3;">📊 Inventory Audit Trail</h2>
        <div style="margin: 1rem 0;">
          ${auditData.length > 0 ? auditData.map(audit => `
            <div style="border: 1px solid #ddd; padding: 1rem; margin: 0.5rem 0; border-radius: 5px;">
              <h4>${audit.ProductName}</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <p><strong>Stock Change:</strong> ${audit.OldStock} → ${audit.NewStock} (${audit.StockChange > 0 ? '+' : ''}${audit.StockChange})</p>
                <p><strong>Reason:</strong> ${audit.ChangeReason}</p>
                <p><strong>Date:</strong> ${new Date(audit.ChangeDate).toLocaleDateString()}</p>
                ${audit.OrderID ? `<p><strong>Order ID:</strong> #${audit.OrderID}</p>` : ''}
              </div>
            </div>
          `).join('') : '<p class="empty">No audit trail data available.</p>'}
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button class="btn" onclick="this.closest('div[style*=fixed]').remove()">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
  } catch (e) {
    alert('Failed to load audit trail: ' + e.message);
  }
}

// Enhanced order creation using validated stored procedure
async function createValidatedOrder(customerId, retailerId, shippingAddress, productId, quantity) {
  try {
    const res = await fetch(`${API}/orders/validated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        retailerId, 
        shippingAddress,
        productId,
        quantity
      }),
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.message || 'Order creation failed');
    }
    
    alert(`✅ ${result.message}`);
    return result.orderId;
    
  } catch (e) {
    alert(`❌ Order Failed: ${e.message}`);
    throw e;
  }
}
