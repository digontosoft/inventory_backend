const { listQuery, findById, insertOne, updateById, softDelete } = require('../../utils/query');

const TABLE = 'suppliers';

const entityName = 'Supplier';

const list = (shopId, query, pagination) =>
  listQuery(TABLE, shopId, pagination, (q) => {
    if (query.search) {
      const term = `%${query.search}%`;
      q = q.where((inner) =>
        inner.whereILike('name', term).orWhereILike('phone', term)
      );
    }
    if (query.status) q = q.where({ status: query.status });
    return q;
  });

const findByIdInShop = (id, shopId) => findById(TABLE, id, shopId);

const create = (shopId, body) => {
  const { name, phone, email, address, payment_terms, opening_balance, status } = body;
  return insertOne(TABLE, {
    shop_id: shopId, name, phone: phone || null, email: email || null,
    address: address || null, payment_terms: payment_terms || null,
    opening_balance: opening_balance || 0,
    due_balance: opening_balance || 0,   // opening balance = initial due
    status: status || 'active',
  });
};

const update = (id, shopId, body) => updateById(TABLE, id, shopId, body);

const remove = (id, shopId) => softDelete(TABLE, id, shopId);

module.exports = { entityName, list, findById: findByIdInShop, create, update, remove };
