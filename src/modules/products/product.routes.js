const { Router } = require('express');
const controller = require('./product.controller');
const { authenticate } = require('../../middleware/auth');
const { validate, rules } = require('../../utils/validate');

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);

router.post(
  '/',
  validate({
    name:          [rules.required(), rules.min(1)],
    sku:           [rules.required()],
    selling_price: [rules.required(), rules.number(), rules.minValue(0)],
    purchase_price:[rules.number(), rules.minValue(0)],
  }),
  controller.create
);

router.put('/:id', controller.update);

router.delete('/:id', controller.remove);

module.exports = router;
