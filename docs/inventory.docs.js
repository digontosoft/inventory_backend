const errorResponse = (example = 'Error message') => ({
  content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, error: { type: 'string', example } } } } },
});
const successMessage = (example = 'Deleted') => ({
  content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example } } } } },
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

const adjustmentItemSchema = {
  type: 'object',
  properties: {
    id:           { type: 'string', format: 'uuid' },
    productId:    { type: 'string', format: 'uuid' },
    productName:  { type: 'string', example: 'Samsung Galaxy A54' },
    sku:          { type: 'string', example: 'MOB-001' },
    unit:         { type: 'string', example: 'pcs' },
    currentStock: { type: 'integer', example: 25 },
    adjustedQty:  { type: 'integer', example: 22 },
    difference:   { type: 'integer', example: -3 },
    unitCost:     { type: 'number',  example: 35000 },
    valueImpact:  { type: 'number',  example: -105000 },
  },
};

const adjustmentSchema = {
  type: 'object',
  properties: {
    id:               { type: 'string', format: 'uuid' },
    adjustmentNo:     { type: 'string', example: 'ADJ-0001' },
    date:             { type: 'string', format: 'date' },
    reason:           { type: 'string', enum: ['damage', 'loss', 'found', 'expiry', 'correction', 'other'] },
    reasonNote:       { type: 'string' },
    totalValueImpact: { type: 'number', example: -105000 },
    status:           { type: 'string', enum: ['draft', 'approved'] },
    locationId:       { type: 'string', format: 'uuid', nullable: true },
    notes:            { type: 'string' },
    createdBy:        { type: 'string', format: 'uuid' },
    approvedBy:       { type: 'string', format: 'uuid', nullable: true },
    createdAt:        { type: 'string', format: 'date-time' },
    items:            { type: 'array', items: adjustmentItemSchema },
  },
};

const movementSchema = {
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    date:          { type: 'string', format: 'date' },
    time:          { type: 'string', example: '02:30 PM' },
    productId:     { type: 'string', format: 'uuid' },
    productName:   { type: 'string', example: 'Samsung Galaxy A54' },
    sku:           { type: 'string', example: 'MOB-001' },
    type:          { type: 'string', enum: ['purchase_in', 'sale_out', 'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out', 'return_in', 'return_out', 'opening_stock', 'count_adjustment'] },
    referenceType: { type: 'string', example: 'adjustment' },
    referenceId:   { type: 'string', format: 'uuid', nullable: true },
    referenceNo:   { type: 'string', example: 'ADJ-0001' },
    qtyBefore:     { type: 'integer', example: 25 },
    qtyChange:     { type: 'integer', example: -3 },
    qtyAfter:      { type: 'integer', example: 22 },
    unitCost:      { type: 'number',  example: 35000 },
    totalValue:    { type: 'number',  example: 105000 },
    locationId:    { type: 'string',  format: 'uuid', nullable: true },
    notes:         { type: 'string' },
    createdByName: { type: 'string',  example: 'Rahim Uddin' },
  },
};

const transferItemSchema = {
  type: 'object',
  properties: {
    id:           { type: 'string', format: 'uuid' },
    productId:    { type: 'string', format: 'uuid' },
    productName:  { type: 'string', example: 'Samsung Galaxy A54' },
    sku:          { type: 'string', example: 'MOB-001' },
    unit:         { type: 'string', example: 'pcs' },
    qtyRequested: { type: 'integer', example: 5 },
    qtySent:      { type: 'integer', example: 5 },
    qtyReceived:  { type: 'integer', example: 5 },
  },
};

