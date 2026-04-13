const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');
const { getDefaultLocation, incrementLocationStock } = require('../inventory/locationStockHelper');

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtItem = (i) => ({
  id:            i.id,
  productId:     i.product_id,
  productName:   i.product_name,
  unit:          i.unit,
  qty:           parseFloat(i.qty)            || 0,
  purchasePrice: parseFloat(i.purchase_price) || 0,
  discount:      parseFloat(i.discount)       || 0,
  vatRate:       parseFloat(i.vat_rate)       || 0,
  vatAmount:     parseFloat(i.vat_amount)     || 0,
  lineTotal:     parseFloat(i.line_total)     || 0,
});

const fmtPurchase = (p, items = []) => ({
  id:            p.id,
  invoiceNo:     p.invoice_no,
  date:          p.date,
  supplierId:    p.supplier_id,
  supplierName:  p.supplier_name,
  subtotal:      parseFloat(p.subtotal)        || 0,
  totalDiscount: parseFloat(p.total_discount)  || 0,
  totalVat:      parseFloat(p.total_vat)       || 0,
  freightCost:   parseFloat(p.freight_cost)    || 0,
  grandTotal:    parseFloat(p.grand_total)     || 0,
  paymentMethod: p.payment_method,
  amountPaid:    parseFloat(p.amount_paid)     || 0,
  dueAmount:     parseFloat(p.due_amount)      || 0,
  status:        p.status,
  notes:         p.notes || '',
  items:         items.map(fmtItem),
  createdAt:     p.created_at,
  updatedAt:     p.updated_at,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function nextInvoiceNo(shopId) {
  const [row] = await db('purchases')
    .where({ shop_id: shopId })
    .select(db.raw("MAX(CAST(REGEXP_REPLACE(invoice_no, '[^0-9]', '', 'g') AS INTEGER)) as max_num"));
  const next = (parseInt(row?.max_num, 10) || 0) + 1;
  return `PUR-${String(next).padStart(4, '0')}`;
}

function itemsPayload(purchaseId, items) {
  return items.map((i) => ({
    purchase_id:    purchaseId,
    product_id:     i.productId,
    product_name:   i.productName,
    unit:           i.unit           || '',
    qty:            i.qty,
    purchase_price: i.purchasePrice,
    discount:       i.discount        || 0,
    vat_rate:       i.vatRate         || 0,
    vat_amount:     i.vatAmount       || 0,
    line_total:     i.lineTotal       || 0,
  }));
}

// ─── GET /purchases ───────────────────────────────────────────────────────────

const getPurchases = asyncHandler(async (req, res) => {
  const { search, status, supplierId } = req.query;

  let q = db('purchases').where({ shop_id: req.shopId }).whereNull('deleted_at');
  if (search)     q = q.where((b) => b.whereILike('invoice_no', `%${search}%`).orWhereILike('supplier_name', `%${search}%`));
  if (status && status !== 'all')     q = q.where({ status });
  if (supplierId && supplierId !== 'all') q = q.where({ supplier_id: supplierId });

  const rows = await q.orderBy('date', 'desc').orderBy('created_at', 'desc');
  res.json({ success: true, data: rows.map((p) => fmtPurchase(p)) });
});

// ─── GET /purchases/:id ───────────────────────────────────────────────────────

const getPurchase = asyncHandler(async (req, res) => {
  const purchase = await db('purchases')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .first();

  if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });

  const items = await db('purchase_items').where({ purchase_id: purchase.id });
  res.json({ success: true, data: fmtPurchase(purchase, items) });
});

// ─── POST /purchases ──────────────────────────────────────────────────────────

