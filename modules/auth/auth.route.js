const express    = require('express');
const router     = express.Router();
const { register, login, logout, refresh, me } = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.route('/auth/register').post(register);
router.route('/auth/login').post(login);
router.route('/auth/logout').post(logout);
router.route('/auth/refresh').post(refresh);
router.route('/auth/me').get(authenticate, me);

module.exports = router;
