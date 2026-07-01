/**
 * reports.js — Sales, Profit, Inventory, ABC, Dead Stock, Customer reports
 */
requireSession(['Owner', 'Assistant']);

let dashData = null, productsData = [], customersData = [];
let rCharts = {};

function destroyRCharts() { Object.values(rCharts).forEach(c => c && c.destroy()); rCharts = {}; }

function chartC() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  return { text: dark ? '#9BA1AE' : '#6B6F76', grid: dark ? '#262B35' : '#E2DDD0', gold: '#D4A24C', teal: '#3FA796', danger: '#E0584F', success: '#4CAF7D' };
}

function baseOpts() {
  const c = chartC();
  return { plugins: { legend: { labels: { color: c.text, font: { family: 'Inter' } } } }, scales: { x: { ticks: { color: c.text }, grid: { color: c.grid } }, y: { ticks: { color: c.text }, grid: { color: c.grid } } }, responsive: true, maintainAspectRatio: false };
}

async function loadAll() {
  const [dr, pr, cr] = await Promise.all([
    callApi('getDashboard'),
    callApi('getProducts'),
    callApi('getCustomers')
  ]);
  if (dr.success) dashData = dr;
  if (pr.success) productsData = pr.products;
  if (cr.success) customersData = cr.customers;
  renderActiveTab();
}

function switchTab(name) {
  document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  destroyRCharts();
  renderActiveTab();
}

function renderActiveTab() {
  const active = document.querySelector('.report-section.active');
  if (!active || !dashData) return;
  const id = active.id;
  if (id === 'tab-sales') renderSales();
  else if (id === 'tab-profit') renderProfit();
  else if (id === 'tab-inventory') renderInventoryReport();
  else if (id === 'tab-abc') renderABC();
  else if (id === 'tab-dead') renderDead();
  else if (id === 'tab-customers') renderCustomerReport();
}

// ===== SALES =====
function renderSales() {
  const d = dashData;
  document.getElementById('salesKpis').innerHTML = `
    <div class="kpi-card accent"><div class="label">Today's Sales</div><div class="stat-value figure">${fmtMoney(d.todaySales)}</div></div>
    <div class="kpi-card accent"><div class="label">This Month</div><div class="stat-value figure">${fmtMoney(d.monthSales)}</div></div>
    <div class="kpi-card"><div class="label">Completed Orders</div><div class="stat-value figure">${d.completedOrders}</div></div>
    <div class="kpi-card"><div class="label">Pending Orders</div><div class="stat-value figure">${d.pendingOrders}</div></div>
  `;
  const c = chartC();
  rCharts.sales = new Chart(document.getElementById('salesChart'), {
    type: 'bar',
    data: {
      labels: d.monthlyRevenue.map(m => m.month),
      datasets: [{ label: 'Revenue', data: d.monthlyRevenue.map(m => m.total), backgroundColor: c.gold, borderRadius: 4 }]
    },
    options: baseOpts()
  });
  const top = d.topSelling || [];
  document.getElementById('topSellingBody').innerHTML = top.length
    ? top.map(p => `<tr><td>${p.name}</td><td>${fmtNum(p.qty)}</td><td class="price">${fmtMoney(p.revenue)}</td></tr>`).join('')
    : '<tr><td colspan="3" style="color:var(--text-dim);text-align:center">No sales data yet</td></tr>';
}

// ===== PROFIT =====
function renderProfit() {
  const d = dashData;
  document.getElementById('profitKpis').innerHTML = `
    <div class="kpi-card accent"><div class="label">Month Profit</div><div class="stat-value figure">${fmtMoney(d.monthProfit)}</div></div>
    <div class="kpi-card"><div class="label">Month Expenses</div><div class="stat-value figure">${fmtMoney(d.monthExpenses)}</div></div>
    <div class="kpi-card accent"><div class="label">Net</div><div class="stat-value figure">${fmtMoney(d.monthProfit - d.monthExpenses)}</div></div>
  `;
  const c = chartC();
  rCharts.profit = new Chart(document.getElementById('profitChart'), {
    type: 'line',
    data: {
      labels: d.monthlyRevenue.map(m => m.month),
      datasets: [{ label: 'Revenue', data: d.monthlyRevenue.map(m => m.total), borderColor: c.gold, backgroundColor: 'rgba(212,162,76,0.1)', fill: true, tension: 0.35 }]
    },
    options: baseOpts()
  });
  const sorted = [...productsData].sort((a, b) => Number(b.ProfitPct) - Number(a.ProfitPct)).slice(0, 20);
  document.getElementById('profitBody').innerHTML = sorted.map(p => `
    <tr>
      <td>${p.Name}</td>
      <td class="price">${fmtMoney(p.BuyingPrice)}</td>
      <td class="price" style="color:var(--gold)">${fmtMoney(p.SellingPrice)}</td>
      <td style="color:${Number(p.ProfitPct) >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:600">${Number(p.ProfitPct).toFixed(1)}%</td>
    </tr>`).join('');
}

