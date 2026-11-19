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

  function render(u, st, staff) {
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

    app.innerHTML = (staff ? '<a class="back" href="./">← All units</a>' : '') +
      '<div class="gallery" aria-label="Photos">' + gallery + '</div>' +
      '<div class="u-head"><div class="comp">' + C.esc(u.compound) + ' · ' + (ready ? 'Ready to move' : 'Off-plan') + '</div>' +
      '<h1>' + C.esc(name) + '</h1><div class="u-price">EGP ' + C.full(u.totalPrice) + '</div></div>' +
      '<div class="u-layout"><div>' +
      '<section class="panel"><h2>Unit details</h2><dl class="facts">' + factsHtml + '</dl></section>' +
      (u.notes ? '<section class="panel"><h2>Notes</h2><p class="notes">' + C.esc(u.notes) + '</p></section>' : '') +
      (staff && u.internalNotes ? '<section class="panel internal"><h2>Internal notes (staff only)</h2><p class="notes">' + C.esc(u.internalNotes) + '</p></section>' : '') +
      '</div><div>' +
      '<section class="panel"><h2>Payment breakdown</h2>' + pay +
      '<p class="fine">Estimate based on equal installments. Maintenance deposit, fees and any extra payments are not included. Prices may change. Confirm with your sales advisor.</p></section>' +
      '<div class="actions">' + photosBtn + '</div>' +
      '</div></div>' +
      (wa ? '<div class="sticky">' + wa + '</div>' : '');
  }

  function staffBar(u) {
    var box = document.createElement('div');
    box.className = 'staffbar';
    box.innerHTML = '<b>Staff view. Clients see everything below except internal notes.</b><div class="row">' +
      '<a class="btn wa" id="sb-send" target="_blank" rel="noopener" href="#">Send to client on WhatsApp</a>' +
      '<button class="btn" id="sb-copy" type="button">Copy client link</button></div>';
    app.insertBefore(box, app.firstChild);
    document.getElementById('sb-send').addEventListener('click', function () { this.href = C.sendLink(u.id); });
    document.getElementById('sb-copy').addEventListener('click', function () { C.copy(C.clientLink(u.id), this, 'Copy client link'); });
  }

  var q = new URLSearchParams(location.search);
  var id = q.get('id') || decodeURIComponent(location.hash.slice(1));
  C.api('/api/unit?id=' + encodeURIComponent(id)).then(function (r) {
    if (r.status !== 200 || !r.body.unit) {
      app.innerHTML = '<div class="empty"><b>This unit is no longer available.</b><br>Message us and we will suggest similar ones.</div>';
      document.title = 'Unit not available';
      return;
    }
    var d = r.body, st = d.settings || {}, staff = !!d.staff;
    // WhatsApp goes to whoever sent the link (?wa=), otherwise the company number
    st.whatsapp = C.normWa(q.get('wa')) || st.whatsapp;
    document.getElementById('foot').textContent = '';
    var brand = document.getElementById('brand');
    if (staff) brand.href = './'; else brand.removeAttribute('href');
    render(d.unit, st, staff);
    if (staff) staffBar(d.unit);
  }).catch(function () { app.innerHTML = '<div class="empty">Could not load this unit. Check your connection and try again.</div>'; });
})();
