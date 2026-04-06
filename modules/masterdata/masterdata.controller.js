const asyncHandler = require('express-async-handler');
const db           = require('../../config/db');

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtUnit = (u) => ({
  id:           u.id,
  name:         u.name,
  abbreviation: u.abbreviation,
  description:  u.description || '',
  createdAt:    u.created_at,
});

const fmtCategory = (c) => ({
  id:          c.id,
  name:        c.name,
  description: c.description || '',
  createdAt:   c.created_at,
});

const fmtProduct = (p) => ({
  id:                p.id,
  name:              p.name,
  sku:               p.sku,
  barcode:           p.barcode || '',
  categoryId:        p.category_id,
  unitId:            p.unit_id,
  purchasePrice:     parseFloat(p.purchase_price) || 0,
  sellingPrice:      parseFloat(p.selling_price)  || 0,
  vatRate:           parseFloat(p.vat_rate)        || 0,
  stock:             parseFloat(p.stock)           || 0,
  lowStockThreshold: parseFloat(p.low_stock_threshold) || 0,
  description:       p.description || '',
  status:            p.status || 'active',
  createdAt:         p.created_at,
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNITS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /units
const getUnits = asyncHandler(async (req, res) => {
  const rows = await db('units')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .orderBy('name');
  res.json({ success: true, data: rows.map(fmtUnit) });
});

// POST /units
const createUnit = asyncHandler(async (req, res) => {
  const { name, abbreviation, description } = req.body;
  if (!name || !abbreviation) {
    return res.status(400).json({ success: false, error: 'name and abbreviation are required' });
  }

  const [unit] = await db('units')
    .insert({ shop_id: req.shopId, name, abbreviation, description: description || null })
    .returning('*');

  res.status(201).json({ success: true, data: fmtUnit(unit) });
});

// PUT /units/:id
const updateUnit = asyncHandler(async (req, res) => {
  const { name, abbreviation, description } = req.body;
  if (!name || !abbreviation) {
    return res.status(400).json({ success: false, error: 'name and abbreviation are required' });
  }

  const [unit] = await db('units')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({ name, abbreviation, description: description || null, updated_at: db.fn.now() })
    .returning('*');

  if (!unit) return res.status(404).json({ success: false, error: 'Unit not found' });
  res.json({ success: true, data: fmtUnit(unit) });
});

// DELETE /units/:id
const deleteUnit = asyncHandler(async (req, res) => {
  const inUse = await db('products')
    .where({ unit_id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .first();
  if (inUse) {
    return res.status(409).json({ success: false, error: 'Cannot delete: unit is in use by products' });
  }

  const count = await db('units')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() });

  if (!count) return res.status(404).json({ success: false, error: 'Unit not found' });
  res.json({ success: true, message: 'Unit deleted' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /categories
const getCategories = asyncHandler(async (req, res) => {
  const rows = await db('categories')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .orderBy('name');

  // attach product count per category
  const counts = await db('products')
    .where({ shop_id: req.shopId })
    .whereNull('deleted_at')
    .select('category_id')
    .count('id as cnt')
    .groupBy('category_id');

  const countMap = {};
  counts.forEach((r) => { countMap[r.category_id] = parseInt(r.cnt, 10); });

  res.json({
    success: true,
    data: rows.map((c) => ({ ...fmtCategory(c), productCount: countMap[c.id] || 0 })),
  });
});

// POST /categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });

  const [cat] = await db('categories')
    .insert({ shop_id: req.shopId, name, description: description || null })
    .returning('*');

  res.status(201).json({ success: true, data: fmtCategory(cat) });
});

// PUT /categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });

  const [cat] = await db('categories')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({ name, description: description || null, updated_at: db.fn.now() })
    .returning('*');

  if (!cat) return res.status(404).json({ success: false, error: 'Category not found' });
  res.json({ success: true, data: fmtCategory(cat) });
});

// DELETE /categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await db('products')
    .where({ category_id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .first();
  if (inUse) {
    return res.status(409).json({ success: false, error: 'Cannot delete: category has products' });
  }

  const count = await db('categories')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() });

  if (!count) return res.status(404).json({ success: false, error: 'Category not found' });
  res.json({ success: true, message: 'Category deleted' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /products
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, status, lowstock, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let q = db('products as p')
    .where('p.shop_id', req.shopId)
    .whereNull('p.deleted_at');

  if (search)   q = q.where((b) => b.whereILike('p.name', `%${search}%`).orWhereILike('p.sku', `%${search}%`));
  if (category && category !== 'all') q = q.where('p.category_id', category);
  if (status   && status   !== 'all') q = q.where('p.status', status);
  if (lowstock === 'true') q = q.whereRaw('p.stock <= p.low_stock_threshold');

  const [{ total }] = await q.clone().clearSelect().count('p.id as total');
  const rows = await q.select('p.*').orderBy('p.name').limit(parseInt(limit, 10)).offset(offset);

  res.json({
    success: true,
    data:    rows.map(fmtProduct),
    meta:    { total: parseInt(total, 10), page: parseInt(page, 10), limit: parseInt(limit, 10) },
  });
});

// POST /products
const createProduct = asyncHandler(async (req, res) => {
  const {
    name, sku, barcode, categoryId, unitId,
    purchasePrice, sellingPrice, vatRate,
    lowStockThreshold, description, status,
  } = req.body;

  if (!name || !sku || !categoryId || !unitId) {
    return res.status(400).json({ success: false, error: 'name, sku, categoryId and unitId are required' });
  }

  const [product] = await db('products')
    .insert({
      shop_id:             req.shopId,
      name,
      sku,
      barcode:             barcode             || null,
      category_id:         categoryId,
      unit_id:             unitId,
      purchase_price:      purchasePrice        ?? 0,
      selling_price:       sellingPrice         ?? 0,
      vat_rate:            vatRate              ?? 0,
      low_stock_threshold: lowStockThreshold    ?? 0,
      description:         description          || null,
      status:              status               || 'active',
      stock:               0,
    })
    .returning('*');

  res.status(201).json({ success: true, data: fmtProduct(product) });
});

// PUT /products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name, sku, barcode, categoryId, unitId,
    purchasePrice, sellingPrice, vatRate,
    lowStockThreshold, description, status,
  } = req.body;

  if (!name || !sku || !categoryId || !unitId) {
    return res.status(400).json({ success: false, error: 'name, sku, categoryId and unitId are required' });
  }

  const [product] = await db('products')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({
      name,
      sku,
      barcode:             barcode             || null,
      category_id:         categoryId,
      unit_id:             unitId,
      purchase_price:      purchasePrice        ?? 0,
      selling_price:       sellingPrice         ?? 0,
      vat_rate:            vatRate              ?? 0,
      low_stock_threshold: lowStockThreshold    ?? 0,
      description:         description          || null,
      status:              status               || 'active',
      updated_at:          db.fn.now(),
    })
    .returning('*');

  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: fmtProduct(product) });
});

