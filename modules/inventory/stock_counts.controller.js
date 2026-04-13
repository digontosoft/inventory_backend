const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');
const { getDefaultLocation, setLocationStock } = require('./locationStockHelper');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function nextCountNo(shopId) {
  const [row] = await db('stock_counts')
    .where({ shop_id: shopId })
    .select(db.raw("MAX(CAST(REGEXP_REPLACE(count_no, '[^0-9]', '', 'g') AS INTEGER)) as max_num"));
  const next = (parseInt(row?.max_num, 10) || 0) + 1;
  return `CNT-${String(next).padStart(4, '0')}`;
}

function fmtItem(i) {
  return {
    id:           i.id,
    productId:    i.product_id,
    productName:  i.product_name,
    sku:          i.sku          || '',
    unit:         i.unit         || '',
    category:     i.category     || '',
    systemQty:    parseFloat(i.system_qty)  || 0,
    countedQty:   i.counted_qty !== null ? parseFloat(i.counted_qty) : null,
    difference:   parseFloat(i.difference)  || 0,
    unitCost:     parseFloat(i.unit_cost)   || 0,
    valueVariance: parseFloat(i.value_variance) || 0,
    status:       i.status,
  };
}

function fmtCount(c, items = []) {
  return {
    id:                 c.id,
    countNo:            c.count_no,
    title:              c.title,
    type:               c.type,
    categoryFilter:     c.category_filter || '',
    date:               c.date,
    status:             c.status,
    locationId:         c.location_id || null,
    totalSystemValue:   parseFloat(c.total_system_value)   || 0,
    totalCountedValue:  parseFloat(c.total_counted_value)  || 0,
    totalVarianceValue: parseFloat(c.total_variance_value) || 0,
    totalItemsToCount:  c.total_items_to_count  || 0,
    totalItemsCounted:  c.total_items_counted   || 0,
    notes:              c.notes      || '',
    createdBy:          c.created_by || '',
    createdAt:          c.created_at,
    completedAt:        c.completed_at || '',
    items:              items.map(fmtItem),
  };
}

// ─── GET /stock-counts ────────────────────────────────────────────────────────

const getStockCounts = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  let q = db('stock_counts').where({ shop_id: req.shopId });
  if (search) q = q.where((b) => b.whereILike('count_no', `%${search}%`).orWhereILike('title', `%${search}%`));
  if (status && status !== 'all') q = q.where({ status });

  const rows = await q.orderBy('created_at', 'desc');
  res.json({ success: true, data: rows.map((c) => fmtCount(c)) });
});

// ─── GET /stock-counts/:id ────────────────────────────────────────────────────

const getStockCount = asyncHandler(async (req, res) => {
  const count = await db('stock_counts').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!count) return res.status(404).json({ success: false, error: 'Stock count not found' });

  const items = await db('stock_count_items').where({ count_id: count.id });
  res.json({ success: true, data: fmtCount(count, items) });
});

// ─── POST /stock-counts ───────────────────────────────────────────────────────

const createStockCount = asyncHandler(async (req, res) => {
  const { title, date, type, categoryFilter, notes, items, locationId } = req.body;

  if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
  if (!items || items.length === 0) return res.status(400).json({ success: false, error: 'At least one product required' });

  const countNo = await nextCountNo(req.shopId);
  const totalSystemValue = items.reduce((s, i) => s + (parseFloat(i.systemQty) || 0) * (parseFloat(i.unitCost) || 0), 0);

  const result = await db.transaction(async (trx) => {
    let locId = locationId || null;
    if (!locId) {
      const defaultLoc = await getDefaultLocation(trx, req.shopId);
      locId = defaultLoc.id;
    }

    const [count] = await trx('stock_counts').insert({
      shop_id:              req.shopId,
      count_no:             countNo,
      title,
      type:                 type   || 'full',
      category_filter:      categoryFilter || null,
      date:                 date   || new Date().toISOString().split('T')[0],
      status:               'in_progress',
      location_id:          locId,
      total_system_value:   totalSystemValue,
      total_counted_value:  0,
      total_variance_value: 0,
      total_items_to_count: items.length,
      total_items_counted:  0,
      notes:                notes || null,
      created_by:           req.user.id,
    }).returning('*');

    const itemRows = items.map((i) => ({
      count_id:      count.id,
      product_id:    i.productId,
      product_name:  i.productName,
      sku:           i.sku      || null,
      unit:          i.unit     || null,
      category:      i.category || null,
      system_qty:    i.systemQty || 0,
      counted_qty:   null,
      difference:    0,
      unit_cost:     i.unitCost || 0,
      value_variance: 0,
      status:        'pending',
    }));
    await trx('stock_count_items').insert(itemRows);

    return count;
  });

  const insertedItems = await db('stock_count_items').where({ count_id: result.id });
  res.status(201).json({ success: true, data: fmtCount(result, insertedItems) });
});

