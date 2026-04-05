const { Router } = require('express');
const controller = require('./unit.controller');
const { authenticate } = require('../../middleware/auth');
const { validate, rules } = require('../../utils/validate');

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);

router.post(
  '/',
  validate({
    name:         [rules.required(), rules.min(1)],
    abbreviation: [rules.required(), rules.min(1)],
  }),
  controller.create
);

router.put('/:id', controller.update);

router.delete('/:id', controller.remove);

module.exports = router;
