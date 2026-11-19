/* Turns a pasted WhatsApp-style listing message into a unit object. Heuristic: always review the result. */
(function (root) {
  var NUM = '(\\d[\\d,]*(?:\\.\\d+)?)';
  var UNIT = '(million|mil|mn|m(?![a-z0-9²])|k(?![a-z])|thousand|مليون|ألف|الف)?';
  var MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

  function norm(t) {
    return String(t || '').replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })
      .replace(/٫/g, '.').replace(/٬/g, ',').replace(/\r/g, '');
  }
  function money(num, unit) {
    var n = parseFloat(String(num).replace(/,/g, ''));
    unit = (unit || '').toLowerCase();
    if (/^(million|mil|mn|m|مليون)$/.test(unit)) n *= 1e6;
    else if (/^(k|thousand|ألف|الف)$/.test(unit)) n *= 1e3;
    return Math.round(n);
  }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function first(re, t) { var m = t.match(re); return m || null; }

  function findType(t) {
    var l = t.toLowerCase();
    if (/(ground|garden)[\s-]*(floor\s*)?(apartment|apt|flat|unit)|ground floor|أرضي/.test(l)) return 'Ground apartment';
    if (/penthouse|روف|pent\s*house/.test(l)) return 'Penthouse';
    if (/duplex|دوبلكس/.test(l)) return 'Duplex';
    if (/studio|ستوديو/.test(l)) return 'Studio';
    if (/twin\s*house|twinhouse|توين/.test(l)) return 'Twin house';
    if (/town\s*house|townhouse|تاون/.test(l)) return 'Townhouse';
    if (/i[\s-]*villa|ivilla/.test(l)) return 'iVilla';
    if (/stand\s*alone|villa|فيلا/.test(l)) return 'Villa';
    if (/chalet|شاليه/.test(l)) return 'Chalet';
    if (/apartment|apt\b|flat|شقة/.test(l)) return 'Apartment';
    return '';
  }

  function parse(text, knownCompounds) {
    var raw = String(text || '');
    var t = norm(raw), l = t.toLowerCase();
    var u = { id: '', compound: '', type: '', area: 0, garden: 0, bedrooms: 0, bathrooms: 0, finishing: '',
      delivery: '', totalPrice: 0, downPayment: 0, installments: { years: 0, frequency: 'quarterly' },
      photosFolder: '', images: [], notes: '', internalNotes: '' };
    var m;

    // --- compound
    m = first(/(?:compound|project|كمبوند|مشروع)\s*[:\-=]\s*([^\n,|]+)/i, t);
    if (m) u.compound = m[1].trim();
    if (!u.compound) {
      (knownCompounds || []).slice().sort(function (a, b) { return b.length - a.length; }).some(function (c) {
        if (l.indexOf(c.toLowerCase()) >= 0) { u.compound = c; return true; } });
    }
    if (!u.compound) {
      m = first(/(?:\bin|\bat|في)\s+([A-Z][A-Za-z0-9'’]+(?:\s+[A-Z][A-Za-z0-9'’]+){0,3})/, t);
      if (m) u.compound = m[1].trim();
    }

    u.type = findType(t);

    // --- garden then area
    var gardenSpan = null;
    m = first(new RegExp('garden(?:\\s*area)?\\s*[:\\-=+]?\\s*' + NUM + '\\s*(?:m2|m²|sqm|sq\\.?\\s*m|m\\b|متر)?', 'i'), t) ||
        first(new RegExp(NUM + '\\s*(?:m2|m²|sqm|sq\\.?\\s*m|m\\b|متر)?\\s*(?:private\\s*)?garden', 'i'), t);
    if (m) { u.garden = Math.round(parseFloat(m[1].replace(/,/g, ''))); gardenSpan = [m.index, m.index + m[0].length]; }
    m = first(/(?:built[\s-]*up(?:\s*area)?|bua|area|مساحة)\s*[:\-=]\s*(\d+(?:\.\d+)?)/i, t);
    if (m) u.area = Math.round(parseFloat(m[1]));
    if (!u.area) {
      var re = /(\d+(?:\.\d+)?)\s*(?:m2|m²|sqm|sq\.?\s*m|square|م²|متر|m(?![a-z0-9²]))/gi, mm;
      while ((mm = re.exec(t))) {
        var inGarden = gardenSpan && mm.index >= gardenSpan[0] && mm.index < gardenSpan[1];
        var v = parseFloat(mm[1]);
        if (!inGarden && v >= 25 && v <= 3000) { u.area = Math.round(v); break; }
      }
    }

    // --- beds / baths
    m = first(/(\d)\s*[- ]?(?:bed(?:room)?s?\b|br\b|bdr|bd\b|غرف|غرفة)/i, t) || first(/(?:bed(?:room)?s?|غرف|غرفة)\s*[:\-=]?\s*(\d)/i, t);
    if (m) u.bedrooms = +m[1];
    m = first(/(\d)\s*[- ]?(?:bath(?:room)?s?\b|wc\b|toilets?\b|حمام)/i, t) || first(/(?:bath(?:room)?s?|حمام)\s*[:\-=]?\s*(\d)/i, t);
    if (m) u.bathrooms = +m[1];
    if (u.type === 'Studio' && !u.bedrooms) u.bedrooms = 1;

    // --- finishing
    if (/semi[\s-]*finish|نصف تشطيب|نص تشطيب|تشطيب نصف/.test(l)) u.finishing = 'Semi-finished';
    else if (/core\s*(?:&|and)?\s*shell|\bc\s*&\s*s\b|على الطوب|without finish|not finished|unfinished/.test(l)) u.finishing = 'Core & shell';
    else if (/fully[\s-]*finish|full[\s-]*finish|ultra[\s-]*super|super[\s-]*lux|finished|تشطيب كامل|متشطب/.test(l)) u.finishing = 'Fully finished';

    // --- delivery
    if (/ready\s*to\s*move|\bready\b|immediate|\brtm\b|استلام فوري|جاهز/.test(l) && !/off[\s-]*plan/.test(l)) u.delivery = 'ready';
    else {
      m = first(/(?:deliver\w*|handover|تسليم|استلام)[^\n\d]{0,25}?(?:(q[1-4])\s*[- ]?)?(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*[,-]?\s*)?(20\d\d)/i, t);
      if (m) {
        if (m[2]) u.delivery = m[3] + '-' + String(MONTHS.indexOf(m[2].toLowerCase()) + 1).padStart(2, '0');
        else if (m[1]) u.delivery = m[1].toUpperCase() + ' ' + m[3];
        else u.delivery = m[3];
      }
    }

    // --- prices
    var tp = first(new RegExp('(?<!down\\s)(?:total(?:\\s*price)?|price|cash|السعر|اجمالي|إجمالي)(?!\\s*area)\\s*[:\\-=]?\\s*(?:egp|le|£|ج)?\\s*' + NUM + '\\s*' + UNIT, 'i'), t);
    if (tp) u.totalPrice = money(tp[1], tp[2]);
    else {
      var best = 0, r2 = new RegExp(NUM + '\\s*' + UNIT + '(?!\\s*%)', 'gi'), x;
      while ((x = r2.exec(t))) {
        var val = money(x[1], x[2]);
        if (val >= 500000 && val > best) best = val;
      }
      u.totalPrice = best;
    }
    m = first(new RegExp('(?:down\\s*payment|downpayment|\\bd\\.?p\\b|deposit|مقدم)\\s*[:\\-=]?\\s*(?:egp|le|£|ج)?\\s*' + NUM + '\\s*(%|' + UNIT.slice(1, -2) + ')?', 'i'), t) ||
        first(new RegExp(NUM + '\\s*(%)\\s*(?:down|dp\\b|d\\.p)', 'i'), t);
    if (m) {
      var unit = m[2] || '';
      var n = parseFloat(m[1].replace(/,/g, ''));
      if (unit === '%' || (!unit && n <= 100)) u.downPayment = u.totalPrice ? Math.round(u.totalPrice * n / 100) : 0;
      else u.downPayment = money(m[1], unit);
    }

    // --- installments
    var yrs = 0;
    m = first(/(?:install\w*|over|plan|قسط|تقسيط|payment)[^\n.]{0,25}?(\d+(?:\.\d+)?)\s*(years?|yrs?|y\b|months?|سنوات|سنين|سنة|شهر)/i, t) ||
        first(/(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|سنوات|سنين|سنة)\s*(?:install\w*|plan|payment|تقسيط|قسط)/i, t);
    if (m) yrs = /month|شهر/i.test(m[2]) ? +m[1] / 12 : +m[1];
    u.installments.years = Math.round(yrs * 10) / 10;
    if (/monthly|per\s*month|شهري|شهريا/.test(l)) u.installments.frequency = 'monthly';
    else if (/quarter|ربع/.test(l)) u.installments.frequency = 'quarterly';
    m = first(new RegExp('(?:monthly|quarterly|per\\s*(?:month|quarter)|شهري|ربع سنوي)\\s*[:\\-=]?\\s*(?:egp|le)?\\s*' + NUM + '\\s*' + UNIT, 'i'), t);
    if (m && money(m[1], m[2]) >= 1000) u.installments.amount = money(m[1], m[2]);
    if (!u.installments.years) { u.installments = { years: 0 }; if (!u.downPayment && u.totalPrice) u.downPayment = u.totalPrice; }

    // --- links + notes
    m = first(/https?:\/\/[^\s)]+/i, t);
    if (m) u.photosFolder = m[0].replace(/[.,;!]+$/, '');
    m = first(/(?:notes?|ملاحظات)\s*[:\-]\s*([\s\S]+)$/i, t);
    if (m) u.internalNotes = m[1].trim(); // safe default: not shown to clients

    u.id = makeId(u);
    return u;
  }

  /* Ends in a random code so a client who has one unit link cannot guess the others. */
  function rand(n) {
    var c = 'abcdefghjkmnpqrstuvwxyz23456789', s = '';
    for (var i = 0; i < n; i++) s += c.charAt(Math.floor(Math.random() * c.length));
    return s;
  }
  function makeId(u) {
    return slug([u.compound, u.type, u.bedrooms ? u.bedrooms + 'br' : '', u.area || ''].filter(Boolean).join(' ')) + '-' + rand(6);
  }
  function missing(u) {
    var out = [];
    ['compound', 'type', 'area', 'bedrooms', 'bathrooms', 'finishing', 'delivery', 'totalPrice', 'downPayment'].forEach(function (k) {
      if (!u[k]) out.push(k);
    });
    return out;
  }

  var api = { parse: parse, makeId: makeId, missing: missing, slug: slug };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Parse = api;
})(typeof window !== 'undefined' ? window : this);
