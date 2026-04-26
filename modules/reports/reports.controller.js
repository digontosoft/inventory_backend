const asyncHandler = require('express-async-handler');
const db = require('../../config/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateFilter(q, col, req) {
  const { dateStart, dateEnd } = req.query;
  if (dateStart) q = q.where(col, '>=', dateStart);
  if (dateEnd)   q = q.where(col, '<=', dateEnd);
  return q;
}

// ─── Purchase Reports ─────────────────────────────────────────────────────────

const getPurchaseSummary = asyncHandler(async (req, res) => {
  let q = db('purchases')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .whereNotIn('status', ['draft']);
  q = dateFilter(q, 'date', req);

  const rows = await q.orderBy('date', 'desc')
    .select('id', 'invoice_no', 'date', 'supplier_name', 'subtotal', 'total_discount',
      'total_vat', 'freight_cost', 'grand_total', 'payment_method', 'amount_paid', 'due_amount', 'status');

  res.json({
    success: true,
    data: rows.map((p) => ({
      id:            p.id,
      invoiceNo:     p.invoice_no,
      date:          p.date,
      supplierName:  p.supplier_name,
      subtotal:      parseFloat(p.subtotal)       || 0,
      totalDiscount: parseFloat(p.total_discount) || 0,
      totalVat:      parseFloat(p.total_vat)      || 0,
      freightCost:   parseFloat(p.freight_cost)   || 0,
      grandTotal:    parseFloat(p.grand_total)    || 0,
      paymentMethod: p.payment_method,
      amountPaid:    parseFloat(p.amount_paid)    || 0,
      dueAmount:     parseFloat(p.due_amount)     || 0,
      status:        p.status,
    })),
  });
});

const getPurchaseBySupplier = asyncHandler(async (req, res) => {
  let q = db('purchases')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .whereNotIn('status', ['draft']);
  q = dateFilter(q, 'date', req);

  const purchases = await q.select('supplier_id', 'supplier_name', 'grand_total', 'amount_paid', 'due_amount', 'date');
  const suppliers = await db('suppliers').where({ shop_id: req.shopId }).whereNull('deleted_at').select('id', 'due_balance', 'phone');

  const supMap = {};
  suppliers.forEach((s) => { supMap[s.id] = { dueBalance: parseFloat(s.due_balance) || 0, phone: s.phone || '' }; });

  const map = {};
  purchases.forEach((p) => {
    if (!map[p.supplier_id]) {
      map[p.supplier_id] = {
        supplierId:   p.supplier_id,
        supplier:     p.supplier_name,
        phone:        supMap[p.supplier_id]?.phone || '',
        invoices:     0,
        gross:        0,
        paid:         0,
        due:          supMap[p.supplier_id]?.dueBalance || 0,
        lastPurchase: '',
      };
    }
    map[p.supplier_id].invoices++;
    map[p.supplier_id].gross    += parseFloat(p.grand_total)  || 0;
    map[p.supplier_id].paid     += parseFloat(p.amount_paid)  || 0;
    const d = p.date instanceof Date ? p.date.toISOString().split('T')[0] : String(p.date).split('T')[0];
    if (d > map[p.supplier_id].lastPurchase) map[p.supplier_id].lastPurchase = d;
  });

  const data = Object.values(map).sort((a, b) => b.gross - a.gross);
  res.json({ success: true, data });
});

