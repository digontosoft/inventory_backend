const asyncHandler = require('express-async-handler');
const db = require('../../config/db');

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtCat = (c) => ({
  id:            c.id,
  name:          c.name,
  icon:          c.icon,
  description:   c.description || '',
  budgetMonthly: parseFloat(c.budget_monthly) || 0,
  isActive:      c.is_active,
  createdAt:     c.created_at,
});

const fmtExpense = (e) => ({
  id:            e.id,
  expenseNo:     e.expense_no,
  date:          e.date,
  categoryId:    e.category_id || '',
  categoryName:  e.category_name,
  description:   e.description,
  amount:        parseFloat(e.amount) || 0,
  paymentMethod: e.payment_method,
  referenceNo:   e.reference_no || '',
  status:        e.status,
  notes:         e.notes || '',
  createdBy:     e.created_by || '',
  createdAt:     e.created_at,
});

const fmtTxn = (t) => ({
  id:            t.id,
  transactionNo: t.transaction_no,
  date:          t.date,
  time:          t.time,
  type:          t.type,
  category:      t.category,
  referenceType: t.reference_type,
  referenceId:   t.reference_id || '',
  referenceNo:   t.reference_no || '',
  description:   t.description,
  amount:        parseFloat(t.amount) || 0,
  paymentMethod: t.payment_method,
  balance:       parseFloat(t.balance) || 0,
  createdBy:     t.created_by || '',
  createdAt:     t.created_at,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function nextExpenseCatNo(shopId) {
  const [row] = await db('expenses')
    .where({ shop_id: shopId })
    .select(db.raw("MAX(CAST(REGEXP_REPLACE(expense_no, '[^0-9]', '', 'g') AS INTEGER)) as max_num"));
  const next = (parseInt(row?.max_num, 10) || 0) + 1;
  return `EXP-${String(next).padStart(4, '0')}`;
}

async function nextCashTxnNo(shopId) {
  const [row] = await db('cash_transactions')
    .where({ shop_id: shopId })
    .select(db.raw("MAX(CAST(REGEXP_REPLACE(transaction_no, '[^0-9]', '', 'g') AS INTEGER)) as max_num"));
  const next = (parseInt(row?.max_num, 10) || 0) + 1;
  return `CASH-${String(next).padStart(4, '0')}`;
}

async function getLastBalance(shopId, paymentMethod) {
  const last = await db('cash_transactions')
    .where({ shop_id: shopId, payment_method: paymentMethod })
    .orderBy('date', 'desc')
    .orderBy('created_at', 'desc')
    .first();
  return parseFloat(last?.balance) || 0;
}

// ─── Expense Categories ───────────────────────────────────────────────────────

const getExpenseCategories = asyncHandler(async (req, res) => {
  const rows = await db('expense_categories')
    .where({ shop_id: req.shopId })
    .orderBy('name');
  res.json({ success: true, data: rows.map(fmtCat) });
});

const createExpenseCategory = asyncHandler(async (req, res) => {
  const { name, icon, description, budgetMonthly, isActive } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });

  const [row] = await db('expense_categories').insert({
    shop_id:        req.shopId,
    name,
    icon:           icon || '📋',
    description:    description || null,
    budget_monthly: budgetMonthly || 0,
    is_active:      isActive !== false,
  }).returning('*');

  res.status(201).json({ success: true, data: fmtCat(row) });
});

const updateExpenseCategory = asyncHandler(async (req, res) => {
  const { name, icon, description, budgetMonthly, isActive } = req.body;

  const existing = await db('expense_categories')
    .where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!existing) return res.status(404).json({ success: false, error: 'Category not found' });

  const [row] = await db('expense_categories')
    .where({ id: req.params.id })
    .update({
      name:           name || existing.name,
      icon:           icon !== undefined ? icon : existing.icon,
      description:    description !== undefined ? description : existing.description,
      budget_monthly: budgetMonthly !== undefined ? budgetMonthly : existing.budget_monthly,
      is_active:      isActive !== undefined ? isActive : existing.is_active,
      updated_at:     db.fn.now(),
    }).returning('*');

  res.json({ success: true, data: fmtCat(row) });
});

