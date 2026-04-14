const swaggerUi      = require('swagger-ui-express');
const authDocs       = require('./docs/auth.docs');
const masterdataDocs = require('./docs/masterdata.docs');
const purchaseDocs   = require('./docs/purchase.docs');
const inventoryDocs  = require('./docs/inventory.docs');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title:       'StockBD Inventory API',
    version:     '1.0.0',
    description: 'API documentation for the StockBD Inventory Management SaaS backend',
  },
  servers: [
    { url: 'http://localhost:5000/api/v1',           description: 'Local development' },
    { url: 'https://inventoryos.netlify.app/api/v1', description: 'Production (Netlify)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
        description:  'Enter your access token from /auth/login',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Authentication',              description: 'Register, login, token refresh' },
    { name: 'Master Data – Units',         description: 'Units of measure' },
    { name: 'Master Data – Categories',    description: 'Product categories' },
    { name: 'Master Data – Products',      description: 'Product catalogue' },
    { name: 'Master Data – Suppliers',     description: 'Supplier accounts' },
    { name: 'Master Data – Customers',     description: 'Customer accounts' },
    { name: 'Master Data – Locations',     description: 'Warehouses / branches' },
    { name: 'Purchase – Purchases',        description: 'Purchase orders and receiving' },
    { name: 'Purchase – Returns',          description: 'Purchase return notes' },
    { name: 'Purchase – Supplier Payments',description: 'Payments made to suppliers' },
    { name: 'Inventory – Adjustments',     description: 'Manual stock corrections' },
    { name: 'Inventory – Movements',       description: 'Read-only stock movement ledger' },
    { name: 'Inventory – Transfers',       description: 'Inter-location stock transfers' },
    { name: 'Inventory – Stock Counts',    description: 'Physical inventory counting' },
    { name: 'Inventory – Expiry Tracking', description: 'Batch expiry dates and disposal' },
  ],
  paths: {
    ...authDocs.paths,
    ...masterdataDocs.paths,
    ...purchaseDocs.paths,
    ...inventoryDocs.paths,
  },
};

const swaggerUiOptions = {
  customSiteTitle: 'StockBD API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

module.exports = { swaggerUi, swaggerDefinition, swaggerUiOptions };
