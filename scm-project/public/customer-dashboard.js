const API = 'http://localhost:3000/api';
let currentUser = null;
let catalogProducts = [];
let cart = [];

let statsSection;
let catalogGrid;
let catalogSearch;
let cartContainer;
let checkoutForm;
let checkoutError;
let ordersList;

document.addEventListener('DOMContentLoaded', () => {
  statsSection = document.getElementById('stats-section');
  catalogGrid = document.getElementById('catalog-grid');
  catalogSearch = document.getElementById('catalog-search');
  cartContainer = document.getElementById('cart');
  checkoutForm = document.getElementById('checkout-form');
  checkoutError = document.getElementById('checkout-error');
  ordersList = document.getElementById('orders-list');

  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser || currentUser.Role !== 'Customer') {
    alert('Please log in as a Customer');
    window.location.href = 'index.html';
    return;
  }

  if (catalogSearch) {
    catalogSearch.addEventListener('input', () => renderCatalogCards());
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckout);
  }

  loadStats();
  loadCatalog();
  loadOrders();
});

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

function switchTab(evt, tabName) {
  document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add('active');
  }

  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  const panel = document.getElementById(tabName);
  if (panel) {
    panel.classList.add('active');
  }

  if (tabName === 'catalog') {
    loadCatalog();
  } else if (tabName === 'orders') {
    loadOrders();
  }
}