const createPurchase = asyncHandler(async (req, res) => {
  const {
    date, supplierId, items,
    subtotal, totalDiscount, totalVat, freightCost, grandTotal,
    paymentMethod, amountPaid, dueAmount, status, notes,
  } = req.body;

  if (!supplierId || !items?.length) {
    return res.status(400).json({ success: false, error: 'supplierId and items are required' });
  }

  const supplier = await db('suppliers').where({ id: supplierId, shop_id: req.shopId }).first();
  if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

  const invoiceNo = await nextInvoiceNo(req.shopId);

  const result = await db.transaction(async (trx) => {
    const [purchase] = await trx('purchases')
      .insert({
        shop_id:        req.shopId,
        invoice_no:     invoiceNo,
        date:           date || new Date().toISOString().split('T')[0],
        supplier_id:    supplierId,
        supplier_name:  supplier.name,
        subtotal:       subtotal       || 0,
        total_discount: totalDiscount  || 0,
        total_vat:      totalVat       || 0,
        freight_cost:   freightCost    || 0,
        grand_total:    grandTotal     || 0,
        payment_method: paymentMethod  || 'cash',
        amount_paid:    amountPaid     || 0,
        due_amount:     dueAmount      || 0,
        status:         status         || 'draft',
        notes:          notes          || null,
        created_by:     req.user.id,
      })
      .returning('*');

    await trx('purchase_items').insert(itemsPayload(purchase.id, items));

    // Update stock and supplier balance when confirmed
    if (status === 'received' || status === 'partial') {
      const defaultLoc = await getDefaultLocation(trx, req.shopId);
      for (const item of items) {
        await incrementLocationStock(trx, {
          productId:  item.productId,
          locationId: defaultLoc.id,
          shopId:     req.shopId,
          delta:      item.qty,
        });
      }
      await trx('suppliers')
        .where({ id: supplierId })
        .increment('total_purchases', grandTotal || 0)
        .increment('due_balance', dueAmount || 0);
    }

    const savedItems = await trx('purchase_items').where({ purchase_id: purchase.id });
    return { purchase, savedItems };
  });

  res.status(201).json({ success: true, data: fmtPurchase(result.purchase, result.savedItems) });
});

// ─── PUT /purchases/:id ───────────────────────────────────────────────────────

const updatePurchase = asyncHandler(async (req, res) => {
  const existing = await db('purchases')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .first();

  if (!existing) return res.status(404).json({ success: false, error: 'Purchase not found' });
  if (existing.status !== 'draft') {
    return res.status(400).json({ success: false, error: 'Only draft purchases can be edited' });
  }

  const {
    date, supplierId, items,
    subtotal, totalDiscount, totalVat, freightCost, grandTotal,
    paymentMethod, amountPaid, dueAmount, status, notes,
  } = req.body;

  const supplier = await db('suppliers').where({ id: supplierId, shop_id: req.shopId }).first();
  if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

  const result = await db.transaction(async (trx) => {
    const [purchase] = await trx('purchases')
      .where({ id: req.params.id })
      .update({
        date,
        supplier_id:    supplierId,
        supplier_name:  supplier.name,
        subtotal:       subtotal       || 0,
        total_discount: totalDiscount  || 0,
        total_vat:      totalVat       || 0,
        freight_cost:   freightCost    || 0,
        grand_total:    grandTotal     || 0,
        payment_method: paymentMethod  || 'cash',
        amount_paid:    amountPaid     || 0,
        due_amount:     dueAmount      || 0,
        status:         status         || 'draft',
        notes:          notes          || null,
        updated_at:     db.fn.now(),
      })
      .returning('*');

    // Replace all items
    await trx('purchase_items').where({ purchase_id: purchase.id }).delete();
    await trx('purchase_items').insert(itemsPayload(purchase.id, items));

    // Update stock and supplier balance when confirming
    if (status === 'received' || status === 'partial') {
      const defaultLoc = await getDefaultLocation(trx, req.shopId);
      for (const item of items) {
        await incrementLocationStock(trx, {
          productId:  item.productId,
          locationId: defaultLoc.id,
          shopId:     req.shopId,
          delta:      item.qty,
        });
      }
      await trx('suppliers')
        .where({ id: supplierId })
        .increment('total_purchases', grandTotal || 0)
        .increment('due_balance', dueAmount || 0);
    }

    const savedItems = await trx('purchase_items').where({ purchase_id: purchase.id });
    return { purchase, savedItems };
  });

  res.json({ success: true, data: fmtPurchase(result.purchase, result.savedItems) });
});

// ─── DELETE /purchases/:id ────────────────────────────────────────────────────

const deletePurchase = asyncHandler(async (req, res) => {
  const existing = await db('purchases')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .first();

  if (!existing) return res.status(404).json({ success: false, error: 'Purchase not found' });
  if (existing.status !== 'draft') {
    return res.status(400).json({ success: false, error: 'Only draft purchases can be deleted' });
  }

  await db('purchases').where({ id: req.params.id }).update({ deleted_at: db.fn.now() });
  res.json({ success: true, message: 'Purchase deleted' });
});

module.exports = { getPurchases, getPurchase, createPurchase, updatePurchase, deletePurchase };