const transferSchema = {
  type: 'object',
  properties: {
    id:             { type: 'string', format: 'uuid' },
    transferNo:     { type: 'string', example: 'TRF-0001' },
    date:           { type: 'string', format: 'date' },
    expectedDate:   { type: 'string', format: 'date' },
    fromBranch:     { type: 'string', example: 'Main Warehouse' },
    toBranch:       { type: 'string', example: 'Branch Uttara' },
    fromLocationId: { type: 'string', format: 'uuid', nullable: true },
    toLocationId:   { type: 'string', format: 'uuid', nullable: true },
    totalItems:     { type: 'integer', example: 3 },
    status:         { type: 'string', enum: ['draft', 'dispatched', 'received', 'partial', 'cancelled'] },
    dispatchedAt:   { type: 'string', format: 'date' },
    receivedAt:     { type: 'string', format: 'date' },
    notes:          { type: 'string' },
    createdBy:      { type: 'string', example: 'Rahim Uddin' },
    createdAt:      { type: 'string', format: 'date-time' },
    items:          { type: 'array', items: transferItemSchema },
  },
};

const stockCountItemSchema = {
  type: 'object',
  properties: {
    id:           { type: 'string', format: 'uuid' },
    productId:    { type: 'string', format: 'uuid' },
    productName:  { type: 'string', example: 'Samsung Galaxy A54' },
    sku:          { type: 'string', example: 'MOB-001' },
    unit:         { type: 'string', example: 'pcs' },
    category:     { type: 'string', example: 'Electronics' },
    systemQty:    { type: 'integer', example: 25 },
    countedQty:   { type: 'integer', example: 23, nullable: true },
    difference:   { type: 'integer', example: -2 },
    unitCost:     { type: 'number',  example: 35000 },
    valueVariance:{ type: 'number',  example: -70000 },
    status:       { type: 'string',  enum: ['pending', 'counted', 'verified'] },
  },
};

const stockCountSchema = {
  type: 'object',
  properties: {
    id:                 { type: 'string', format: 'uuid' },
    countNo:            { type: 'string', example: 'CNT-0001' },
    title:              { type: 'string', example: 'Monthly Count April 2026' },
    type:               { type: 'string', enum: ['full', 'category'] },
    categoryFilter:     { type: 'string', example: 'uuid1,uuid2' },
    date:               { type: 'string', format: 'date' },
    status:             { type: 'string', enum: ['in_progress', 'approved'] },
    locationId:         { type: 'string', format: 'uuid', nullable: true },
    totalSystemValue:   { type: 'number', example: 875000 },
    totalCountedValue:  { type: 'number', example: 805000 },
    totalVarianceValue: { type: 'number', example: -70000 },
    totalItemsToCount:  { type: 'integer', example: 40 },
    totalItemsCounted:  { type: 'integer', example: 40 },
    notes:              { type: 'string' },
    createdBy:          { type: 'string', format: 'uuid' },
    completedAt:        { type: 'string', format: 'date-time', nullable: true },
    createdAt:          { type: 'string', format: 'date-time' },
    items:              { type: 'array', items: stockCountItemSchema },
  },
};

const expiryRecordSchema = {
  type: 'object',
  properties: {
    id:               { type: 'string', format: 'uuid' },
    productId:        { type: 'string', format: 'uuid' },
    productName:      { type: 'string', example: 'Antiseptic Cream 50g' },
    sku:              { type: 'string', example: 'PHM-001' },
    batchNo:          { type: 'string', example: 'BTH-2024-08' },
    expiryDate:       { type: 'string', format: 'date', example: '2026-06-30' },
    manufacturingDate:{ type: 'string', format: 'date', nullable: true },
    qty:              { type: 'integer', example: 48 },
    locationId:       { type: 'string', format: 'uuid', nullable: true },
    status:           { type: 'string', enum: ['active', 'near_expiry', 'expired', 'disposed'] },
    disposedAt:       { type: 'string', format: 'date-time', nullable: true },
    disposedQty:      { type: 'integer', nullable: true },
    createdAt:        { type: 'string', format: 'date-time' },
  },
};

// ─── Docs ─────────────────────────────────────────────────────────────────────

