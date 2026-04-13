const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { getSupplierPayments, createSupplierPayment, deleteSupplierPayment } = require('./supplier_payments.controller');

const router = Router();

router.use(authenticate);

router.route('/supplier-payments').get(getSupplierPayments).post(createSupplierPayment);
router.route('/supplier-payments/:id').delete(deleteSupplierPayment);

module.exports = router;
