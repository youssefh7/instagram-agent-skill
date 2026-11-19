(function () {
  var C = Common, $ = function (id) { return document.getElementById(id); };
  var STEPS = [3, 4, 5, 6, 7, 8, 10, 12, 15, 20];
  var data, units;

  function readUrl() {
    var p = new URLSearchParams(location.search);
    return { budget: C.parseBudget(p.get('budget')), beds: p.get('beds') || '', compound: p.get('compound') || '',
      delivery: p.get('delivery') || '' };
  }
  function budgetOptions(extra) {
    var vals = STEPS.map(function (m) { return m * 1e6; });
    if (extra && vals.indexOf(extra) < 0) { vals.push(extra); vals.sort(function (a, b) { return a - b; }); }
    $('budget').innerHTML = '<option value="">Any budget</option>' + vals.map(function (v) {
      return '<option value="' + v + '">Up to ' + C.short(v) + '</option>'; }).join('');
  }
  function state() {
    return { budget: +$('budget').value || null, beds: $('beds').value, compound: $('compound').value,
      delivery: $('delivery').value };
  }
  function query(s) {
    var p = new URLSearchParams();
    if (s.budget) p.set('budget', C.short(s.budget));
    if (s.beds) p.set('beds', s.beds);
    if (s.compound) p.set('compound', s.compound);
    if (s.delivery) p.set('delivery', s.delivery);
    var q = p.toString();
    return q ? '?' + q : '';
  }
  function match(u, s) {
    if (s.budget && u.totalPrice > s.budget) return false;
    if (s.beds && (s.beds === '4' ? u.bedrooms < 4 : u.bedrooms !== +s.beds)) return false;
    if (s.compound && u.compound !== s.compound) return false;
    if (s.delivery === 'ready' && !C.isReady(u)) return false;
    if (s.delivery === 'offplan' && C.isReady(u)) return false;
    return true;
  }
  function card(u) {
    var p = C.plan(u), ready = C.isReady(u);
    var img = u.images && u.images[0]
      ? '<img src="' + C.esc(u.images[0]) + '" alt="" loading="lazy" decoding="async">'
      : C.esc(u.compound.charAt(0));
    var pay = p.years ? 'DP ' + C.short(p.dp) + ' · ' + p.years + ' yr' + (p.years === 1 ? '' : 's')
      : 'Cash / full payment';
    var tags = [u.bedrooms + ' bed', u.bathrooms + ' bath', u.area + ' m²'];
    if (u.garden) tags.push(u.garden + ' m² garden');
    tags.push(u.finishing);
    return '<div class="card"><a class="card-link" href="unit.html?id=' + encodeURIComponent(u.id) + '">' +
      '<div class="thumb"><span class="badge' + (ready ? '' : ' off') + '">' +
      C.esc(ready ? 'Ready' : 'Off-plan · ' + C.deliveryLabel(u)) + '</span>' + img + '</div>' +
      '<div class="card-body"><div class="comp">' + C.esc(u.compound) + '</div>' +
      '<h2 class="type">' + C.esc(u.type) + '</h2>' +
      '<div class="price">EGP ' + C.short(u.totalPrice) + '</div><div class="pay">' + C.esc(pay) + '</div>' +
      '<div class="tags">' + tags.filter(Boolean).map(function (t) {
        return '<span class="tag">' + C.esc(t) + '</span>'; }).join('') + '</div></div></a>' +
      '<div class="card-actions"><a class="btn small wa" target="_blank" rel="noopener" data-send="' + C.esc(u.id) + '" href="#">Send to client</a>' +
      '<button class="btn small" type="button" data-copy="' + C.esc(u.id) + '">Copy link</button></div></div>';
  }
  function render() {
    var s = state();
    var list = units.filter(function (u) { return match(u, s); })
      .sort(function (a, b) { return a.totalPrice - b.totalPrice; });
    $('count').textContent = list.length + (list.length === 1 ? ' unit' : ' units') + ' found';
    $('cards').innerHTML = list.length ? list.map(card).join('') :
      '<div class="empty" style="grid-column:1/-1"><b>No units match.</b><br>Try a higher budget or reset the filters.</div>';
    try { history.replaceState(null, '', location.pathname + query(s)); } catch (e) {}
    $('heading').textContent = s.budget ? 'Units up to EGP ' + C.short(s.budget) : 'Find your unit';
  }
  function bind() {
    var cards = $('cards');
    cards.addEventListener('click', function (e) {
      var c = e.target.closest('[data-copy]');
      if (c) C.copy(C.clientLink(c.getAttribute('data-copy')), c, 'Copy link');
    });
    // build the WhatsApp href at click time so a freshly typed number is used
    cards.addEventListener('click', function (e) {
      var s = e.target.closest('[data-send]');
      if (s) s.href = C.sendLink(s.getAttribute('data-send'));
    });
  }

  function start(d) {
    units = d.units;
    $('gate').hidden = true; $('staff').hidden = false; $('logout').hidden = false;
    var u0 = readUrl();
    budgetOptions(u0.budget);
    var comps = Array.from(new Set(units.map(function (u) { return u.compound; }))).sort();
    $('compound').innerHTML = '<option value="">All compounds</option>' + comps.map(function (c) { return '<option>' + C.esc(c) + '</option>'; }).join('');
    $('budget').value = u0.budget || '';
    $('beds').value = u0.beds; $('compound').value = u0.compound; $('delivery').value = u0.delivery;
    if (!start.bound) {
      start.bound = true;
      ['budget', 'beds', 'compound', 'delivery'].forEach(function (id) { $(id).addEventListener('change', render); });
      $('reset').onclick = function () { ['budget', 'beds', 'compound', 'delivery'].forEach(function (id) { $(id).value = ''; }); render(); };
      $('mywa').value = C.store('tz_wa');
      $('mywa').addEventListener('input', function () { C.store('tz_wa', this.value); });
      $('logout').onclick = function () { C.logout().then(function () { location.reload(); }); };
      bind();
    }
    render();
  }

  function boot() {
    C.load().then(start).catch(function (e) {
      if (e.auth) { $('staff').hidden = true; $('gate').hidden = false; C.loginForm($('gate'), boot); return; }
      $('gate').hidden = false;
      $('gate').innerHTML = '<div class="empty">Could not load units. ' + C.esc(e.message) + '</div>';
    });
  }
  boot();
})();
