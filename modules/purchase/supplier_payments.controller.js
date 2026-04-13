const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');

// ─── Formatter ────────────────────────────────────────────────────────────────

const fmtPayment = (p) => ({
  id:            p.id,
  paymentNo:     p.payment_no,
  date:          p.date,
  supplierId:    p.supplier_id  || '',
  supplierName:  p.supplier_name,
  amount:        parseFloat(p.amount) || 0,
  paymentMethod: p.payment_method,
  referenceNo:   p.reference_no || '',
  notes:         p.notes        || '',
  createdAt:     p.created_at,
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function nextPaymentNo(shopId) {
  const [row] = await db('supplier_payments')
    .where({ shop_id: shopId })
    .select(db.raw("MAX(CAST(REGEXP_REPLACE(payment_no, '[^0-9]', '', 'g') AS INTEGER)) as max_num"));
  const next = (parseInt(row?.max_num, 10) || 0) + 1;
  return `PAY-${String(next).padStart(4, '0')}`;
}

// ─── GET /supplier-payments ───────────────────────────────────────────────────

const getSupplierPayments = asyncHandler(async (req, res) => {
  const { search, supplierId } = req.query;

  let q = db('supplier_payments').where({ shop_id: req.shopId });
  if (search)     q = q.where((b) => b.whereILike('payment_no', `%${search}%`).orWhereILike('supplier_name', `%${search}%`));
  if (supplierId && supplierId !== 'all') q = q.where({ supplier_id: supplierId });

  const rows = await q.orderBy('date', 'desc').orderBy('created_at', 'desc');
  res.json({ success: true, data: rows.map(fmtPayment) });
});

// ─── POST /supplier-payments ──────────────────────────────────────────────────

const createSupplierPayment = asyncHandler(async (req, res) => {
  const { supplierId, date, amount, paymentMethod, referenceNo, notes } = req.body;

  if (!supplierId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'supplierId and a positive amount are required' });
  }

  const supplier = await db('suppliers').where({ id: supplierId, shop_id: req.shopId }).first();
  if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

  if (amount > parseFloat(supplier.due_balance)) {
    return res.status(400).json({
      success: false,
      error: `Amount cannot exceed supplier due balance (${supplier.due_balance})`,
    });
  }

  const paymentNo = await nextPaymentNo(req.shopId);

  const result = await db.transaction(async (trx) => {
    const [payment] = await trx('supplier_payments')
      .insert({
        shop_id:        req.shopId,
        payment_no:     paymentNo,
        supplier_id:    supplierId,
        supplier_name:  supplier.name,
        date:           date || new Date().toISOString().split('T')[0],
        amount,
        payment_method: paymentMethod || 'cash',
        reference_no:   referenceNo || null,
        notes:          notes       || null,
        created_by:     req.user.id,
      })
      .returning('*');

    // Reduce supplier due balance
    await trx('suppliers')
      .where({ id: supplierId })
      .update({ due_balance: db.raw('GREATEST(due_balance - ?, 0)', [amount]) });

    return payment;
  });

  res.status(201).json({ success: true, data: fmtPayment(result) });
});

// ─── DELETE /supplier-payments/:id ───────────────────────────────────────────

const deleteSupplierPayment = asyncHandler(async (req, res) => {
  const payment = await db('supplier_payments')
    .where({ id: req.params.id, shop_id: req.shopId })
    .first();

  if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

  // Only allow deletion on the same calendar day it was created
  const createdDate = new Date(payment.created_at).toDateString();
  const today       = new Date().toDateString();
  if (createdDate !== today) {
    return res.status(400).json({ success: false, error: 'Payments can only be deleted on the day they were created' });
  }

  await db.transaction(async (trx) => {
    // Restore supplier due balance
    await trx('suppliers')
      .where({ id: payment.supplier_id })
      .update({ due_balance: db.raw('due_balance + ?', [payment.amount]) });

    await trx('supplier_payments').where({ id: payment.id }).delete();
  });

  res.json({ success: true, message: 'Payment deleted' });
});

module.exports = { getSupplierPayments, createSupplierPayment, deleteSupplierPayment };
