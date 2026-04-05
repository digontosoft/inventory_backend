const { createCrudController } = require('../../utils/crudController');
const service = require('./customer.service');

module.exports = createCrudController(service);
