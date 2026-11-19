(function () {
  var C = Common, app = document.getElementById('app');

  function row(label, val, hl) {
    return '<div class="pay-row' + (hl ? ' hl' : '') + '"><span>' + C.esc(label) + '</span><b>' + val + '</b></div>';
  }
  function egp(n) { return 'EGP ' + C.full(n); }

  function waLink(u, number) {
    var msg = 'Hi, I\'m interested in the ' + u.type.toLowerCase() + ' in ' + u.compound + ' (' + u.area + ' m²' +
      (u.garden ? ' + ' + u.garden + ' m² garden' : '') + ', ' + u.bedrooms + ' bed, EGP ' + C.short(u.totalPrice) +
      '). Ref: ' + u.id + '. Is it still available?\n' + location.href;
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(msg);
  }

  function render(u, st) {
    var p = C.plan(u), ready = C.isReady(u);
    var folder = C.safeUrl(u.photosFolder);
    var number = String(st.whatsapp || '').replace(/\D/g, '');
    var name = C.title(u);
    document.title = name + ' - EGP ' + C.short(u.totalPrice);

    var imgs = (u.images || []).map(function (src, i) {
      return '<img src="' + C.esc(src) + '" alt="' + C.esc(name + ' photo ' + (i + 1)) + '"' +
        (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async">';
    }).join('');
    var gallery = imgs || '<div class="ph"><div>No photos uploaded yet</div>' +
      (folder ? '<a class="btn" href="' + C.esc(folder) + '" target="_blank" rel="noopener">View photos folder</a>' : '') + '</div>';

    var facts = [['Type', u.type], ['Built-up area', u.area + ' m²'],
      ['Garden', u.garden ? u.garden + ' m²' : 'None'], ['Bedrooms', u.bedrooms], ['Bathrooms', u.bathrooms],
      ['Finishing', u.finishing], ['Delivery', C.deliveryLabel(u)]];
    var factsHtml = facts.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + C.esc(f[1]) + '</dd></div>'; }).join('');

    var pay = row('Total price', egp(p.total), true) +
      row('Down payment' + (p.dpPct && p.dpPct < 100 ? ' (' + p.dpPct + '%)' : ''), egp(p.dp));
    if (p.remaining && p.count) {
      pay += row('Remaining', egp(p.remaining)) +
        row('Installment plan', p.years + (p.years === 1 ? ' year' : ' years') + ', ' + p.freq) +
        row(p.count + ' ' + p.freq + ' payments of', egp(p.amount), true);
    } else if (p.remaining) {
      pay += row('Remaining balance', egp(p.remaining));
    } else {
      pay += row('Payment', 'Full payment (cash)');
    }

    var wa = number ? '<a class="btn wa" href="' + C.esc(waLink(u, number)) + '" target="_blank" rel="noopener">Ask about this unit on WhatsApp</a>' : '';
    var photosBtn = folder && imgs ? '<a class="btn" href="' + C.esc(folder) + '" target="_blank" rel="noopener">View all photos</a>' : '';

    app.innerHTML = '<a class="back" href="javascript:history.length>1?history.back():location.href=\'./\'">← All units</a>' +
      '<div class="gallery" aria-label="Photos">' + gallery + '</div>' +
      '<div class="u-head"><div class="comp">' + C.esc(u.compound) + ' · ' + (ready ? 'Ready to move' : 'Off-plan') + '</div>' +
      '<h1>' + C.esc(name) + '</h1><div class="u-price">EGP ' + C.full(u.totalPrice) + '</div></div>' +
      '<div class="u-layout"><div>' +
      '<section class="panel"><h2>Unit details</h2><dl class="facts">' + factsHtml + '</dl></section>' +
      (u.notes ? '<section class="panel"><h2>Notes</h2><p class="notes">' + C.esc(u.notes) + '</p></section>' : '') +
      '</div><div>' +
      '<section class="panel"><h2>Payment breakdown</h2>' + pay +
      '<p class="fine">Estimate based on equal installments. Maintenance deposit, fees and any extra payments are not included. Prices may change - confirm with me.</p></section>' +
      '<div class="actions">' + photosBtn + '</div>' +
      '</div></div>' +
      (wa ? '<div class="sticky">' + wa + '</div>' : '');
  }

  C.load().then(function (d) {
    var st = d.settings || {};
    document.getElementById('foot').textContent = st.agentName || '';
    var id = new URLSearchParams(location.search).get('id');
    var u = d.units.filter(function (x) { return x.id === id; })[0];
    if (!u) {
      app.innerHTML = '<div class="empty"><b>This unit is no longer available.</b><br><br><a class="btn primary" href="./">See available units</a></div>';
      document.title = 'Unit not found';
      return;
    }
    render(u, st);
  }).catch(function (e) { app.innerHTML = '<div class="empty">Could not load unit. ' + C.esc(e.message) + '</div>'; });
})();
