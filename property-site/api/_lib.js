/* Shared server helpers. units.json lives OUTSIDE public/, so it is never served as a file. */
const crypto = require('crypto');
const data = require('../units.json');

const DAY = 864e5;

function secretKey() {
  const pw = process.env.STAFF_PASSWORD;
  if (!pw) return null; // not configured -> everything staff-only stays locked
  // Key derives from the password: changing STAFF_PASSWORD logs every device out.
  return crypto.createHash('sha256').update('tendiz-staff|' + pw).digest();
}
function sign(exp) { return crypto.createHmac('sha256', secretKey()).update(String(exp)).digest('hex'); }
function safeEq(a, b) {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
function makeToken() { const exp = Date.now() + 30 * DAY; return exp + '.' + sign(exp); }

function isStaff(req) {
  if (!secretKey()) return false;
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)tz_staff=([^;]+)/);
  if (!m) return false;
  const parts = m[1].split('.');
  if (parts.length !== 2 || !(+parts[0] > Date.now())) return false;
  return safeEq(parts[1], sign(parts[0]));
}
function cookie(req, value, maxAge) {
  const local = /^(localhost|127\.)/.test(String(req.headers.host || ''));
  return 'tz_staff=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAge + (local ? '' : '; Secure');
}
function send(res, code, obj, headers) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  Object.keys(headers || {}).forEach((k) => res.setHeader(k, headers[k]));
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 1e5) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
function publicSettings() {
  const s = data.settings || {};
  return { siteTitle: s.siteTitle || 'Tendiz Property', whatsapp: s.whatsapp || '' };
}
const activeUnits = () => (data.units || []).filter((u) => u && u.id && !u.sold);

module.exports = { data, isStaff, makeToken, cookie, send, readBody, safeEq, publicSettings, activeUnits, secretKey };
