require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const db                                                 = require('./config/db');
const routes                                             = require('./modules/index');
const { swaggerUi, swaggerDefinition, swaggerUiOptions } = require('./swagger');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    // and any Netlify subdomain or localhost
    if (!origin) return cb(null, true);
    if (/\.netlify\.app$/.test(origin) || /^http:\/\/localhost/.test(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDefinition, swaggerUiOptions));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'StockBD API is running' });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === '23505') return res.status(409).json({ success: false, error: 'A record with this value already exists' });
  if (err.code === '23503') return res.status(400).json({ success: false, error: 'Referenced record does not exist' });
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ success: false, error: status < 500 ? err.message : 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('PostgreSQL connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;