// DELETE /products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const count = await db('products')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() });

  if (!count) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, message: 'Product deleted' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════════════════════════════

const fmtSupplier = (s) => ({
  id:             s.id,
  name:           s.name,
  phone:          s.phone,
  email:          s.email          || '',
  address:        s.address        || '',
  paymentTerms:   s.payment_terms  || 'Cash',
  openingBalance: parseFloat(s.opening_balance)  || 0,
  totalPurchases: parseFloat(s.total_purchases)  || 0,
  dueBalance:     parseFloat(s.due_balance)      || 0,
  status:         s.status         || 'active',
  createdAt:      s.created_at,
});

// GET /suppliers
const getSuppliers = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  let q = db('suppliers').where({ shop_id: req.shopId }).whereNull('deleted_at');
  if (search) q = q.where((b) => b.whereILike('name', `%${search}%`).orWhereILike('phone', `%${search}%`));
  if (status && status !== 'all') q = q.where({ status });
  const rows = await q.orderBy('name');
  res.json({ success: true, data: rows.map(fmtSupplier) });
});

// POST /suppliers
const createSupplier = asyncHandler(async (req, res) => {
  const { name, phone, email, address, paymentTerms, openingBalance, status } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, error: 'name and phone are required' });

  const [s] = await db('suppliers')
    .insert({
      shop_id:         req.shopId,
      name,
      phone,
      email:           email           || null,
      address:         address         || null,
      payment_terms:   paymentTerms    || 'Cash',
      opening_balance: openingBalance  ?? 0,
      total_purchases: 0,
      due_balance:     openingBalance  ?? 0,
      status:          status          || 'active',
    })
    .returning('*');

  res.status(201).json({ success: true, data: fmtSupplier(s) });
});

