const asyncHandler = require('express-async-handler');
const db = require('../../config/db');

async function getLastBalance(shopId, paymentMethod) {
  const last = await db('cash_transactions')
    .where({ shop_id: shopId, payment_method: paymentMethod })
    .orderBy('date', 'desc')
    .orderBy('created_at', 'desc')
    .first();
  return parseFloat(last?.balance) || 0;
}

const getDashboardOverview = asyncHandler(async (req, res) => {
  const shopId = req.shopId;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // ── Cash balances ─────────────────────────────────────────────────────────
  const [cashBal, bkashBal, bankBal] = await Promise.all([
    getLastBalance(shopId, 'cash'),
    getLastBalance(shopId, 'bkash'),
    getLastBalance(shopId, 'bank'),
  ]);

  // ── Counts ────────────────────────────────────────────────────────────────
  const [productRow, supplierRow, customerRow] = await Promise.all([
    db('products').where({ shop_id: shopId }).whereNull('deleted_at').count('id as cnt').first(),
    db('suppliers').where({ shop_id: shopId }).whereNull('deleted_at').count('id as cnt').first(),
    db('customers').where({ shop_id: shopId }).whereNull('deleted_at').count('id as cnt').first(),
  ]);

  // ── Inventory value + low stock ───────────────────────────────────────────
  const products = await db('products')
    .where({ shop_id: shopId })
    .whereNull('deleted_at')
    .select('id', 'name', 'sku', 'stock', 'low_stock_threshold', 'purchase_price', 'category_id');

  const inventoryValue = products.reduce(
    (s, p) => s + (parseFloat(p.stock) || 0) * (parseFloat(p.purchase_price) || 0),
    0,
  );

  const lowStockProducts = products
    .filter((p) => (parseFloat(p.stock) || 0) <= (parseFloat(p.low_stock_threshold) || 0))
    .slice(0, 10)
    .map((p) => ({
      id:             p.id,
      name:           p.name,
      sku:            p.sku || '',
      stock:          parseFloat(p.stock) || 0,
      lowStockThreshold: parseFloat(p.low_stock_threshold) || 0,
    }));

  // ── Supplier & customer dues ───────────────────────────────────────────────
  const [suppDueRow, custDueRow] = await Promise.all([
    db('suppliers').where({ shop_id: shopId }).whereNull('deleted_at').sum('due_balance as total').first(),
    db('customers').where({ shop_id: shopId }).whereNull('deleted_at').sum('due_balance as total').first(),
  ]);
  const supplierDues  = parseFloat(suppDueRow?.total) || 0;
  const customerDues  = parseFloat(custDueRow?.total) || 0;

  // ── This month purchases ───────────────────────────────────────────────────
  const [monthPurRow] = await db('purchases')
    .where({ shop_id: shopId })
    .whereNull('deleted_at')
    .whereNotIn('status', ['draft'])
    .whereRaw("TO_CHAR(date, 'YYYY-MM') = ?", [thisMonth])
    .sum('grand_total as total');
  const monthPurchases = parseFloat(monthPurRow?.total) || 0;

  // ── This month expenses ───────────────────────────────────────────────────
  const [monthExpRow] = await db('expenses')
    .where({ shop_id: shopId, status: 'paid' })
    .whereNull('deleted_at')
    .whereRaw("TO_CHAR(date, 'YYYY-MM') = ?", [thisMonth])
    .sum('amount as total');
  const monthExpenses = parseFloat(monthExpRow?.total) || 0;

  // ── Pending supplier due (partial purchases) ──────────────────────────────
  const [pendingDueRow] = await db('purchases')
    .where({ shop_id: shopId })
    .whereNull('deleted_at')
    .whereIn('status', ['partial', 'received'])
    .where('due_amount', '>', 0)
    .sum('due_amount as total');
  const pendingPurchasesDue = parseFloat(pendingDueRow?.total) || 0;

  // ── Purchase trend last 30 days ───────────────────────────────────────────
  const days30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days30.push(d.toISOString().split('T')[0]);
  }

  const purchasesInRange = await db('purchases')
    .where({ shop_id: shopId })
    .whereNull('deleted_at')
    .whereNotIn('status', ['draft'])
    .where('date', '>=', days30[0])
    .select('date', 'grand_total');

  const expensesInRange = await db('expenses')
    .where({ shop_id: shopId, status: 'paid' })
    .whereNull('deleted_at')
    .where('date', '>=', days30[0])
    .select('date', 'amount');

  const trendMap = {};
  days30.forEach((d) => {
    trendMap[d] = { date: d.slice(5), purchases: 0, expenses: 0 };
  });
  purchasesInRange.forEach((p) => {
    const key = p.date instanceof Date ? p.date.toISOString().split('T')[0] : String(p.date).split('T')[0];
    if (trendMap[key]) trendMap[key].purchases += parseFloat(p.grand_total) || 0;
  });
  expensesInRange.forEach((e) => {
    const key = e.date instanceof Date ? e.date.toISOString().split('T')[0] : String(e.date).split('T')[0];
    if (trendMap[key]) trendMap[key].expenses += parseFloat(e.amount) || 0;
  });
  const spendingTrend = Object.values(trendMap);

  // ── Stock by category ─────────────────────────────────────────────────────
  const categories = await db('categories').where({ shop_id: shopId }).whereNull('deleted_at').select('id', 'name');
  const stockByCategory = categories
    .map((c) => ({
      name: c.name,
      value: products
        .filter((p) => p.category_id === c.id)
        .reduce((s, p) => s + (parseFloat(p.stock) || 0), 0),
    }))
    .filter((c) => c.value > 0);

  // ── Expense breakdown this month by category ──────────────────────────────
  const expBreakdown = await db('expenses')
    .where({ shop_id: shopId, status: 'paid' })
    .whereNull('deleted_at')
    .whereRaw("TO_CHAR(date, 'YYYY-MM') = ?", [thisMonth])
    .groupBy('category_name')
    .select('category_name as name')
    .sum('amount as value')
    .orderBy('value', 'desc');
  const expenseBreakdown = expBreakdown.map((r) => ({ name: r.name || 'Uncategorized', value: parseFloat(r.value) || 0 }));

  // ── Top purchased products this month ─────────────────────────────────────
  const topProducts = await db('purchase_items as pi')
    .join('purchases as p', 'pi.purchase_id', 'p.id')
    .where('p.shop_id', shopId)
    .whereNull('p.deleted_at')
    .whereNotIn('p.status', ['draft'])
    .whereRaw("TO_CHAR(p.date, 'YYYY-MM') = ?", [thisMonth])
    .groupBy('pi.product_name')
    .select('pi.product_name as name')
    .sum('pi.qty as qty')
    .sum('pi.line_total as total')
    .orderBy('qty', 'desc')
    .limit(5);

  // ── Expiring soon (within 30 days) ────────────────────────────────────────
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const expiringProducts = await db('expiry_records')
    .where({ shop_id: shopId })
    .whereNotIn('status', ['disposed'])
    .where('expiry_date', '<=', in30)
    .where('expiry_date', '>=', today)
    .orderBy('expiry_date', 'asc')
    .limit(10)
    .select('product_name', 'batch_no', 'expiry_date', 'qty', 'status');

  // ── Recent purchases (last 6) ─────────────────────────────────────────────
  const recentPurchases = await db('purchases')
    .where({ shop_id: shopId })
    .whereNull('deleted_at')
    .orderBy('created_at', 'desc')
    .limit(6)
    .select('invoice_no', 'supplier_name', 'grand_total', 'date', 'status', 'due_amount');

  // ── Recent expenses (last 6) ──────────────────────────────────────────────
  const recentExpenses = await db('expenses')
    .where({ shop_id: shopId })
    .whereNull('deleted_at')
    .orderBy('created_at', 'desc')
    .limit(6)
    .select('expense_no', 'description', 'amount', 'date', 'category_name', 'status');

  res.json({
    success: true,
    data: {
      summary: {
        totalProducts:     parseInt(productRow?.cnt)  || 0,
        totalSuppliers:    parseInt(supplierRow?.cnt)  || 0,
        totalCustomers:    parseInt(customerRow?.cnt)  || 0,
        inventoryValue,
        lowStockCount:     lowStockProducts.length,
        supplierDues,
        customerDues,
        cashBalances: {
          cash:  cashBal,
          bkash: bkashBal,
          bank:  bankBal,
          total: cashBal + bkashBal + bankBal,
        },
        monthPurchases,
        monthExpenses,
        pendingPurchasesDue,
      },
      spendingTrend,
      stockByCategory,
      expenseBreakdown,
      topProducts: topProducts.map((t) => ({
        name:  t.name,
        qty:   parseFloat(t.qty)   || 0,
        total: parseFloat(t.total) || 0,
      })),
      lowStockProducts,
      expiringProducts: expiringProducts.map((e) => ({
        productName: e.product_name,
        batchNo:     e.batch_no     || '',
        expiryDate:  e.expiry_date,
        qty:         parseFloat(e.qty) || 0,
        status:      e.status,
      })),
      recentPurchases: recentPurchases.map((p) => ({
        invoiceNo:    p.invoice_no,
        supplierName: p.supplier_name,
        grandTotal:   parseFloat(p.grand_total)  || 0,
        dueAmount:    parseFloat(p.due_amount)    || 0,
        date:         p.date,
        status:       p.status,
      })),
      recentExpenses: recentExpenses.map((e) => ({
        expenseNo:    e.expense_no,
        description:  e.description,
        amount:       parseFloat(e.amount) || 0,
        date:         e.date,
        categoryName: e.category_name,
        status:       e.status,
      })),
    },
  });
});

module.exports = { getDashboardOverview };
