const { success, paginated, error } = require('./response');
const { getPagination, buildMeta } = require('./pagination');

/**
 * Factory that generates standard CRUD controller methods from a service.
 *
 * Each service must implement:
 *   list(shopId, query, pagination) → { data, total }
 *   findById(id, shopId)            → row | null
 *   create(shopId, body)            → row
 *   update(id, shopId, body)        → row | null
 *   remove(id, shopId)              → boolean
 *
 * Optionally the service can set:
 *   service.entityName  e.g. 'Product' → used in messages
 */
const createCrudController = (service) => {
  const name = service.entityName || 'Record';

  return {
    list: async (req, res, next) => {
      try {
        const pagination = getPagination(req.query);
        const { data, total } = await service.list(req.shopId, req.query, pagination);
        return paginated(res, data, buildMeta(pagination.page, pagination.limit, total));
      } catch (err) {
        next(err);
      }
    },

    getOne: async (req, res, next) => {
      try {
        const item = await service.findById(req.params.id, req.shopId);
        if (!item) return error(res, `${name} not found`, 404);
        return success(res, item);
      } catch (err) {
        next(err);
      }
    },

    create: async (req, res, next) => {
      try {
        const item = await service.create(req.shopId, req.body);
        return success(res, item, 201, `${name} created successfully`);
      } catch (err) {
        next(err);
      }
    },

    update: async (req, res, next) => {
      try {
        const item = await service.update(req.params.id, req.shopId, req.body);
        if (!item) return error(res, `${name} not found`, 404);
        return success(res, item, 200, `${name} updated successfully`);
      } catch (err) {
        next(err);
      }
    },

    remove: async (req, res, next) => {
      try {
        const deleted = await service.remove(req.params.id, req.shopId);
        if (!deleted) return error(res, `${name} not found`, 404);
        return success(res, null, 200, `${name} deleted successfully`);
      } catch (err) {
        next(err);
      }
    },
  };
};

module.exports = { createCrudController };
