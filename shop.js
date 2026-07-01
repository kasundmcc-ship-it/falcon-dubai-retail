/**
 * shop.js — customer-facing store: browse, search, filter by category,
 * add to cart, checkout and place order via the backend.
 */

const session = getSession();
if (!session || session.role !== 'Customer') window.location.href = "customer-login.html";

document.getElementById('greetName').textContent = session.name;
document.getElementById('userChip').textContent = session.phone;

let shopProducts = [];
let shopCart = []; // [{code, name, unitPrice, qty}]
let activeCategory = 'All';

// Category emoji map for visual flair
const catEmoji = {
  'Food & Beverage': '🥤', 'Personal Care': '🧴', 'Household': '🏠',
  'Health': '💊', 'Spices': '🌶️', 'Cosmetics': '💄', 'General': '📦'
};

// ===== Load Products =====
async function loadShop() {
  const r = await callApi('getProducts');
  if (!r.success) {
    document.getElementById('productGrid').innerHTML = '<p style="color:var(--text-dim);text-align:center;grid-column:1/-1">Could not load products. Please refresh.</p>';
    return;
  }
  shopProducts = r.products.filter(p => p.Status === 'Active');
  buildCategoryPills();
  applyFilters();
}

function buildCategoryPills() {
  const cats = ['All', ...new Set(shopProducts.map(p => p.Category).filter(Boolean)).values()].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));
  document.getElementById('catPills').innerHTML = cats.map(c => `
    <div class="cat-pill ${c === activeCategory ? 'active' : ''}" onclick="setCategory('${c}')">
      ${catEmoji[c] || '📦'} ${c}
    </div>
  `).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  buildCategoryPills();
  applyFilters();
}

