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

  function load() {
    return fetch('units.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Could not load units.json');
      return r.json();
    }).then(function (d) {
      d.units = (d.units || []).filter(function (u) { return u && u.id && !u.sold; });
      return d;
    });
  }

  w.Common = { esc: esc, safeUrl: safeUrl, short: short, full: full, parseBudget: parseBudget,
    isReady: isReady, deliveryLabel: deliveryLabel, plan: plan, title: title, load: load };
})(window);
