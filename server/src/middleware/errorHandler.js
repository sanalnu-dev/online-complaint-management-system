function errorHandler(err, req, res, next) {
  // Safe logging of internal error (without credentials)
  console.error('[Error]', {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle JSON parse error in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body'
    });
  }

  // Handle MySQL Duplicate Entry (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique information already exists'
    });
  }

  // Handle MySQL Foreign Key Constraint (ER_NO_REFERENCED_ROW_2)
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced category, user, or complaint does not exist'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
