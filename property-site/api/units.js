/* Staff only: the full list, including internal notes. */
const L = require('./_lib');
module.exports = (req, res) => {
  if (!L.isStaff(req)) return L.send(res, 401, { error: 'login' });
  return L.send(res, 200, { staff: true, settings: L.publicSettings(), units: L.activeUnits() });
};
