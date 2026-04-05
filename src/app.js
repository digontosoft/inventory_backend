const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./modules/auth/auth.routes');
const categoryRoutes = require('./modules/categories/category.routes');
const unitRoutes = require('./modules/units/unit.routes');
const productRoutes = require('./modules/products/product.routes');
const supplierRoutes = require('./modules/suppliers/supplier.routes');
const customerRoutes = require('./modules/customers/customer.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Routes
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/categories`, categoryRoutes);
app.use(`${API}/units`, unitRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/suppliers`, supplierRoutes);
app.use(`${API}/customers`, customerRoutes);

// 404
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Global error handler
app.use(errorHandler);

module.exports = app;
