/**
 * dashboard.js — loads getDashboard() from the backend and renders
 * KPI cards, charts, low stock table, latest orders, recent customers.
 */

requireSession(['Owner', 'Assistant']);

document.getElementById('todayLabel').textContent = new Date().toLocaleDateString('en-LK', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

let charts = {};

function destroyCharts() {
  Object.values(charts).forEach(c => c && c.destroy());
  charts = {};
}

function chartColors() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    text: dark ? '#9BA1AE' : '#6B6F76',
    grid: dark ? '#262B35' : '#E2DDD0',
    gold: '#D4A24C',
    teal: '#3FA796',
    danger: '#E0584F',
    success: '#4CAF7D'
  };
}

async function loadDashboard() {
  const r = await callApi('getDashboard');
  if (!r.success) {
    alert('Could not load dashboard: ' + r.error);
    return;
  }
  renderKpis(r);
  renderCharts(r);
  renderLowStock(r.lowStockItems);
  renderLatestOrders(r.latestOrders);
  renderRecentCustomers(r.recentCustomers);
}

function renderKpis(d) {
  const targetPct = d.salesTarget ? Math.min(100, Math.round((d.monthSales / d.salesTarget) * 100)) : 0;
  const cards = [
    { label: "Today's Sales", value: fmtMoney(d.todaySales), accent: true },
    { label: 'Monthly Sales', value: fmtMoney(d.monthSales), delta: `${targetPct}% of target` },
    { label: 'Monthly Profit', value: fmtMoney(d.monthProfit), accent: true },
    { label: 'Monthly Expenses', value: fmtMoney(d.monthExpenses) },
    { label: 'Inventory Value', value: fmtMoney(d.inventoryValue) },
    { label: 'Pending Orders', value: fmtNum(d.pendingOrders) },
    { label: 'Completed Orders', value: fmtNum(d.completedOrders) },
    { label: 'Cancelled Orders', value: fmtNum(d.cancelledOrders) },
    { label: 'Low Stock Items', value: fmtNum(d.lowStockCount), warn: d.lowStockCount > 0 },
    { label: 'Out of Stock', value: fmtNum(d.outOfStockCount), warn: d.outOfStockCount > 0 },
  ];
  document.getElementById('kpiGrid').innerHTML = cards.map(c => `
    <div class="kpi-card ${c.accent ? 'accent' : ''} ${c.warn ? 'warn' : ''}">
      <div class="label">${c.label}</div>
      <div class="stat-value figure">${c.value}</div>
      ${c.delta ? `<div class="delta">${c.delta}</div>` : ''}
    </div>
  `).join('');
}

function renderCharts(d) {
  destroyCharts();
  const c = chartColors();
  const baseOpts = {
    plugins: { legend: { labels: { color: c.text, font: { family: 'Inter' } } } },
    scales: {
      x: { ticks: { color: c.text }, grid: { color: c.grid } },
      y: { ticks: { color: c.text }, grid: { color: c.grid } }
    }
  };

  // Revenue trend (line)
  charts.revenue = new Chart(document.getElementById('revenueChart'), {
    type: 'line',
    data: {
      labels: d.monthlyRevenue.map(m => m.month),
      datasets: [{
        label: 'Monthly Revenue',
        data: d.monthlyRevenue.map(m => m.total),
        borderColor: c.gold,
        backgroundColor: 'rgba(212,162,76,0.12)',
        fill: true, tension: 0.35, pointRadius: 3
      }]
    },
    options: { ...baseOpts, responsive: true, maintainAspectRatio: false }
  });

  // Order status doughnut
  charts.orderStatus = new Chart(document.getElementById('orderStatusChart'), {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Completed', 'Cancelled'],
      datasets: [{
        data: [d.pendingOrders, d.completedOrders, d.cancelledOrders],
        backgroundColor: [c.gold, c.success, c.danger],
        borderWidth: 0
      }]
    },
    options: { plugins: { legend: { position: 'bottom', labels: { color: c.text } } }, responsive: true, maintainAspectRatio: false }
  });

  // Top selling bar
  charts.topSelling = new Chart(document.getElementById('topSellingChart'), {
    type: 'bar',
    data: {
      labels: d.topSelling.slice(0, 6).map(p => p.name),
      datasets: [{ label: 'Units Sold', data: d.topSelling.slice(0, 6).map(p => p.qty), backgroundColor: c.teal, borderRadius: 4 }]
    },
    options: { ...baseOpts, indexAxis: 'y', responsive: true, maintainAspectRatio: false }
  });

  // Profit trend (reusing revenue history shape as proxy line — true profit-by-month comes from Forecast page)
  charts.profitTrend = new Chart(document.getElementById('profitTrendChart'), {
    type: 'bar',
    data: {
      labels: d.monthlyRevenue.map(m => m.month),
      datasets: [{ label: 'Revenue', data: d.monthlyRevenue.map(m => m.total), backgroundColor: c.gold, borderRadius: 4 }]
    },
    options: { ...baseOpts, responsive: true, maintainAspectRatio: false }
  });
}

function renderLowStock(items) {
  const body = document.getElementById('lowStockBody');
  if (!items || !items.length) {
    body.innerHTML = '<tr><td colspan="5" style="color:var(--text-dim)">No low stock items — inventory looks healthy.</td></tr>';
    return;
  }
  body.innerHTML = items.map(p => `
    <tr>
      <td class="product-code">${p.Code}</td>
      <td>${p.Name}</td>
      <td>${fmtNum(p.Quantity)}</td>
      <td>${fmtNum(p.ReorderLevel)}</td>
      <td><span class="badge low">Low Stock</span></td>
    </tr>
  `).join('');
}

function renderLatestOrders(orders) {
  const body = document.getElementById('latestOrdersBody');
  if (!orders || !orders.length) {
    body.innerHTML = '<tr><td colspan="4" style="color:var(--text-dim)">No orders yet.</td></tr>';
    return;
  }
  const badgeClass = s => s === 'Completed' ? 'ok' : s === 'Cancelled' ? 'low' : 'pending';
  body.innerHTML = orders.map(o => `
    <tr>
      <td class="mono">${o.OrderID}</td>
      <td>${o.CustomerName}</td>
      <td class="price">${fmtMoney(o.Total)}</td>
      <td><span class="badge ${badgeClass(o.Status)}">${o.Status}</span></td>
    </tr>
  `).join('');
}

function renderRecentCustomers(customers) {
  const body = document.getElementById('recentCustomersBody');
  if (!customers || !customers.length) {
    body.innerHTML = '<tr><td colspan="3" style="color:var(--text-dim)">No customers yet.</td></tr>';
    return;
  }
  body.innerHTML = customers.map(c => `
    <tr>
      <td>${c.Name}</td>
      <td class="mono">${c.Phone || '—'}</td>
      <td>${fmtNum(c.RewardPoints)}</td>
    </tr>
  `).join('');
}

loadDashboard();
