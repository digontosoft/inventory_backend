const errorResponse = (example = 'Error message') => ({
  content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, error: { type: 'string', example } } } } },
});
const successMessage = (example = 'Deleted') => ({
  content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example } } } } },
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

const purchaseItemSchema = {
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    productId:     { type: 'string', format: 'uuid' },
    productName:   { type: 'string', example: 'Samsung Galaxy A54' },
    unit:          { type: 'string', example: 'pcs' },
    qty:           { type: 'number', example: 10 },
    purchasePrice: { type: 'number', example: 35000 },
    discount:      { type: 'number', example: 500 },
    vatRate:       { type: 'number', example: 5 },
    vatAmount:     { type: 'number', example: 1725 },
    lineTotal:     { type: 'number', example: 36225 },
  },
};

const purchaseSchema = {
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    invoiceNo:     { type: 'string', example: 'PUR-0001' },
    date:          { type: 'string', format: 'date', example: '2026-04-15' },
    supplierId:    { type: 'string', format: 'uuid' },
    supplierName:  { type: 'string', example: 'Dhaka Electronics Wholesale' },
    subtotal:      { type: 'number', example: 350000 },
    totalDiscount: { type: 'number', example: 5000 },
    totalVat:      { type: 'number', example: 17250 },
    freightCost:   { type: 'number', example: 500 },
    grandTotal:    { type: 'number', example: 362750 },
    paymentMethod: { type: 'string', enum: ['cash', 'bank', 'mobile_banking', 'credit'] },
    amountPaid:    { type: 'number', example: 200000 },
    dueAmount:     { type: 'number', example: 162750 },
    status:        { type: 'string', enum: ['draft', 'received', 'partial', 'cancelled'] },
    locationId:    { type: 'string', format: 'uuid', nullable: true },
    notes:         { type: 'string' },
    createdBy:     { type: 'string', format: 'uuid' },
    createdAt:     { type: 'string', format: 'date-time' },
    items:         { type: 'array', items: purchaseItemSchema },
  },
};

const returnItemSchema = {
  type: 'object',
  properties: {
    id:           { type: 'string', format: 'uuid' },
    productId:    { type: 'string', format: 'uuid' },
    productName:  { type: 'string', example: 'Samsung Galaxy A54' },
    unit:         { type: 'string', example: 'pcs' },
    qtyReturned:  { type: 'number', example: 2 },
    unitPrice:    { type: 'number', example: 35000 },
    lineTotal:    { type: 'number', example: 70000 },
    reason:       { type: 'string', example: 'Defective units' },
  },
};

const purchaseReturnSchema = {
  type: 'object',
  properties: {
    id:           { type: 'string', format: 'uuid' },
    returnNo:     { type: 'string', example: 'PRN-0001' },
    date:         { type: 'string', format: 'date' },
    purchaseId:   { type: 'string', format: 'uuid', nullable: true },
    purchaseNo:   { type: 'string', example: 'PUR-0001', nullable: true },
    supplierId:   { type: 'string', format: 'uuid' },
    supplierName: { type: 'string', example: 'Dhaka Electronics Wholesale' },
    totalAmount:  { type: 'number', example: 70000 },
    reason:       { type: 'string', example: 'Defective goods' },
    locationId:   { type: 'string', format: 'uuid', nullable: true },
    notes:        { type: 'string' },
    createdAt:    { type: 'string', format: 'date-time' },
    items:        { type: 'array', items: returnItemSchema },
  },
};

const supplierPaymentSchema = {
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    paymentNo:     { type: 'string', example: 'SPY-0001' },
    date:          { type: 'string', format: 'date' },
    supplierId:    { type: 'string', format: 'uuid' },
    supplierName:  { type: 'string', example: 'Dhaka Electronics Wholesale' },
    amount:        { type: 'number', example: 50000 },
    method:        { type: 'string', enum: ['cash', 'bank', 'mobile_banking', 'cheque'] },
    reference:     { type: 'string', example: 'TXN-123456' },
    notes:         { type: 'string' },
    createdAt:     { type: 'string', format: 'date-time' },
  },
};

