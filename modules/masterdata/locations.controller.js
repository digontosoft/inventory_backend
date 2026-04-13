const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');

function fmtLocation(l) {
  return {
    id:        l.id,
    name:      l.name,
    address:   l.address   || '',
    phone:     l.phone     || '',
    isDefault: l.is_default,
    isActive:  l.is_active,
    createdAt: l.created_at,
  };
}

// ─── GET /locations ───────────────────────────────────────────────────────────

const getLocations = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;
  let q = db('locations').where({ shop_id: req.shopId });
  if (!includeInactive) q = q.where({ is_active: true });
  const rows = await q.orderBy([{ column: 'is_default', order: 'desc' }, { column: 'name', order: 'asc' }]);
  res.json({ success: true, data: rows.map(fmtLocation) });
});

// ─── GET /locations/:id ───────────────────────────────────────────────────────

const getLocation = asyncHandler(async (req, res) => {
  const loc = await db('locations').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!loc) return res.status(404).json({ success: false, error: 'Location not found' });
  res.json({ success: true, data: fmtLocation(loc) });
});

// ─── POST /locations ──────────────────────────────────────────────────────────

const createLocation = asyncHandler(async (req, res) => {
  const { name, address, phone, isDefault } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Name is required' });

  const [loc] = await db('locations').insert({
    shop_id:    req.shopId,
    name:       name.trim(),
    address:    address || null,
    phone:      phone   || null,
    is_default: false,  // new locations can't be default unless explicitly set
    is_active:  true,
  }).returning('*');

  res.status(201).json({ success: true, data: fmtLocation(loc) });
});

// ─── PUT /locations/:id ───────────────────────────────────────────────────────

const updateLocation = asyncHandler(async (req, res) => {
  const loc = await db('locations').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!loc) return res.status(404).json({ success: false, error: 'Location not found' });

  const { name, address, phone, isActive } = req.body;

  const [updated] = await db('locations').where({ id: loc.id }).update({
    name:      name      !== undefined ? name.trim()  : loc.name,
    address:   address   !== undefined ? address      : loc.address,
    phone:     phone     !== undefined ? phone        : loc.phone,
    is_active: isActive  !== undefined ? isActive     : loc.is_active,
  }).returning('*');

  res.json({ success: true, data: fmtLocation(updated) });
});

// ─── PUT /locations/:id/set-default ──────────────────────────────────────────

const setDefaultLocation = asyncHandler(async (req, res) => {
  const loc = await db('locations').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!loc) return res.status(404).json({ success: false, error: 'Location not found' });

  await db.transaction(async (trx) => {
    // unset all defaults
    await trx('locations').where({ shop_id: req.shopId }).update({ is_default: false });
    // set new default
    await trx('locations').where({ id: loc.id }).update({ is_default: true, is_active: true });
  });

  const updated = await db('locations').where({ id: loc.id }).first();
  res.json({ success: true, data: fmtLocation(updated) });
});

// ─── DELETE /locations/:id ────────────────────────────────────────────────────

const deleteLocation = asyncHandler(async (req, res) => {
  const loc = await db('locations').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!loc) return res.status(404).json({ success: false, error: 'Location not found' });
  if (loc.is_default) return res.status(400).json({ success: false, error: 'Cannot delete the default location. Set another as default first.' });

  // check if any stock at this location
  const stockRow = await db('product_location_stocks').where({ location_id: loc.id }).sum('qty as total').first();
  if (parseFloat(stockRow?.total) > 0) {
    return res.status(400).json({ success: false, error: 'Cannot delete a location that has stock. Transfer stock first.' });
  }

  await db('locations').where({ id: loc.id }).delete();
  res.json({ success: true, message: 'Location deleted' });
});

// ─── GET /locations/:id/stock ─────────────────────────────────────────────────

const getLocationStock = asyncHandler(async (req, res) => {
  const loc = await db('locations').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!loc) return res.status(404).json({ success: false, error: 'Location not found' });

  const rows = await db('product_location_stocks as pls')
    .join('products as p', 'p.id', 'pls.product_id')
    .where({ 'pls.location_id': loc.id })
    .where('pls.qty', '>', 0)
    .select(
      'pls.product_id',
      'p.name as product_name',
      'p.sku',
      'pls.qty',
      'p.purchase_price',
    )
    .orderBy('p.name');

  res.json({
    success: true,
    data: rows.map((r) => ({
      productId:     r.product_id,
      productName:   r.product_name,
      sku:           r.sku || '',
      qty:           parseInt(r.qty),
      purchasePrice: parseFloat(r.purchase_price) || 0,
      stockValue:    parseInt(r.qty) * (parseFloat(r.purchase_price) || 0),
    })),
  });
});

module.exports = { getLocations, getLocation, createLocation, updateLocation, setDefaultLocation, deleteLocation, getLocationStock };