function applyFilters() {
  const q = (document.getElementById('shopSearch').value || '').toLowerCase().trim();
  const filtered = shopProducts.filter(p => {
    const matchCat = activeCategory === 'All' || p.Category === activeCategory;
    const matchQ = !q || p.Name.toLowerCase().includes(q) || (p.Description || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  renderGrid(filtered);
}

function renderGrid(products) {
  const grid = document.getElementById('productGrid');
  if (!products.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:40px">No products found</div>';
    return;
  }
  grid.innerHTML = products.map(p => {
    const qty = Number(p.Quantity);
    const oos = qty <= 0;
    const low = !oos && qty <= Number(p.ReorderLevel);
    const emoji = catEmoji[p.Category] || '📦';
    return `
      <div class="product-card">
        <div class="img-wrap">${emoji}</div>
        <div class="card-body">
          <div class="p-name">${p.Name}</div>
          <div class="p-desc">${p.Description || p.Category}</div>
          <div class="p-price">${fmtMoney(p.SellingPrice)}</div>
          <div class="stock-note">${oos ? '❌ Out of stock' : low ? '⚠️ Low stock: ' + qty + ' left' : '✅ In stock'}</div>
          <button class="add-btn" ${oos ? 'disabled' : ''} onclick="addToShopCart('${p.Code}','${p.Name.replace(/'/g,"\\'")}',${p.SellingPrice})">
            ${oos ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ===== Cart =====
function addToShopCart(code, name, unitPrice) {
  const existing = shopCart.find(i => i.code === code);
  if (existing) existing.qty++;
  else shopCart.push({ code, name, unitPrice: Number(unitPrice), qty: 1 });
  updateCartUI();
  // quick bounce animation on cart button
  const btn = document.querySelector('.cart-btn');
  btn.style.transform = 'scale(1.3)';
  setTimeout(() => btn.style.transform = '', 200);
}

function changeShopQty(code, delta) {
  const item = shopCart.find(i => i.code === code);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) shopCart = shopCart.filter(i => i.code !== code);
  renderCartDrawer();
  updateCartUI();
}

function updateCartUI() {
  const totalItems = shopCart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = shopCart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const badge = document.getElementById('cartCountBadge');
  badge.textContent = totalItems;
  badge.style.display = totalItems > 0 ? 'flex' : 'none';
  document.getElementById('bbTotal').textContent = fmtMoney(totalPrice);
  document.getElementById('bbItemCount').textContent = totalItems + ' item' + (totalItems !== 1 ? 's' : '');
  const bar = document.getElementById('bottomBar');
  bar.className = 'bottom-bar' + (totalItems > 0 ? '' : ' hidden');
}

function openCart() {
  renderCartDrawer();
  document.getElementById('checkoutDrawer').style.display = 'none';
  document.getElementById('cartDrawer').style.display = 'block';
  document.getElementById('drawerOverlay').classList.add('open');
}

function closeCart() {
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('cartDrawer').style.display = 'none';
  document.getElementById('checkoutDrawer').style.display = 'none';
}

function renderCartDrawer() {
  const el = document.getElementById('cartDrawerItems');
  const total = shopCart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  if (!shopCart.length) {
    el.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px">Your cart is empty</p>';
  } else {
    el.innerHTML = shopCart.map(item => `
      <div class="drawer-item">
        <div class="di-name">${item.name}<br><span style="font-size:12px;color:var(--text-dim)">${fmtMoney(item.unitPrice)} each</span></div>
        <div class="qty-ctrl">
          <button onclick="changeShopQty('${item.code}',-1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeShopQty('${item.code}',1)">+</button>
        </div>
        <div class="di-price">${fmtMoney(item.unitPrice * item.qty)}</div>
      </div>
    `).join('');
  }
  document.getElementById('cartDrawerTotal').textContent = fmtMoney(total);
}

// ===== Payment Selection =====
let selectedPayment = 'cod';
const DELIVERY_CHARGE = 350; // Rs. 350 flat island-wide — change as needed

function selectPayment(method) {
  // Only cod is active right now — ignore clicks on disabled options
  if (method !== 'cod') return;
  selectedPayment = method;
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('pm-' + method).classList.add('selected');
}

function showComingSoon(name) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--hairline);border-radius:10px;padding:12px 20px;font-size:13px;color:var(--text-dim);z-index:200;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.4)';
  toast.textContent = name + ' — Coming Soon! 🚀';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function showCheckout() {
  if (!shopCart.length) { alert('Add items to your cart first.'); return; }
  document.getElementById('cartDrawer').style.display = 'none';
  document.getElementById('checkoutDrawer').style.display = 'block';

  const subtotal = shopCart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const total = subtotal + DELIVERY_CHARGE;

  document.getElementById('coName').value = session.name;
  document.getElementById('coPhone').value = session.phone;
  if (session.address) document.getElementById('coAddress').value = session.address;

  document.getElementById('coSubtotal').textContent = fmtMoney(subtotal);
  document.getElementById('coDeliveryCharge').textContent = fmtMoney(DELIVERY_CHARGE);
  document.getElementById('coDeliverySummary').textContent = fmtMoney(DELIVERY_CHARGE);
  document.getElementById('coTotal').textContent = fmtMoney(total);

  // Reset to COD
  selectedPayment = 'cod';
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('pm-cod').classList.add('selected');
}

function backToCart() {
  document.getElementById('checkoutDrawer').style.display = 'none';
  document.getElementById('cartDrawer').style.display = 'block';
}

// ===== Place Order =====
async function placeShopOrder() {
  const address = document.getElementById('coAddress').value.trim();
  if (!address) { alert('Please enter your delivery address.'); return; }

  const subtotal = shopCart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const total = subtotal + DELIVERY_CHARGE;

  const paymentLabel = selectedPayment === 'cod' ? 'Cash on Delivery' : selectedPayment;

  const r = await callApi('placeOrder', {
    customerId: session.id,
    customerName: session.name,
    items: shopCart,
    discount: 0,
    shipping: DELIVERY_CHARGE,
    paymentMethod: paymentLabel,
    paidAmount: 0, // COD = not paid yet
    deliveryAddress: address,
    createdBy: session.name,
    notes: ''
  });

  if (r.success) {
    shopCart = [];
    updateCartUI();
    closeCart();
    showOrderConfirmation(r.orderId, total);
  } else {
    alert('Order failed: ' + r.error);
  }
}

function showOrderConfirmation(orderId, total) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;';
  div.innerHTML = `
    <div style="background:var(--surface);border-radius:16px;padding:32px;text-align:center;max-width:320px;width:100%">
      <div style="font-size:56px;margin-bottom:12px">✅</div>
      <div style="font-family:'Fraunces',serif;font-size:22px;color:var(--gold);margin-bottom:8px">Order Placed!</div>
      <div style="font-size:13px;color:var(--text-dim);margin-bottom:6px">Order ID: <span style="font-family:monospace;color:var(--text)">${orderId}</span></div>
      <div style="font-size:13px;color:var(--text-dim);margin-bottom:20px">Total: <span style="color:var(--gold);font-weight:700">${fmtMoney(total)}</span></div>
      <div style="font-size:13px;color:var(--text-dim);margin-bottom:24px">We'll contact you on <strong>${session.phone}</strong> to confirm delivery.</div>
      <button class="btn btn-gold" style="width:100%" onclick="this.closest('div[style]').remove()">Continue Shopping</button>
    </div>
  `;
  document.body.appendChild(div);
}

loadShop();
