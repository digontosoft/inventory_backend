const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtReturnItem = (i) => ({
  id:            i.id,
  productId:     i.product_id,
  productName:   i.product_name,
  qty:           parseFloat(i.qty)            || 0,
  purchasePrice: parseFloat(i.purchase_price) || 0,
  lineTotal:     parseFloat(i.line_total)     || 0,
});

const fmtReturn = (r, items = []) => ({
  id:           r.id,
  returnNo:     r.return_no,
  date:         r.date,
  purchaseId:   r.purchase_id  || '',
  supplierId:   r.supplier_id  || '',
  supplierName: r.supplier_name,
  totalAmount:  parseFloat(r.total_amount) || 0,
  reason:       r.reason,
  status:       r.status,
  items:        items.map(fmtReturnItem),
  createdAt:    r.created_at,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function nextReturnNo(shopId) {
  const [row] = await db('purchase_returns')
    .where({ shop_id: shopId })
    .select(db.raw("MAX(CAST(REGEXP_REPLACE(return_no, '[^0-9]', '', 'g') AS INTEGER)) as max_num"));
  const next = (parseInt(row?.max_num, 10) || 0) + 1;
  return `RET-${String(next).padStart(4, '0')}`;
}

// ─── GET /purchase-returns ────────────────────────────────────────────────────

const getPurchaseReturns = asyncHandler(async (req, res) => {
  const { search, supplierId } = req.query;

  let q = db('purchase_returns').where({ shop_id: req.shopId });
  if (search)     q = q.whereILike('return_no', `%${search}%`);
  if (supplierId && supplierId !== 'all') q = q.where({ supplier_id: supplierId });

  const rows = await q.orderBy('date', 'desc').orderBy('created_at', 'desc');
  res.json({ success: true, data: rows.map((r) => fmtReturn(r)) });
});

// ─── GET /purchase-returns/:id ────────────────────────────────────────────────

const getPurchaseReturn = asyncHandler(async (req, res) => {
  const ret = await db('purchase_returns')
    .where({ id: req.params.id, shop_id: req.shopId })
    .first();

  if (!ret) return res.status(404).json({ success: false, error: 'Return not found' });

  const items = await db('purchase_return_items').where({ return_id: ret.id });
  res.json({ success: true, data: fmtReturn(ret, items) });
});

// ─── POST /purchase-returns ───────────────────────────────────────────────────

const createPurchaseReturn = asyncHandler(async (req, res) => {
  const { purchaseId, supplierId, date, items, totalAmount, reason } = req.body;

  if (!supplierId || !items?.length || !reason?.trim()) {
    return res.status(400).json({ success: false, error: 'supplierId, items and reason are required' });
  }

  const supplier = await db('suppliers').where({ id: supplierId, shop_id: req.shopId }).first();
  if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

  // If linked to a purchase, verify it belongs to this shop
  if (purchaseId) {
    const purchase = await db('purchases').where({ id: purchaseId, shop_id: req.shopId }).first();
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });
  }

  const returnNo = await nextReturnNo(req.shopId);

  const result = await db.transaction(async (trx) => {
    const [ret] = await trx('purchase_returns')
      .insert({
        shop_id:       req.shopId,
        return_no:     returnNo,
        purchase_id:   purchaseId  || null,
        supplier_id:   supplierId,
        supplier_name: supplier.name,
        date:          date || new Date().toISOString().split('T')[0],
        total_amount:  totalAmount || 0,
        reason:        reason.trim(),
        status:        'completed',
        created_by:    req.user.id,
      })
      .returning('*');

    await trx('purchase_return_items').insert(
      items.map((i) => ({
        return_id:      ret.id,
        product_id:     i.productId,
        product_name:   i.productName,
        qty:            i.qty,
        purchase_price: i.purchasePrice,
        line_total:     i.lineTotal,
      }))
    );

    // Decrement product stock
    for (const item of items) {
      await trx('products')
        .where({ id: item.productId, shop_id: req.shopId })
        .decrement('stock', item.qty);
    }

    // Decrease supplier totals (clamp due_balance at 0)
    await trx('suppliers')
      .where({ id: supplierId })
      .update({
        total_purchases: db.raw('GREATEST(total_purchases - ?, 0)', [totalAmount || 0]),
        due_balance:     db.raw('GREATEST(due_balance - ?, 0)',     [totalAmount || 0]),
      });

    const savedItems = await trx('purchase_return_items').where({ return_id: ret.id });
    return { ret, savedItems };
  });

  res.status(201).json({ success: true, data: fmtReturn(result.ret, result.savedItems) });
});

// ─── DELETE /purchase-returns/:id ─────────────────────────────────────────────

const deletePurchaseReturn = asyncHandler(async (req, res) => {
  const ret = await db('purchase_returns')
    .where({ id: req.params.id, shop_id: req.shopId })
    .first();

  if (!ret) return res.status(404).json({ success: false, error: 'Return not found' });

  await db.transaction(async (trx) => {
    const items = await trx('purchase_return_items').where({ return_id: ret.id });

    // Restore stock
    for (const item of items) {
      await trx('products')
        .where({ id: item.product_id, shop_id: req.shopId })
        .increment('stock', item.qty);
    }

    // Restore supplier totals
    await trx('suppliers')
      .where({ id: ret.supplier_id })
      .update({
        total_purchases: db.raw('total_purchases + ?', [ret.total_amount]),
        due_balance:     db.raw('due_balance + ?',     [ret.total_amount]),
      });

    await trx('purchase_return_items').where({ return_id: ret.id }).delete();
    await trx('purchase_returns').where({ id: ret.id }).delete();
  });

  res.json({ success: true, message: 'Return deleted' });
});

module.exports = { getPurchaseReturns, getPurchaseReturn, createPurchaseReturn, deletePurchaseReturn };