const deleteExpenseCategory = asyncHandler(async (req, res) => {
  const existing = await db('expense_categories')
    .where({ id: req.params.id, shop_id: req.shopId }).first();
  if (!existing) return res.status(404).json({ success: false, error: 'Category not found' });

  const linked = await db('expenses')
    .where({ category_id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at').count('id as cnt').first();
  if (parseInt(linked?.cnt) > 0) {
    return res.status(400).json({ success: false, error: 'Cannot delete: expenses are linked to this category' });
  }

  await db('expense_categories').where({ id: req.params.id }).delete();
  res.json({ success: true, message: 'Category deleted' });
});

// ─── Expenses ─────────────────────────────────────────────────────────────────

const getExpenses = asyncHandler(async (req, res) => {
  const { search, categoryId, status, dateStart, dateEnd } = req.query;

  let q = db('expenses').where({ shop_id: req.shopId }).whereNull('deleted_at');
  if (search)     q = q.where((b) => b.whereILike('description', `%${search}%`).orWhereILike('expense_no', `%${search}%`));
  if (categoryId && categoryId !== 'all') q = q.where({ category_id: categoryId });
  if (status && status !== 'all')         q = q.where({ status });
  if (dateStart)  q = q.where('date', '>=', dateStart);
  if (dateEnd)    q = q.where('date', '<=', dateEnd);

  const rows = await q.orderBy('date', 'desc').orderBy('created_at', 'desc');
  res.json({ success: true, data: rows.map(fmtExpense) });
});

const createExpense = asyncHandler(async (req, res) => {
  const { date, categoryId, description, amount, paymentMethod, referenceNo, status, notes } = req.body;
  if (!description || !amount) {
    return res.status(400).json({ success: false, error: 'description and amount are required' });
  }

  const expenseNo = await nextExpenseCatNo(req.shopId);

  let categoryName = '';
  if (categoryId) {
    const cat = await db('expense_categories').where({ id: categoryId, shop_id: req.shopId }).first();
    if (cat) categoryName = cat.name;
  }

  const result = await db.transaction(async (trx) => {
    const [expense] = await trx('expenses').insert({
      shop_id:        req.shopId,
      expense_no:     expenseNo,
      date:           date || new Date().toISOString().split('T')[0],
      category_id:    categoryId || null,
      category_name:  categoryName,
      description,
      amount,
      payment_method: paymentMethod || 'cash',
      reference_no:   referenceNo || null,
      status:         status || 'paid',
      notes:          notes || null,
      created_by:     req.user.id,
    }).returning('*');

    if (expense.status === 'paid') {
      const txnNo = await nextCashTxnNo(req.shopId);
      const lastBalance = await getLastBalance(req.shopId, expense.payment_method);
      const newBalance = lastBalance - parseFloat(expense.amount);
      const now = new Date();

      await trx('cash_transactions').insert({
        shop_id:        req.shopId,
        transaction_no: txnNo,
        date:           expense.date,
        time:           now.toTimeString().slice(0, 5),
        type:           'out',
        category:       'expense',
        reference_type: 'expense',
        reference_id:   expense.id,
        reference_no:   expense.expense_no,
        description:    expense.description,
        amount:         expense.amount,
        payment_method: expense.payment_method,
        balance:        newBalance,
        created_by:     req.user.id,
      });
    }

    return expense;
  });

  res.status(201).json({ success: true, data: fmtExpense(result) });
});

const updateExpense = asyncHandler(async (req, res) => {
  const existing = await db('expenses')
    .where({ id: req.params.id, shop_id: req.shopId }).whereNull('deleted_at').first();
  if (!existing) return res.status(404).json({ success: false, error: 'Expense not found' });

  const { date, categoryId, description, amount, paymentMethod, referenceNo, status, notes } = req.body;

  let categoryName = existing.category_name;
  if (categoryId) {
    const cat = await db('expense_categories').where({ id: categoryId, shop_id: req.shopId }).first();
    if (cat) categoryName = cat.name;
  }

  const [updated] = await db('expenses').where({ id: req.params.id }).update({
    date:           date || existing.date,
    category_id:    categoryId !== undefined ? categoryId : existing.category_id,
    category_name:  categoryName,
    description:    description || existing.description,
    amount:         amount || existing.amount,
    payment_method: paymentMethod || existing.payment_method,
    reference_no:   referenceNo !== undefined ? referenceNo : existing.reference_no,
    status:         status || existing.status,
    notes:          notes !== undefined ? notes : existing.notes,
    updated_at:     db.fn.now(),
  }).returning('*');

  res.json({ success: true, data: fmtExpense(updated) });
});

const deleteExpense = asyncHandler(async (req, res) => {
  const existing = await db('expenses')
    .where({ id: req.params.id, shop_id: req.shopId }).whereNull('deleted_at').first();
  if (!existing) return res.status(404).json({ success: false, error: 'Expense not found' });

  await db('expenses').where({ id: req.params.id }).update({ deleted_at: db.fn.now() });
  res.json({ success: true, message: 'Expense deleted' });
});

const markExpensePaid = asyncHandler(async (req, res) => {
  const existing = await db('expenses')
    .where({ id: req.params.id, shop_id: req.shopId }).whereNull('deleted_at').first();
  if (!existing) return res.status(404).json({ success: false, error: 'Expense not found' });
  if (existing.status === 'paid') return res.status(400).json({ success: false, error: 'Already paid' });

  const { paymentMethod } = req.body;
  const method = paymentMethod || existing.payment_method;

  const result = await db.transaction(async (trx) => {
    const [updated] = await trx('expenses').where({ id: req.params.id })
      .update({ status: 'paid', payment_method: method, updated_at: db.fn.now() }).returning('*');

    const txnNo = await nextCashTxnNo(req.shopId);
    const lastBalance = await getLastBalance(req.shopId, method);
    const newBalance = lastBalance - parseFloat(existing.amount);
    const now = new Date();

    await trx('cash_transactions').insert({
      shop_id:        req.shopId,
      transaction_no: txnNo,
      date:           existing.date,
      time:           now.toTimeString().slice(0, 5),
      type:           'out',
      category:       'expense',
      reference_type: 'expense',
      reference_id:   existing.id,
      reference_no:   existing.expense_no,
      description:    existing.description,
      amount:         existing.amount,
      payment_method: method,
      balance:        newBalance,
      created_by:     req.user.id,
    });

    return updated;
  });

  res.json({ success: true, data: fmtExpense(result) });
});

// ─── Cash Transactions ────────────────────────────────────────────────────────

const getCashTransactions = asyncHandler(async (req, res) => {
  const { paymentMethod, type, search } = req.query;

  let q = db('cash_transactions').where({ shop_id: req.shopId });
  if (paymentMethod && paymentMethod !== 'all') q = q.where({ payment_method: paymentMethod });
  if (type && type !== 'all')                   q = q.where({ type });
  if (search) {
    const s = `%${search}%`;
    q = q.where((b) => b.whereILike('description', s).orWhereILike('reference_no', s).orWhereILike('transaction_no', s));
  }

  const rows = await q.orderBy('date', 'desc').orderBy('created_at', 'desc');
  res.json({ success: true, data: rows.map(fmtTxn) });
});

const createCashTransaction = asyncHandler(async (req, res) => {
  const { date, type, category, referenceType, referenceNo, description, amount, paymentMethod } = req.body;
  if (!description || !amount || !type || !category) {
    return res.status(400).json({ success: false, error: 'description, amount, type, and category are required' });
  }

  const txnNo = await nextCashTxnNo(req.shopId);
  const lastBalance = await getLastBalance(req.shopId, paymentMethod || 'cash');
  const amt = parseFloat(amount);
  const newBalance = type === 'in' ? lastBalance + amt : lastBalance - amt;
  const now = new Date();

  const [txn] = await db('cash_transactions').insert({
    shop_id:        req.shopId,
    transaction_no: txnNo,
    date:           date || new Date().toISOString().split('T')[0],
    time:           now.toTimeString().slice(0, 5),
    type,
    category,
    reference_type: referenceType || 'manual',
    reference_no:   referenceNo || null,
    description,
    amount:         amt,
    payment_method: paymentMethod || 'cash',
    balance:        newBalance,
    created_by:     req.user.id,
  }).returning('*');

  res.status(201).json({ success: true, data: fmtTxn(txn) });
});

const getCashBalances = asyncHandler(async (req, res) => {
  const methods = ['cash', 'bkash', 'bank'];
  const balances = {};

  for (const m of methods) {
    balances[m] = await getLastBalance(req.shopId, m);
  }

  res.json({ success: true, data: balances });
});

// ─── Finance Overview ─────────────────────────────────────────────────────────

const getFinanceOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Balances
  const cashBal = await getLastBalance(req.shopId, 'cash');
  const bkashBal = await getLastBalance(req.shopId, 'bkash');
  const bankBal = await getLastBalance(req.shopId, 'bank');

  // Month expenses
  const [expRow] = await db('expenses')
    .where({ shop_id: req.shopId, status: 'paid' })
    .whereNull('deleted_at')
    .whereRaw("TO_CHAR(date, 'YYYY-MM') = ?", [thisMonth])
    .sum('amount as total');
  const monthExpenses = parseFloat(expRow?.total) || 0;

  // Cash flow last 30 days
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().split('T')[0]);
  }
  const txns = await db('cash_transactions')
    .where({ shop_id: req.shopId })
    .where('date', '>=', days[0])
    .orderBy('date');

  const flowMap = {};
  days.forEach((d) => { flowMap[d] = { date: d.slice(5), cashIn: 0, cashOut: 0 }; });
  txns.forEach((t) => {
    const key = t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date).split('T')[0];
    if (flowMap[key]) {
      if (t.type === 'in') flowMap[key].cashIn += parseFloat(t.amount);
      else flowMap[key].cashOut += parseFloat(t.amount);
    }
  });
  const cashFlowData = Object.values(flowMap);

  // Expense breakdown this month
  const expBreakdown = await db('expenses')
    .where({ shop_id: req.shopId, status: 'paid' })
    .whereNull('deleted_at')
    .whereRaw("TO_CHAR(date, 'YYYY-MM') = ?", [thisMonth])
    .groupBy('category_name')
    .select('category_name as name')
    .sum('amount as value')
    .orderBy('value', 'desc');
  const expenseBreakdown = expBreakdown.map((r) => ({ name: r.name, value: parseFloat(r.value) }));

  // Budget alerts
  const cats = await db('expense_categories')
    .where({ shop_id: req.shopId, is_active: true })
    .where('budget_monthly', '>', 0);

  const budgetAlerts = [];
  for (const cat of cats) {
    const [spent] = await db('expenses')
      .where({ shop_id: req.shopId, category_id: cat.id, status: 'paid' })
      .whereNull('deleted_at')
      .whereRaw("TO_CHAR(date, 'YYYY-MM') = ?", [thisMonth])
      .sum('amount as total');
    const s = parseFloat(spent?.total) || 0;
    const pct = (s / parseFloat(cat.budget_monthly)) * 100;
    if (pct >= 80) {
      budgetAlerts.push({ name: cat.name, spent: s, budget: parseFloat(cat.budget_monthly), pct });
    }
  }

  // Recent
  const recentTxns = await db('cash_transactions')
    .where({ shop_id: req.shopId })
    .orderBy('created_at', 'desc')
    .limit(8);
  const recentExpenses = await db('expenses')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .orderBy('created_at', 'desc')
    .limit(8);

  res.json({
    success: true,
    data: {
      balances: { cash: cashBal, bkash: bkashBal, bank: bankBal },
      monthExpenses,
      cashFlowData,
      expenseBreakdown,
      budgetAlerts,
      recentTransactions: recentTxns.map(fmtTxn),
      recentExpenses: recentExpenses.map(fmtExpense),
    },
  });
});

