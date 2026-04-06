const swaggerUi  = require('swagger-ui-express');
const authDocs   = require('./docs/auth.docs');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title:       'StockBD Inventory API',
    version:     '1.0.0',
    description: 'API documentation for the StockBD Inventory Management SaaS backend',
  },
  servers: [
    { url: 'http://localhost:5000/api/v1',          description: 'Local development' },
    { url: 'https://inventoryos.netlify.app/api/v1', description: 'Production (Netlify)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
        description:  'Enter your access token',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    ...authDocs.paths,
  },
};

const swaggerUiOptions = {
  customSiteTitle: 'StockBD API Docs',
};

module.exports = { swaggerUi, swaggerDefinition, swaggerUiOptions };
