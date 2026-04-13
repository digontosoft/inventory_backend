const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');
const { getDefaultLocation, setLocationStock, getLocationStock } = require('./locationStockHelper');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function nextAdjustmentNo(shopId) {
  const [row] = await db('stock_adjustments')
    .where({ shop_id: shopId })
    .select(db.raw("MAX(CAST(REGEXP_REPLACE(adjustment_no, '[^0-9]', '', 'g') AS INTEGER)) as max_num"));
  const next = (parseInt(row?.max_num, 10) || 0) + 1;
  return `ADJ-${String(next).padStart(4, '0')}`;
}

function fmtItem(i) {
  return {
    id:           i.id,
    productId:    i.product_id,
    productName:  i.product_name,
    sku:          i.sku          || '',
    unit:         i.unit         || '',
    currentStock: parseFloat(i.current_stock) || 0,
    adjustedQty:  parseFloat(i.adjusted_qty)  || 0,
    difference:   parseFloat(i.difference)    || 0,
    unitCost:     parseFloat(i.unit_cost)     || 0,
    valueImpact:  parseFloat(i.value_impact)  || 0,
  };
}

function fmtAdj(a, items = []) {
  return {
    id:               a.id,
    adjustmentNo:     a.adjustment_no,
    date:             a.date,
    reason:           a.reason,
    reasonNote:       a.reason_note    || '',
    totalValueImpact: parseFloat(a.total_value_impact) || 0,
    status:           a.status,
    notes:            a.notes          || '',
    locationId:       a.location_id    || null,
    createdBy:        a.created_by,
    approvedBy:       a.approved_by    || null,
    createdAt:        a.created_at,
    items:            items.map(fmtItem),
  };
}

async function applyApproval(trx, adj, items, userId, shopId, locationId) {
  const user = await trx('users').where({ id: userId }).select('name').first();

  // resolve location if not provided
  let locId = locationId || adj.location_id;
  if (!locId) {
    const defaultLoc = await getDefaultLocation(trx, shopId);
    locId = defaultLoc.id;
  }

  for (const item of items) {
    if (parseFloat(item.difference) === 0) continue;

    const product = await trx('products').where({ id: item.product_id, shop_id: shopId }).first();
    if (!product) continue;

    const qtyBefore  = parseFloat(product.stock) || 0;
    const newQty     = parseFloat(item.adjusted_qty);
    const diff       = parseFloat(item.difference);

    // Update per-location stock and sync total
    await setLocationStock(trx, { productId: item.product_id, locationId: locId, shopId, qty: newQty });

    await trx('stock_movements').insert({
      shop_id:         shopId,
      date:            adj.date,
      time:            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      product_id:      item.product_id,
      product_name:    item.product_name,
      sku:             item.sku,
      type:            diff > 0 ? 'adjustment_in' : 'adjustment_out',
      reference_type:  'adjustment',
      reference_id:    adj.id,
      reference_no:    adj.adjustment_no,
      qty_before:      qtyBefore,
      qty_change:      diff,
      qty_after:       newQty,
      unit_cost:       parseFloat(item.unit_cost) || 0,
      total_value:     Math.abs(parseFloat(item.value_impact)) || 0,
      location_id:     locId,
      notes:           adj.reason_note || '',
      created_by_name: user?.name || '',
    });
  }
}

// ─── GET /stock-adjustments ───────────────────────────────────────────────────

const getStockAdjustments = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  let q = db('stock_adjustments').where({ shop_id: req.shopId });
  if (search) q = q.where((b) => b.whereILike('adjustment_no', `%${search}%`));
  if (status && status !== 'all') q = q.where({ status });

  const rows = await q.orderBy('created_at', 'desc');

  // Attach item counts
  const ids = rows.map((r) => r.id);
  const itemCounts = ids.length
    ? await db('stock_adjustment_items').whereIn('adjustment_id', ids).count('id as cnt').groupBy('adjustment_id').select('adjustment_id')
    : [];
  const countMap = Object.fromEntries(itemCounts.map((r) => [r.adjustment_id, parseInt(r.cnt)]));

  res.json({
    success: true,
    data: rows.map((a) => ({ ...fmtAdj(a), itemCount: countMap[a.id] || 0 })),
  });
});

