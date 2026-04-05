const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Knex / PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'A record with this value already exists' });
  }

  // Knex / PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, error: 'Referenced record does not exist' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode < 500 ? err.message : 'Internal server error';

  return res.status(statusCode).json({ success: false, error: message });
};

module.exports = errorHandler;
