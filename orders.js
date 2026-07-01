/**
 * orders.js — new order builder, order list, invoice generator.
 */

requireSession(['Owner', 'Assistant']);

let allOrders = [];
let allProductsList = [];
let cart = []; // [{code, name, unitPrice, qty}]

// ===== Load data =====
async function init() {
  const [ordersR, productsR] = await Promise.all([
    callApi('getOrders', {}),
    callApi('getProducts')
  ]);
  if (productsR.success) allProductsList = productsR.products.filter(p => p.Status === 'Active');
  if (ordersR.success) {
    allOrders = ordersR.orders;
    document.getElementById('orderCount').textContent = allOrders.length + ' orders';
    renderOrders(allOrders);
  }
}

// ===== Order list =====
function filterOrders() {
  const q = document.getElementById('orderSearch').value.toLowerCase();
  const status = document.getElementById('orderStatusFilter').value;
  const filtered = allOrders.filter(o => {
    const matchQ = !q || o.OrderID?.toLowerCase().includes(q) || o.CustomerName?.toLowerCase().includes(q);
    const matchS = !status || o.Status === status;
    return matchQ && matchS;
  });
  renderOrders(filtered);
}

function renderOrders(list) {
  const body = document.getElementById('ordersBody');
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:32px">No orders found</td></tr>';
    return;
  }
  const bc = s => s === 'Completed' ? 'ok' : s === 'Cancelled' ? 'low' : 'pending';
  body.innerHTML = list.map(o => `
    <tr>
      <td class="mono" style="font-size:12px">${o.OrderID}</td>
      <td style="font-size:12px;color:var(--text-dim)">${new Date(o.Date).toLocaleDateString()}</td>
      <td>${o.CustomerName}</td>
      <td class="price">${fmtMoney(o.Total)}</td>
      <td class="price">${fmtMoney(o.PaidAmount)}</td>
      <td class="price" style="color:${Number(o.Balance) > 0 ? 'var(--danger)' : 'var(--success)'}">${fmtMoney(o.Balance)}</td>
      <td><span class="badge ${bc(o.Status)}">${o.Status}</span></td>
      <td style="display:flex;gap:4px;flex-wrap:wrap">
        <button class="btn" style="padding:4px 8px;font-size:11px" onclick="showInvoice('${o.OrderID}')">Invoice</button>
        ${o.Status === 'Pending' ? `<button class="btn" style="padding:4px 8px;font-size:11px" onclick="markComplete('${o.OrderID}')">Complete</button>` : ''}
        ${o.Status !== 'Cancelled' ? `<button class="btn" style="padding:4px 8px;font-size:11px;color:var(--danger)" onclick="cancelOrd('${o.OrderID}')">Cancel</button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function markComplete(orderId) {
  if (!confirm('Mark this order as Completed?')) return;
  const r = await callApi('updateOrder', { orderId, status: 'Completed' });
  if (r.success) init();
  else alert('Failed: ' + r.error);
}

async function cancelOrd(orderId) {
  if (!confirm('Cancel this order? Stock will be restored.')) return;
  const r = await callApi('cancelOrder', { orderId });
  if (r.success) init();
  else alert('Failed: ' + r.error);
}

// ===== Product search =====
function searchProducts(q) {
  const sl = document.getElementById('suggestList');
  if (!q.trim()) { sl.style.display = 'none'; return; }
  const matches = allProductsList.filter(p =>
    p.Name.toLowerCase().includes(q.toLowerCase()) ||
    (p.Code && p.Code.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 8);
  if (!matches.length) { sl.style.display = 'none'; return; }
  sl.innerHTML = matches.map(p => `
    <div class="suggest-item" onclick="addToCart('${p.Code}','${p.Name.replace(/'/g,"\\'")}',${p.SellingPrice})">
      <span>${p.Name}</span>
      <span style="color:var(--gold);float:right">${fmtMoney(p.SellingPrice)}</span>
    </div>
  `).join('');
  sl.style.display = 'block';
}

document.addEventListener('click', e => {
  if (!document.getElementById('productSearch').contains(e.target)) {
    document.getElementById('suggestList').style.display = 'none';
  }
});

// ===== Cart =====
function addToCart(code, name, unitPrice) {
  document.getElementById('productSearch').value = '';
  document.getElementById('suggestList').style.display = 'none';
  const existing = cart.find(i => i.code === code);
  if (existing) { existing.qty++; }
  else { cart.push({ code, name, unitPrice: Number(unitPrice), qty: 1 }); }
  renderCart();
}

function changeQty(code, delta) {
  const item = cart.find(i => i.code === code);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.code !== code);
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cartItems');
  if (!cart.length) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;text-align:center;padding:20px">No items yet</div>';
    updateTotals(); return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span class="name">${item.name}<br><span style="font-size:11px;color:var(--text-dim)">${fmtMoney(item.unitPrice)} each</span></span>
      <div class="qty-ctrl">
        <button onclick="changeQty('${item.code}',-1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty('${item.code}',1)">+</button>
      </div>
      <span style="min-width:70px;text-align:right;font-weight:600">${fmtMoney(item.unitPrice * item.qty)}</span>
    </div>
  `).join('');
  updateTotals();
}

function updateTotals() {
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const discount = parseFloat(document.getElementById('tDiscount').value) || 0;
  const shipping = parseFloat(document.getElementById('tShipping').value) || 0;
  const total = Math.max(0, subtotal - discount + shipping);
  document.getElementById('tSubtotal').textContent = fmtMoney(subtotal);
  document.getElementById('tTotal').textContent = fmtMoney(total);
  updateBalance();
}

function updateBalance() {
  const total = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0)
    - (parseFloat(document.getElementById('tDiscount').value) || 0)
    + (parseFloat(document.getElementById('tShipping').value) || 0);
  const paid = parseFloat(document.getElementById('paidAmount').value) || 0;
  const balance = Math.max(0, total - paid);
  document.getElementById('balanceDisplay').textContent = fmtMoney(balance);
}

function clearCart() {
  cart = [];
  document.getElementById('newCustomerName').value = '';
  document.getElementById('newCustomerPhone').value = '';
  document.getElementById('tDiscount').value = 0;
  document.getElementById('tShipping').value = 0;
  document.getElementById('paidAmount').value = '';
  document.getElementById('orderNotes').value = '';
  renderCart();
}

// ===== Place Order =====
async function submitOrder() {
  if (!cart.length) { alert('Add at least one product to the order.'); return; }
  const session = getSession();
  const customerName = document.getElementById('newCustomerName').value.trim() || 'Walk-in';
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const discount = parseFloat(document.getElementById('tDiscount').value) || 0;
  const shipping = parseFloat(document.getElementById('tShipping').value) || 0;
  const paidAmount = parseFloat(document.getElementById('paidAmount').value) || subtotal - discount + shipping;

  const r = await callApi('placeOrder', {
    customerName,
    customerId: '',
    items: cart,
    discount,
    shipping,
    paymentMethod: document.getElementById('paymentMethod').value,
    paidAmount,
    deliveryAddress: document.getElementById('orderNotes').value.trim(),
    createdBy: session?.name || 'Staff',
    notes: ''
  });

  if (r.success) {
    alert(`Order ${r.orderId} placed! Total: ${fmtMoney(r.total)} | Balance: ${fmtMoney(r.balance)}`);
    clearCart();
    await init();
    showInvoice(r.orderId);
  } else {
    alert('Order failed: ' + r.error);
  }
}

// ===== Invoice =====
function showInvoice(orderId) {
  const order = allOrders.find(o => o.OrderID === orderId);
  const content = document.getElementById('invoiceContent');
  if (!order) { content.innerHTML = '<p style="color:var(--text-dim)">Loading invoice…</p>'; }
  else {
    content.innerHTML = `
      <div class="inv-row"><span>Order ID</span><span class="mono">${order.OrderID}</span></div>
      <div class="inv-row"><span>Date</span><span>${new Date(order.Date).toLocaleString()}</span></div>
      <div class="inv-row"><span>Customer</span><span>${order.CustomerName}</span></div>
      <div class="inv-row"><span>Payment</span><span>${order.PaymentMethod}</span></div>
      <hr style="border-color:var(--hairline);margin:10px 0">
      <div class="inv-row" style="font-weight:600"><span>Subtotal</span><span>${fmtMoney(order.Subtotal)}</span></div>
      <div class="inv-row"><span>Discount</span><span>− ${fmtMoney(order.Discount)}</span></div>
      <div class="inv-row"><span>Shipping</span><span>${fmtMoney(order.Shipping)}</span></div>
      <div class="inv-row" style="font-size:18px;font-weight:700;font-family:'Fraunces',serif;margin-top:8px"><span>TOTAL</span><span style="color:var(--gold)">${fmtMoney(order.Total)}</span></div>
      <div class="inv-row"><span>Paid</span><span>${fmtMoney(order.PaidAmount)}</span></div>
      <div class="inv-row" style="color:${Number(order.Balance) > 0 ? 'var(--danger)' : 'var(--success)'}"><span>Balance</span><span>${fmtMoney(order.Balance)}</span></div>
      ${order.DeliveryAddress ? `<div style="margin-top:10px;font-size:12px;color:var(--text-dim)">Delivery: ${order.DeliveryAddress}</div>` : ''}
      <div style="text-align:center;margin-top:20px;font-size:12px;color:var(--text-dim)">Thank you for shopping at Bhavi Retail!</div>
    `;
  }
  document.getElementById('invoiceOverlay').classList.add('open');
}

function closeInvoice(e) {
  if (!e || e.target === document.getElementById('invoiceOverlay')) {
    document.getElementById('invoiceOverlay').classList.remove('open');
  }
}

function printInvoice() {
  const content = document.getElementById('invoiceContent').innerHTML;
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>Invoice</title><style>
    body{font-family:sans-serif;padding:32px;max-width:400px;margin:auto}
    .inv-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee}
    h2{text-align:center;color:#B5812F}
  </style></head><body><h2>Bhavi Retail</h2>${content}</body></html>`);
  w.document.close();
  w.print();
}

init();
