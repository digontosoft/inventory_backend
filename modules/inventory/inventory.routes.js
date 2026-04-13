const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');

const { getStockAdjustments, getStockAdjustment, createStockAdjustment, approveStockAdjustment, deleteStockAdjustment } = require('./stock_adjustments.controller');
const { getStockMovements } = require('./stock_movements.controller');
const { getStockTransfers, getStockTransfer, createStockTransfer, dispatchStockTransfer, receiveStockTransfer, deleteStockTransfer } = require('./stock_transfers.controller');
const { getStockCounts, getStockCount, createStockCount, updateStockCount, deleteStockCount } = require('./stock_counts.controller');
const { getExpiryRecords, createExpiryRecord, disposeExpiryRecord, deleteExpiryRecord } = require('./expiry_records.controller');

const router = Router();
router.use(authenticate);

// Stock Adjustments
router.route('/stock-adjustments').get(getStockAdjustments).post(createStockAdjustment);
router.route('/stock-adjustments/:id').get(getStockAdjustment).delete(deleteStockAdjustment);
router.post('/stock-adjustments/:id/approve', approveStockAdjustment);

// Stock Movements (read-only)
router.get('/stock-movements', getStockMovements);

// Stock Transfers
router.route('/stock-transfers').get(getStockTransfers).post(createStockTransfer);
router.route('/stock-transfers/:id').get(getStockTransfer).delete(deleteStockTransfer);
router.post('/stock-transfers/:id/dispatch', dispatchStockTransfer);
router.post('/stock-transfers/:id/receive', receiveStockTransfer);

// Stock Counts
router.route('/stock-counts').get(getStockCounts).post(createStockCount);
router.route('/stock-counts/:id').get(getStockCount).put(updateStockCount).delete(deleteStockCount);

// Expiry Records
router.route('/expiry-records').get(getExpiryRecords).post(createExpiryRecord);
router.post('/expiry-records/:id/dispose', disposeExpiryRecord);
router.delete('/expiry-records/:id', deleteExpiryRecord);

module.exports = router;
