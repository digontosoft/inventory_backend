const errorResponse = (example = 'Error message') => ({
  content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, error: { type: 'string', example } } } } },
});
const successMessage = (example = 'Deleted') => ({
  content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example } } } } },
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

const expenseCategorySchema = {
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    name:          { type: 'string', example: 'Electricity & Utilities' },
    icon:          { type: 'string', example: '⚡' },
    description:   { type: 'string', example: 'Electricity, water, gas bills' },
    budgetMonthly: { type: 'number', example: 5000 },
    isActive:      { type: 'boolean', example: true },
    createdAt:     { type: 'string', format: 'date-time' },
  },
};

const expenseSchema = {
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    expenseNo:     { type: 'string', example: 'EXP-0001' },
    date:          { type: 'string', format: 'date', example: '2026-04-25' },
    categoryId:    { type: 'string', format: 'uuid' },
    categoryName:  { type: 'string', example: 'Rent' },
    description:   { type: 'string', example: 'Shop rent for April' },
    amount:        { type: 'number', example: 15000 },
    paymentMethod: { type: 'string', enum: ['cash', 'bkash', 'bank'] },
    referenceNo:   { type: 'string', example: 'BNK-001' },
    status:        { type: 'string', enum: ['paid', 'pending'] },
    notes:         { type: 'string', example: 'Paid to landlord' },
    createdBy:     { type: 'string', format: 'uuid' },
    createdAt:     { type: 'string', format: 'date-time' },
  },
};

const cashTransactionSchema = {
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    transactionNo: { type: 'string', example: 'CASH-0001' },
    date:          { type: 'string', format: 'date', example: '2026-04-25' },
    time:          { type: 'string', example: '10:30' },
    type:          { type: 'string', enum: ['in', 'out'] },
    category:      { type: 'string', enum: ['sale', 'purchase_payment', 'customer_collection', 'expense', 'cash_in', 'cash_out', 'opening', 'other'] },
    referenceType: { type: 'string', enum: ['sale', 'purchase', 'expense', 'payment', 'manual'] },
    referenceId:   { type: 'string', example: '' },
    referenceNo:   { type: 'string', example: 'EXP-0001' },
    description:   { type: 'string', example: 'Shop rent payment' },
    amount:        { type: 'number', example: 15000 },
    paymentMethod: { type: 'string', enum: ['cash', 'bkash', 'bank'] },
    balance:       { type: 'number', example: 36500, description: 'Running balance for this payment method' },
    createdBy:     { type: 'string', format: 'uuid' },
    createdAt:     { type: 'string', format: 'date-time' },
  },
};

const cashBalancesSchema = {
  type: 'object',
  properties: {
    cash:  { type: 'number', example: 51122 },
    bkash: { type: 'number', example: 5000 },
    bank:  { type: 'number', example: 34650 },
  },
};

const financeOverviewSchema = {
  type: 'object',
  properties: {
    balances:         { $ref: '#/components/schemas/CashBalances' },
    monthExpenses:    { type: 'number', example: 47600 },
    cashFlowData:     { type: 'array', items: { type: 'object', properties: { date: { type: 'string', example: '04-25' }, cashIn: { type: 'number' }, cashOut: { type: 'number' } } } },
    expenseBreakdown: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'number' } } } },
    budgetAlerts:     { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, spent: { type: 'number' }, budget: { type: 'number' }, pct: { type: 'number' } } } },
    recentTransactions: { type: 'array', items: { $ref: '#/components/schemas/CashTransaction' } },
    recentExpenses:   { type: 'array', items: { $ref: '#/components/schemas/Expense' } },
  },
};

const supplierLedgerEntrySchema = {
  type: 'object',
  properties: {
    id:          { type: 'integer', example: 0 },
    date:        { type: 'string', format: 'date' },
    type:        { type: 'string', enum: ['purchase', 'payment', 'return'] },
    referenceNo: { type: 'string', example: 'PUR-0001' },
    description: { type: 'string', example: 'Purchase order' },
    debit:       { type: 'number', example: 7360 },
    credit:      { type: 'number', example: 0 },
    balance:     { type: 'number', example: 7360 },
  },
};

const vatEntrySchema = {
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    date:          { type: 'string', format: 'date' },
    type:          { type: 'string', enum: ['input', 'output'] },
    referenceType: { type: 'string', example: 'purchase' },
    referenceNo:   { type: 'string', example: 'PUR-0001' },
    taxableAmount: { type: 'number', example: 5000 },
    vatRate:       { type: 'number', example: 15 },
    vatAmount:     { type: 'number', example: 750 },
  },
};

