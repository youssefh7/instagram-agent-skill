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
    return '<a class="card" href="unit.html?id=' + encodeURIComponent(u.id) + '">' +
      '<div class="thumb"><span class="badge' + (ready ? '' : ' off') + '">' +
      C.esc(ready ? 'Ready' : 'Off-plan · ' + C.deliveryLabel(u)) + '</span>' + img + '</div>' +
      '<div class="card-body"><div class="comp">' + C.esc(u.compound) + '</div>' +
      '<h2 class="type">' + C.esc(u.type) + '</h2>' +
      '<div class="price">EGP ' + C.short(u.totalPrice) + '</div><div class="pay">' + C.esc(pay) + '</div>' +
      '<div class="tags">' + tags.filter(Boolean).map(function (t) {
        return '<span class="tag">' + C.esc(t) + '</span>'; }).join('') + '</div></div></a>';
  }
  function render() {
    var s = state();
    var list = units.filter(function (u) { return match(u, s); })
      .sort(function (a, b) { return a.totalPrice - b.totalPrice; });
    $('count').textContent = list.length + (list.length === 1 ? ' unit' : ' units') + ' found';
    $('cards').innerHTML = list.length ? list.map(card).join('') :
      '<div class="empty" style="grid-column:1/-1"><b>No units match.</b><br>Try a higher budget or reset the filters.</div>';
    history.replaceState(null, '', location.pathname + query(s));
    $('heading').textContent = s.budget ? 'Units up to EGP ' + C.short(s.budget) : 'Find your unit';
  }
  function share() {
    var url = location.origin + location.pathname + query(state());
    var s = state();
    var text = 'Units' + (s.budget ? ' up to EGP ' + C.short(s.budget) : '') + ': ' + url;
    if (navigator.share) { navigator.share({ title: document.title, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { flash('Link copied'); },
      function () { prompt('Copy this link:', url); });
    else prompt('Copy this link:', url);
  }
  function flash(msg) {
    var b = $('share'), old = b.textContent; b.textContent = msg; setTimeout(function () { b.textContent = old; }, 1600);
  }

  C.load().then(function (d) {
    data = d; units = d.units;
    var st = d.settings || {};
    document.title = (st.siteTitle || 'Unit Finder') + ' - Apartments & Villas in Egypt';
    $('brand').textContent = st.siteTitle || 'Unit Finder';
    var wa = String(st.whatsapp || '').replace(/\D/g, '');
    if (wa) $('top-wa').href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hi, I saw your listings and would like some help finding a unit.');
    else $('top-wa').style.display = 'none';

    var u0 = readUrl();
    budgetOptions(u0.budget);
    var comps = Array.from(new Set(units.map(function (u) { return u.compound; }))).sort();
    $('compound').innerHTML += comps.map(function (c) { return '<option>' + C.esc(c) + '</option>'; }).join('');
    $('budget').value = u0.budget || '';
    $('beds').value = u0.beds; $('compound').value = u0.compound; $('delivery').value = u0.delivery;
    ['budget', 'beds', 'compound', 'delivery'].forEach(function (id) { $(id).addEventListener('change', render); });
    $('reset').onclick = function () { ['budget', 'beds', 'compound', 'delivery'].forEach(function (id) { $(id).value = ''; }); render(); };
    $('share').onclick = share;
    render();
  }).catch(function (e) {
    $('cards').innerHTML = '<div class="empty" style="grid-column:1/-1">Could not load units. ' + C.esc(e.message) + '</div>';
  });
})();
