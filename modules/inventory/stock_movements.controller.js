const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');

// ─── Formatter ────────────────────────────────────────────────────────────────

function fmtMovement(m) {
  return {
    id:            m.id,
    date:          m.date,
    time:          m.time          || '',
    productId:     m.product_id,
    productName:   m.product_name,
    sku:           m.sku           || '',
    type:          m.type,
    referenceType: m.reference_type || '',
    referenceId:   m.reference_id  || '',
    referenceNo:   m.reference_no  || '',
    qtyBefore:     parseFloat(m.qty_before) || 0,
    qtyChange:     parseFloat(m.qty_change) || 0,
    qtyAfter:      parseFloat(m.qty_after)  || 0,
    unitCost:      parseFloat(m.unit_cost)  || 0,
    totalValue:    parseFloat(m.total_value) || 0,
    location:      m.location      || '',
    notes:         m.notes         || '',
    createdBy:     m.created_by_name || '',
    createdAt:     m.created_at,
  };
}

// ─── GET /stock-movements ─────────────────────────────────────────────────────

const getStockMovements = asyncHandler(async (req, res) => {
  const { search, type, productId, limit } = req.query;

  let q = db('stock_movements').where({ shop_id: req.shopId });

  if (search) {
    q = q.where((b) =>
      b.whereILike('product_name', `%${search}%`)
        .orWhereILike('sku', `%${search}%`)
        .orWhereILike('reference_no', `%${search}%`)
    );
  }
  if (type && type !== 'all')           q = q.where({ type });
  if (productId && productId !== 'all') q = q.where({ product_id: productId });

  q = q.orderBy('created_at', 'desc');
  if (limit) q = q.limit(parseInt(limit, 10));

  const rows = await q;
  res.json({ success: true, data: rows.map(fmtMovement) });
});

module.exports = { getStockMovements };
