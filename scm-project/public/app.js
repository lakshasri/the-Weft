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
  const stored = localStorage.getItem('user');
  if (stored) {
    currentUser = JSON.parse(stored);
    showDashboard();
  }

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
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    showDashboard();
  } catch (e) {
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
    if (!res.ok) throw new Error('Signup failed');
    const data = await res.json();
    currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    showDashboard();
  } catch (e) {
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

  const role = currentUser.Role;
  document.getElementById('manufacturer-panel').hidden = role !== 'Manufacturer';
  document.getElementById('retailer-panel').hidden = role !== 'Retailer';
  document.getElementById('customer-panel').hidden = role !== 'Customer';
  document.getElementById('distributor-panel').hidden = role !== 'Distributor';

  if (role === 'Manufacturer') loadManufacturerData();
  else if (role === 'Retailer') loadRetailerData();
  else if (role === 'Customer') loadCustomerData();
  else if (role === 'Distributor') loadDistributorData();
}

async function loadManufacturerData() {
  try {
    const res = await fetch(`${API}/products/master/manufacturer/${currentUser.UserID}`);
    const products = await res.json();
    productList.innerHTML = products.length
      ? products.map(p => `<div class="list-item"><h4>${p.ProductName}</h4><p>${p.Description || 'N/A'}</p></div>`).join('')
      : '<p class="empty">No products yet.</p>';
  } catch (e) {
    productList.innerHTML = '<p class="empty">Error loading.</p>';
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
    retailerInventory.innerHTML = inv.length
      ? inv.map(i => `<div class="list-item"><h4>${i.ProductName}</h4><p>$${parseFloat(i.Price).toFixed(2)} | Stock: ${i.Stock}</p></div>`).join('')
      : '<p class="empty">Empty.</p>';

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
          <button class="btn" onclick="addToCart('${p.RetailerProductID}', '${p.RetailerID}', '${p.ProductName}', ${parseFloat(p.Price)})">Add</button>
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

function addToCart(rpid, rid, name, price) {
  const existing = cart.find(i => i.RetailerProductID === rpid);
  if (existing) existing.Quantity += 1;
  else cart.push({ RetailerProductID: rpid, RetailerID: rid, Quantity: 1, name, price });
  renderCart();
}

function renderCart() {
  if (!cart.length) {
    cartDiv.innerHTML = '<p class="empty">Empty.</p>';
    return;
  }
  cartDiv.innerHTML = cart.map(i => `
    <div class="cart-item">
      <span>${i.name} x${i.Quantity} ($${(i.price * i.Quantity).toFixed(2)})</span>
      <button class="btn" onclick="removeFromCart('${i.RetailerProductID}')">Remove</button>
    </div>
  `).join('');
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
