const { createCrudController } = require('../../utils/crudController');
const service = require('./category.service');

module.exports = createCrudController(service);
