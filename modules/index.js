const { Router } = require('express');
const authRoutes             = require('./auth/auth.route');
const masterdataRoutes       = require('./masterdata/masterdata.routes');
const purchaseRoutes         = require('./purchase/purchase.routes');
const purchaseReturnRoutes   = require('./purchase/purchase_returns.routes');
const supplierPaymentRoutes  = require('./purchase/supplier_payments.routes');
const inventoryRoutes        = require('./inventory/inventory.routes');
const financeRoutes          = require('./finance/finance.routes');
const dashboardRoutes        = require('./dashboard/dashboard.routes');
const reportsRoutes          = require('./reports/reports.routes');

const router = Router();

router.use(authRoutes);
router.use(masterdataRoutes);
router.use(purchaseRoutes);
router.use(purchaseReturnRoutes);
router.use(supplierPaymentRoutes);
router.use(inventoryRoutes);
router.use(financeRoutes);
router.use(dashboardRoutes);
router.use(reportsRoutes);

module.exports = router;
