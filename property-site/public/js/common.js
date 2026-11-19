/* Shared helpers: data loading + formatting. No dependencies. */
(function (w) {
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }

  function trim1(n) { return String(parseFloat(n.toFixed(2))); }
  /* 6500000 -> "6.5M", 750000 -> "750K" */
  function short(n) {
    if (n >= 1e6) return trim1(n / 1e6) + 'M';
    if (n >= 1e3) return trim1(n / 1e3) + 'K';
    return String(n);
  }
  function full(n) { return Math.round(n).toLocaleString('en-US'); }

  /* "6", "6M", "6.5m", "6000000", "750k" -> EGP number. Bare numbers under 1000 mean millions. */
  function parseBudget(s) {
    if (s == null) return null;
    var m = String(s).trim().toLowerCase().replace(/[, ]/g, '').match(/^(\d+(?:\.\d+)?)(m|mn|million|k)?$/);
    if (!m) return null;
    var n = parseFloat(m[1]), u = m[2];
    if (u === 'k') n *= 1e3; else if (u) n *= 1e6; else if (n < 1000) n *= 1e6;
    return n > 0 ? Math.round(n) : null;
  }

  function isReady(u) { return String(u.delivery).trim().toLowerCase() === 'ready'; }
  function deliveryLabel(u) {
    var d = String(u.delivery || '').trim();
    if (!d) return 'TBC';
    if (isReady(u)) return 'Ready to move';
    var m = d.match(/^(\d{4})-(\d{1,2})$/);
    if (m && +m[2] >= 1 && +m[2] <= 12) return MONTHS[+m[2] - 1] + ' ' + m[1];
    return d; // "2028", "Q3 2027" or free text shown as written
  }

  function plan(u) {
    var total = +u.totalPrice || 0, dp = +u.downPayment || 0;
    var inst = u.installments || {}, years = +inst.years || 0;
    var per = inst.frequency === 'monthly' ? 12 : 4;
    var remaining = Math.max(total - dp, 0);
    var count = years > 0 ? Math.round(years * per) : 0;
    var amount = count && remaining ? (+inst.amount || Math.round(remaining / count)) : 0;
    return {
      total: total, dp: dp, remaining: remaining, years: years, count: count, amount: amount,
      freq: inst.frequency === 'monthly' ? 'monthly' : 'quarterly',
      dpPct: total ? Math.round(dp / total * 1000) / 10 : 0
    };
  }

  function title(u) { return u.type + ' in ' + u.compound; }

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; }
  }
  /* "01012345678" -> "201012345678"; keeps digits only */
  function normWa(n) {
    n = String(n || '').replace(/\D/g, '').replace(/^00/, '');
    if (/^01\d{9}$/.test(n)) n = '2' + n;
    return n;
  }
  function myWa() { return normWa(store('tz_wa')); }
  /* The link you send a client: ONE unit, and WhatsApp goes to the employee who sent it. */
  function clientLink(id) {
    var wa = myWa();
    return location.origin + '/unit.html?id=' + encodeURIComponent(id) + (wa ? '&wa=' + wa : '');
  }
  function sendLink(id) {
    return 'https://wa.me/?text=' + encodeURIComponent('Hi, here are the details of the unit we discussed:\n' + clientLink(id));
  }
  function copy(text, btn, label) {
    var done = function () { if (btn) { var o = label || btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1500); } };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { window.prompt('Copy this link:', text); });
    else window.prompt('Copy this link:', text);
  }

  function api(url, opts) {
    return fetch(url, Object.assign({ cache: 'no-store', credentials: 'same-origin' }, opts || {})).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; });
    });
  }
  /* Staff list. Rejects with {auth:true} when not logged in. */
  function load() {
    return api('/api/units').then(function (r) {
      if (r.status === 401) { var e = new Error('Please log in'); e.auth = true; throw e; }
      if (r.status !== 200) throw new Error('Could not load units');
      return r.body;
    });
  }
  function logout() { return api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"logout":true}' }); }

  /* Renders a login form into `box`; calls onDone() after a successful login. */
  function loginForm(box, onDone) {
    box.innerHTML = '<form class="login" id="login-f"><h1>Staff login</h1><p class="fine" style="margin:0 0 12px">For Tendiz team members only.</p>' +
      '<label for="pw" class="lbl">Password</label><input id="pw" type="password" autocomplete="current-password" required>' +
      '<p class="err" id="login-err" hidden></p><button class="btn primary" type="submit" style="width:100%;margin-top:12px">Log in</button></form>';
    var f = document.getElementById('login-f'), err = document.getElementById('login-err');
    f.onsubmit = function (e) {
      e.preventDefault(); err.hidden = true;
      var b = f.querySelector('button'); b.disabled = true;
      api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: document.getElementById('pw').value }) }).then(function (r) {
        b.disabled = false;
        if (r.status === 200) return onDone();
        err.textContent = r.body.error || 'Could not log in'; err.hidden = false;
      }, function () { b.disabled = false; err.textContent = 'No connection. Try again.'; err.hidden = false; });
    };
    document.getElementById('pw').focus();
  }

  w.Common = { esc: esc, safeUrl: safeUrl, short: short, full: full, parseBudget: parseBudget,
    isReady: isReady, deliveryLabel: deliveryLabel, plan: plan, title: title, load: load, api: api, logout: logout,
    loginForm: loginForm, normWa: normWa, myWa: myWa, store: store, clientLink: clientLink, sendLink: sendLink, copy: copy };
})(window);
