/**
 * Global error handler — must be registered last in Express.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  // SQLite unique-constraint violation
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      message: 'A record with that value already exists.',
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'An unexpected error occurred.';

  res.status(status).json({ success: false, message });
};

/**
 * 404 handler — catches requests that reached no route.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
