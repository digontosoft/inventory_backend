const { listQuery, findById, insertOne, updateById, softDelete, exists } = require('../../utils/query');

const TABLE = 'categories';

const entityName = 'Category';

const list = async (shopId, query, pagination) => {
  return listQuery(TABLE, shopId, pagination, (q) => {
    if (query.search) q = q.whereILike('name', `%${query.search}%`);
    return q;
  });
};

const findByIdInShop = (id, shopId) => findById(TABLE, id, shopId);

const create = async (shopId, { name, description }) => {
  const duplicate = await exists(TABLE, shopId, { name });
  if (duplicate) {
    const err = new Error('Category name already exists'); err.statusCode = 409; throw err;
  }
  return insertOne(TABLE, { shop_id: shopId, name, description: description || null });
};

const update = async (id, shopId, body) => {
  const { name, description } = body;
  if (name) {
    const duplicate = await exists(TABLE, shopId, { name }, id);
    if (duplicate) {
      const err = new Error('Category name already exists'); err.statusCode = 409; throw err;
    }
  }
  return updateById(TABLE, id, shopId, { name, description });
};

const remove = (id, shopId) => softDelete(TABLE, id, shopId);

module.exports = { entityName, list, findById: findByIdInShop, create, update, remove };
