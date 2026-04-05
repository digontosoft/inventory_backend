const { createCrudController } = require('../../utils/crudController');
const service = require('./supplier.service');

module.exports = createCrudController(service);
