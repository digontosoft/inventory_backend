const db = require('../../config/db');
const { listQuery, findById, insertOne, updateById, softDelete, exists } = require('../../utils/query');

const TABLE = 'products';

const entityName = 'Product';

/**
 * List products with joined category and unit names.
 */
const list = async (shopId, query, pagination) => {
  const { limit, skip } = pagination;

  let base = db('products as p')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .where('p.shop_id', shopId)
    .whereNull('p.deleted_at')
    .select(
      'p.*',
      'c.name as category_name',
      'u.name as unit_name',
      'u.abbreviation as unit_abbreviation'
    );

  if (query.search) {
    const term = `%${query.search}%`;
    base = base.where((q) =>
      q.whereILike('p.name', term)
       .orWhereILike('p.sku', term)
       .orWhereILike('p.barcode', term)
    );
  }
  if (query.category)  base = base.where('p.category_id', query.category);
  if (query.status)    base = base.where('p.status', query.status);

  // Sort
  const sortCol = ['name', 'sku', 'selling_price', 'stock', 'created_at'].includes(query.sort)
    ? `p.${query.sort}`
    : 'p.created_at';
  const order = query.order === 'asc' ? 'asc' : 'desc';

  const [{ count }] = await base.clone().clearSelect().clearOrder().count('p.id as count');
  const data = await base.clone().orderBy(sortCol, order).limit(limit).offset(skip);

  return { data, total: parseInt(count, 10) };
};

const findByIdInShop = (id, shopId) => findById(TABLE, id, shopId);

const create = async (shopId, body) => {
  const { name, sku, barcode, category_id, unit_id, purchase_price, selling_price,
          vat_rate, stock, low_stock_threshold, image, description, status } = body;

  const duplicate = await exists(TABLE, shopId, { sku });
  if (duplicate) {
    const err = new Error('SKU already exists in this shop'); err.statusCode = 409; throw err;
  }

  return insertOne(TABLE, {
    shop_id: shopId, name, sku, barcode: barcode || null,
    category_id: category_id || null, unit_id: unit_id || null,
    purchase_price: purchase_price || 0, selling_price: selling_price || 0,
    vat_rate: vat_rate || 0, stock: stock || 0,
    low_stock_threshold: low_stock_threshold || 0,
    image: image || null, description: description || null,
    status: status || 'active',
  });
};

const update = async (id, shopId, body) => {
  if (body.sku) {
    const duplicate = await exists(TABLE, shopId, { sku: body.sku }, id);
    if (duplicate) {
      const err = new Error('SKU already exists in this shop'); err.statusCode = 409; throw err;
    }
  }
  return updateById(TABLE, id, shopId, body);
};

const remove = (id, shopId) => softDelete(TABLE, id, shopId);

module.exports = { entityName, list, findById: findByIdInShop, create, update, remove };
