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
    // Store user in localStorage for the retailer dashboard
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    // Redirect to the new retailer dashboard
    window.location.href = 'retailer-dashboard.html';
  } else if (role === 'Customer') {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    window.location.href = 'customer-dashboard.html';
  } else if (role === 'Distributor') {
    // Store user in localStorage for the distributor dashboard
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    // Redirect to the new distributor dashboard
    window.location.href = 'distributor-dashboard.html';
  }
}

async function loadManufacturerData() {
  await loadManufacturerStats();
  showManufacturerTab('products');
}

async function loadManufacturerStats() {
  try {
    const [productsRes, inventoryRes, ordersRes] = await Promise.all([
      fetch(`${API}/products/master/manufacturer/${currentUser.UserID}`),
      fetch(`${API}/manufacturer/${currentUser.UserID}/inventory`),
      fetch(`${API}/manufacturer/${currentUser.UserID}/orders`)
    ]);
    
    const [products, inventory, orders] = await Promise.all([
      productsRes.json(),
      inventoryRes.json(),
      ordersRes.json()
    ]);
    
    const totalProducts = Array.isArray(products) ? products.length : 0;
    const totalInventory = Array.isArray(inventory)
      ? inventory.reduce((sum, item) => sum + Number(item.QuantityAvailable || 0), 0)
      : 0;
    const pendingOrders = Array.isArray(orders)
      ? orders.filter(order => order.Status === 'Pending').length
      : 0;
    const totalRevenue = Array.isArray(orders)
      ? orders.reduce((sum, order) => sum + Number(order.TotalAmount || 0), 0)
      : 0;
    
    const statsDiv = document.getElementById('manufacturer-stats');
    if (statsDiv) {
      statsDiv.innerHTML = `
        <div class="stat-card">
          <h3>Products</h3>
          <div class="stat-value">${totalProducts}</div>
        </div>
        <div class="stat-card">
          <h3>Units Available</h3>
          <div class="stat-value">${totalInventory}</div>
        </div>
        <div class="stat-card">
          <h3>Pending Orders</h3>
          <div class="stat-value">${pendingOrders}</div>
        </div>
        <div class="stat-card">
          <h3>Total Revenue</h3>
          <div class="stat-value">$${totalRevenue.toFixed(0)}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to load manufacturer stats:', error);
    const statsDiv = document.getElementById('manufacturer-stats');
    if (statsDiv) {
      statsDiv.innerHTML = '<p class="error">Failed to load stats.</p>';
    }
  }
}

// Manufacturer Tab Navigation
function showManufacturerTab(tabName) {
  document.querySelectorAll('#manufacturer-panel .manufacturer-tab').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`#manufacturer-panel .manufacturer-tab[onclick*="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  document.querySelectorAll('#manufacturer-panel .tab-content').forEach(content => content.classList.remove('active'));
  const contentEl = document.getElementById(`tab-${tabName}`);
  if (contentEl) contentEl.classList.add('active');
  
  switch(tabName) {
    case 'products':
      loadManufacturerProducts();
      break;
    case 'inventory':
      loadManufacturerInventory();
      break;
    case 'orders':
      loadManufacturerOrders();
      break;
  }
}

// Load Products Tab
async function loadManufacturerProducts() {
  try {
    const res = await fetch(`${API}/products/master/manufacturer/${currentUser.UserID}`);
    const products = await res.json();
    
    const productListDiv = document.getElementById('product-list');
    productListDiv.innerHTML = products.length
      ? `
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Wholesale Price</th>
              <th>Min Order</th>
              <th>Capacity</th>
              <th>Lead Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td>
                  <strong>${p.ProductName}</strong><br>
                  <small>${p.Description || 'No description'}</small>
                </td>
                <td>$${p.ManufacturerPrice ? parseFloat(p.ManufacturerPrice).toFixed(2) : 'Not Set'}</td>
                <td>${p.MinOrderQuantity || 'Not Set'}</td>
                <td>${p.ProductionCapacity || 'Not Set'} units</td>
                <td>${p.LeadTimeDays || 'Not Set'} days</td>
                <td>
                  <button class="btn btn-secondary" onclick="editProduct(${p.ProductID})">Edit</button>
                  <button class="btn btn-secondary" onclick="updateProductPrice(${p.ProductID}, ${p.ManufacturerPrice || 0})">Update Price</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '<p class="empty">No products yet. Create your first product!</p>';
      
  } catch (e) {
    console.error('Error loading products:', e);
    document.getElementById('product-list').innerHTML = '<p class="error">Error loading products</p>';
  }
}

// Load Inventory Tab
async function loadManufacturerInventory() {
  try {
    const res = await fetch(`${API}/manufacturer/${currentUser.UserID}/inventory`);
    const inventory = await res.json();
    
    const inventoryListDiv = document.getElementById('inventory-list');
    inventoryListDiv.innerHTML = inventory.length
      ? `
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Available</th>
              <th>Reserved</th>
              <th>Produced</th>
              <th>Cost</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${inventory.map(item => `
              <tr>
                <td>
                  <strong>${item.ProductName}</strong><br>
                  <small>Min Order: ${item.MinOrderQuantity || 0} | Capacity: ${item.ProductionCapacity || 0}</small>
                </td>
                <td>${item.QuantityAvailable || 0}</td>
                <td>${item.QuantityReserved || 0}</td>
                <td>${item.QuantityProduced || 0}</td>
                <td>$${parseFloat(item.ProductionCost || 0).toFixed(2)}</td>
                <td>$${parseFloat(item.ManufacturerPrice || 0).toFixed(2)}</td>
                <td>
                  <button class="btn btn-success" onclick="addProduction(${item.ProductID}, '${item.ProductName}')">Add Production</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '<p class="empty">No inventory records. Create products first.</p>';
      
  } catch (e) {
    console.error('Error loading inventory:', e);
    document.getElementById('inventory-list').innerHTML = '<p class="error">Error loading inventory</p>';
  }
}

// Load Orders Tab
let currentOrderFilter = 'All';

async function loadManufacturerOrders(status = null) {
  try {
    const filterParam = status && status !== 'All' ? `?status=${status}` : '';
    const res = await fetch(`${API}/manufacturer/${currentUser.UserID}/orders${filterParam}`);
    const orders = await res.json();
    
    const ordersListDiv = document.getElementById('orders-list');
    ordersListDiv.innerHTML = orders.length
      ? `
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Distributor</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>
                  <strong>#${order.OrderID}</strong><br>
                  <small>${order.PaymentTerms || 'N/A'}</small>
                </td>
                <td>${order.DistributorName || 'N/A'}</td>
                <td>${order.OrderDate ? new Date(order.OrderDate).toLocaleDateString() : '—'}</td>
                <td>
                  <strong>${order.ItemCount || 0}</strong> items<br>
                  <small>${order.TotalQuantity || 0} units</small><br>
                  ${order.items && order.items.length ? `<button class="btn btn-secondary" data-items="${encodeURIComponent(JSON.stringify(order.items))}" onclick="viewManufacturerOrderItems(this.dataset.items, ${order.OrderID})">View Items</button>` : ''}
                </td>
                <td><strong>$${parseFloat(order.TotalAmount || 0).toFixed(2)}</strong></td>
                <td><span class="badge">${order.Status}</span></td>
                <td>
                  ${order.Status === 'Pending' ? `
                    <button class="btn btn-success" onclick="confirmOrder(${order.OrderID})">Confirm</button>
                    <button class="btn btn-danger" onclick="cancelOrder(${order.OrderID})">Cancel</button>
                  ` : order.Status === 'Confirmed' ? `
                    <button class="btn btn-success" onclick="shipOrder(${order.OrderID})">Mark Shipped</button>
                  ` : order.Status === 'Shipped' ? `
                    <span style="color:#2196F3;">In Transit</span>
                  ` : '<span style="color:#4CAF50;">Completed</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : `<p class="empty">No ${status && status !== 'All' ? status.toLowerCase() : ''} orders found.</p>`;
      
  } catch (e) {
    console.error('Error loading orders:', e);
    document.getElementById('orders-list').innerHTML = '<p class="error">Error loading orders</p>';
  }
}

function viewManufacturerOrderItems(serializedItems, orderId) {
  let items = [];
  try {
    items = JSON.parse(decodeURIComponent(serializedItems || '[]'));
  } catch (err) {
    console.error('Failed to parse order items:', err);
  }
  
  if (!Array.isArray(items) || !items.length) {
    alert('No items found for this order.');
    return;
  }
  
  const list = items.map(item =>
    `• ${item.ProductName}: ${item.Quantity} units @ $${parseFloat(item.UnitPrice || 0).toFixed(2)} = $${parseFloat(item.LineTotal || 0).toFixed(2)}`
  ).join('\n');
  
  alert(`Order #${orderId} Items:\n\n${list}`);
}

function filterOrders(evt, status) {
  currentOrderFilter = status;
  
  document.querySelectorAll('#tab-orders .filter-btn').forEach(btn => btn.classList.remove('active'));
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add('active');
  }
  
  loadManufacturerOrders(status);
}

// Load Analytics Tab - REMOVED
/*
async function loadManufacturerAnalytics() {
  try {
    const res = await fetch(`${API}/manufacturer/${currentUser.UserID}/analytics`);
    const data = await res.json();
    
    const analyticsDiv = document.getElementById('analytics-dashboard');
    analyticsDiv.innerHTML = `
      <div class="analytics-section">
        <h4>Business Overview</h4>
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-label">Total Orders</div>
            <div class="card-value">${data.overview.TotalOrders || 0}</div>
          </div>
          <div class="overview-card">
            <div class="card-label">Unique Distributors</div>
            <div class="card-value">${data.overview.UniqueDistributors || 0}</div>
          </div>
          <div class="overview-card">
            <div class="card-label">Total Revenue</div>
            <div class="card-value">$${parseFloat(data.overview.TotalRevenue || 0).toFixed(2)}</div>
          </div>
          <div class="overview-card">
            <div class="card-label">Avg Order Value</div>
            <div class="card-value">$${parseFloat(data.overview.AverageOrderValue || 0).toFixed(2)}</div>
          </div>
        </div>
        
        <div class="overview-cards" style="margin-top: 1rem;">
          <div class="overview-card" style="background: #FFC107;">
            <div class="card-label" style="color: black;">Pending Orders</div>
            <div class="card-value" style="color: black;">${data.overview.PendingOrders || 0}</div>
          </div>
          <div class="overview-card" style="background: #2196F3;">
            <div class="card-label" style="color: white;">Confirmed Orders</div>
            <div class="card-value" style="color: white;">${data.overview.ConfirmedOrders || 0}</div>
          </div>
          <div class="overview-card" style="background: #9C27B0;">
            <div class="card-label" style="color: white;">Shipped Orders</div>
            <div class="card-value" style="color: white;">${data.overview.ShippedOrders || 0}</div>
          </div>
          <div class="overview-card" style="background: #4CAF50;">
            <div class="card-label" style="color: white;">Received Orders</div>
            <div class="card-value" style="color: white;">${data.overview.ReceivedOrders || 0}</div>
          </div>
        </div>
      </div>
      
      <div class="analytics-section">
        <h4>Product Performance</h4>
        <div class="performance-grid">
          ${data.productPerformance.map(product => `
            <div class="performance-card">
              <h5>${product.ProductName}</h5>
              <div style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                <div style="font-size: 0.85rem; color: #666;">Price: $${parseFloat(product.ManufacturerPrice || 0).toFixed(2)}</div>
              </div>
              <div class="performance-metrics">
                <div class="performance-metric">
                  <span class="label">Times Ordered</span>
                  <span class="value">${product.TimesOrdered || 0}</span>
                </div>
                <div class="performance-metric">
                  <span class="label">Total Sold</span>
                  <span class="value">${product.TotalQuantitySold || 0} units</span>
                </div>
                <div class="performance-metric">
                  <span class="label">Revenue</span>
                  <span class="value" style="color: #4CAF50;">$${parseFloat(product.TotalRevenue || 0).toFixed(2)}</span>
                </div>
                <div class="performance-metric">
                  <span class="label">Available</span>
                  <span class="value">${product.QuantityAvailable || 0} units</span>
                </div>
              </div>
              <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                <div class="performance-metric">
                  <span class="label">Reserved: ${product.QuantityReserved || 0} | Produced: ${product.QuantityProduced || 0}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="analytics-section">
        <h4>Top Distributors</h4>
        ${data.topDistributors.map((dist, index) => `
          <div class="distributor-ranking">
            <div class="distributor-info">
              <h5 style="margin: 0 0 0.5rem 0;">
                <span style="font-size: 1.5rem; color: ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#666'};">
                  ${index + 1}.
                </span>
                ${dist.CompanyName}
              </h5>
              <p style="margin: 0; color: #666;">
                ${dist.OrderCount} orders | Avg: $${parseFloat(dist.AvgOrderValue || 0).toFixed(2)}<br>
                Last order: ${new Date(dist.LastOrderDate).toLocaleDateString()}
              </p>
            </div>
            <div class="distributor-stats">
              <div class="main-stat">$${parseFloat(dist.TotalSpent || 0).toFixed(2)}</div>
              <div class="sub-stat">Total Spent</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
  } catch (e) {
    console.error('Error loading analytics:', e);
    document.getElementById('analytics-dashboard').innerHTML = '<p class="error">Error loading analytics</p>';
  }
}
*/

// Modal for creating new product
function showCreateProductModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Create New Product</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <form id="create-product-form">
        <div class="form-group">
          <label>Product Name *</label>
          <input type="text" name="ProductName" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea name="Description" rows="3"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Wholesale Price ($) *</label>
            <input type="number" name="ManufacturerPrice" step="0.01" min="0" required>
          </div>
          <div class="form-group">
            <label>Min Order Quantity *</label>
            <input type="number" name="MinOrderQuantity" min="1" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Production Capacity *</label>
            <input type="number" name="ProductionCapacity" min="1" required>
          </div>
          <div class="form-group">
            <label>Lead Time (Days) *</label>
            <input type="number" name="LeadTimeDays" min="1" required>
          </div>
        </div>
        <p id="create-product-error" class="error"></p>
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn btn-success">Create Product</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('create-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const errorDiv = document.getElementById('create-product-error');
    errorDiv.textContent = '';
    
    try {
      const res = await fetch(`${API}/products/master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ProductName: formData.get('ProductName'),
          Description: formData.get('Description'),
          ManufacturerID: currentUser.UserID,
          ManufacturerPrice: parseFloat(formData.get('ManufacturerPrice')),
          MinOrderQuantity: parseInt(formData.get('MinOrderQuantity')),
          ProductionCapacity: parseInt(formData.get('ProductionCapacity')),
          LeadTimeDays: parseInt(formData.get('LeadTimeDays'))
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create product');
      }
      
      modal.remove();
      loadManufacturerProducts();
      alert('✅ Product created successfully!');
      
    } catch (e) {
      errorDiv.textContent = e.message;
    }
  });
}

// Update product price
function updateProductPrice(productId, currentPrice) {
  const newPrice = prompt(`Enter new wholesale price for this product:\n\nCurrent price: $${parseFloat(currentPrice).toFixed(2)}`, currentPrice);
  
  if (newPrice === null || newPrice === '') return;
  
  const price = parseFloat(newPrice);
  if (isNaN(price) || price <= 0) {
    alert('❌ Please enter a valid positive price');
    return;
  }
  
  fetch(`${API}/manufacturer/${currentUser.UserID}/products/${productId}/price`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ManufacturerPrice: price })
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to update price');
    return res.json();
  })
  .then(() => {
    alert('✅ Price updated successfully!');
    loadManufacturerProducts();
    loadManufacturerInventory();
  })
  .catch(e => alert('❌ ' + e.message));
}

// Edit product
function editProduct(productId) {
  // Fetch product details first
  fetch(`${API}/products/master/manufacturer/${currentUser.UserID}`)
    .then(res => res.json())
    .then(products => {
      const product = products.find(p => p.ProductID === productId);
      if (!product) throw new Error('Product not found');
      
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Edit Product</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <form id="edit-product-form">
            <div class="form-group">
              <label>Product Name</label>
              <input type="text" name="ProductName" value="${product.ProductName}" required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea name="Description" rows="3">${product.Description || ''}</textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Wholesale Price ($)</label>
                <input type="number" name="ManufacturerPrice" step="0.01" min="0" value="${product.ManufacturerPrice || 0}" required>
              </div>
              <div class="form-group">
                <label>Min Order Quantity</label>
                <input type="number" name="MinOrderQuantity" min="1" value="${product.MinOrderQuantity || 1}" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Production Capacity</label>
                <input type="number" name="ProductionCapacity" min="1" value="${product.ProductionCapacity || 1}" required>
              </div>
              <div class="form-group">
                <label>Lead Time (Days)</label>
                <input type="number" name="LeadTimeDays" min="1" value="${product.LeadTimeDays || 1}" required>
              </div>
            </div>
            <p id="edit-product-error" class="error"></p>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
              <button type="submit" class="btn btn-success">Update Product</button>
            </div>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const errorDiv = document.getElementById('edit-product-error');
        errorDiv.textContent = '';
        
        try {
          const res = await fetch(`${API}/manufacturer/${currentUser.UserID}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ProductName: formData.get('ProductName'),
              Description: formData.get('Description'),
              ManufacturerPrice: parseFloat(formData.get('ManufacturerPrice')),
              MinOrderQuantity: parseInt(formData.get('MinOrderQuantity')),
              ProductionCapacity: parseInt(formData.get('ProductionCapacity')),
              LeadTimeDays: parseInt(formData.get('LeadTimeDays'))
            })
          });
          
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to update product');
          }
          
          modal.remove();
          loadManufacturerProducts();
          alert('✅ Product updated successfully!');
          
        } catch (e) {
          errorDiv.textContent = e.message;
        }
      });
    })
    .catch(e => alert('❌ ' + e.message));
}