const purchaseDocs = {
  paths: {

    // ── Purchases ─────────────────────────────────────────────────────────────

    '/purchases': {
      get: {
        tags: ['Purchase – Purchases'],
        summary: 'List purchases',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search',     in: 'query', schema: { type: 'string' },  description: 'Search by invoice no or supplier name' },
          { name: 'supplierId', in: 'query', schema: { type: 'string' },  description: 'Filter by supplier UUID' },
          { name: 'status',     in: 'query', schema: { type: 'string', enum: ['draft', 'received', 'partial', 'cancelled'] } },
          { name: 'from',       in: 'query', schema: { type: 'string', format: 'date' }, description: 'Start date (inclusive)' },
          { name: 'to',         in: 'query', schema: { type: 'string', format: 'date' }, description: 'End date (inclusive)' },
        ],
        responses: {
          200: { description: 'List of purchases', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: purchaseSchema } } } } } },
        },
      },
      post: {
        tags: ['Purchase – Purchases'],
        summary: 'Create a purchase',
        description: 'Creates a new purchase. Set `status` to `received` or `partial` to immediately update stock.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['supplierId', 'items'],
                properties: {
                  date:          { type: 'string', format: 'date' },
                  supplierId:    { type: 'string', format: 'uuid' },
                  subtotal:      { type: 'number', example: 350000 },
                  totalDiscount: { type: 'number', example: 5000 },
                  totalVat:      { type: 'number', example: 17250 },
                  freightCost:   { type: 'number', example: 500 },
                  grandTotal:    { type: 'number', example: 362750 },
                  paymentMethod: { type: 'string', enum: ['cash', 'bank', 'mobile_banking', 'credit'] },
                  amountPaid:    { type: 'number', example: 200000 },
                  dueAmount:     { type: 'number', example: 162750 },
                  status:        { type: 'string', enum: ['draft', 'received', 'partial'], default: 'draft' },
                  notes:         { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['productId', 'qty', 'purchasePrice'],
                      properties: {
                        productId:    { type: 'string', format: 'uuid' },
                        productName:  { type: 'string' },
                        unit:         { type: 'string' },
                        qty:          { type: 'number', example: 10 },
                        purchasePrice:{ type: 'number', example: 35000 },
                        discount:     { type: 'number', example: 500 },
                        vatRate:      { type: 'number', example: 5 },
                        vatAmount:    { type: 'number', example: 1725 },
                        lineTotal:    { type: 'number', example: 36225 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Purchase created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: purchaseSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('supplierId and items are required') },
          404: { description: 'Supplier not found', ...errorResponse('Supplier not found') },
        },
      },
    },

    '/purchases/{id}': {
      get: {
        tags: ['Purchase – Purchases'],
        summary: 'Get a single purchase',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Purchase detail', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: purchaseSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Purchase not found') },
        },
      },
      put: {
        tags: ['Purchase – Purchases'],
        summary: 'Update a purchase',
        description: 'Only `draft` purchases can be edited. Confirming (status → received) updates stock.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['draft', 'received', 'partial', 'cancelled'] }, notes: { type: 'string' } } } } } },
        responses: {
          200: { description: 'Purchase updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: purchaseSchema } } } } },
          400: { description: 'Only draft purchases can be edited', ...errorResponse('Only draft purchases can be edited') },
          404: { description: 'Not found', ...errorResponse('Purchase not found') },
        },
      },
      delete: {
        tags: ['Purchase – Purchases'],
        summary: 'Soft-delete a purchase',
        description: 'Only `draft` purchases can be deleted.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Purchase deleted') },
          400: { description: 'Cannot delete non-draft', ...errorResponse('Only draft purchases can be deleted') },
          404: { description: 'Not found', ...errorResponse('Purchase not found') },
        },
      },
    },

    // ── Purchase Returns ──────────────────────────────────────────────────────

    '/purchase-returns': {
      get: {
        tags: ['Purchase – Returns'],
        summary: 'List purchase returns',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search',     in: 'query', schema: { type: 'string' } },
          { name: 'supplierId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'List of purchase returns', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: purchaseReturnSchema } } } } } } },
      },
      post: {
        tags: ['Purchase – Returns'],
        summary: 'Create a purchase return',
        description: 'Immediately deducts stock for returned items.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['supplierId', 'items'],
                properties: {
                  date:        { type: 'string', format: 'date' },
                  purchaseId:  { type: 'string', format: 'uuid', nullable: true, description: 'Link to original purchase (optional)' },
                  supplierId:  { type: 'string', format: 'uuid' },
                  reason:      { type: 'string', example: 'Defective goods' },
                  notes:       { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['productId', 'qtyReturned', 'unitPrice'],
                      properties: {
                        productId:   { type: 'string', format: 'uuid' },
                        productName: { type: 'string' },
                        unit:        { type: 'string' },
                        qtyReturned: { type: 'number', example: 2 },
                        unitPrice:   { type: 'number', example: 35000 },
                        lineTotal:   { type: 'number', example: 70000 },
                        reason:      { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Return created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: purchaseReturnSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('supplierId and items are required') },
        },
      },
    },

    '/purchase-returns/{id}': {
      get: {
        tags: ['Purchase – Returns'],
        summary: 'Get a single purchase return',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Purchase return detail', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: purchaseReturnSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Return not found') },
        },
      },
      delete: {
        tags: ['Purchase – Returns'],
        summary: 'Delete a purchase return',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Return deleted') },
          404: { description: 'Not found', ...errorResponse('Return not found') },
        },
      },
    },

    // ── Supplier Payments ─────────────────────────────────────────────────────

    '/supplier-payments': {
      get: {
        tags: ['Purchase – Supplier Payments'],
        summary: 'List supplier payments',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'supplierId', in: 'query', schema: { type: 'string' } },
          { name: 'from',       in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to',         in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'List of payments', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: supplierPaymentSchema } } } } } } },
      },
      post: {
        tags: ['Purchase – Supplier Payments'],
        summary: 'Record a supplier payment',
        description: 'Reduces the supplier\'s due balance by the payment amount.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['supplierId', 'amount', 'method'],
                properties: {
                  date:       { type: 'string', format: 'date' },
                  supplierId: { type: 'string', format: 'uuid' },
                  amount:     { type: 'number', example: 50000 },
                  method:     { type: 'string', enum: ['cash', 'bank', 'mobile_banking', 'cheque'] },
                  reference:  { type: 'string', example: 'TXN-123456' },
                  notes:      { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Payment recorded', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: supplierPaymentSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('supplierId, amount and method are required') },
          404: { description: 'Supplier not found', ...errorResponse('Supplier not found') },
        },
      },
    },

    '/supplier-payments/{id}': {
      delete: {
        tags: ['Purchase – Supplier Payments'],
        summary: 'Delete a supplier payment',
        description: 'Reverses the supplier due balance reduction.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Payment deleted') },
          404: { description: 'Not found', ...errorResponse('Payment not found') },
        },
      },
    },
  },
};

module.exports = purchaseDocs;
