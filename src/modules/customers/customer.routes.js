const { Router } = require('express');
const controller = require('./customer.controller');
const { authenticate } = require('../../middleware/auth');
const { validate, rules } = require('../../utils/validate');

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);

router.post(
  '/',
  validate({
    name: [rules.required(), rules.min(2)],
    type: [rules.oneOf(['Retail', 'Wholesale'])],
  }),
  controller.create
);

router.put('/:id', controller.update);

router.delete('/:id', controller.remove);

module.exports = router;