async function loadStats() {
  try {
    const [catalogRes, ordersRes] = await Promise.all([
      fetch(`${API}/products`),
      fetch(`${API}/orders/customer/${currentUser.UserID}`)
    ]);

    const catalog = await catalogRes.json();
    const ordersRaw = await ordersRes.json();
    const groupedOrders = groupOrdersByID(ordersRaw || []);

    const totalSpent = groupedOrders.reduce((sum, order) => sum + parseFloat(order.TotalAmount || 0), 0);

    if (statsSection) {
      statsSection.innerHTML = `
        <div class="stat-card">
          <h3>Retail Products</h3>
          <div class="stat-value">${catalog.length}</div>
        </div>
        <div class="stat-card">
          <h3>Orders Placed</h3>
          <div class="stat-value">${groupedOrders.length}</div>
        </div>
        <div class="stat-card">
          <h3>Total Spent</h3>
          <div class="stat-value">$${totalSpent.toFixed(0)}</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
    if (statsSection) {
      statsSection.innerHTML = '<p class="error">Failed to load stats.</p>';
    }
  }
}

async function loadCatalog() {
  try {
    const response = await fetch(`${API}/products`);
    catalogProducts = await response.json();
    renderCatalogCards();
  } catch (error) {
    console.error('Failed to load catalog:', error);
    catalogGrid.innerHTML = '<p class="error">Failed to load catalog.</p>';
  }
}

function renderCatalogCards() {
  if (!catalogGrid) return;
  if (!catalogProducts.length) {
    catalogGrid.innerHTML = '<p>No products available right now.</p>';
    return;
  }

  const query = (catalogSearch?.value || '').toLowerCase();
  const filtered = catalogProducts.filter(p =>
    p.ProductName?.toLowerCase().includes(query) ||
    p.RetailerName?.toLowerCase().includes(query)
  );

  catalogGrid.innerHTML = filtered.length
    ? filtered.map(p => `
        <div class="product-card">
          <div class="product-name">${p.ProductName}</div>
          <div class="product-details">
            ${p.Description || 'No description'}<br><br>
            <span class="badge">Retailer: ${p.RetailerName}</span>
            <span class="badge">Stock: ${p.Stock}</span>
          </div>
          <div class="price-display">$${parseFloat(p.Price || 0).toFixed(2)}</div>
          <button ${p.Stock <= 0 ? 'disabled' : ''} onclick="addToCart('${p.RetailerProductID}', '${p.RetailerID}', '${escapeQuotes(p.ProductName)}', ${parseFloat(p.Price || 0)}, ${p.Stock})">
            ${p.Stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      `).join('')
    : '<p class="empty">No products match your search.</p>';
}

function escapeQuotes(str = '') {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function addToCart(productId, retailerId, name, price, maxStock) {
  const existing = cart.find(item => item.RetailerProductID === productId);
  const currentQty = existing ? existing.Quantity : 0;

  if (currentQty >= maxStock) {
    alert(`Cannot add more. Maximum stock available: ${maxStock}`);
    return;
  }

  if (existing) {
    existing.Quantity += 1;
  } else {
    cart.push({ RetailerProductID: productId, RetailerID: retailerId, Quantity: 1, name, price, maxStock });
  }
  renderCart();
}

function renderCart() {
  if (!cartContainer) return;

  if (!cart.length) {
    cartContainer.innerHTML = '<p class="empty">Your cart is empty.</p>';
    return;
  }

  cartContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <div style="margin-top: 8px;">
          <input type="number" min="1" max="${item.maxStock}" value="${item.Quantity}"
            onchange="updateCartQuantity('${item.RetailerProductID}', this.value, ${item.maxStock})"
            style="width: 70px; padding: 4px;">
          <span>/ ${item.maxStock} available</span>
        </div>
        <p style="margin-top: 4px; font-weight: bold;">$${(item.price * item.Quantity).toFixed(2)}</p>
      </div>
      <button class="btn" onclick="removeFromCart('${item.RetailerProductID}')">Remove</button>
    </div>
  `).join('');
}

function updateCartQuantity(productId, newQty, maxStock) {
  newQty = parseInt(newQty, 10);
  if (Number.isNaN(newQty) || newQty < 1) {
    removeFromCart(productId);
    return;
  }
  if (newQty > maxStock) {
    alert(`Cannot exceed available stock: ${maxStock}`);
    renderCart();
    return;
  }
  const item = cart.find(i => i.RetailerProductID === productId);
  if (item) {
    item.Quantity = newQty;
  }
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.RetailerProductID !== productId);
  renderCart();
}

function clearCart() {
  if (!cart.length) return;
  if (confirm('Remove all items from cart?')) {
    cart = [];
    renderCart();
  }
}

async function handleCheckout(event) {
  event.preventDefault();
  if (!checkoutError) return;
  checkoutError.textContent = '';

  if (!cart.length) {
    checkoutError.textContent = 'Your cart is empty.';
    return;
  }

  const firstRetailer = cart[0].RetailerID;
  if (!cart.every(item => item.RetailerID === firstRetailer)) {
    checkoutError.textContent = 'All items must be from the same retailer.';
    return;
  }

  const formData = new FormData(checkoutForm);

  try {
    const response = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CustomerID: currentUser.UserID,
        RetailerID: firstRetailer,
        ShippingAddress: formData.get('ShippingAddress'),
        items: cart.map(item => ({
          RetailerProductID: item.RetailerProductID,
          Quantity: item.Quantity,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to place order.');
    }

    cart = [];
    renderCart();
    checkoutForm.reset();
    loadOrders();
    loadStats();
    alert('Order placed successfully!');
  } catch (error) {
    console.error('Checkout error:', error);
    checkoutError.textContent = error.message;
  }
}

async function loadOrders() {
  try {
    const response = await fetch(`${API}/orders/customer/${currentUser.UserID}`);
    const ordersRaw = await response.json();
    const orders = groupOrdersByID(ordersRaw || []);

    if (!orders.length) {
      ordersList.innerHTML = '<p class="empty">No orders yet.</p>';
      return;
    }

    ordersList.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Retailer</th>
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
              <td><strong>#${order.OrderID}</strong></td>
              <td>${order.RetailerName || 'N/A'}</td>
              <td>${order.OrderDate ? new Date(order.OrderDate).toLocaleDateString() : '—'}</td>
              <td>${order.items.map(item => `${item.ProductName} x${item.Quantity}`).join('<br>')}</td>
              <td><strong>$${parseFloat(order.TotalAmount || 0).toFixed(2)}</strong></td>
              <td><span class="badge">${order.Status}</span></td>
              <td>
                ${order.Status === 'Shipped'
                  ? `<button class="btn" onclick="markOrderDelivered(${order.OrderID})">Mark Delivered</button>`
                  : order.Status === 'Delivered'
                    ? '<span style="color:#4CAF50;">Delivered</span>'
                    : '<span style="color:#666;">—</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load orders:', error);
    ordersList.innerHTML = '<p class="error">Failed to load orders.</p>';
  }
}

async function markOrderDelivered(orderId) {
  if (!confirm('Confirm that you have received this order?')) return;

  try {
    const response = await fetch(`${API}/customer/${currentUser.UserID}/orders/${orderId}/receive`, {
      method: 'PATCH'
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update order.');
    }
    alert('Order marked as delivered!');
    loadOrders();
    loadStats();
  } catch (error) {
    console.error('Mark delivered error:', error);
    alert('Failed to mark order as delivered. Please try again.');
  }
}

function groupOrdersByID(orders) {
  const map = {};
  for (const entry of orders) {
    if (!map[entry.OrderID]) {
      map[entry.OrderID] = { ...entry, items: [] };
    }
    map[entry.OrderID].items.push({
      ProductName: entry.ProductName,
      Quantity: entry.Quantity,
    });
  }
  return Object.values(map);
}

