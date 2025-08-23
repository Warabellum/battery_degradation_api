import { ZodError } from 'zod';

/**
 * Middleware to validate request body against Zod schema
 * @param {Object} schema - Zod validation schema
 * @returns {Function} Express middleware function
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      // Validate and parse the request body
      const validatedData = schema.parse(req.body);

      // Replace req.body with validated and transformed data
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid request data',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }

      // Handle other validation errors
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message || 'Invalid request data',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Middleware to validate query parameters
 * @param {Object} schema - Zod validation schema
 * @returns {Function} Express middleware function
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));

        return res.status(400).json({
          success: false,
          error: 'Query Validation Error',
          message: 'Invalid query parameters',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Query Validation Error',
        message: error.message || 'Invalid query parameters',
        timestamp: new Date().toISOString()
      });
    }
  };
}