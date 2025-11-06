'use strict';

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const signupForm = document.getElementById('signup-form');
  const signupError = document.getElementById('signup-error');
  const showSigninBtn = document.getElementById('show-signin');
  const showSignupBtn = document.getElementById('show-signup');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const logoutBtn = document.getElementById('logout-btn');
  const welcomeText = document.getElementById('welcome-text');
  const roleText = document.getElementById('role-text');
  const manufacturerSection = document.getElementById('manufacturer-section');
  const retailerSection = document.getElementById('retailer-section');
  const customerSection = document.getElementById('customer-section');
  const distributorSection = document.getElementById('distributor-section');
  const masterProductsGrid = document.getElementById('master-products-grid');
  const masterProductForm = document.getElementById('master-product-form');
  const mpError = document.getElementById('mp-error');
  const masterProductsList = document.getElementById('master-products-list');
  const retailerInventoryGrid = document.getElementById('retailer-inventory-grid');
  const retailerOrdersList = document.getElementById('retailer-orders-list');
  const catalogGrid = document.getElementById('catalog-grid');
  const cartItems = document.getElementById('cart-items');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutError = document.getElementById('checkout-error');
  const distributorOrdersList = document.getElementById('distributor-orders-list');

  const cart = []; // simple in-memory cart

  // Session boot
  const storedUser = getStoredUser();
  if (storedUser) {
    showDashboard(storedUser);
  }

  // Login submit
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const formData = new FormData(loginForm);
    const payload = { Email: formData.get('email'), Password: formData.get('password') };
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = res.status === 401 ? 'Incorrect password.' : res.status === 404 ? 'No account found for that email.' : 'Unable to sign you in right now.';
        throw new Error(msg);
      }
      const data = await res.json();
      const user = data?.user;
      if (!user) throw new Error('Unexpected server response.');
      saveUser(user);
      showDashboard(user);
    } catch (err) {
      console.error('Login failed', err);
      loginError.textContent = err?.message || 'Login failed. Please try again later.';
    }
  });

  // Signup submit
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.textContent = '';
    const formData = new FormData(signupForm);
    const payload = {
      FullName: formData.get('FullName'),
      Email: formData.get('Email'),
      Password: formData.get('Password'),
      Role: formData.get('Role'),
      Address: formData.get('Address'),
    };
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 409) throw new Error('This email is already registered.');
        throw new Error('Unable to create account right now.');
      }
      const data = await res.json();
      const user = data?.user;
      if (!user) throw new Error('Unexpected server response.');
      saveUser(user);
      showDashboard(user);
    } catch (err) {
      console.error('Signup failed', err);
      signupError.textContent = err?.message || 'Signup failed. Please try again later.';
    }
  });

  // Toggle between login and signup
  showSignupBtn?.addEventListener('click', () => {
    loginForm.hidden = true;
    signupForm.hidden = false;
    showSignupBtn.hidden = true;
    showSigninBtn.hidden = false;
    authTitle.textContent = 'Create your account';
    authSubtitle.textContent = 'Join the-Weft network';
    loginError.textContent = '';
  });
  showSigninBtn?.addEventListener('click', () => {
    signupForm.hidden = true;
    loginForm.hidden = false;
    showSigninBtn.hidden = true;
    showSignupBtn.hidden = false;
    authTitle.textContent = 'Sign in';
    authSubtitle.textContent = 'Access your supply chain dashboard';
    signupError.textContent = '';
  });

  // Logout
  logoutBtn?.addEventListener('click', () => {
    clearSession();
    // Reset views
    dashboardView.hidden = true;
    authView.hidden = false;
    logoutBtn.hidden = true;
    loginForm.reset();
    loginError.textContent = '';
  });

  // Helpers
  function showDashboard(user) {
    // Update header
    logoutBtn.hidden = false;
    // Views
    authView.hidden = true;
    dashboardView.hidden = false;
    // Copy
    welcomeText.textContent = `Welcome, ${getName(user)}`;
    roleText.textContent = `Role: ${getRole(user)}`;
    // Sections
    const role = getRole(user);
    manufacturerSection.hidden = true;
    retailerSection.hidden = true;
    customerSection.hidden = true;
    distributorSection.hidden = true;

    if (role === 'Manufacturer') {
      manufacturerSection.hidden = false;
      loadMasterProducts(user);
    } else if (role === 'Retailer') {
      retailerSection.hidden = false;
      loadMasterProductsForRetailer(user);
      loadRetailerInventory(user);
      loadRetailerOrders(user);
    } else if (role === 'Customer') {
      customerSection.hidden = false;
      loadCatalog();
    } else if (role === 'Distributor') {
      distributorSection.hidden = false;
      loadDistributorOrders(user);
    }
  }

  async function loadMasterProducts(user) {
    masterProductsGrid.innerHTML = '';
    try {
      const manufacturerId = getUserId(user);
      const res = await fetch(`${API_BASE}/products/master/manufacturer/${encodeURIComponent(manufacturerId)}`);
      const products = await res.json();
      masterProductsGrid.innerHTML = products.map(p => `
        <div class="product-card"><h4>${escapeHtml(p.ProductName)}</h4><p class="product-meta">${escapeHtml(p.Description || '—')}</p></div>
      `).join('') || '<p class="muted">No products yet.</p>';
    } catch (e) {
      console.error('Failed to load master products', e);
      masterProductsGrid.innerHTML = `<p class="muted">Failed to load.</p>`;
    }
  }

  masterProductForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    mpError.textContent = '';
    const formData = new FormData(masterProductForm);
    const payload = {
      ProductName: formData.get('ProductName'),
      Description: formData.get('Description'),
      ManufacturerID: getStoredUser()?.UserID || getStoredUser()?.id,
    };
    try {
      const res = await fetch(`${API_BASE}/products/master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create product');
      masterProductForm.reset();
      loadMasterProducts(getStoredUser());
    } catch (err) {
      mpError.textContent = err.message;
    }
  });

  async function loadMasterProductsForRetailer(user) {
    masterProductsList.innerHTML = '';
    try {
      const res = await fetch(`${API_BASE}/products/master`);
      const products = await res.json();
      masterProductsList.innerHTML = products.map(p => `
        <div class="product-card">
          <h4>${escapeHtml(p.ProductName)}</h4>
          <p class="product-meta">${escapeHtml(p.Description || '—')}<br><span class="muted">By ${escapeHtml(p.ManufacturerName || '')}</span></p>
          <form class="stock-form" data-pid="${p.ProductID}">
            <div class="input-group" style="margin-bottom:0.4rem;">
              <label>Price</label>
              <input name="Price" type="number" min="0" step="0.01" required />
            </div>
            <div class="input-group" style="margin-bottom:0.4rem;">
              <label>Stock</label>
              <input name="Stock" type="number" min="0" step="1" required />
            </div>
            <button class="btn primary" type="submit">Stock</button>
            <p class="error-message stock-error" aria-live="polite"></p>
          </form>
        </div>
      `).join('');

      masterProductsList.querySelectorAll('.stock-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const errEl = form.querySelector('.stock-error');
          errEl.textContent = '';
          const fd = new FormData(form);
          const payload = {
            RetailerID: getStoredUser()?.UserID || getStoredUser()?.id,
            ProductID: form.getAttribute('data-pid'),
            Price: fd.get('Price'),
            Stock: fd.get('Stock'),
          };
          try {
            const res2 = await fetch(`${API_BASE}/retailer/inventory`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res2.ok) throw new Error('Failed to stock product');
            loadRetailerInventory(getStoredUser());
          } catch (er) {
            errEl.textContent = er.message;
          }
        });
      });
    } catch (e) {
      console.error('Failed to load master products list', e);
      masterProductsList.innerHTML = `<p class="muted">Failed to load master products.</p>`;
    }
  }

  async function loadRetailerInventory(user) {
    retailerInventoryGrid.innerHTML = '';
    try {
      const res = await fetch(`${API_BASE}/retailer/${getUserId(user)}/inventory`);
      const items = await res.json();
      retailerInventoryGrid.innerHTML = items.map(it => `
        <div class="product-card">
          <h4>${escapeHtml(it.ProductName)}</h4>
          <p class="product-meta">Stock: ${Number(it.Stock)} • Price: $${Number(it.Price).toFixed(2)}</p>
        </div>
      `).join('') || '<p class="muted">Inventory empty.</p>';
    } catch (e) {
      console.error('Failed to load retailer inventory', e);
      retailerInventoryGrid.innerHTML = `<p class="muted">Failed to load inventory.</p>`;
    }
  }

  async function loadRetailerOrders(user) {
    retailerOrdersList.innerHTML = '';
    try {
      const res = await fetch(`${API_BASE}/orders/retailer/${getUserId(user)}`);
      const rows = await res.json();
      const grouped = groupOrders(rows);
      retailerOrdersList.innerHTML = grouped.map(renderRetailerOrder).join('') || '<p class="muted">No orders yet.</p>';
      attachAssignmentHandlers(retailerOrdersList);
    } catch (e) {
      console.error('Failed to load retailer orders', e);
      retailerOrdersList.innerHTML = `<p class="muted">Failed to load orders.</p>`;
    }
  }

  async function loadDistributorOrders(user) {
    distributorOrdersList.innerHTML = '';
    try {
      const res = await fetch(`${API_BASE}/orders/distributor/${getUserId(user)}`);
      const rows = await res.json();
      const grouped = groupOrders(rows);
      distributorOrdersList.innerHTML = grouped.map(renderDistributorOrder).join('') || '<p class="muted">No assigned orders.</p>';
      attachStatusHandlers(distributorOrdersList);
    } catch (e) {
      console.error('Failed to load distributor orders', e);
      distributorOrdersList.innerHTML = `<p class="muted">Failed to load orders.</p>`;
    }
  }

  async function loadCatalog() {
    catalogGrid.innerHTML = '';
    try {
      const res = await fetch(`${API_BASE}/products`);
      const products = await res.json();
      catalogGrid.innerHTML = products.map(p => `
        <div class="product-card" data-rpid="${p.RetailerProductID}" data-retailer="${p.RetailerID}">
          <h4>${escapeHtml(p.ProductName)}</h4>
          <p class="product-meta">${escapeHtml(p.Description || '—')}<br><span class="muted">Sold by ${escapeHtml(p.RetailerName)}</span></p>
          <p class="product-meta"><span class="price">$${Number(p.Price).toFixed(2)}</span> • Stock: ${Number(p.Stock)}</p>
          <button class="btn primary add-to-cart" type="button">Add</button>
        </div>
      `).join('') || '<p class="muted">No products.</p>';
      catalogGrid.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', () => {
          const card = btn.closest('.product-card');
          const id = card.getAttribute('data-rpid');
          const retailerId = card.getAttribute('data-retailer');
          const existing = cart.find(c => c.RetailerProductID === id);
          if (existing) existing.Quantity += 1; else cart.push({ RetailerProductID: id, Quantity: 1, RetailerID: retailerId });
          renderCart();
        });
      });
    } catch (e) {
      console.error('Failed to load catalog', e);
      catalogGrid.innerHTML = `<p class="muted">Failed to load products.</p>`;
    }
  }

  function renderCart() {
    if (!cart.length) { cartItems.innerHTML = '<p class="muted">Cart empty.</p>'; return; }
    cartItems.innerHTML = cart.map(item => `
      <div class="product-meta">Item ${item.RetailerProductID} • Qty: ${item.Quantity}</div>
    `).join('');
  }

  checkoutForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    checkoutError.textContent = '';
    if (!cart.length) {
      checkoutError.textContent = 'Cart is empty.';
      return;
    }
    // All items must belong to same retailer for this MVP
    const retailerId = cart[0].RetailerID;
    const sameRetailer = cart.every(c => c.RetailerID === retailerId);
    if (!sameRetailer) {
      checkoutError.textContent = 'All items must be from the same retailer.';
      return;
    }
    const fd = new FormData(checkoutForm);
    const payload = {
      CustomerID: getStoredUser()?.UserID || getStoredUser()?.id,
      RetailerID: retailerId,
      ShippingAddress: fd.get('ShippingAddress'),
      items: cart.map(c => ({ RetailerProductID: c.RetailerProductID, Quantity: c.Quantity })),
    };
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to place order');
      cart.length = 0;
      renderCart();
      checkoutForm.reset();
    } catch (err) {
      checkoutError.textContent = err.message;
    }
  });

  function groupOrders(rows) {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.OrderID)) {
        map.set(r.OrderID, { ...r, items: [] });
      }
      map.get(r.OrderID).items.push({
        OrderItemID: r.OrderItemID,
        ProductName: r.ProductName,
        Quantity: r.Quantity,
        UnitPriceAtPurchase: r.UnitPriceAtPurchase,
      });
    }
    return Array.from(map.values());
  }

  function renderRetailerOrder(o) {
    const distributorInfo = o.DistributorName ? `Distributor: ${escapeHtml(o.DistributorName)}` : 'Unassigned';
    return `
      <div class="product-card" data-orderid="${o.OrderID}">
        <h4>Order #${o.OrderID}</h4>
        <p class="product-meta">Status: ${escapeHtml(o.Status)} • Customer: ${escapeHtml(o.CustomerName)} • ${distributorInfo}</p>
        <div>${o.items.map(i => `<div class="product-meta">${escapeHtml(i.ProductName)} × ${i.Quantity}</div>`).join('')}</div>
        ${o.Status === 'Pending' ? `<div class="input-group" style="margin-top:0.4rem;">
          <label>Assign distributor</label>
          <select class="assign-distributor"></select>
          <button type="button" class="btn primary btn-assign">Assign</button>
          <p class="error-message assign-error"></p>
        </div>` : ''}
      </div>
    `;
  }

  async function attachAssignmentHandlers(container) {
    const pendingCards = container.querySelectorAll('.product-card .btn-assign');
    if (!pendingCards.length) return;
    // Load distributors once
    let distributors = [];
    try {
      const res = await fetch(`${API_BASE}/distributors`);
      distributors = await res.json();
    } catch (e) { console.error('Failed to load distributors', e); }
    pendingCards.forEach(btn => {
      const wrapper = btn.closest('.product-card');
      const select = wrapper.querySelector('.assign-distributor');
      const errEl = wrapper.querySelector('.assign-error');
      if (select) {
        select.innerHTML = '<option value="">Select</option>' + distributors.map(d => `<option value="${d.UserID}">${escapeHtml(d.FullName)}</option>`).join('');
      }
      btn.addEventListener('click', async () => {
        errEl.textContent = '';
        const val = select.value;
        if (!val) { errEl.textContent = 'Choose a distributor.'; return; }
        const orderId = wrapper.getAttribute('data-orderid');
        try {
          const res2 = await fetch(`${API_BASE}/orders/${orderId}/assign`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ DistributorID: val }),
          });
          if (!res2.ok) throw new Error('Failed to assign');
          loadRetailerOrders(getStoredUser());
        } catch (e) { errEl.textContent = e.message; }
      });
    });
  }

  function renderDistributorOrder(o) {
    return `
      <div class="product-card" data-orderid="${o.OrderID}">
        <h4>Order #${o.OrderID}</h4>
        <p class="product-meta">Status: ${escapeHtml(o.Status)} • Customer: ${escapeHtml(o.CustomerName)} • Retailer: ${escapeHtml(o.RetailerName)}</p>
        <div>${o.items.map(i => `<div class="product-meta">${escapeHtml(i.ProductName)} × ${i.Quantity}</div>`).join('')}</div>
        ${o.Status === 'Assigned' ? `<div style="margin-top:0.4rem;">
          <button type="button" class="btn primary btn-status" data-next="Shipped">Mark Shipped</button>
        </div>` : ''}
        ${o.Status === 'Shipped' ? `<div style="margin-top:0.4rem;">
          <button type="button" class="btn primary btn-status" data-next="Delivered">Mark Delivered</button>
        </div>` : ''}
        <p class="error-message status-error"></p>
      </div>
    `;
  }

  function attachStatusHandlers(container) {
    container.querySelectorAll('.btn-status').forEach(btn => {
      const card = btn.closest('.product-card');
      const orderId = card.getAttribute('data-orderid');
      const next = btn.getAttribute('data-next');
      const errEl = card.querySelector('.status-error');
      btn.addEventListener('click', async () => {
        errEl.textContent = '';
        try {
          const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Status: next }),
          });
          if (!res.ok) throw new Error('Failed to update status');
          loadDistributorOrders(getStoredUser());
        } catch (e) { errEl.textContent = e.message; }
      });
    });
  }

  function renderProducts(container, products) {
    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = `<p class="muted">No products to display.</p>`;
      return;
    }
    container.innerHTML = products
      .map((p) => {
        const name = p.ProductName || p.productName || 'Unnamed product';
        const desc = p.Description || p.description || '—';
        const price = p.UnitPrice ?? p.unitPrice ?? 0;
        const stock = p.QuantityInStock ?? p.quantityInStock ?? 0;
        return `
          <div class="product-card">
            <h4>${escapeHtml(String(name))}</h4>
            <p class="product-meta">${escapeHtml(String(desc))}</p>
            <p class="product-meta"><span class="price">$${Number(price).toFixed(2)}</span> • Stock: ${Number(stock)}</p>
          </div>
        `;
      })
      .join('');
  }

  function getStoredUser() {
    try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; }
  }
  function saveUser(user) { sessionStorage.setItem('user', JSON.stringify(user)); }
  function clearSession() { sessionStorage.removeItem('user'); }
  function getUserId(u) { return u?.id ?? u?.UserID ?? u?.userId ?? u?.ID; }
  function getRole(u) { return u?.role ?? u?.Role ?? 'Customer'; }
  function getName(u) { return u?.name ?? u?.FullName ?? u?.fullName ?? u?.Email ?? u?.email ?? 'User'; }
});

// Basic HTML escape for UI safety
function escapeHtml(value) {
  if (typeof value !== 'string') return String(value ?? '');
  return value.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

function renderDashboard(user, dashboardContainer) {
  dashboardContainer.innerHTML = `
    <header class="dashboard-header">
      <div class="brand">
        <img src="assets/logo.png" alt="SCM Logo">
        <div>
          <h1>Supply Chain Nexus</h1>
          <span class="muted">Role-based command center</span>
        </div>
      </div>
      <div class="user-meta">
        <strong>Welcome, ${escapeHtml(user.FullName || 'Member')}</strong>
        <span>${escapeHtml(user.Role)}</span>
        <button id="logout-btn" class="primary-action" type="button">Log out</button>
      </div>
    </header>
    <main class="dashboard-main">
      ${user.Role === 'Customer' ? renderCustomerDashboard() : renderManufacturerDashboard()}
    </main>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('user');
    location.reload();
  });

  if (user.Role === 'Manufacturer') {
    fetchProducts(user, document.getElementById('product-list'));
  }
}

