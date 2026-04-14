// ─── Reusable response schemas ────────────────────────────────────────────────

const errorResponse = (example = 'Error message') => ({
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error:   { type: 'string',  example },
        },
      },
    },
  },
});

const successMessage = (example = 'Deleted successfully') => ({
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string',  example },
        },
      },
    },
  },
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

const unitSchema = {
  type: 'object',
  properties: {
    id:           { type: 'string', format: 'uuid', example: 'uuid-here' },
    name:         { type: 'string', example: 'Kilogram' },
    abbreviation: { type: 'string', example: 'kg' },
    description:  { type: 'string', example: 'Weight unit' },
    createdAt:    { type: 'string', format: 'date-time' },
  },
};

const categorySchema = {
  type: 'object',
  properties: {
    id:           { type: 'string', format: 'uuid' },
    name:         { type: 'string', example: 'Electronics' },
    description:  { type: 'string', example: 'Electronic goods' },
    productCount: { type: 'integer', example: 12 },
    createdAt:    { type: 'string', format: 'date-time' },
  },
};

const productSchema = {
  type: 'object',
  properties: {
    id:                { type: 'string', format: 'uuid' },
    name:              { type: 'string', example: 'Samsung Galaxy A54' },
    sku:               { type: 'string', example: 'MOB-001' },
    barcode:           { type: 'string', example: '8801234567890' },
    categoryId:        { type: 'string', format: 'uuid' },
    unitId:            { type: 'string', format: 'uuid' },
    purchasePrice:     { type: 'number', example: 35000 },
    sellingPrice:      { type: 'number', example: 38000 },
    vatRate:           { type: 'number', example: 5 },
    stock:             { type: 'integer', example: 25 },
    lowStockThreshold: { type: 'integer', example: 5 },
    description:       { type: 'string', example: 'Mid-range Android phone' },
    status:            { type: 'string', enum: ['active', 'inactive'] },
    createdAt:         { type: 'string', format: 'date-time' },
  },
};

const supplierSchema = {
  type: 'object',
  properties: {
    id:             { type: 'string', format: 'uuid' },
    name:           { type: 'string', example: 'Dhaka Electronics Wholesale' },
    phone:          { type: 'string', example: '01812345678' },
    email:          { type: 'string', example: 'supplier@dew.com' },
    address:        { type: 'string', example: '12 Nawabpur Road, Dhaka' },
    paymentTerms:   { type: 'string', enum: ['Cash', '7 days', '15 days', '30 days'] },
    openingBalance: { type: 'number', example: 5000 },
    totalPurchases: { type: 'number', example: 150000 },
    dueBalance:     { type: 'number', example: 12000 },
    status:         { type: 'string', enum: ['active', 'inactive'] },
    createdAt:      { type: 'string', format: 'date-time' },
  },
};

const customerSchema = {
  type: 'object',
  properties: {
    id:             { type: 'string', format: 'uuid' },
    name:           { type: 'string', example: 'Karim Traders' },
    phone:          { type: 'string', example: '01911223344' },
    type:           { type: 'string', enum: ['Retail', 'Wholesale'] },
    address:        { type: 'string', example: 'Mirpur-1, Dhaka' },
    customPrice:    { type: 'boolean', example: false },
    creditLimit:    { type: 'number', example: 10000 },
    openingBalance: { type: 'number', example: 0 },
    totalSales:     { type: 'number', example: 45000 },
    dueBalance:     { type: 'number', example: 2500 },
    status:         { type: 'string', enum: ['active', 'inactive'] },
    createdAt:      { type: 'string', format: 'date-time' },
  },
};

