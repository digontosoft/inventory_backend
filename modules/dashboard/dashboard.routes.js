const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { getDashboardOverview } = require('./dashboard.controller');

const router = Router();

router.get('/dashboard/overview', authenticate, getDashboardOverview);

module.exports = router;