function fetchProducts(user, productListContainer) {
  fetch(`${API_BASE}/products?manufacturerId=${user.UserID}`)
    .then((response) => response.json())
    .then((products) => {
      productListContainer.innerHTML = products.map((product) => `
        <div class="product-card">
          <h3>${product.ProductName}</h3>
          <p>${product.Description}</p>
          <p>Price: $${product.UnitPrice}</p>
          <p>Stock: ${product.QuantityInStock}</p>
        </div>
      `).join('');
    })
    .catch((error) => {
      console.error('Failed to fetch products', error);
      productListContainer.innerHTML = '<p>Failed to load products.</p>';
    });
}

function renderCustomerDashboard() {
  return `
    <article class="dashboard-card" id="card-browse-products">
      <h2>Browse Products <span>All Manufacturers</span></h2>
      <table class="data-table" aria-describedby="card-browse-products">
        <thead>
          <tr>
            <th>Product</th>
            <th>Description</th>
            <th>Unit Price</th>
            <th>In Stock</th>
            <th>Manufacturer</th>
          </tr>
        </thead>
        <tbody id="customer-products-body"></tbody>
      </table>
    </article>
    <article class="dashboard-card" id="card-create-order">
      <h2>Create New Order <span>Curate your shipment</span></h2>
      <form id="create-order-form" class="dashboard-form">
        <div class="field">
          <label for="shipping-address">Shipping Address</label>
          <input id="shipping-address" name="ShippingAddress" type="text" placeholder="123 Innovation Way, Campus City" required>
        </div>
        <section id="order-items-container" aria-label="Order items"></section>
        <div class="actions">
          <button type="button" id="add-order-item" class="primary-action">Add Product</button>
        </div>
        <div class="actions">
          <button type="submit" class="primary-action">Submit Order</button>
        </div>
        <p id="order-feedback" class="muted"></p>
      </form>
    </article>
    <article class="dashboard-card" id="card-past-orders">
      <h2>My Past Orders <span>Chronological history</span></h2>
      <table class="data-table" aria-describedby="card-past-orders">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Status</th>
            <th>Ship To</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody id="customer-orders-body"></tbody>
      </table>
    </article>
  `;
}

