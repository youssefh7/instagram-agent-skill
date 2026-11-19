/* One unit by its (unguessable) id. Anyone with the link can open it; internal notes are staff only. */
const L = require('./_lib');
module.exports = (req, res) => {
  const id = new URL(req.url, 'http://x').searchParams.get('id') || '';
  const unit = L.activeUnits().filter((u) => u.id === id)[0];
  if (!unit) return L.send(res, 404, { error: 'not found' });
  const staff = L.isStaff(req);
  const out = Object.assign({}, unit);
  if (!staff) delete out.internalNotes;
  return L.send(res, 200, { staff, settings: L.publicSettings(), unit: out });
};