const getPurchaseByProduct = asyncHandler(async (req, res) => {
  let q = db('purchase_items as pi')
    .join('purchases as p', 'pi.purchase_id', 'p.id')
    .where('p.shop_id', req.shopId)
    .whereNull('p.deleted_at')
    .whereNotIn('p.status', ['draft']);
  if (req.query.dateStart) q = q.where('p.date', '>=', req.query.dateStart);
  if (req.query.dateEnd)   q = q.where('p.date', '<=', req.query.dateEnd);

  const rows = await q
    .select('pi.product_id', 'pi.product_name', 'pi.unit', 'pi.qty', 'pi.line_total', 'p.date',
      'pi.purchase_price')
    .orderBy('p.date', 'desc');

  const map = {};
  rows.forEach((r) => {
    const id = r.product_id;
    if (!map[id]) {
      map[id] = { productId: id, product: r.product_name, unit: r.unit || '', qty: 0, totalCost: 0, lastPurchased: '' };
    }
    map[id].qty       += parseFloat(r.qty)        || 0;
    map[id].totalCost += parseFloat(r.line_total)  || 0;
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
    if (d > map[id].lastPurchased) map[id].lastPurchased = d;
  });

  const data = Object.values(map).map((r) => ({ ...r, avgCost: r.qty ? r.totalCost / r.qty : 0 }))
    .sort((a, b) => b.totalCost - a.totalCost);

  res.json({ success: true, data });
});

const getPurchaseReturns = asyncHandler(async (req, res) => {
  let q = db('purchase_returns')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at');
  q = dateFilter(q, 'date', req);

  const returns = await q.orderBy('date', 'desc')
    .select('id', 'return_no', 'date', 'supplier_name', 'purchase_id', 'total_amount', 'reason', 'status');

  // Fetch purchase invoice nos
  const purchaseIds = [...new Set(returns.map((r) => r.purchase_id).filter(Boolean))];
  let invoiceMap = {};
  if (purchaseIds.length) {
    const purs = await db('purchases').whereIn('id', purchaseIds).select('id', 'invoice_no');
    purs.forEach((p) => { invoiceMap[p.id] = p.invoice_no; });
  }

  // Fetch total purchases in period for return rate
  let pq = db('purchases').where({ shop_id: req.shopId }).whereNull('deleted_at').whereNotIn('status', ['draft']);
  pq = dateFilter(pq, 'date', req);
  const [purRow] = await pq.sum('grand_total as total');
  const totalPurchases = parseFloat(purRow?.total) || 0;

  const data = returns.map((r) => ({
    id:           r.id,
    returnNo:     r.return_no,
    date:         r.date,
    supplierName: r.supplier_name,
    invoiceNo:    invoiceMap[r.purchase_id] || '—',
    totalAmount:  parseFloat(r.total_amount) || 0,
    reason:       r.reason || '',
    status:       r.status,
  }));

  res.json({ success: true, data, meta: { totalPurchases } });
});

// ─── Inventory Reports ────────────────────────────────────────────────────────

const getStockStatus = asyncHandler(async (req, res) => {
  const products = await db('products as p')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .where({ 'p.shop_id': req.shopId })
    .whereNull('p.deleted_at')
    .select('p.id', 'p.name', 'p.sku', 'p.stock', 'p.low_stock_threshold', 'p.purchase_price',
      'p.selling_price', 'p.status', 'c.name as category_name');

  const data = products.map((p) => {
    const stock     = parseFloat(p.stock)           || 0;
    const threshold = parseFloat(p.low_stock_threshold) || 0;
    const purPrice  = parseFloat(p.purchase_price)  || 0;
    const status    = stock === 0 ? 'Out of Stock' : stock <= threshold ? 'Low Stock' : 'Healthy';
    return {
      id:             p.id,
      name:           p.name,
      sku:            p.sku || '',
      category:       p.category_name || '',
      stock,
      lowStockThreshold: threshold,
      purchasePrice:  purPrice,
      sellingPrice:   parseFloat(p.selling_price) || 0,
      stockValue:     stock * purPrice,
      stockStatus:    status,
      productStatus:  p.status,
    };
  });

  res.json({ success: true, data });
});