// Add production to inventory
function addProduction(productId, productName) {
  const quantity = prompt(`Add production quantity for "${productName}":\n\nEnter number of units produced:`);
  
  if (quantity === null || quantity === '') return;
  
  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    alert('❌ Please enter a valid positive quantity');
    return;
  }
  
  fetch(`${API}/manufacturer/${currentUser.UserID}/inventory/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ QuantityProduced: qty })
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to update inventory');
    return res.json();
  })
  .then(data => {
    alert(`✅ Inventory updated!\n\nAvailable: ${data.inventory.QuantityAvailable}\nTotal Produced: ${data.inventory.QuantityProduced}`);
    loadManufacturerInventory();
  })
  .catch(e => alert('❌ ' + e.message));
}

// Confirm order
async function confirmOrder(orderId) {
  if (!confirm('Confirm this order? This will reserve inventory for the distributor.')) return;
  
  try {
    const res = await fetch(`${API}/manufacturer/${currentUser.UserID}/orders/${orderId}/confirm`, {
      method: 'PATCH'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to confirm order');
    }
    
    alert('✅ Order confirmed successfully! Inventory has been reserved.');
    loadManufacturerOrders(currentOrderFilter);
    loadManufacturerInventory();
    loadManufacturerOverview();
    
  } catch (e) {
    alert('❌ ' + e.message);
  }
}

// Ship order
async function shipOrder(orderId) {
  if (!confirm('Mark this order as shipped? The distributor will be notified.')) return;
  
  try {
    const res = await fetch(`${API}/manufacturer/${currentUser.UserID}/orders/${orderId}/ship`, {
      method: 'PATCH'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to ship order');
    }
    
    alert('✅ Order marked as shipped successfully!');
    loadManufacturerOrders(currentOrderFilter);
    loadManufacturerInventory();
    loadManufacturerOverview();
    
  } catch (e) {
    alert('❌ ' + e.message);
  }
}

// Cancel order (placeholder - needs backend implementation)
async function cancelOrder(orderId) {
  alert('⚠️ Cancel order functionality coming soon!');
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
        ManufacturerPrice: parseFloat(fd.get('ManufacturerPrice')),
        MinOrderQuantity: parseInt(fd.get('MinOrderQuantity')),
        ProductionCapacity: parseInt(fd.get('ProductionCapacity')),
        LeadTimeDays: parseInt(fd.get('LeadTimeDays')),
      }),
    });
    if (!res.ok) throw new Error('Failed to create');
    alert('✅ Product created successfully! Don\'t forget to add inventory.');
    productForm.reset();
    document.querySelector('.modal-overlay')?.remove();
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
          <div style="display: grid; grid-template-columns: 1fr 200px; gap: 1rem; align-items: start;">
            <div>
              <h4>${p.ProductName}</h4>
              <p>${p.Description || 'N/A'} - By ${p.ManufacturerName}</p>
              <form class="stock-form" data-pid="${p.ProductID}" style="margin-top: 0.5rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem;">
                  <input type="number" name="Price" placeholder="Your Price" min="0" step="0.01" required>
                  <input type="number" name="Stock" placeholder="Stock" min="0" step="1" required>
                  <button type="submit" class="btn">Add</button>
                </div>
              </form>
            </div>
            <div style="background: #f5f5f5; padding: 0.75rem; border-radius: 5px; border-left: 3px solid #2196F3;">
              <h5 style="margin: 0 0 0.5rem 0; color: #2196F3;">🏭 Manufacturer Pricing</h5>
              ${p.PriceAvailability === 'Available' ? `
                <p style="margin: 0.25rem 0; font-size: 0.9em;"><strong>Wholesale:</strong> 
                  ${p.MinManufacturerPrice === p.MaxManufacturerPrice ? 
                    `$${parseFloat(p.AvgManufacturerPrice || 0).toFixed(2)}` :
                    `$${parseFloat(p.MinManufacturerPrice || 0).toFixed(2)} - $${parseFloat(p.MaxManufacturerPrice || 0).toFixed(2)}`
                  }
                </p>
                <p style="margin: 0.25rem 0; font-size: 0.85em; color: #666;">
                  Avg: $${parseFloat(p.AvgManufacturerPrice || 0).toFixed(2)} 
                  (${p.PriceDataPoints} transactions)
                </p>
                <p style="margin: 0.25rem 0; font-size: 0.8em; color: #4CAF50;">
                  💡 Suggested retail: $${(parseFloat(p.AvgManufacturerPrice || 0) * 1.4).toFixed(2)}+
                </p>
              ` : `
                <p style="margin: 0.25rem 0; font-size: 0.9em; color: #ff9800;">Contact manufacturer for pricing</p>
              `}
            </div>
          </div>
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
        sel.innerHTML += dists.map(d => `<option value="${d.DistributorID}">${d.FullName}</option>`).join('');
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
          <p>Retailer: ${o.RetailerName} | Status: <strong>${o.Status}</strong></p>
          <p>Items: ${o.items.map(i => `${i.ProductName} x${i.Quantity}`).join(', ')}</p>
          <p>Total: $${parseFloat(o.TotalAmount || 0).toFixed(2)}</p>
          ${o.Status === 'Shipped' ? `
            <button class="btn" onclick="markOrderDelivered(${o.OrderID})" style="background: #4caf50; margin-top: 8px;">
              ✓ Mark as Delivered
            </button>
          ` : o.Status === 'Delivered' ? `
            <p style="color: #4caf50; font-weight: bold; margin-top: 8px;">✓ Delivered</p>
          ` : ''}
        </div>`).join('')
      : '<p class="empty">No orders.</p>';
  } catch (e) {
    console.error(e);
  }
}