function renderManufacturerDashboard() {
  return `
    <article class="dashboard-card" id="card-my-products">
      <h2>My Products <span>Inventory snapshot</span></h2>
      <table class="data-table" aria-describedby="card-my-products">
        <thead>
          <tr>
            <th>Product</th>
            <th>Description</th>
            <th>Unit Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody id="manufacturer-products-body"></tbody>
      </table>
    </article>
    <article class="dashboard-card" id="card-add-product">
      <h2>Add New Product <span>Launch instantly</span></h2>
      <form id="add-product-form" class="dashboard-form">
        <div class="field">
          <label for="product-name">Product Name</label>
          <input id="product-name" name="ProductName" type="text" placeholder="Next-gen component" required>
        </div>
        <div class="field">
          <label for="product-description">Description</label>
          <textarea id="product-description" name="Description" placeholder="What makes this product unique?" required></textarea>
        </div>
        <div class="field">
          <label for="unit-price">Unit Price (USD)</label>
          <input id="unit-price" name="UnitPrice" type="number" min="0" step="0.01" placeholder="199.99" required>
        </div>
        <div class="field">
          <label for="quantity-stock">Quantity In Stock</label>
          <input id="quantity-stock" name="QuantityInStock" type="number" min="0" step="1" placeholder="100" required>
        </div>
        <div class="actions">
          <button type="submit" class="primary-action">Publish Product</button>
        </div>
        <p id="product-feedback" class="muted"></p>
      </form>
    </article>
    <article class="dashboard-card" id="card-incoming-orders">
      <h2>Incoming Orders <span>Products awaiting fulfilment</span></h2>
      <table class="data-table" aria-describedby="card-incoming-orders">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody id="manufacturer-orders-body"></tbody>
      </table>
      <p id="manufacturer-orders-hint" class="muted"></p>
    </article>
  `;
}