// ─── Paths ────────────────────────────────────────────────────────────────────

exports.schemas = {
  ExpenseCategory:      expenseCategorySchema,
  Expense:              expenseSchema,
  CashTransaction:      cashTransactionSchema,
  CashBalances:         cashBalancesSchema,
  FinanceOverview:      financeOverviewSchema,
  SupplierLedgerEntry:  supplierLedgerEntrySchema,
  VatEntry:             vatEntrySchema,
};

exports.paths = {

  // ── Expense Categories ──────────────────────────────────────────────────────

  '/expense-categories': {
    get: {
      tags: ['Finance – Expense Categories'],
      summary: 'List all expense categories',
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'array', items: { $ref: '#/components/schemas/ExpenseCategory' } } } } } } },
        401: { description: 'Unauthorized', ...errorResponse('Unauthorized') },
      },
    },
    post: {
      tags: ['Finance – Expense Categories'],
      summary: 'Create an expense category',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'Marketing' }, icon: { type: 'string', example: '📢' }, description: { type: 'string' }, budgetMonthly: { type: 'number', example: 1000 }, isActive: { type: 'boolean', example: true } } } } },
      },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/ExpenseCategory' } } } } } },
        400: { description: 'Validation error', ...errorResponse('name is required') },
      },
    },
  },

  '/expense-categories/{id}': {
    put: {
      tags: ['Finance – Expense Categories'],
      summary: 'Update an expense category',
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, icon: { type: 'string' }, description: { type: 'string' }, budgetMonthly: { type: 'number' }, isActive: { type: 'boolean' } } } } },
      },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/ExpenseCategory' } } } } } },
        404: { description: 'Not found', ...errorResponse('Category not found') },
      },
    },
    delete: {
      tags: ['Finance – Expense Categories'],
      summary: 'Delete an expense category (only if no linked expenses)',
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Deleted', ...successMessage('Category deleted') },
        400: { description: 'Has linked expenses', ...errorResponse('Cannot delete: expenses are linked to this category') },
        404: { description: 'Not found', ...errorResponse('Category not found') },
      },
    },
  },

  // ── Expenses ────────────────────────────────────────────────────────────────

  '/expenses': {
    get: {
      tags: ['Finance – Expenses'],
      summary: 'List expenses with optional filters',
      parameters: [
        { in: 'query', name: 'search',     schema: { type: 'string' }, description: 'Search description or expense number' },
        { in: 'query', name: 'categoryId', schema: { type: 'string', format: 'uuid' } },
        { in: 'query', name: 'status',     schema: { type: 'string', enum: ['paid', 'pending'] } },
        { in: 'query', name: 'dateStart',  schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'dateEnd',    schema: { type: 'string', format: 'date' } },
      ],
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'array', items: { $ref: '#/components/schemas/Expense' } } } } } } },
      },
    },
    post: {
      tags: ['Finance – Expenses'],
      summary: 'Record a new expense (auto-creates cash transaction if status=paid)',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', required: ['description', 'amount'], properties: { date: { type: 'string', format: 'date', example: '2026-04-25' }, categoryId: { type: 'string', format: 'uuid' }, description: { type: 'string', example: 'Shop rent for April' }, amount: { type: 'number', example: 15000 }, paymentMethod: { type: 'string', enum: ['cash', 'bkash', 'bank'], default: 'cash' }, referenceNo: { type: 'string' }, status: { type: 'string', enum: ['paid', 'pending'], default: 'paid' }, notes: { type: 'string' } } } } },
      },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/Expense' } } } } } },
        400: { description: 'Validation error', ...errorResponse('description and amount are required') },
      },
    },
  },

  '/expenses/{id}': {
    put: {
      tags: ['Finance – Expenses'],
      summary: 'Update an expense',
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        content: { 'application/json': { schema: { type: 'object', properties: { date: { type: 'string', format: 'date' }, categoryId: { type: 'string', format: 'uuid' }, description: { type: 'string' }, amount: { type: 'number' }, paymentMethod: { type: 'string', enum: ['cash', 'bkash', 'bank'] }, status: { type: 'string', enum: ['paid', 'pending'] }, notes: { type: 'string' } } } } },
      },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/Expense' } } } } } },
        404: { description: 'Not found', ...errorResponse('Expense not found') },
      },
    },
    delete: {
      tags: ['Finance – Expenses'],
      summary: 'Soft-delete an expense',
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Deleted', ...successMessage('Expense deleted') },
        404: { description: 'Not found', ...errorResponse('Expense not found') },
      },
    },
  },

  '/expenses/{id}/mark-paid': {
    post: {
      tags: ['Finance – Expenses'],
      summary: 'Mark a pending expense as paid (auto-creates cash transaction)',
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        content: { 'application/json': { schema: { type: 'object', properties: { paymentMethod: { type: 'string', enum: ['cash', 'bkash', 'bank'] } } } } },
      },
      responses: {
        200: { description: 'Marked paid', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/Expense' } } } } } },
        400: { description: 'Already paid', ...errorResponse('Already paid') },
        404: { description: 'Not found', ...errorResponse('Expense not found') },
      },
    },
  },

  // ── Cash Transactions ───────────────────────────────────────────────────────

  '/cash-transactions': {
    get: {
      tags: ['Finance – Cash Book'],
      summary: 'List cash transactions',
      parameters: [
        { in: 'query', name: 'paymentMethod', schema: { type: 'string', enum: ['cash', 'bkash', 'bank'] }, description: 'Filter by payment method' },
        { in: 'query', name: 'type',          schema: { type: 'string', enum: ['in', 'out'] } },
        { in: 'query', name: 'search',        schema: { type: 'string' }, description: 'Search description, reference, or transaction number' },
      ],
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'array', items: { $ref: '#/components/schemas/CashTransaction' } } } } } } },
      },
    },
    post: {
      tags: ['Finance – Cash Book'],
      summary: 'Create a manual cash transaction (balance auto-computed)',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', required: ['description', 'amount', 'type', 'category'], properties: { date: { type: 'string', format: 'date' }, type: { type: 'string', enum: ['in', 'out'] }, category: { type: 'string', enum: ['sale', 'purchase_payment', 'customer_collection', 'expense', 'cash_in', 'cash_out', 'opening', 'other'] }, referenceType: { type: 'string', enum: ['sale', 'purchase', 'expense', 'payment', 'manual'], default: 'manual' }, referenceNo: { type: 'string' }, description: { type: 'string', example: 'Opening balance' }, amount: { type: 'number', example: 25000 }, paymentMethod: { type: 'string', enum: ['cash', 'bkash', 'bank'], default: 'cash' } } } } },
      },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/CashTransaction' } } } } } },
        400: { description: 'Validation error', ...errorResponse('description, amount, type, and category are required') },
      },
    },
  },

  '/cash-transactions/balances': {
    get: {
      tags: ['Finance – Cash Book'],
      summary: 'Get current balance for each payment method',
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/CashBalances' } } } } } },
      },
    },
  },

  // ── Finance Overview ────────────────────────────────────────────────────────

  '/finance/overview': {
    get: {
      tags: ['Finance – Overview'],
      summary: 'Finance dashboard: balances, KPIs, charts, recent activity',
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/FinanceOverview' } } } } } },
      },
    },
  },

  // ── Supplier Statement ──────────────────────────────────────────────────────

  '/finance/supplier-statement/{supplierId}': {
    get: {
      tags: ['Finance – Ledgers'],
      summary: 'Supplier statement derived from purchases, payments, and returns',
      parameters: [{ in: 'path', name: 'supplierId', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Supplier UUID' }],
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'array', items: { $ref: '#/components/schemas/SupplierLedgerEntry' } } } } } } },
      },
    },
  },

  // ── VAT Report ──────────────────────────────────────────────────────────────

  '/finance/vat': {
    get: {
      tags: ['Finance – VAT'],
      summary: 'VAT report: input VAT from purchases for a given month',
      parameters: [
        { in: 'query', name: 'month', required: true, schema: { type: 'string', example: '2026-04' }, description: 'Period in YYYY-MM format' },
      ],
      responses: {
        200: {
          description: 'OK',
          content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties: { outputEntries: { type: 'array', items: { $ref: '#/components/schemas/VatEntry' } }, inputEntries: { type: 'array', items: { $ref: '#/components/schemas/VatEntry' } }, outputVat: { type: 'number', example: 0 }, inputVat: { type: 'number', example: 1402.5 } } } } } } },
        },
      },
    },
  },
};