const getStockValuation = asyncHandler(async (req, res) => {
  const products = await db('products as p')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .where({ 'p.shop_id': req.shopId })
    .whereNull('p.deleted_at')
    .where('p.stock', '>', 0)
    .select('p.id', 'p.name', 'p.sku', 'p.stock', 'p.purchase_price', 'p.selling_price', 'c.name as category_name');

  const data = products.map((p) => {
    const stock    = parseFloat(p.stock)          || 0;
    const purPrice = parseFloat(p.purchase_price) || 0;
    const sellPrice = parseFloat(p.selling_price) || 0;
    const costValue = stock * purPrice;
    const sellValue = stock * sellPrice;
    const margin    = sellValue ? ((sellValue - costValue) / sellValue) * 100 : 0;
    return {
      id: p.id, name: p.name, sku: p.sku || '',
      category: p.category_name || '', stock,
      purchasePrice: purPrice, sellingPrice: sellPrice,
      costValue, sellValue, margin,
    };
  }).sort((a, b) => b.costValue - a.costValue);

  res.json({ success: true, data });
});

const getStockMovements = asyncHandler(async (req, res) => {
  let q = db('stock_movements')
    .where({ shop_id: req.shopId });
  q = dateFilter(q, 'date', req);
  if (req.query.movementType) q = q.where({ movement_type: req.query.movementType });

  const rows = await q.orderBy('date', 'desc').orderBy('created_at', 'desc')
    .limit(500)
    .select('id', 'product_name', 'movement_type', 'quantity', 'date', 'reference_no', 'notes', 'created_at');

  const data = rows.map((r) => ({
    id:            r.id,
    productName:   r.product_name,
    movementType:  r.movement_type,
    quantity:      parseFloat(r.quantity) || 0,
    date:          r.date,
    referenceNo:   r.reference_no || '',
    notes:         r.notes || '',
  }));

  res.json({ success: true, data });
});

const getLowStock = asyncHandler(async (req, res) => {
  const products = await db('products as p')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .where({ 'p.shop_id': req.shopId, 'p.status': 'active' })
    .whereNull('p.deleted_at')
    .whereRaw('p.stock <= p.low_stock_threshold')
    .select('p.id', 'p.name', 'p.sku', 'p.stock', 'p.low_stock_threshold', 'p.purchase_price', 'c.name as category_name');

  const data = products.map((p) => {
    const stock     = parseFloat(p.stock)             || 0;
    const threshold = parseFloat(p.low_stock_threshold) || 0;
    const shortage  = Math.max(0, threshold - stock);
    return {
      id: p.id, name: p.name, sku: p.sku || '',
      category: p.category_name || '', stock, threshold, shortage,
      stockValue: stock * (parseFloat(p.purchase_price) || 0),
      stockStatus: stock === 0 ? 'Out of Stock' : 'Low Stock',
    };
  }).sort((a, b) => a.stock - b.stock);

  res.json({ success: true, data });
});

const getExpiryReport = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const today = new Date().toISOString().split('T')[0];
  const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  let q = db('expiry_records').where({ shop_id: req.shopId });

  if (status === 'near_expiry') {
    q = q.whereNotIn('status', ['disposed']).where('expiry_date', '>=', today).where('expiry_date', '<=', in30);
  } else if (status === 'expired') {
    q = q.whereNotIn('status', ['disposed']).where('expiry_date', '<', today);
  } else if (status === 'disposed') {
    q = q.where({ status: 'disposed' });
  } else {
    q = q.whereNotIn('status', ['disposed']);
  }

  const rows = await q.orderBy('expiry_date', 'asc')
    .select('id', 'product_name', 'sku', 'batch_no', 'expiry_date', 'qty', 'location', 'status', 'notes');

  const todayDate = new Date(today);
  const data = rows.map((r) => {
    const expDate  = new Date(r.expiry_date);
    const daysLeft = Math.ceil((expDate - todayDate) / 86400000);
    return {
      id:          r.id,
      productName: r.product_name,
      sku:         r.sku || '',
      batchNo:     r.batch_no || '',
      expiryDate:  r.expiry_date,
      qty:         parseFloat(r.qty) || 0,
      location:    r.location || '',
      status:      r.status,
      daysLeft,
    };
  });

  res.json({ success: true, data });
});