// ─── GET /stock-adjustments/:id ──────────────────────────────────────────────

const getStockAdjustment = asyncHandler(async (req, res) => {
  const adj = await db('stock_adjustments').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!adj) return res.status(404).json({ success: false, error: 'Adjustment not found' });

  const items = await db('stock_adjustment_items').where({ adjustment_id: adj.id });
  res.json({ success: true, data: fmtAdj(adj, items) });
});

// ─── POST /stock-adjustments ──────────────────────────────────────────────────

const createStockAdjustment = asyncHandler(async (req, res) => {
  const { date, reason, reasonNote, notes, items, status, locationId } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one item required' });
  }
  if (!reason) {
    return res.status(400).json({ success: false, error: 'Reason is required' });
  }

  const adjNo   = await nextAdjustmentNo(req.shopId);
  const approve = status === 'approved';
  const totalImpact = items.reduce((s, i) => s + (parseFloat(i.valueImpact) || 0), 0);

  const result = await db.transaction(async (trx) => {
    // resolve location
    let locId = locationId || null;
    if (!locId) {
      const defaultLoc = await getDefaultLocation(trx, req.shopId);
      locId = defaultLoc.id;
    }

    const [adj] = await trx('stock_adjustments').insert({
      shop_id:            req.shopId,
      adjustment_no:      adjNo,
      date:               date || new Date().toISOString().split('T')[0],
      reason,
      reason_note:        reasonNote || null,
      total_value_impact: totalImpact,
      status:             approve ? 'approved' : 'draft',
      notes:              notes || null,
      location_id:        locId,
      created_by:         req.user.id,
      approved_by:        approve ? req.user.id : null,
    }).returning('*');

    const itemRows = items.map((i) => ({
      adjustment_id: adj.id,
      product_id:    i.productId,
      product_name:  i.productName,
      sku:           i.sku          || null,
      unit:          i.unit         || null,
      current_stock: i.currentStock || 0,
      adjusted_qty:  i.adjustedQty  || 0,
      difference:    i.difference   || 0,
      unit_cost:     i.unitCost     || 0,
      value_impact:  i.valueImpact  || 0,
    }));
    await trx('stock_adjustment_items').insert(itemRows);

    if (approve) {
      const inserted = await trx('stock_adjustment_items').where({ adjustment_id: adj.id });
      await applyApproval(trx, adj, inserted, req.user.id, req.shopId, locId);
    }

    return adj;
  });

  const items2 = await db('stock_adjustment_items').where({ adjustment_id: result.id });
  res.status(201).json({ success: true, data: fmtAdj(result, items2) });
});

// ─── POST /stock-adjustments/:id/approve ─────────────────────────────────────

const approveStockAdjustment = asyncHandler(async (req, res) => {
  const adj = await db('stock_adjustments').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!adj) return res.status(404).json({ success: false, error: 'Adjustment not found' });
  if (adj.status !== 'draft') return res.status(400).json({ success: false, error: 'Only draft adjustments can be approved' });

  const items = await db('stock_adjustment_items').where({ adjustment_id: adj.id });

  await db.transaction(async (trx) => {
    await applyApproval(trx, adj, items, req.user.id, req.shopId);
    await trx('stock_adjustments').where({ id: adj.id }).update({ status: 'approved', approved_by: req.user.id });
  });

  const updated = await db('stock_adjustments').where({ id: adj.id }).first();
  res.json({ success: true, data: fmtAdj(updated, items) });
});

// ─── DELETE /stock-adjustments/:id ───────────────────────────────────────────

const deleteStockAdjustment = asyncHandler(async (req, res) => {
  const adj = await db('stock_adjustments').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!adj) return res.status(404).json({ success: false, error: 'Adjustment not found' });
  if (adj.status !== 'draft') return res.status(400).json({ success: false, error: 'Only draft adjustments can be deleted' });

  await db('stock_adjustments').where({ id: adj.id }).delete();
  res.json({ success: true, message: 'Adjustment deleted' });
});

module.exports = { getStockAdjustments, getStockAdjustment, createStockAdjustment, approveStockAdjustment, deleteStockAdjustment };
