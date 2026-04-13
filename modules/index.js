const { Router } = require('express');
const authRoutes          = require('./auth/auth.route');
const masterdataRoutes    = require('./masterdata/masterdata.routes');
const purchaseRoutes      = require('./purchase/purchase.routes');
const purchaseReturnRoutes = require('./purchase/purchase_returns.routes');

const router = Router();

router.use(authRoutes);
router.use(masterdataRoutes);
router.use(purchaseRoutes);
router.use(purchaseReturnRoutes);

module.exports = router;
