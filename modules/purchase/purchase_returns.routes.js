const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { getPurchaseReturns, getPurchaseReturn, createPurchaseReturn, deletePurchaseReturn } = require('./purchase_returns.controller');

const router = Router();

router.use(authenticate);

router.route('/purchase-returns').get(getPurchaseReturns).post(createPurchaseReturn);
router.route('/purchase-returns/:id').get(getPurchaseReturn).delete(deletePurchaseReturn);

module.exports = router;
