/* Staff only: the complete units.json exactly as stored (used by the Add page so nothing gets lost). */
const L = require('./_lib');
module.exports = (req, res) => {
  if (!L.isStaff(req)) return L.send(res, 401, { error: 'login' });
  return L.send(res, 200, L.data);
};
