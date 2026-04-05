const { createCrudController } = require('../../utils/crudController');
const service = require('./unit.service');

module.exports = createCrudController(service);
