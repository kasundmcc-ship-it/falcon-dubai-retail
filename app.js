/**
 * app.js — shared helpers used by every page (dashboard, products, orders, etc.)
 * Loaded before any page-specific script (dashboard.js, products.js, ...).
 */

// ============================================================
// CONFIG — paste your deployed Web App URL here
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbwJyU5iMivQBeZJAZ_AIsuTzbyBPstlyzYegIx2MvZtbqPn143VtM02aTor_F63Nf-7/exec';

// ============================================================
// API call helper
// ============================================================
async function callApi(action, params = {}) {
  const body = JSON.stringify({ action, ...params });
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body
    });
    return await res.json();
  } catch (err) {
    console.error('API call failed:', action, err);
    return { success: false, error: 'Network error — check your connection or API_URL in app.js' };
  }
}

// ============================================================
// Currency / number formatting (LKR)
// ============================================================
function fmtMoney(n) {
  const num = Number(n) || 0;
  return 'Rs. ' + num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString('en-LK');
}

// ============================================================
// Session (simple localStorage-based, set by login.html)
// ============================================================
function getSession() {
  try {
    return JSON.parse(localStorage.getItem('bhavi_session') || 'null');
  } catch (e) {
    return null;
  }
}

function requireSession(allowedRoles) {
  const s = getSession();
  if (!s || (allowedRoles && !allowedRoles.includes(s.role))) {
    window.location.href = 'login.html';
    return null;
  }
  return s;
}

function logout() {
  localStorage.removeItem('bhavi_session');
  window.location.href = 'login.html';
}

// ============================================================
// Theme toggle (dark default, light optional)
// ============================================================
function initTheme() {
  const saved = localStorage.getItem('bhavi_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bhavi_theme', next);
}

// ============================================================
// Tiny skeleton-loader helper
// ============================================================
function skeletonRow(cols) {
  return '<tr class="skel-row">' + Array(cols).fill('<td><div class="skel"></div></td>').join('') + '</tr>';
}

initTheme();
