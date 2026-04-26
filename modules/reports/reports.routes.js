const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const c = require('./reports.controller');

const router = Router();

router.get('/reports/purchases',          authenticate, c.getPurchaseSummary);
router.get('/reports/purchases/by-supplier', authenticate, c.getPurchaseBySupplier);
router.get('/reports/purchases/by-product',  authenticate, c.getPurchaseByProduct);
router.get('/reports/purchase-returns',   authenticate, c.getPurchaseReturns);
router.get('/reports/stock-status',       authenticate, c.getStockStatus);
router.get('/reports/stock-valuation',    authenticate, c.getStockValuation);
router.get('/reports/stock-movements',    authenticate, c.getStockMovements);
router.get('/reports/low-stock',          authenticate, c.getLowStock);
router.get('/reports/expiry',             authenticate, c.getExpiryReport);
router.get('/reports/dead-stock',         authenticate, c.getDeadStock);
router.get('/reports/cash-flow',          authenticate, c.getCashFlowReport);
router.get('/reports/expenses',           authenticate, c.getExpenseReport);
router.get('/reports/supplier-dues',      authenticate, c.getSupplierDues);
router.get('/reports/customer-dues',      authenticate, c.getCustomerDues);

module.exports = router;