const inventoryDocs = {
  paths: {

    // ── Stock Adjustments ─────────────────────────────────────────────────────

    '/stock-adjustments': {
      get: {
        tags: ['Inventory – Adjustments'],
        summary: 'List stock adjustments',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by adjustment no' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'approved'] } },
        ],
        responses: { 200: { description: 'List of adjustments', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: adjustmentSchema } } } } } } },
      },
      post: {
        tags: ['Inventory – Adjustments'],
        summary: 'Create a stock adjustment',
        description: 'Set `status: "approved"` to immediately apply stock changes. Drafts can be approved later.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason', 'items'],
                properties: {
                  date:       { type: 'string', format: 'date' },
                  reason:     { type: 'string', enum: ['damage', 'loss', 'found', 'expiry', 'correction', 'other'] },
                  reasonNote: { type: 'string' },
                  notes:      { type: 'string' },
                  locationId: { type: 'string', format: 'uuid', nullable: true },
                  status:     { type: 'string', enum: ['draft', 'approved'], default: 'draft' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['productId', 'adjustedQty'],
                      properties: {
                        productId:    { type: 'string', format: 'uuid' },
                        productName:  { type: 'string' },
                        sku:          { type: 'string' },
                        unit:         { type: 'string' },
                        currentStock: { type: 'integer', example: 25 },
                        adjustedQty:  { type: 'integer', example: 22 },
                        difference:   { type: 'integer', example: -3 },
                        unitCost:     { type: 'number',  example: 35000 },
                        valueImpact:  { type: 'number',  example: -105000 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Adjustment created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: adjustmentSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('At least one item required') },
        },
      },
    },

    '/stock-adjustments/{id}': {
      get: {
        tags: ['Inventory – Adjustments'],
        summary: 'Get a single stock adjustment',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Adjustment detail', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: adjustmentSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Adjustment not found') },
        },
      },
      delete: {
        tags: ['Inventory – Adjustments'],
        summary: 'Delete a draft adjustment',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Adjustment deleted') },
          400: { description: 'Only drafts can be deleted', ...errorResponse('Only draft adjustments can be deleted') },
          404: { description: 'Not found', ...errorResponse('Adjustment not found') },
        },
      },
    },

    '/stock-adjustments/{id}/approve': {
      post: {
        tags: ['Inventory – Adjustments'],
        summary: 'Approve a draft adjustment',
        description: 'Applies stock changes for all items and marks adjustment as approved.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Approved', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: adjustmentSchema } } } } },
          400: { description: 'Already approved', ...errorResponse('Only draft adjustments can be approved') },
          404: { description: 'Not found', ...errorResponse('Adjustment not found') },
        },
      },
    },

    // ── Stock Movements ───────────────────────────────────────────────────────

    '/stock-movements': {
      get: {
        tags: ['Inventory – Movements'],
        summary: 'List stock movements (read-only ledger)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search',    in: 'query', schema: { type: 'string' }, description: 'Search by product name, SKU, or reference no' },
          { name: 'type',      in: 'query', schema: { type: 'string', enum: ['purchase_in', 'sale_out', 'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out', 'return_in', 'return_out', 'opening_stock', 'count_adjustment'] } },
          { name: 'productId', in: 'query', schema: { type: 'string' } },
          { name: 'limit',     in: 'query', schema: { type: 'integer', default: 50, maximum: 1000 } },
        ],
        responses: { 200: { description: 'List of stock movements', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: movementSchema } } } } } } },
      },
    },

    // ── Stock Transfers ───────────────────────────────────────────────────────

    '/stock-transfers': {
      get: {
        tags: ['Inventory – Transfers'],
        summary: 'List stock transfers',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'dispatched', 'received', 'partial', 'cancelled'] } },
        ],
        responses: { 200: { description: 'List of transfers', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: transferSchema } } } } } } },
      },
      post: {
        tags: ['Inventory – Transfers'],
        summary: 'Create a stock transfer',
        description: 'Pass `dispatch: true` to immediately dispatch (deducts stock from source location).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items'],
                properties: {
                  date:           { type: 'string', format: 'date' },
                  expectedDate:   { type: 'string', format: 'date' },
                  fromLocationId: { type: 'string', format: 'uuid', description: 'Defaults to shop default location' },
                  toLocationId:   { type: 'string', format: 'uuid' },
                  fromBranch:     { type: 'string', example: 'Main Warehouse', description: 'Display label (auto-resolved if omitted)' },
                  toBranch:       { type: 'string', example: 'Branch Uttara',  description: 'Display label (auto-resolved if omitted)' },
                  notes:          { type: 'string' },
                  dispatch:       { type: 'boolean', default: false },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['productId', 'qtyRequested'],
                      properties: {
                        productId:    { type: 'string', format: 'uuid' },
                        productName:  { type: 'string' },
                        sku:          { type: 'string' },
                        unit:         { type: 'string' },
                        qtyRequested: { type: 'integer', example: 5 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Transfer created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: transferSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('At least one item required') },
        },
      },
    },

    '/stock-transfers/{id}': {
      get: {
        tags: ['Inventory – Transfers'],
        summary: 'Get a single stock transfer',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Transfer detail', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: transferSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Transfer not found') },
        },
      },
      delete: {
        tags: ['Inventory – Transfers'],
        summary: 'Delete a draft transfer',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Transfer deleted') },
          400: { description: 'Only drafts can be deleted', ...errorResponse('Only draft transfers can be deleted') },
          404: { description: 'Not found', ...errorResponse('Transfer not found') },
        },
      },
    },

    '/stock-transfers/{id}/dispatch': {
      post: {
        tags: ['Inventory – Transfers'],
        summary: 'Dispatch a draft transfer',
        description: 'Deducts stock from the source location and marks transfer as dispatched.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Dispatched', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: transferSchema } } } } },
          400: { description: 'Only drafts can be dispatched', ...errorResponse('Only draft transfers can be dispatched') },
          404: { description: 'Not found', ...errorResponse('Transfer not found') },
        },
      },
    },

    '/stock-transfers/{id}/receive': {
      post: {
        tags: ['Inventory – Transfers'],
        summary: 'Receive a dispatched transfer',
        description: 'Adds stock to the destination location. Supply `receivedQtys` map to record partial receipt.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  receivedQtys: {
                    type: 'object',
                    description: 'Map of productId → received quantity. Omit to use qty_sent for all items.',
                    additionalProperties: { type: 'integer' },
                    example: { 'uuid-product-1': 4, 'uuid-product-2': 5 },
                  },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Received', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: transferSchema } } } } },
          400: { description: 'Only dispatched transfers can be received', ...errorResponse('Only dispatched transfers can be received') },
          404: { description: 'Not found', ...errorResponse('Transfer not found') },
        },
      },
    },

    // ── Stock Counts ──────────────────────────────────────────────────────────

    '/stock-counts': {
      get: {
        tags: ['Inventory – Stock Counts'],
        summary: 'List stock counts',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['in_progress', 'approved'] } },
        ],
        responses: { 200: { description: 'List of stock counts', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: stockCountSchema } } } } } } },
      },
      post: {
        tags: ['Inventory – Stock Counts'],
        summary: 'Start a new stock count',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'items'],
                properties: {
                  title:          { type: 'string', example: 'Monthly Count April 2026' },
                  date:           { type: 'string', format: 'date' },
                  type:           { type: 'string', enum: ['full', 'category'], default: 'full' },
                  categoryFilter: { type: 'string', description: 'Comma-separated category UUIDs for category count' },
                  locationId:     { type: 'string', format: 'uuid', nullable: true },
                  notes:          { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['productId', 'systemQty'],
                      properties: {
                        productId:   { type: 'string', format: 'uuid' },
                        productName: { type: 'string' },
                        sku:         { type: 'string' },
                        unit:        { type: 'string' },
                        category:    { type: 'string' },
                        systemQty:   { type: 'integer', example: 25 },
                        unitCost:    { type: 'number',  example: 35000 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Count started', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: stockCountSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('Title is required') },
        },
      },
    },

    '/stock-counts/{id}': {
      get: {
        tags: ['Inventory – Stock Counts'],
        summary: 'Get a single stock count',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Count detail with all items', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: stockCountSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Stock count not found') },
        },
      },
      put: {
        tags: ['Inventory – Stock Counts'],
        summary: 'Save progress or complete a count',
        description: 'Pass updated `items` array with `countedQty` values. Set `complete: true` to finalise — applies all variances to stock.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items'],
                properties: {
                  complete: { type: 'boolean', default: false, description: 'Set true to finalise count and update stock' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId:    { type: 'string', format: 'uuid' },
                        productName:  { type: 'string' },
                        sku:          { type: 'string' },
                        systemQty:    { type: 'integer', example: 25 },
                        countedQty:   { type: 'integer', example: 23, nullable: true },
                        difference:   { type: 'integer', example: -2 },
                        unitCost:     { type: 'number',  example: 35000 },
                        valueVariance:{ type: 'number',  example: -70000 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Progress saved or count completed', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: stockCountSchema } } } } },
          400: { description: 'Already completed', ...errorResponse('Count is already completed') },
          404: { description: 'Not found', ...errorResponse('Stock count not found') },
        },
      },
      delete: {
        tags: ['Inventory – Stock Counts'],
        summary: 'Delete an in-progress count',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Stock count deleted') },
          400: { description: 'Approved counts cannot be deleted', ...errorResponse('Approved counts cannot be deleted') },
          404: { description: 'Not found', ...errorResponse('Stock count not found') },
        },
      },
    },

    // ── Expiry Records ────────────────────────────────────────────────────────

    '/expiry-records': {
      get: {
        tags: ['Inventory – Expiry Tracking'],
        summary: 'List expiry records',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search',    in: 'query', schema: { type: 'string' } },
          { name: 'status',    in: 'query', schema: { type: 'string', enum: ['active', 'near_expiry', 'expired', 'disposed'] }, description: 'near_expiry = expiry within 30 days; expired = past today' },
          { name: 'productId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'List of expiry records', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: expiryRecordSchema } } } } } } },
      },
      post: {
        tags: ['Inventory – Expiry Tracking'],
        summary: 'Create an expiry record',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'expiryDate', 'qty'],
                properties: {
                  productId:         { type: 'string', format: 'uuid' },
                  batchNo:           { type: 'string', example: 'BTH-2024-08' },
                  expiryDate:        { type: 'string', format: 'date', example: '2026-06-30' },
                  manufacturingDate: { type: 'string', format: 'date', nullable: true },
                  qty:               { type: 'integer', example: 48 },
                  locationId:        { type: 'string', format: 'uuid', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Record created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: expiryRecordSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('productId, expiryDate and qty are required') },
        },
      },
    },

    '/expiry-records/{id}/dispose': {
      post: {
        tags: ['Inventory – Expiry Tracking'],
        summary: 'Mark a batch as disposed',
        description: 'Records disposal quantity and deducts from stock.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  disposedQty: { type: 'integer', description: 'Defaults to full batch qty' },
                  notes:       { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Disposed', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: expiryRecordSchema } } } } },
          400: { description: 'Already disposed', ...errorResponse('Record is already disposed') },
          404: { description: 'Not found', ...errorResponse('Expiry record not found') },
        },
      },
    },

    '/expiry-records/{id}': {
      delete: {
        tags: ['Inventory – Expiry Tracking'],
        summary: 'Delete an expiry record',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Expiry record deleted') },
          404: { description: 'Not found', ...errorResponse('Expiry record not found') },
        },
      },
    },
  },
};

module.exports = inventoryDocs;