// ─── PUT /stock-counts/:id ────────────────────────────────────────────────────
// Used for both save-progress and complete

const updateStockCount = asyncHandler(async (req, res) => {
  const count = await db('stock_counts').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!count) return res.status(404).json({ success: false, error: 'Stock count not found' });
  if (count.status !== 'in_progress') return res.status(400).json({ success: false, error: 'Count is already completed' });

  const { items, complete } = req.body;

  if (!items) return res.status(400).json({ success: false, error: 'Items are required' });

  const counted       = items.filter((i) => i.countedQty !== null && i.countedQty !== undefined).length;
  const totalCounted  = items.filter((i) => i.countedQty !== null).reduce((s, i) => s + (parseFloat(i.countedQty) || 0) * (parseFloat(i.unitCost) || 0), 0);
  const totalVariance = items.reduce((s, i) => s + (parseFloat(i.valueVariance) || 0), 0);

  const user = await db('users').where({ id: req.user.id }).select('name').first();

  await db.transaction(async (trx) => {
    // Update each item
    for (const item of items) {
      const diff     = item.countedQty !== null ? (parseFloat(item.countedQty) - parseFloat(item.systemQty)) : 0;
      const variance = diff * (parseFloat(item.unitCost) || 0);
      await trx('stock_count_items').where({ count_id: count.id, product_id: item.productId }).update({
        counted_qty:    item.countedQty !== undefined ? item.countedQty : null,
        difference:     diff,
        value_variance: variance,
        status:         item.countedQty !== null ? (complete ? 'verified' : 'counted') : 'pending',
      });
    }

    const updates = {
      total_counted_value:  totalCounted,
      total_variance_value: totalVariance,
      total_items_counted:  counted,
    };

    if (complete) {
      const defaultLoc = await getDefaultLocation(trx, req.shopId);
      const locId = count.location_id || defaultLoc.id;

      // Apply stock changes and log movements
      for (const item of items) {
        if (item.countedQty === null) continue;
        const diff = parseFloat(item.countedQty) - parseFloat(item.systemQty);
        if (diff === 0) continue;

        const product = await trx('products').where({ id: item.productId, shop_id: req.shopId }).first();
        if (!product) continue;

        const qtyBefore = parseFloat(product.stock) || 0;

        // Set location-specific stock and sync total
        await setLocationStock(trx, { productId: item.productId, locationId: locId, shopId: req.shopId, qty: parseFloat(item.countedQty) });

        const updatedProd = await trx('products').where({ id: item.productId }).select('stock').first();

        await trx('stock_movements').insert({
          shop_id:         req.shopId,
          date:            new Date().toISOString().split('T')[0],
          time:            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          product_id:      item.productId,
          product_name:    item.productName,
          sku:             item.sku || '',
          type:            'count_adjustment',
          reference_type:  'stock_count',
          reference_id:    count.id,
          reference_no:    count.count_no,
          qty_before:      qtyBefore,
          qty_change:      diff,
          qty_after:       parseFloat(updatedProd?.stock ?? item.countedQty),
          unit_cost:       parseFloat(item.unitCost) || 0,
          total_value:     Math.abs(diff) * (parseFloat(item.unitCost) || 0),
          location_id:     locId,
          notes:           'Stock count adjustment',
          created_by_name: user?.name || '',
        });
      }

      updates.status       = 'approved';
      updates.completed_at = new Date().toISOString();
    }

    await trx('stock_counts').where({ id: count.id }).update(updates);
  });

  const updated = await db('stock_counts').where({ id: count.id }).first();
  const updatedItems = await db('stock_count_items').where({ count_id: count.id });
  res.json({ success: true, data: fmtCount(updated, updatedItems) });
});

// ─── DELETE /stock-counts/:id ─────────────────────────────────────────────────

const deleteStockCount = asyncHandler(async (req, res) => {
  const count = await db('stock_counts').where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!count) return res.status(404).json({ success: false, error: 'Stock count not found' });
  if (count.status === 'approved') return res.status(400).json({ success: false, error: 'Approved counts cannot be deleted' });

  await db('stock_counts').where({ id: count.id }).delete();
  res.json({ success: true, message: 'Stock count deleted' });
});

module.exports = { getStockCounts, getStockCount, createStockCount, updateStockCount, deleteStockCount };