// ===== INVENTORY REPORT =====
function renderInventoryReport() {
  const total = productsData.length;
  const low = productsData.filter(p => Number(p.Quantity) > 0 && Number(p.Quantity) <= Number(p.ReorderLevel)).length;
  const out = productsData.filter(p => Number(p.Quantity) <= 0).length;
  const value = productsData.reduce((s, p) => s + Number(p.StockValue || 0), 0);
  document.getElementById('invRptKpis').innerHTML = `
    <div class="kpi-card"><div class="label">Total SKUs</div><div class="stat-value figure">${total}</div></div>
    <div class="kpi-card warn"><div class="label">Low Stock</div><div class="stat-value figure">${low}</div></div>
    <div class="kpi-card warn"><div class="label">Out of Stock</div><div class="stat-value figure">${out}</div></div>
    <div class="kpi-card accent"><div class="label">Total Value</div><div class="stat-value figure">${fmtMoney(value)}</div></div>
  `;
  // Category breakdown chart
  const catMap = {};
  productsData.forEach(p => { catMap[p.Category] = (catMap[p.Category] || 0) + Number(p.StockValue || 0); });
  const cats = Object.keys(catMap); const vals = cats.map(c => catMap[c]);
  const c = chartC();
  rCharts.inv = new Chart(document.getElementById('invChart'), {
    type: 'doughnut',
    data: { labels: cats, datasets: [{ data: vals, backgroundColor: [c.gold, c.teal, c.success, c.danger, '#8B5CF6', '#06B6D4', '#F59E0B'], borderWidth: 0 }] },
    options: { plugins: { legend: { position: 'bottom', labels: { color: c.text } } }, responsive: true, maintainAspectRatio: false }
  });
  const alerts = productsData.filter(p => Number(p.Quantity) <= Number(p.ReorderLevel));
  document.getElementById('invRptBody').innerHTML = alerts.length
    ? alerts.map(p => {
        const qty = Number(p.Quantity);
        return `<tr>
          <td class="product-code">${p.Code}</td><td>${p.Name}</td>
          <td>${qty}</td><td>${p.ReorderLevel}</td>
          <td class="price">${fmtMoney(p.StockValue)}</td>
          <td><span class="badge ${qty <= 0 ? 'low' : 'pending'}">${qty <= 0 ? 'Out of Stock' : 'Low Stock'}</span></td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:20px">All items are well stocked ✅</td></tr>';
}

// ===== ABC =====
function renderABC() {
  const sorted = [...productsData]
    .map(p => ({ name: p.Name, revenue: Number(p.StockValue || 0) * 2 })) // proxy: use stock value * 2 until real sales totals exist
    .sort((a, b) => b.revenue - a.revenue);
  const total = sorted.reduce((s, p) => s + p.revenue, 0);
  let cum = 0;
  const gradeColor = { A: 'var(--gold)', B: 'var(--teal)', C: 'var(--text-dim)' };
  document.getElementById('abcBody').innerHTML = sorted.map(p => {
    cum += p.revenue;
    const pct = total ? (cum / total) * 100 : 0;
    const grade = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
    return `<tr>
      <td><strong style="color:${gradeColor[grade]};font-family:'Fraunces',serif;font-size:18px">${grade}</strong></td>
      <td>${p.name}</td>
      <td class="price">${fmtMoney(p.revenue)}</td>
      <td style="color:var(--text-dim)">${pct.toFixed(1)}%</td>
    </tr>`;
  }).join('');
}

// ===== DEAD STOCK =====
async function renderDead() {
  const r = await callApi('getReports', { reportType: 'deadStock' });
  const list = r.success ? r.deadStock : [];
  document.getElementById('deadBody').innerHTML = list.length
    ? list.map(p => `<tr>
        <td class="product-code">${p.Code}</td><td>${p.Name}</td>
        <td>${p.Quantity}</td><td class="price">${fmtMoney(p.StockValue)}</td><td>${p.Category}</td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:20px">No dead stock — everything has sold at least once 🎉</td></tr>';
}

// ===== CUSTOMERS REPORT =====
function renderCustomerReport() {
  const total = customersData.length;
  const monthMap = {};
  customersData.forEach(c => {
    const m = c.RegisteredAt ? String(c.RegisteredAt).slice(0, 7) : 'Unknown';
    monthMap[m] = (monthMap[m] || 0) + 1;
  });
  const months = Object.keys(monthMap).sort();
  document.getElementById('custRptKpis').innerHTML = `
    <div class="kpi-card"><div class="label">Total Customers</div><div class="stat-value figure">${total}</div></div>
    <div class="kpi-card accent"><div class="label">Months Active</div><div class="stat-value figure">${months.length}</div></div>
  `;
  const c = chartC();
  rCharts.cust = new Chart(document.getElementById('custChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{ label: 'New Customers', data: months.map(m => monthMap[m]), backgroundColor: c.teal, borderRadius: 4 }]
    },
    options: baseOpts()
  });
}

loadAll();
