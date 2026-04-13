const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');

// ─── Formatter ────────────────────────────────────────────────────────────────

function fmtRecord(r) {
  return {
    id:                r.id,
    productId:         r.product_id,
    productName:       r.product_name,
    sku:               r.sku                || '',
    batchNo:           r.batch_no           || '',
    expiryDate:        r.expiry_date,
    manufacturingDate: r.manufacturing_date || '',
    qty:               parseFloat(r.qty)    || 0,
    location:          r.location           || '',
    status:            r.status,
    disposedAt:        r.disposed_at        || '',
    disposedQty:       parseFloat(r.disposed_qty) || 0,
    notes:             r.notes              || '',
    createdAt:         r.created_at,
  };
}

// ─── GET /expiry-records ──────────────────────────────────────────────────────

const getExpiryRecords = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  let q = db('expiry_records').where({ shop_id: req.shopId });
  if (search) q = q.where((b) => b.whereILike('product_name', `%${search}%`).orWhereILike('batch_no', `%${search}%`));
  if (status && status !== 'all') {
    if (status === 'near_expiry') {
      const today   = new Date().toISOString().split('T')[0];
      const in30    = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      q = q.where((b) =>
        b.where('status', 'near_expiry')
          .orWhere((b2) => b2.where('status', 'active').where('expiry_date', '<=', in30).where('expiry_date', '>', today))
      );
    } else if (status === 'expired') {
      const today = new Date().toISOString().split('T')[0];
      q = q.where((b) =>
        b.where('status', 'expired').orWhere((b2) => b2.where('status', 'active').where('expiry_date', '<=', today))
      );
    } else {
      q = q.where({ status });
    }
  }

  const rows = await q.orderBy('expiry_date', 'asc');
  res.json({ success: true, data: rows.map(fmtRecord) });
});

// ─── POST /expiry-records ─────────────────────────────────────────────────────

const createExpiryRecord = asyncHandler(async (req, res) => {
  const { productId, productName, sku, batchNo, expiryDate, manufacturingDate, qty, location, notes } = req.body;

  if (!productId || !expiryDate || !qty) {
    return res.status(400).json({ success: false, error: 'productId, expiryDate and qty are required' });
  }

  const [record] = await db('expiry_records').insert({
    shop_id:             req.shopId,
    product_id:          productId,
    product_name:        productName,
    sku:                 sku                || null,
    batch_no:            batchNo            || null,
    expiry_date:         expiryDate,
    manufacturing_date:  manufacturingDate  || null,
    qty,
    location:            location           || null,
    status:              'active',
    created_by:          req.user.id,
    notes:               notes || null,
  }).returning('*');

  res.status(201).json({ success: true, data: fmtRecord(record) });
});

// ─── POST /expiry-records/:id/dispose ────────────────────────────────────────

const disposeExpiryRecord = asyncHandler(async (req, res) => {
  const record = await db('expiry_records').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
  if (record.status === 'disposed') return res.status(400).json({ success: false, error: 'Already disposed' });

  const today = new Date().toISOString().split('T')[0];
  const [updated] = await db('expiry_records').where({ id: record.id }).update({
    status:      'disposed',
    disposed_at: today,
    disposed_qty: record.qty,
  }).returning('*');

  res.json({ success: true, data: fmtRecord(updated) });
});

// ─── DELETE /expiry-records/:id ───────────────────────────────────────────────

const deleteExpiryRecord = asyncHandler(async (req, res) => {
  const record = await db('expiry_records').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!record) return res.status(404).json({ success: false, error: 'Record not found' });

  await db('expiry_records').where({ id: record.id }).delete();
  res.json({ success: true, message: 'Expiry record deleted' });
});

module.exports = { getExpiryRecords, createExpiryRecord, disposeExpiryRecord, deleteExpiryRecord };
