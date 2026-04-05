const { Router } = require('express');
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');
const { validate, rules } = require('../../utils/validate');

const router = Router();

router.post(
  '/register',
  validate({
    name:     [rules.required(), rules.min(2)],
    email:    [rules.required(), rules.email()],
    password: [rules.required(), rules.min(6)],
    shopName: [rules.required(), rules.min(2)],
  }),
  controller.register
);

router.post(
  '/login',
  validate({
    email:    [rules.required(), rules.email()],
    password: [rules.required()],
  }),
  controller.login
);

router.post('/logout', controller.logout);

router.post(
  '/refresh',
  validate({ refreshToken: [rules.required()] }),
  controller.refresh
);

router.get('/me', authenticate, controller.me);

module.exports = router;