async function markOrderDelivered(orderId) {
  if (!confirm('Confirm that you have received this order?')) return;
  
  try {
    const res = await fetch(`${API}/customer/${currentUser.UserID}/orders/${orderId}/receive`, {
      method: 'PATCH'
    });
    
    const result = await res.json();
    
    if (res.ok) {
      alert('✅ Order marked as delivered successfully!');
      await loadCustomerData(); // Reload orders
    } else {
      alert('❌ ' + (result.message || 'Failed to mark order as delivered'));
    }
  } catch (e) {
    console.error('Mark delivered error:', e);
    alert('❌ Failed to mark order as delivered. Please try again.');
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
          <button class="btn" onclick="this.closest('div[style*=fixed]').remove()">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
  } catch (e) {
    alert('Failed to load low stock details: ' + e.message);
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

// Show profit analysis modal for retailers
async function showProfitAnalysis() {
  try {
    const res = await fetch(`${API}/retailer/${currentUser.UserID}/profit-analysis`);
    if (!res.ok) throw new Error('Failed to load profit analysis');
    const profitData = await res.json();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.8); display: flex; align-items: center; 
      justify-content: center; z-index: 1000;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 90%; max-height: 90%; overflow-y: auto; width: 800px;">
        <h3 style="margin-top: 0; color: #FF5722;">💰 Profit Analysis</h3>
        <div style="max-height: 500px; overflow-y: auto;">
          ${profitData.length ? profitData.map(item => `
            <div class="list-item" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 5px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <h4 style="margin: 0 0 0.5rem 0;">${item.ProductName}</h4>
                  <p><strong>Manufacturer:</strong> ${item.ManufacturerName || 'Unknown'}</p>
                  <p><strong>Stock:</strong> ${item.Stock} units</p>
                  <p><strong>Purchase Date:</strong> ${item.PurchaseDate ? new Date(item.PurchaseDate).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Price Source:</strong> <em>${item.PriceSource || 'Unknown'}</em></p>
                </div>
                <div style="text-align: right;">
                  <p><strong>🏪 Your Retail Price:</strong> $${parseFloat(item.RetailPrice || 0).toFixed(2)}</p>
                  <p><strong>🏭 Manufacturer Price:</strong> 
                    ${item.ManufacturerSellingPrice ? 
                      `$${parseFloat(item.ManufacturerSellingPrice).toFixed(2)}` : 
                      `$${parseFloat(item.CostBasis || 0).toFixed(2)} <small>(est.)</small>`
                    }
                  </p>
                  <p><strong>💰 Your Cost Basis:</strong> $${parseFloat(item.CostBasis || 0).toFixed(2)}</p>
                  <p><strong>📈 Profit per Unit:</strong> <span style="color: ${item.ProfitPerUnit >= 0 ? '#4CAF50' : '#f44336'};">$${parseFloat(item.ProfitPerUnit || 0).toFixed(2)}</span></p>
                  <p><strong>📊 Profit Margin:</strong> <span style="color: ${item.ProfitMargin >= 0 ? '#4CAF50' : '#f44336'};">${parseFloat(item.ProfitMargin || 0).toFixed(1)}%</span></p>
                  <p style="font-size: 1.1em;"><strong>🎯 Total Potential Profit:</strong> <span style="color: ${item.TotalPotentialProfit >= 0 ? '#4CAF50' : '#f44336'};">$${parseFloat(item.TotalPotentialProfit || 0).toFixed(2)}</span></p>
                </div>
              </div>
            </div>
          `).join('') : '<p class="empty">No profit analysis data available.</p>'}
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <button class="btn" onclick="this.closest('div[style*=fixed]').remove()">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
  } catch (e) {
    alert('Failed to load profit analysis: ' + e.message);
  }
}