// PUT /suppliers/:id
const updateSupplier = asyncHandler(async (req, res) => {
  const { name, phone, email, address, paymentTerms, openingBalance, status } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, error: 'name and phone are required' });

  const [s] = await db('suppliers')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({
      name,
      phone,
      email:           email           || null,
      address:         address         || null,
      payment_terms:   paymentTerms    || 'Cash',
      opening_balance: openingBalance  ?? 0,
      status:          status          || 'active',
      updated_at:      db.fn.now(),
    })
    .returning('*');

  if (!s) return res.status(404).json({ success: false, error: 'Supplier not found' });
  res.json({ success: true, data: fmtSupplier(s) });
});

// DELETE /suppliers/:id
const deleteSupplier = asyncHandler(async (req, res) => {
  const count = await db('suppliers')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() });

  if (!count) return res.status(404).json({ success: false, error: 'Supplier not found' });
  res.json({ success: true, message: 'Supplier deleted' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════════════

const fmtCustomer = (c) => ({
  id:             c.id,
  name:           c.name,
  phone:          c.phone,
  type:           c.type           || 'Retail',
  address:        c.address        || '',
  customPrice:    Boolean(c.custom_price),
  creditLimit:    parseFloat(c.credit_limit)     || 0,
  openingBalance: parseFloat(c.opening_balance)  || 0,
  totalSales:     parseFloat(c.total_sales)      || 0,
  dueBalance:     parseFloat(c.due_balance)      || 0,
  status:         c.status         || 'active',
  createdAt:      c.created_at,
});

// GET /customers
const getCustomers = asyncHandler(async (req, res) => {
  const { search, type, status } = req.query;
  let q = db('customers').where({ shop_id: req.shopId }).whereNull('deleted_at');
  if (search) q = q.where((b) => b.whereILike('name', `%${search}%`).orWhereILike('phone', `%${search}%`));
  if (type   && type   !== 'all') q = q.where({ type });
  if (status && status !== 'all') q = q.where({ status });
  const rows = await q.orderBy('name');
  res.json({ success: true, data: rows.map(fmtCustomer) });
});

// POST /customers
const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, type, address, customPrice, creditLimit, openingBalance, status } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, error: 'name and phone are required' });

  const [c] = await db('customers')
    .insert({
      shop_id:         req.shopId,
      name,
      phone,
      type:            type            || 'Retail',
      address:         address         || null,
      custom_price:    customPrice     ?? false,
      credit_limit:    creditLimit     ?? 0,
      opening_balance: openingBalance  ?? 0,
      total_sales:     0,
      due_balance:     openingBalance  ?? 0,
      status:          status          || 'active',
    })
    .returning('*');

  res.status(201).json({ success: true, data: fmtCustomer(c) });
});

// PUT /customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const { name, phone, type, address, customPrice, creditLimit, openingBalance, status } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, error: 'name and phone are required' });

  const [c] = await db('customers')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({
      name,
      phone,
      type:            type            || 'Retail',
      address:         address         || null,
      custom_price:    customPrice     ?? false,
      credit_limit:    creditLimit     ?? 0,
      opening_balance: openingBalance  ?? 0,
      status:          status          || 'active',
      updated_at:      db.fn.now(),
    })
    .returning('*');

  if (!c) return res.status(404).json({ success: false, error: 'Customer not found' });
  res.json({ success: true, data: fmtCustomer(c) });
});

// DELETE /customers/:id
const deleteCustomer = asyncHandler(async (req, res) => {
  const count = await db('customers')
    .where({ id: req.params.id, shop_id: req.shopId })
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() });

  if (!count) return res.status(404).json({ success: false, error: 'Customer not found' });
  res.json({ success: true, message: 'Customer deleted' });
});

module.exports = {
  getUnits, createUnit, updateUnit, deleteUnit,
  getCategories, createCategory, updateCategory, deleteCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
};
