const { createCrudController } = require('../../utils/crudController');
const service = require('./product.service');

module.exports = createCrudController(service);
