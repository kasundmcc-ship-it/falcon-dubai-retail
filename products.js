/**
 * products.js — product management: load list, search/filter, add/edit via modal.
 */

requireSession(['Owner', 'Assistant']);

let allProducts = [];
let editingCode = null;

async function loadProducts() {
  const r = await callApi('getProducts');
  if (!r.success) { alert('Failed to load products: ' + r.error); return; }
  allProducts = r.products;
  document.getElementById('productCount').textContent = allProducts.length + ' products';
  populateCategoryFilter();
  renderProducts(allProducts);
}

function populateCategoryFilter() {
  const cats = [...new Set(allProducts.map(p => p.Category).filter(Boolean))].sort();
  const sel = document.getElementById('filterCategory');
  sel.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option>${c}</option>`).join('');
}

function filterProducts() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const cat = document.getElementById('filterCategory').value;
  const filtered = allProducts.filter(p => {
    const matchQ = !q || p.Name?.toLowerCase().includes(q) || p.Code?.toLowerCase().includes(q) || p.Category?.toLowerCase().includes(q) || p.Supplier?.toLowerCase().includes(q);
    const matchStatus = !status || p.Status === status;
    const matchCat = !cat || p.Category === cat;
    return matchQ && matchStatus && matchCat;
  });
  renderProducts(filtered);
}

function renderProducts(list) {
  const session = getSession();
  const isOwner = session && session.role === 'Owner';
  const body = document.getElementById('productsBody');
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="9" style="color:var(--text-dim);text-align:center;padding:32px">No products found</td></tr>';
    return;
  }
  body.innerHTML = list.map(p => {
    const qty = Number(p.Quantity);
    const reorder = Number(p.ReorderLevel);
    let stockBadge;
    if (qty <= 0) stockBadge = `<span class="badge low">Out of Stock</span>`;
    else if (qty <= reorder) stockBadge = `<span class="badge pending">Low: ${qty}</span>`;
    else stockBadge = `<span style="color:var(--text-dim)">${qty}</span>`;

    return `<tr>
      <td class="product-code">${p.Code}</td>
      <td>
        <div style="font-weight:600">${p.Name}</div>
        <div style="font-size:11px;color:var(--text-dim)">${p.Description || ''}</div>
      </td>
      <td>${p.Category}</td>
      <td class="price">Rs.${Number(p.BuyingPrice).toLocaleString()}</td>
      <td class="price" style="color:var(--gold)">Rs.${Number(p.SellingPrice).toLocaleString()}</td>
      <td style="color:${Number(p.ProfitPct) >= 0 ? 'var(--success)' : 'var(--danger)'}">
        ${Number(p.ProfitPct).toFixed(1)}%
      </td>
      <td>${stockBadge}</td>
      <td><span class="stat-chip chip-${p.Status === 'Active' ? 'active' : 'inactive'}">${p.Status}</span></td>
      <td>
        <button class="btn" style="padding:5px 10px;font-size:12px" onclick="openModal('${p.Code}')">Edit</button>
        ${isOwner ? `<button class="btn" style="padding:5px 10px;font-size:12px;color:var(--danger);margin-left:4px" onclick="deleteProduct('${p.Code}','${p.Name}')">Del</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

// ===== Modal =====

function openModal(code) {
  editingCode = code || null;
  document.getElementById('modalTitle').textContent = code ? 'Edit Product' : 'Add Product';
  document.getElementById('modalOverlay').classList.add('open');

  if (code) {
    const p = allProducts.find(x => x.Code === code);
    if (p) {
      document.getElementById('fCode').value = p.Code;
      document.getElementById('fBarcode').value = p.Barcode || '';
      document.getElementById('fName').value = p.Name;
      document.getElementById('fCategory').value = p.Category;
      document.getElementById('fSupplier').value = p.Supplier;
      document.getElementById('fBuyingPrice').value = p.BuyingPrice;
      document.getElementById('fSellingPrice').value = p.SellingPrice;
      document.getElementById('fShipping').value = p.ShippingCost;
      document.getElementById('fHandling').value = p.HandlingCost;
      document.getElementById('fImport').value = p.ImportCost;
      document.getElementById('fQty').value = p.Quantity;
      document.getElementById('fReorder').value = p.ReorderLevel;
      document.getElementById('fDesc').value = p.Description || '';
      document.getElementById('fStatus').value = p.Status;
    }
  } else {
    document.getElementById('fCode').value = '';
    ['fBarcode','fName','fDesc'].forEach(id => document.getElementById(id).value = '');
    ['fBuyingPrice','fSellingPrice','fShipping','fHandling','fImport','fQty'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fReorder').value = 5;
    document.getElementById('fSupplier').value = 'Dubai Import';
    document.getElementById('fCategory').value = 'General';
    document.getElementById('fStatus').value = 'Active';
  }
  recalc();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingCode = null;
}

function closeModalOnBg(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function recalc() {
  const buy = parseFloat(document.getElementById('fBuyingPrice').value) || 0;
  const sell = parseFloat(document.getElementById('fSellingPrice').value) || 0;
  const ship = parseFloat(document.getElementById('fShipping').value) || 0;
  const handle = parseFloat(document.getElementById('fHandling').value) || 0;
  const imp = parseFloat(document.getElementById('fImport').value) || 0;
  const qty = parseFloat(document.getElementById('fQty').value) || 0;

  const actualCost = buy + ship + handle + imp;
  const profit = sell - actualCost;
  const profitPct = actualCost > 0 ? (profit / actualCost) * 100 : 0;
  const suggested = actualCost * 1.4;
  const stockValue = actualCost * qty;

  const color = profit >= 0 ? 'var(--gold)' : 'var(--danger)';
  document.getElementById('cActualCost').textContent = fmtMoney(actualCost);
  document.getElementById('cProfit').style.color = color;
  document.getElementById('cProfit').textContent = fmtMoney(profit);
  document.getElementById('cProfitPct').style.color = color;
  document.getElementById('cProfitPct').textContent = profitPct.toFixed(1) + '%';
  document.getElementById('cSuggestedPrice').textContent = fmtMoney(suggested);
  document.getElementById('cStockValue').textContent = fmtMoney(stockValue);
}

async function saveProduct() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { alert('Product name is required.'); return; }

  const payload = {
    code: document.getElementById('fCode').value.trim() || undefined,
    barcode: document.getElementById('fBarcode').value.trim(),
    name,
    category: document.getElementById('fCategory').value,
    supplier: document.getElementById('fSupplier').value.trim(),
    buyingPrice: parseFloat(document.getElementById('fBuyingPrice').value) || 0,
    sellingPrice: parseFloat(document.getElementById('fSellingPrice').value) || 0,
    shippingCost: parseFloat(document.getElementById('fShipping').value) || 0,
    handlingCost: parseFloat(document.getElementById('fHandling').value) || 0,
    importCost: parseFloat(document.getElementById('fImport').value) || 0,
    quantity: parseFloat(document.getElementById('fQty').value) || 0,
    reorderLevel: parseFloat(document.getElementById('fReorder').value) || 5,
    description: document.getElementById('fDesc').value.trim(),
    images: '',
    status: document.getElementById('fStatus').value
  };

  const action = editingCode ? 'updateProduct' : 'saveProduct';
  if (editingCode) payload.code = editingCode;

  const r = await callApi(action, payload);
  if (r.success) {
    closeModal();
    await loadProducts();
  } else {
    alert('Save failed: ' + r.error);
  }
}

async function deleteProduct(code, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  const r = await callApi('deleteProduct', { code });
  if (r.success) await loadProducts();
  else alert('Delete failed: ' + r.error);
}

loadProducts();
