const db = require('../config/db');

/**
 * Base query scoped to a shop, excluding soft-deleted rows.
 */
const baseQuery = (table, shopId) =>
  db(table).where({ shop_id: shopId }).whereNull('deleted_at');

/**
 * Paginated list query.
 *
 * @param {string} table
 * @param {string} shopId
 * @param {{ page, limit, skip }} pagination
 * @param {Function} applyFilters - receives a knex query builder, adds .where/.andWhere etc.
 * @param {string|string[]} orderBy - column name(s), default 'created_at'
 */
const listQuery = async (table, shopId, pagination, applyFilters = null, orderBy = 'created_at') => {
  const { limit, skip } = pagination;

  let base = baseQuery(table, shopId);
  if (applyFilters) base = applyFilters(base);

  const [{ count }] = await base.clone().count('id as count');
  const data = await base.clone().orderBy(orderBy, 'desc').limit(limit).offset(skip);

  return { data, total: parseInt(count, 10) };
};

/**
 * Find a single row by id, scoped to shop, excluding soft-deleted.
 */
const findById = (table, id, shopId) =>
  baseQuery(table, shopId).where({ id }).first();

/**
 * Find a single row by arbitrary conditions, scoped to shop.
 */
const findOne = (table, shopId, conditions) =>
  baseQuery(table, shopId).where(conditions).first();

/**
 * Insert a row and return the created record.
 */
const insertOne = async (table, data) => {
  const [row] = await db(table).insert(data).returning('*');
  return row;
};

/**
 * Update a row by id, scoped to shop. Returns the updated record or null.
 */
const updateById = async (table, id, shopId, data) => {
  const [row] = await baseQuery(table, shopId)
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning('*');
  return row || null;
};

/**
 * Soft-delete a row by id, scoped to shop. Returns true if a row was affected.
 */
const softDelete = async (table, id, shopId) => {
  const count = await baseQuery(table, shopId)
    .where({ id })
    .update({ deleted_at: new Date() });
  return count > 0;
};

/**
 * Check if a value exists in a column, optionally excluding a specific id.
 * Always scoped to shop and excludes soft-deleted rows.
 */
const exists = async (table, shopId, conditions, excludeId = null) => {
  let q = baseQuery(table, shopId).where(conditions);
  if (excludeId) q = q.whereNot({ id: excludeId });
  const row = await q.first();
  return !!row;
};

module.exports = { baseQuery, listQuery, findById, findOne, insertOne, updateById, softDelete, exists };
