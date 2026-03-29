function apiUrl(path) {
  const [pathname, qs] = path.split('?');
  const parts = pathname.replace(/^\//, '').split('/');
  const fn = parts[0], sub = parts.slice(1).join('/');
  const base = `/.netlify/functions/${fn}${sub ? '/' + sub : ''}`;
  return qs ? base + '?' + qs : base;
}

const Auth = {
  getToken() { return localStorage.getItem('as_token'); },
  getUser()  { try { return JSON.parse(localStorage.getItem('as_user')); } catch { return null; } },
  setSession(token, user) { localStorage.setItem('as_token', token); localStorage.setItem('as_user', JSON.stringify(user)); },
  clear()    { localStorage.removeItem('as_token'); localStorage.removeItem('as_user'); },
  isLoggedIn(){ return !!this.getToken(); },
  requireAuth(){ if (!this.isLoggedIn()) { window.location.href = '/'; return false; } return true; },
  authHeaders(){ const t = this.getToken(); return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': 'Bearer ' + t } : {}) }; }
};

async function apiFetch(path, method = 'GET', body = null) {
  try {
    const res = await fetch(apiUrl(path), { method, headers: Auth.authHeaders(), ...(body !== null ? { body: JSON.stringify(body) } : {}) });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { Auth.clear(); window.location.href = '/'; return null; }
    return { ok: res.ok, status: res.status, data };
  } catch(e) { console.error('apiFetch:', path, e); return { ok: false, status: 0, data: { error: e.message } }; }
}
async function apiGet(p)      { return apiFetch(p); }
async function apiPost(p, b)  { return apiFetch(p, 'POST', b); }
async function apiDel(p)      { return apiFetch(p, 'DELETE'); }

const Theme = {
  current() { return localStorage.getItem('as_theme') || 'dark'; },
  apply(t) {
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : '');
    localStorage.setItem('as_theme', t);
    document.querySelectorAll('.theme-btn').forEach(b => b.textContent = t === 'light' ? '◐' : '◑');
  },
  toggle() { this.apply(this.current() === 'dark' ? 'light' : 'dark'); },
  init()   { this.apply(this.current()); }
};

function toast(msg, type = 'g', dur = 2400) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = `toast t-${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), dur);
}

function convBadgeClass(c) {
  return { 'STRONG BUY':'conv-sb', 'BUY':'conv-b', 'WATCH':'conv-w' }[c] || 'conv-n';
}
function convColor(c) {
  return { 'STRONG BUY':'var(--c-grn)', 'BUY':'var(--c-grn)', 'WATCH':'var(--c-acc)' }[c] || 'var(--c-muted)';
}
function convPct(c) {
  return { 'STRONG BUY':92, 'BUY':72, 'WATCH':46, 'NEUTRAL':18 }[c] || 18;
}

function renderNav(active) {
  const user = Auth.getUser();
  const nav  = document.getElementById('navbar');
  if (!nav) return;
  const bmCount = parseInt(localStorage.getItem('as_bm_count') || '0');
  nav.innerHTML = `
    <a href="/pages/dashboard.html" class="nav-brand"><div class="brand-dot"></div>ALPHASCOPE</a>
    ${user ? `
    <div class="nav-links">
      <a href="/pages/dashboard.html" class="nav-link ${active==='dashboard'?'active':''}">DASHBOARD</a>
      <a href="/pages/bookmarks.html" class="nav-link ${active==='bookmarks'?'active':''}">WATCHLIST <span class="cnt" id="navBmCount">${bmCount||''}</span></a>
    </div>
    <div class="nav-search-wrap">
      <span class="nav-search-icon">⌕</span>
      <input class="nav-search" id="navSearch" placeholder="Search NSE symbol or name..." autocomplete="off" spellcheck="false">
      <div class="search-drop" id="searchDrop"></div>
    </div>` : ''}
    <div class="nav-right">
      ${user ? `
      <button class="nav-btn acc" onclick="if(typeof runScan==='function')runScan();else window.location='/pages/dashboard.html?scan=1'">▶ SCAN</button>
      <div class="nav-user">
        <div class="user-init">${(user.username||'?')[0].toUpperCase()}</div>
        <span>${user.username}</span>
        <button class="nav-btn" style="border:none;padding:0 8px" onclick="logout()">OUT</button>
      </div>` : ''}
      <button class="nav-btn theme-btn" onclick="Theme.toggle()" title="Toggle theme">◑</button>
    </div>`;
  Theme.apply(Theme.current());
  if (user) initNavSearch();
}

function logout() { Auth.clear(); window.location.href = '/'; }

let _st = null;
function initNavSearch() {
  const inp = document.getElementById('navSearch');
  const dd  = document.getElementById('searchDrop');
  if (!inp) return;
  inp.addEventListener('input', () => { clearTimeout(_st); const q = inp.value.trim(); if (!q) { dd.classList.remove('open'); return; } _st = setTimeout(() => doNavSearch(q), 200); });
  inp.addEventListener('keydown', e => { if (e.key === 'Escape') { dd.classList.remove('open'); inp.value = ''; } });
  document.addEventListener('click', e => { if (!inp.contains(e.target) && !dd.contains(e.target)) dd.classList.remove('open'); });
}

async function doNavSearch(q) {
  const dd  = document.getElementById('searchDrop');
  const res = await apiGet('/stocks/search?q=' + encodeURIComponent(q));
  if (!res?.data?.length) { dd.innerHTML = `<div class="sd-empty">No results for "${q}"</div>`; dd.classList.add('open'); return; }
  const alphaSyms = new Set((window._alphaSignals || []).map(s => s.symbol));
  dd.innerHTML = res.data.map(r => `
    <div class="sd-item" onclick="goToStock('${r.symbol}','${r.name}','${r.sector}')">
      <div><div class="sd-sym">${r.symbol}</div><div class="sd-name">${r.name}</div></div>
      <div style="display:flex;gap:4px">${alphaSyms.has(r.symbol) ? '<span class="sd-tag alpha">ALPHA</span>' : ''}<span class="sd-tag">${r.sector}</span></div>
    </div>`).join('');
  dd.classList.add('open');
}

function goToStock(sym, name, sector) {
  const dd = document.getElementById('searchDrop'), inp = document.getElementById('navSearch');
  if (dd) dd.classList.remove('open');
  if (inp) inp.value = '';
  window.location.href = `/pages/stock.html?symbol=${sym}&name=${encodeURIComponent(name)}&sector=${encodeURIComponent(sector)}`;
}

let _chartInstances = {};
function destroyCharts() { Object.values(_chartInstances).forEach(c => { try { c.destroy(); } catch {} }); _chartInstances = {}; }

function drawChart(canvasId, type, stockData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  try { _chartInstances[canvasId]?.destroy(); } catch {}
  const ohlcv = stockData.ohlcv || [], sma20 = stockData.sma20 || [], sma50 = stockData.sma50 || [], rsiArr = stockData.rsi || [];
  const labels = ohlcv.map((_, i) => i % 15 === 0 ? 'D'+(i+1) : '');
  const closes = ohlcv.map(d => d.c);
  const isDark = Theme.current() === 'dark';
  const gridC = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const textC = isDark ? '#686868' : '#888888';
  const base = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridC }, ticks: { color: textC, font: { family: 'IBM Plex Mono', size: 9 } } },
      y: { grid: { color: gridC }, ticks: { color: textC, font: { family: 'IBM Plex Mono', size: 9 } }, position: 'right' },
    },
    animation: { duration: 300 },
  };
  const ctx = canvas.getContext('2d');
  let cfg;
  const acc = isDark ? '#e8ff00' : '#111111';
  if (type === 'price') {
    const trend = closes[closes.length-1] >= closes[0];
    const trendC = trend ? (isDark ? '#22dd88' : '#0d7a50') : (isDark ? '#ff4455' : '#c8202f');
    const g = ctx.createLinearGradient(0, 0, 0, 200);
    g.addColorStop(0, trend ? 'rgba(34,221,136,.1)' : 'rgba(255,68,85,.1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cfg = { type: 'line', data: { labels, datasets: [
      { data: closes, borderColor: trendC, borderWidth: 1.2, pointRadius: 0, fill: true, backgroundColor: g, tension: 0.2 },
      { data: sma20,  borderColor: acc, borderWidth: 0.8, pointRadius: 0, tension: 0.2, borderDash: [] },
      { data: sma50,  borderColor: isDark ? '#686868' : '#aaaaaa', borderWidth: 0.8, pointRadius: 0, tension: 0.2 },
    ]}, options: base };
  } else if (type === 'rsi') {
    cfg = { type: 'line', data: { labels, datasets: [{ data: rsiArr, borderColor: acc, borderWidth: 1.2, pointRadius: 0, fill: false, tension: 0.2 }] },
      options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, min: 0, max: 100, ticks: { color: textC, font: { family: 'IBM Plex Mono', size: 9 }, callback: v => [30,50,70].includes(v) ? v : '' } } } } };
  } else {
    const cols = ohlcv.map(d => d.c >= d.o ? (isDark ? 'rgba(34,221,136,.7)' : 'rgba(13,122,80,.7)') : (isDark ? 'rgba(255,68,85,.7)' : 'rgba(200,32,47,.7)'));
    cfg = { type: 'bar', data: { labels, datasets: [{ data: ohlcv.map(d => d.v), backgroundColor: cols, borderWidth: 0 }] }, options: base };
  }
  _chartInstances[canvasId] = new Chart(ctx, cfg);
}

async function refreshBmCount() {
  const res = await apiGet('/bookmarks');
  const bms = res?.ok ? (res.data || []) : [];
  localStorage.setItem('as_bm_count', bms.length);
  const el = document.getElementById('navBmCount');
  if (el) el.textContent = bms.length || '';
  return bms;
}

async function triggerScan() {
  if (typeof window.runScan === 'function') { window.runScan(); return; }
  window.location.href = '/pages/dashboard.html?scan=1';
}

Theme.init();