const getDeadStock = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 60;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const products = await db('products as p')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .where({ 'p.shop_id': req.shopId, 'p.status': 'active' })
    .whereNull('p.deleted_at')
    .where('p.stock', '>', 0)
    .select('p.id', 'p.name', 'p.sku', 'p.stock', 'p.purchase_price', 'p.created_at', 'c.name as category_name');

  // Find last movement date per product
  const productIds = products.map((p) => p.id);
  const movements = productIds.length
    ? await db('stock_movements')
        .where({ shop_id: req.shopId })
        .whereIn('product_id', productIds)
        .groupBy('product_id')
        .select('product_id')
        .max('date as last_date')
    : [];

  const movMap = {};
  movements.forEach((m) => { movMap[m.product_id] = m.last_date; });

  const data = products
    .filter((p) => {
      const lastDate = movMap[p.id];
      if (!lastDate) return true; // never moved = dead
      const ld = lastDate instanceof Date ? lastDate.toISOString().split('T')[0] : String(lastDate).split('T')[0];
      return ld < cutoff;
    })
    .map((p) => {
      const lastDate = movMap[p.id];
      const ld = lastDate ? (lastDate instanceof Date ? lastDate.toISOString().split('T')[0] : String(lastDate).split('T')[0]) : null;
      const age = ld ? Math.ceil((Date.now() - new Date(ld).getTime()) / 86400000) : null;
      const stock = parseFloat(p.stock) || 0;
      return {
        id: p.id, name: p.name, sku: p.sku || '',
        category: p.category_name || '', stock,
        stockValue: stock * (parseFloat(p.purchase_price) || 0),
        lastMovement: ld || 'Never',
        daysSinceMovement: age || null,
        risk: age === null || age > 90 ? 'High' : 'Medium',
      };
    })
    .sort((a, b) => (b.daysSinceMovement ?? 999) - (a.daysSinceMovement ?? 999));

  res.json({ success: true, data });
});

// ─── Finance Reports ──────────────────────────────────────────────────────────

const getCashFlowReport = asyncHandler(async (req, res) => {
  let q = db('cash_transactions').where({ shop_id: req.shopId });
  q = dateFilter(q, 'date', req);
  if (req.query.paymentMethod) q = q.where({ payment_method: req.query.paymentMethod });

  const rows = await q.orderBy('date', 'asc').orderBy('created_at', 'asc')
    .select('id', 'transaction_no', 'date', 'type', 'category', 'description', 'amount', 'payment_method', 'balance', 'reference_no');

  const data = rows.map((r) => ({
    id:            r.id,
    transactionNo: r.transaction_no,
    date:          r.date,
    type:          r.type,
    category:      r.category,
    description:   r.description,
    amount:        parseFloat(r.amount)  || 0,
    paymentMethod: r.payment_method,
    balance:       parseFloat(r.balance) || 0,
    referenceNo:   r.reference_no || '',
  }));

  const totalIn  = data.filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const totalOut = data.filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0);
  const opening  = data.length > 0 ? data[0].balance - (data[0].type === 'in' ? data[0].amount : -data[0].amount) : 0;
  const closing  = data.length > 0 ? data[data.length - 1].balance : 0;

  res.json({ success: true, data, meta: { totalIn, totalOut, opening, closing } });
});

