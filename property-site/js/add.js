(function () {
  var $ = function (id) { return document.getElementById(id); };
  var existing = null, unit = null;
  var FIELDS = [
    ['compound', 'Compound', 'text'], ['type', 'Type', 'text'],
    ['area', 'Area (m²)', 'number'], ['garden', 'Garden (m², 0 = none)', 'number'],
    ['bedrooms', 'Bedrooms', 'number'], ['bathrooms', 'Bathrooms', 'number'],
    ['finishing', 'Finishing', 'text'], ['delivery', 'Delivery ("ready", "2028" or "2028-06")', 'text'],
    ['totalPrice', 'Total price (EGP)', 'number'], ['downPayment', 'Down payment (EGP)', 'number'],
    ['years', 'Installment years (0 = none)', 'number'], ['frequency', 'Payment frequency', 'select'],
    ['photosFolder', 'Photos folder link', 'text'], ['id', 'Unit ID (used in the link)', 'text'],
    ['notes', 'Notes', 'textarea']
  ];

  fetch('units.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    existing = d;
    $('loadnote').textContent = 'Merged with your current ' + d.units.length + ' units.';
  }).catch(function () {
    $('loadnote').textContent = 'Could not load units.json from the site - the output below contains only this unit. Add it inside the "units" list yourself.';
  });

  function known() { return existing ? existing.units.map(function (u) { return u.compound; }) : []; }

  function buildForm(u, miss) {
    var vals = Object.assign({}, u, { years: u.installments.years, frequency: u.installments.frequency || 'quarterly' });
    $('form').innerHTML = FIELDS.map(function (f) {
      var k = f[0], cls = (miss.indexOf(k) >= 0 ? 'miss ' : '') + 'field' + (/notes|photosFolder|id|delivery/.test(k) ? ' full' : '');
      var v = Common.esc(vals[k] == null ? '' : vals[k]), c;
      if (f[2] === 'select') c = '<select id="f_' + k + '"><option value="quarterly"' + (v === 'quarterly' ? ' selected' : '') + '>Quarterly</option><option value="monthly"' + (v === 'monthly' ? ' selected' : '') + '>Monthly</option></select>';
      else if (f[2] === 'textarea') c = '<textarea id="f_' + k + '" style="min-height:80px">' + v + '</textarea>';
      else c = '<input id="f_' + k + '" type="' + f[2] + '" value="' + v + '"' + (f[2] === 'number' ? ' inputmode="decimal" step="any"' : '') + '>';
      return '<div class="' + cls + '"><label for="f_' + k + '">' + f[1] + '</label>' + c + '</div>';
    }).join('');
    FIELDS.forEach(function (f) { $('f_' + f[0]).addEventListener('input', rebuild); });
  }

  function val(k) { return $('f_' + k).value.trim(); }
  function rebuild() {
    var years = parseFloat(val('years')) || 0;
    var u = {
      id: val('id'), compound: val('compound'), type: val('type'), area: +val('area') || 0, garden: +val('garden') || 0,
      bedrooms: +val('bedrooms') || 0, bathrooms: +val('bathrooms') || 0, finishing: val('finishing'),
      delivery: val('delivery'), totalPrice: +val('totalPrice') || 0, downPayment: +val('downPayment') || 0,
      installments: years ? { years: years, frequency: val('frequency') } : { years: 0 },
      photosFolder: val('photosFolder'), images: unit.images || [], notes: val('notes')
    };
    if (unit.installments.amount && years === unit.installments.years) u.installments.amount = unit.installments.amount;
    unit = u;
    var data = existing ? JSON.parse(JSON.stringify(existing)) : { units: [] };
    var ids = data.units.map(function (x) { return x.id; });
    var out = Object.assign({}, u), base = out.id || 'unit', n = 2;
    while (ids.indexOf(out.id) >= 0) out.id = base + '-' + n++;
    data.units.push(out);
    $('out').value = existing ? JSON.stringify(data, null, 2) + '\n' : JSON.stringify(out, null, 2);
    $('result').hidden = false;
  }

  $('parse').onclick = function () {
    var msg = $('msg').value;
    if (!msg.trim()) return;
    unit = Parse.parse(msg, known());
    var miss = Parse.missing(unit);
    $('review').hidden = false;
    var w = $('warn');
    w.hidden = !miss.length;
    w.textContent = miss.length ? 'Could not find: ' + miss.join(', ') + '. Fill the orange fields.' : '';
    buildForm(unit, miss);
    rebuild();
    $('review').scrollIntoView({ behavior: 'smooth' });
  };
  $('copy').onclick = function () {
    var b = $('copy'), t = $('out').value;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () {
      b.textContent = 'Copied ✓'; setTimeout(function () { b.textContent = 'Copy units.json'; }, 1600);
    }, function () { $('out').select(); document.execCommand('copy'); });
  };
  $('dl').onclick = function () {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([$('out').value], { type: 'application/json' }));
    a.download = 'units.json'; a.click();
  };
})();
