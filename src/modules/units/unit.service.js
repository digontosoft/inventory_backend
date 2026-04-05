const { listQuery, findById, insertOne, updateById, softDelete, exists } = require('../../utils/query');

const TABLE = 'units';

const entityName = 'Unit';

const list = async (shopId, query, pagination) => {
  return listQuery(TABLE, shopId, pagination, (q) => {
    if (query.search) q = q.whereILike('name', `%${query.search}%`);
    return q;
  });
};

const findByIdInShop = (id, shopId) => findById(TABLE, id, shopId);

const create = async (shopId, { name, abbreviation, description }) => {
  const duplicate = await exists(TABLE, shopId, { abbreviation });
  if (duplicate) {
    const err = new Error('Unit abbreviation already exists'); err.statusCode = 409; throw err;
  }
  return insertOne(TABLE, { shop_id: shopId, name, abbreviation, description: description || null });
};

const update = async (id, shopId, body) => {
  const { name, abbreviation, description } = body;
  if (abbreviation) {
    const duplicate = await exists(TABLE, shopId, { abbreviation }, id);
    if (duplicate) {
      const err = new Error('Unit abbreviation already exists'); err.statusCode = 409; throw err;
    }
  }
  return updateById(TABLE, id, shopId, { name, abbreviation, description });
};

const remove = (id, shopId) => softDelete(TABLE, id, shopId);

module.exports = { entityName, list, findById: findByIdInShop, create, update, remove };