// ─── Supplier Statement ───────────────────────────────────────────────────────

const getSupplierStatement = asyncHandler(async (req, res) => {
  const { supplierId } = req.params;

  const purchases = await db('purchases')
    .where({ shop_id: req.shopId, supplier_id: supplierId })
    .whereNull('deleted_at')
    .whereIn('status', ['received', 'partial'])
    .orderBy('date');

  const payments = await db('supplier_payments')
    .where({ shop_id: req.shopId, supplier_id: supplierId })
    .orderBy('date');

  const returns = await db('purchase_returns')
    .where({ shop_id: req.shopId, supplier_id: supplierId })
    .whereNull('deleted_at')
    .whereIn('status', ['completed', 'approved'])
    .orderBy('date');

  const entries = [];
  purchases.forEach((p) => entries.push({
    date: p.date, type: 'purchase', referenceNo: p.invoice_no,
    description: 'Purchase order', debit: parseFloat(p.grand_total), credit: 0,
  }));
  payments.forEach((p) => entries.push({
    date: p.date, type: 'payment', referenceNo: p.payment_no,
    description: `Payment (${p.payment_method})`, debit: 0, credit: parseFloat(p.amount),
  }));
  returns.forEach((r) => entries.push({
    date: r.date, type: 'return', referenceNo: r.return_no,
    description: 'Purchase return', debit: 0, credit: parseFloat(r.total_amount),
  }));

  entries.sort((a, b) => String(a.date).localeCompare(String(b.date)));

  let balance = 0;
  const ledger = entries.map((e, idx) => {
    balance += e.debit - e.credit;
    return { id: idx, ...e, balance };
  });

  res.json({ success: true, data: ledger });
});

// ─── VAT Report ───────────────────────────────────────────────────────────────

const getVatReport = asyncHandler(async (req, res) => {
  const { month } = req.query; // YYYY-MM
  const prefix = month || new Date().toISOString().slice(0, 7);

  const purchases = await db('purchases')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .whereIn('status', ['received', 'partial'])
    .whereRaw("TO_CHAR(date, 'YYYY-MM') = ?", [prefix])
    .where('total_vat', '>', 0)
    .orderBy('date');

  const inputEntries = purchases.map((p) => ({
    id:            p.id,
    date:          p.date,
    type:          'input',
    referenceType: 'purchase',
    referenceNo:   p.invoice_no,
    taxableAmount: parseFloat(p.subtotal) || 0,
    vatRate:       0,
    vatAmount:     parseFloat(p.total_vat) || 0,
  }));

  res.json({
    success: true,
    data: {
      outputEntries: [],
      inputEntries,
      outputVat: 0,
      inputVat: inputEntries.reduce((s, e) => s + e.vatAmount, 0),
    },
  });
});

module.exports = {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  markExpensePaid,
  getCashTransactions,
  createCashTransaction,
  getCashBalances,
  getFinanceOverview,
  getSupplierStatement,
  getVatReport,
};
