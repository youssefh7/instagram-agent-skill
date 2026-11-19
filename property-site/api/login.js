const crypto = require('crypto');
const L = require('./_lib');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

module.exports = async (req, res) => {
  if (req.method === 'GET') return L.send(res, 200, { staff: L.isStaff(req) });
  if (req.method !== 'POST') return L.send(res, 405, { error: 'Method not allowed' });
  const body = await L.readBody(req);
  if (body.logout) return L.send(res, 200, { ok: true }, { 'Set-Cookie': L.cookie(req, '', 0) });
  if (!process.env.STAFF_PASSWORD) return L.send(res, 500, { error: 'STAFF_PASSWORD is not set on the server.' });
  if (L.safeEq(sha(body.password || ''), sha(process.env.STAFF_PASSWORD))) {
    return L.send(res, 200, { ok: true }, { 'Set-Cookie': L.cookie(req, L.makeToken(), 30 * 86400) });
  }
  await new Promise((r) => setTimeout(r, 800)); // slow down guessing
  return L.send(res, 401, { error: 'Wrong password' });
};
