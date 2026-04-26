const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const {
  getExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
  getExpenses, createExpense, updateExpense, deleteExpense, markExpensePaid,
  getCashTransactions, createCashTransaction, getCashBalances,
  getFinanceOverview, getSupplierStatement, getVatReport,
} = require('./finance.controller');

const router = Router();
router.use(authenticate);

// Expense Categories
router.route('/expense-categories').get(getExpenseCategories).post(createExpenseCategory);
router.route('/expense-categories/:id').put(updateExpenseCategory).delete(deleteExpenseCategory);

// Expenses
router.route('/expenses').get(getExpenses).post(createExpense);
router.route('/expenses/:id').put(updateExpense).delete(deleteExpense);
router.post('/expenses/:id/mark-paid', markExpensePaid);

// Cash Transactions
router.get('/cash-transactions/balances', getCashBalances);
router.route('/cash-transactions').get(getCashTransactions).post(createCashTransaction);

// Finance Overview & Reports
router.get('/finance/overview', getFinanceOverview);
router.get('/finance/supplier-statement/:supplierId', getSupplierStatement);
router.get('/finance/vat', getVatReport);

module.exports = router;