const getExpenseReport = asyncHandler(async (req, res) => {
  let q = db('expenses').where({ shop_id: req.shopId }).whereNull('deleted_at');
  q = dateFilter(q, 'date', req);
  if (req.query.categoryId) q = q.where({ category_id: req.query.categoryId });
  if (req.query.status)     q = q.where({ status: req.query.status });

  const rows = await q.orderBy('date', 'desc')
    .select('id', 'expense_no', 'date', 'category_name', 'description', 'amount', 'payment_method', 'status');

  const categories = await db('expense_categories')
    .where({ shop_id: req.shopId, is_active: true })
    .where('budget_monthly', '>', 0)
    .select('id', 'name', 'budget_monthly');

  const data = rows.map((r) => ({
    id:            r.id,
    expenseNo:     r.expense_no,
    date:          r.date,
    categoryName:  r.category_name || 'Uncategorized',
    description:   r.description,
    amount:        parseFloat(r.amount) || 0,
    paymentMethod: r.payment_method,
    status:        r.status,
  }));

  res.json({ success: true, data, meta: { categories: categories.map((c) => ({ id: c.id, name: c.name, budgetMonthly: parseFloat(c.budget_monthly) || 0 })) } });
});

const getSupplierDues = asyncHandler(async (req, res) => {
  const suppliers = await db('suppliers')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .select('id', 'name', 'phone', 'email', 'due_balance', 'status');

  // Get last purchase date per supplier
  const lastPurchases = await db('purchases')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .groupBy('supplier_id')
    .select('supplier_id')
    .max('date as last_date');

  const lastPurMap = {};
  lastPurchases.forEach((r) => { lastPurMap[r.supplier_id] = r.last_date; });

  const data = suppliers
    .filter((s) => s.status === 'active')
    .map((s) => {
      const due      = parseFloat(s.due_balance) || 0;
      const lastDate = lastPurMap[s.id];
      const ld = lastDate ? (lastDate instanceof Date ? lastDate.toISOString().split('T')[0] : String(lastDate).split('T')[0]) : null;
      const daysSince = ld ? Math.ceil((Date.now() - new Date(ld).getTime()) / 86400000) : null;

      // Approximate aging buckets from last purchase date
      const current = daysSince !== null && daysSince <= 30 ? due : 0;
      const d30     = daysSince !== null && daysSince > 30 && daysSince <= 60 ? due : 0;
      const d60     = daysSince !== null && daysSince > 60 && daysSince <= 90 ? due : 0;
      const d90     = daysSince !== null && daysSince > 90 ? due : (!ld ? due : 0);

      return {
        id: s.id, name: s.name, phone: s.phone || '', email: s.email || '',
        dueBalance: due, lastPurchase: ld || '', daysSince,
        current, d30, d60, d90,
      };
    })
    .sort((a, b) => b.dueBalance - a.dueBalance);

  const totalPayable = data.reduce((s, d) => s + d.dueBalance, 0);
  const overdue      = data.filter((d) => d.d60 + d.d90 > 0).length;
  res.json({ success: true, data, meta: { totalPayable, overdue } });
});

const getCustomerDues = asyncHandler(async (req, res) => {
  const customers = await db('customers')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .select('id', 'name', 'phone', 'email', 'type', 'due_balance', 'credit_limit', 'status');

  const data = customers
    .filter((c) => c.status === 'active')
    .map((c) => {
      const due = parseFloat(c.due_balance) || 0;
      // Without sales, we can't do real aging — use simple buckets
      return {
        id: c.id, name: c.name, phone: c.phone || '', email: c.email || '',
        type: c.type || '',
        dueBalance:  due,
        creditLimit: parseFloat(c.credit_limit) || 0,
        current: due,
        d30: 0, d60: 0, d90: 0,
      };
    })
    .sort((a, b) => b.dueBalance - a.dueBalance);

  const totalReceivable = data.reduce((s, d) => s + d.dueBalance, 0);
  res.json({ success: true, data, meta: { totalReceivable } });
});

module.exports = {
  getPurchaseSummary,
  getPurchaseBySupplier,
  getPurchaseByProduct,
  getPurchaseReturns,
  getStockStatus,
  getStockValuation,
  getStockMovements,
  getLowStock,
  getExpiryReport,
  getDeadStock,
  getCashFlowReport,
  getExpenseReport,
  getSupplierDues,
  getCustomerDues,
};