async function setupCustomerInteractions(user) {
  const orderItemsContainer = document.getElementById('order-items-container');
  const addOrderItemBtn = document.getElementById('add-order-item');
  const orderForm = document.getElementById('create-order-form');
  const feedback = document.getElementById('order-feedback');

  try {
    cachedProducts = await fetchAllProducts();
    populateCustomerProductsTable(cachedProducts);
    ensureOrderItemRows(orderItemsContainer, cachedProducts, 1);
    await fetchCustomerOrders(user.UserID);
  } catch (error) {
    console.error('Failed to initialise customer dashboard', error);
    feedback.textContent = 'Unable to load initial data. Please refresh.';
  }

  addOrderItemBtn?.addEventListener('click', () => {
    appendOrderItemRow(orderItemsContainer, cachedProducts);
  });

  orderForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.textContent = '';

    const shippingAddress = document.getElementById('shipping-address').value.trim();
    const itemRows = Array.from(orderItemsContainer.querySelectorAll('.order-item-row'));
    const products = [];

    itemRows.forEach((row) => {
      const productId = parseInt(row.querySelector('select').value, 10);
      const quantity = parseInt(row.querySelector('input').value, 10);
      if (productId && quantity > 0) {
        products.push({ ProductID: productId, Quantity: quantity });
      }
    });

    if (!shippingAddress) {
      feedback.textContent = 'Shipping address is required.';
      return;
    }

    if (products.length === 0) {
      feedback.textContent = 'Add at least one product to the order.';
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ CustomerID: user.UserID, ShippingAddress: shippingAddress, products }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || 'Unable to place order.');
      }

      feedback.textContent = 'Order submitted successfully!';
      orderForm.reset();
      ensureOrderItemRows(orderItemsContainer, cachedProducts, 1);
      await fetchCustomerOrders(user.UserID);
    } catch (error) {
      console.error('Order creation failed', error);
      feedback.textContent = error.message || 'Order creation failed. Please try again.';
    }
  });
}