const locationSchema = {
  type: 'object',
  properties: {
    id:        { type: 'string', format: 'uuid' },
    name:      { type: 'string', example: 'Main Warehouse' },
    address:   { type: 'string', example: 'Tejgaon, Dhaka' },
    phone:     { type: 'string', example: '01700000001' },
    isDefault: { type: 'boolean', example: true },
    isActive:  { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const masterdataDocs = {
  paths: {

    // ── Units ────────────────────────────────────────────────────────────────

    '/units': {
      get: {
        tags: ['Master Data – Units'],
        summary: 'List all units of measure',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of units',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'array', items: unitSchema } } } } },
          },
          401: { description: 'Unauthorized', ...errorResponse('Access token required') },
        },
      },
      post: {
        tags: ['Master Data – Units'],
        summary: 'Create a unit',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['name', 'abbreviation'],
                properties: {
                  name:         { type: 'string', example: 'Kilogram' },
                  abbreviation: { type: 'string', example: 'kg' },
                  description:  { type: 'string', example: 'Weight unit' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Unit created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: unitSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('Name and abbreviation are required') },
        },
      },
    },

    '/units/{id}': {
      put: {
        tags: ['Master Data – Units'],
        summary: 'Update a unit',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['name', 'abbreviation'], properties: { name: { type: 'string' }, abbreviation: { type: 'string' }, description: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'Unit updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: unitSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Unit not found') },
        },
      },
      delete: {
        tags: ['Master Data – Units'],
        summary: 'Delete a unit',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Unit deleted') },
          404: { description: 'Not found', ...errorResponse('Unit not found') },
        },
      },
    },

    // ── Categories ───────────────────────────────────────────────────────────

    '/categories': {
      get: {
        tags: ['Master Data – Categories'],
        summary: 'List all categories',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of categories', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'array', items: categorySchema } } } } } },
        },
      },
      post: {
        tags: ['Master Data – Categories'],
        summary: 'Create a category',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'Electronics' }, description: { type: 'string' } } } } },
        },
        responses: {
          201: { description: 'Category created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: categorySchema } } } } },
          400: { description: 'Validation error', ...errorResponse('Name is required') },
        },
      },
    },

    '/categories/{id}': {
      put: {
        tags: ['Master Data – Categories'],
        summary: 'Update a category',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' } } } } } },
        responses: {
          200: { description: 'Category updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: categorySchema } } } } },
          404: { description: 'Not found', ...errorResponse('Category not found') },
        },
      },
      delete: {
        tags: ['Master Data – Categories'],
        summary: 'Delete a category',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Category deleted') },
          404: { description: 'Not found', ...errorResponse('Category not found') },
        },
      },
    },

    // ── Products ─────────────────────────────────────────────────────────────

    '/products': {
      get: {
        tags: ['Master Data – Products'],
        summary: 'List products (paginated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search',   in: 'query', schema: { type: 'string' },  description: 'Search by name or SKU' },
          { name: 'category', in: 'query', schema: { type: 'string' },  description: 'Filter by category UUID' },
          { name: 'status',   in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
          { name: 'lowstock', in: 'query', schema: { type: 'boolean' }, description: 'Return only low-stock products' },
          { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',    in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Paginated product list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: productSchema },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 120 },
                        page:  { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Master Data – Products'],
        summary: 'Create a product',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'sku', 'categoryId', 'unitId', 'purchasePrice', 'sellingPrice'],
                properties: {
                  name:              { type: 'string', example: 'Samsung Galaxy A54' },
                  sku:               { type: 'string', example: 'MOB-001' },
                  barcode:           { type: 'string', example: '8801234567890' },
                  categoryId:        { type: 'string', format: 'uuid' },
                  unitId:            { type: 'string', format: 'uuid' },
                  purchasePrice:     { type: 'number', example: 35000 },
                  sellingPrice:      { type: 'number', example: 38000 },
                  vatRate:           { type: 'number', example: 5, default: 0 },
                  lowStockThreshold: { type: 'integer', example: 5, default: 5 },
                  description:       { type: 'string' },
                  status:            { type: 'string', enum: ['active', 'inactive'], default: 'active' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Product created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: productSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('name, sku, categoryId, unitId, purchasePrice and sellingPrice are required') },
          409: { description: 'SKU already exists', ...errorResponse('A record with this value already exists') },
        },
      },
    },

    '/products/{id}': {
      put: {
        tags: ['Master Data – Products'],
        summary: 'Update a product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, sellingPrice: { type: 'number' }, status: { type: 'string', enum: ['active', 'inactive'] } } } } } },
        responses: {
          200: { description: 'Product updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: productSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Product not found') },
        },
      },
      delete: {
        tags: ['Master Data – Products'],
        summary: 'Delete a product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Product deleted') },
          404: { description: 'Not found', ...errorResponse('Product not found') },
        },
      },
    },

    // ── Suppliers ────────────────────────────────────────────────────────────

    '/suppliers': {
      get: {
        tags: ['Master Data – Suppliers'],
        summary: 'List suppliers',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
        ],
        responses: { 200: { description: 'List of suppliers', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: supplierSchema } } } } } } },
      },
      post: {
        tags: ['Master Data – Suppliers'],
        summary: 'Create a supplier',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone', 'paymentTerms'],
                properties: {
                  name:           { type: 'string', example: 'Dhaka Electronics' },
                  phone:          { type: 'string', example: '01812345678' },
                  email:          { type: 'string' },
                  address:        { type: 'string' },
                  paymentTerms:   { type: 'string', enum: ['Cash', '7 days', '15 days', '30 days'] },
                  openingBalance: { type: 'number', example: 0 },
                  status:         { type: 'string', enum: ['active', 'inactive'], default: 'active' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Supplier created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: supplierSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('name, phone and paymentTerms are required') },
        },
      },
    },

    '/suppliers/{id}': {
      put: {
        tags: ['Master Data – Suppliers'],
        summary: 'Update a supplier',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, status: { type: 'string', enum: ['active', 'inactive'] } } } } } },
        responses: {
          200: { description: 'Supplier updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: supplierSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Supplier not found') },
        },
      },
      delete: {
        tags: ['Master Data – Suppliers'],
        summary: 'Delete a supplier',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Supplier deleted') },
          404: { description: 'Not found', ...errorResponse('Supplier not found') },
        },
      },
    },

    // ── Customers ────────────────────────────────────────────────────────────

    '/customers': {
      get: {
        tags: ['Master Data – Customers'],
        summary: 'List customers',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'type',   in: 'query', schema: { type: 'string', enum: ['Retail', 'Wholesale'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
        ],
        responses: { 200: { description: 'List of customers', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: customerSchema } } } } } } },
      },
      post: {
        tags: ['Master Data – Customers'],
        summary: 'Create a customer',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone', 'type'],
                properties: {
                  name:           { type: 'string', example: 'Karim Traders' },
                  phone:          { type: 'string', example: '01911223344' },
                  type:           { type: 'string', enum: ['Retail', 'Wholesale'] },
                  address:        { type: 'string' },
                  customPrice:    { type: 'boolean', default: false },
                  creditLimit:    { type: 'number', example: 10000 },
                  openingBalance: { type: 'number', example: 0 },
                  status:         { type: 'string', enum: ['active', 'inactive'], default: 'active' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Customer created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: customerSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('name, phone and type are required') },
        },
      },
    },

    '/customers/{id}': {
      put: {
        tags: ['Master Data – Customers'],
        summary: 'Update a customer',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, creditLimit: { type: 'number' } } } } } },
        responses: {
          200: { description: 'Customer updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: customerSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Customer not found') },
        },
      },
      delete: {
        tags: ['Master Data – Customers'],
        summary: 'Delete a customer',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Customer deleted') },
          404: { description: 'Not found', ...errorResponse('Customer not found') },
        },
      },
    },

    // ── Locations ────────────────────────────────────────────────────────────

    '/locations': {
      get: {
        tags: ['Master Data – Locations'],
        summary: 'List locations / warehouses',
        description: 'Returns active locations by default. Pass `includeInactive=true` to include inactive ones.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'includeInactive', in: 'query', schema: { type: 'boolean' }, description: 'Include inactive locations' },
        ],
        responses: { 200: { description: 'List of locations', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'array', items: locationSchema } } } } } } },
      },
      post: {
        tags: ['Master Data – Locations'],
        summary: 'Create a location',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name:    { type: 'string', example: 'Branch Uttara' },
                  address: { type: 'string', example: 'Sector 7, Uttara, Dhaka' },
                  phone:   { type: 'string', example: '01700000002' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Location created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: locationSchema } } } } },
          400: { description: 'Validation error', ...errorResponse('Name is required') },
        },
      },
    },

    '/locations/{id}': {
      get: {
        tags: ['Master Data – Locations'],
        summary: 'Get a single location',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Location detail', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: locationSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Location not found') },
        },
      },
      put: {
        tags: ['Master Data – Locations'],
        summary: 'Update a location',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' }, address: { type: 'string' }, phone: { type: 'string' }, isActive: { type: 'boolean' } } },
            },
          },
        },
        responses: {
          200: { description: 'Location updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: locationSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Location not found') },
        },
      },
      delete: {
        tags: ['Master Data – Locations'],
        summary: 'Delete a location',
        description: 'Cannot delete the default location or a location that still holds stock.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', ...successMessage('Location deleted') },
          400: { description: 'Cannot delete default or stocked location', ...errorResponse('Cannot delete the default location') },
          404: { description: 'Not found', ...errorResponse('Location not found') },
        },
      },
    },

    '/locations/{id}/set-default': {
      put: {
        tags: ['Master Data – Locations'],
        summary: 'Set a location as the default',
        description: 'Clears the current default and sets this location as the new default.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Default updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: locationSchema } } } } },
          404: { description: 'Not found', ...errorResponse('Location not found') },
        },
      },
    },

    '/locations/{id}/stock': {
      get: {
        tags: ['Master Data – Locations'],
        summary: 'Get stock held at a location',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Per-product stock at this location',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          productId:     { type: 'string', format: 'uuid' },
                          productName:   { type: 'string', example: 'Samsung Galaxy A54' },
                          sku:           { type: 'string', example: 'MOB-001' },
                          qty:           { type: 'integer', example: 10 },
                          purchasePrice: { type: 'number',  example: 35000 },
                          stockValue:    { type: 'number',  example: 350000 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Not found', ...errorResponse('Location not found') },
        },
      },
    },
  },
};

module.exports = masterdataDocs;
