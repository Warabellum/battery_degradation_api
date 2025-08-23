/**
 * Global error handling middleware for Express
 * This should be the last middleware in your app
 */
export function errorHandler(err, req, res, next) {
  // Log the error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid Data Format',
      message: 'Invalid data format provided',
      timestamp: new Date().toISOString()
    });
  }

  // Handle calculation/business logic errors
  if (err.message && err.message.includes('Battery analysis failed')) {
    return res.status(422).json({
      success: false,
      error: 'Analysis Error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Handle rate limiting errors (if you add rate limiting later)
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message: statusCode === 500
      ? 'An internal server error occurred'
      : err.message || 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: {
      'POST /api/battery/analyze': 'Full battery analysis',
      'POST /api/battery/health': 'Health summary only',
      'POST /api/battery/trend': 'Trend data only',
      'GET /api/battery/status': 'API health check'
    },
    timestamp: new Date().toISOString()
  });
}