async function setupManufacturerInteractions(user) {
  const addProductForm = document.getElementById('add-product-form');
  const feedback = document.getElementById('product-feedback');
  const hint = document.getElementById('manufacturer-orders-hint');

  try {
    await fetchManufacturerProducts(user.UserID);
    await fetchManufacturerOrders(user.UserID);
  } catch (error) {
    console.error('Failed to load manufacturer data', error);
    if (feedback) feedback.textContent = 'Unable to load initial data. Please refresh.';
  }

  addProductForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.textContent = '';

    const formData = new FormData(addProductForm);
    const payload = {
      ProductName: formData.get('ProductName')?.toString().trim(),
      Description: formData.get('Description')?.toString().trim(),
      UnitPrice: parseFloat(formData.get('UnitPrice')),
      QuantityInStock: parseInt(formData.get('QuantityInStock'), 10),
      ManufacturerID: user.UserID,
    };

    if (!payload.ProductName || !payload.Description || payload.UnitPrice < 0 || payload.QuantityInStock < 0) {
      feedback.textContent = 'Please provide valid product information.';
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || 'Unable to add product.');
      }

      feedback.textContent = 'Product published successfully!';
      addProductForm.reset();
      await fetchManufacturerProducts(user.UserID);
    } catch (error) {
      console.error('Product creation failed', error);
      feedback.textContent = error.message || 'Product creation failed. Please try again.';
    }
  });

  if (hint && !hint.textContent) {
    hint.textContent = 'Incoming orders update in real-time when customers purchase your products.';
  }
}

