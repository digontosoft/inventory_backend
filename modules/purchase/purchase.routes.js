const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { getPurchases, getPurchase, createPurchase, updatePurchase, deletePurchase } = require('./purchase.controller');

const router = Router();

router.use(authenticate);

router.route('/purchases').get(getPurchases).post(createPurchase);
router.route('/purchases/:id').get(getPurchase).put(updatePurchase).delete(deletePurchase);

module.exports = router;