async function fetchAllProducts() {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}

async function fetchCustomerOrders(customerId) {
  const response = await fetch(`${API_BASE}/orders/customer/${customerId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  const orders = await response.json();
  populateCustomerOrdersTable(orders);
}

async function fetchManufacturerProducts(manufacturerId) {
  const response = await fetch(`${API_BASE}/products/manufacturer/${manufacturerId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch manufacturer products');
  }
  const products = await response.json();
  populateManufacturerProductsTable(products);
}

async function fetchManufacturerOrders(manufacturerId) {
  const response = await fetch(`${API_BASE}/orders/manufacturer/${manufacturerId}`);
  if (response.status === 404) {
    populateManufacturerOrdersTable([]);
    return;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch manufacturer orders');
  }
  const orders = await response.json();
  populateManufacturerOrdersTable(orders);
}

function populateCustomerProductsTable(products) {
  const tbody = document.getElementById('customer-products-body');
  if (!tbody) return;
  tbody.innerHTML = products
    .map((product) => `
      <tr>
        <td>${escapeHtml(product.ProductName)}</td>
        <td>${escapeHtml(product.Description || '')}</td>
        <td>$${Number(product.UnitPrice).toFixed(2)}</td>
        <td>${Number(product.QuantityInStock)}</td>
        <td>${escapeHtml(product.ManufacturerName || 'Unknown')}</td>
      </tr>
    `)
    .join('');
}

function populateCustomerOrdersTable(orders) {
  const tbody = document.getElementById('customer-orders-body');
  if (!tbody) return;
  if (!Array.isArray(orders) || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">No orders yet. Start by creating one!</td></tr>';
    return;
  }

  const grouped = orders.reduce((acc, row) => {
    if (!acc[row.OrderID]) {
      acc[row.OrderID] = {
        meta: {
          OrderID: row.OrderID,
          OrderDate: row.OrderDate,
          ShippingAddress: row.ShippingAddress,
          Status: row.Status,
        },
        items: [],
      };
    }
    acc[row.OrderID].items.push({
      ProductName: row.ProductName,
      Quantity: row.Quantity,
      UnitPriceAtPurchase: row.UnitPriceAtPurchase,
    });
    return acc;
  }, {});

  tbody.innerHTML = Object.values(grouped)
    .map((order, index) => {
      const itemSummary = order.items
        .map((item) => `${item.Quantity} × ${escapeHtml(item.ProductName)} ($${Number(item.UnitPriceAtPurchase).toFixed(2)})`)
        .join('<br>');
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${formatDate(order.meta.OrderDate)}</td>
          <td><span class="status-chip">${escapeHtml(order.meta.Status)}</span></td>
          <td>${escapeHtml(order.meta.ShippingAddress)}</td>
          <td>${itemSummary}</td>
        </tr>
      `;
    })
    .join('');
}

function populateManufacturerProductsTable(products) {
  const tbody = document.getElementById('manufacturer-products-body');
  if (!tbody) return;
  if (!Array.isArray(products) || products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">No products yet. Add one to get started.</td></tr>';
    return;
  }

  tbody.innerHTML = products
    .map((product) => `
      <tr>
        <td>${escapeHtml(product.ProductName)}</td>
        <td>${escapeHtml(product.Description || '')}</td>
        <td>$${Number(product.UnitPrice).toFixed(2)}</td>
        <td>${Number(product.QuantityInStock)}</td>
      </tr>
    `)
    .join('');
}

function populateManufacturerOrdersTable(orders) {
  const tbody = document.getElementById('manufacturer-orders-body');
  if (!tbody) return;
  if (!Array.isArray(orders) || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">No incoming orders yet.</td></tr>';
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const itemSummary = order.items
        .map((item) => `${item.Quantity} × ${escapeHtml(item.ProductName)} ($${Number(item.UnitPriceAtPurchase).toFixed(2)})`)
        .join('<br>');
      return `
        <tr>
          <td>${order.OrderID}</td>
          <td>${formatDate(order.OrderDate)}</td>
          <td>${escapeHtml(order.CustomerName || 'Customer')}</td>
          <td><span class="status-chip">${escapeHtml(order.Status)}</span></td>
          <td>${itemSummary}</td>
        </tr>
      `;
    })
    .join('');
}

function ensureOrderItemRows(container, products, count) {
  container.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    appendOrderItemRow(container, products);
  }
}

// Ensure product quantity cannot exceed available stock
function appendOrderItemRow(container, products) {
  const row = document.createElement('div');
  row.className = 'order-item-row';
  row.innerHTML = `
    <div class="field">
      <label>Product</label>
      <select required>
        <option value="">Select product</option>
        ${products
          .map((product) => `<option value="${product.ProductID}" data-stock="${product.QuantityInStock}">${escapeHtml(product.ProductName)}</option>`)
          .join('')}
      </select>
    </div>
    <div class="field">
      <label>Quantity</label>
      <input type="number" min="1" step="1" value="1" required>
    </div>
    <button type="button" class="remove-item" aria-label="Remove item">&times;</button>
  `;

  const quantityInput = row.querySelector('input');
  const productSelect = row.querySelector('select');

  productSelect.addEventListener('change', () => {
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const maxStock = parseInt(selectedOption.getAttribute('data-stock'), 10);
    quantityInput.max = maxStock;
    quantityInput.value = Math.min(quantityInput.value, maxStock);
  });

  row.querySelector('.remove-item').addEventListener('click', () => {
    if (container.children.length > 1) {
      container.removeChild(row);
    }
  });

  container.appendChild(row);
}

function escapeHtml(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case '&':
        return '&';
      case '<':
        return '<';
      case '>':
        return '>';
      case '"':
        return '"';
      case "'":
        return "&#39;";
      default:
        return match;
    }
  });
}

function formatDate(dateString) {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return new Date(dateString).toLocaleString(undefined, options).replace(',', '');
}
