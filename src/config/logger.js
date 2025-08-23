import morgan from 'morgan';

// Custom Morgan format for development
const devFormat = ':method :url :status :response-time ms - :res[content-length]';

// Custom Morgan format for production (more detailed)
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

/**
 * Get Morgan logger middleware based on environment
 */
export function getLogger() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Colorized output for development
    return morgan(devFormat, {
      // Skip logging during tests
      skip: (req, res) => process.env.NODE_ENV === 'test'
    });
  } else {
    // More detailed logging for production
    return morgan(prodFormat, {
      skip: (req, res) => process.env.NODE_ENV === 'test'
    });
  }
}

/**
 * Custom logger for application events
 */
export const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },

  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },

  warn: (message, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  },

  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
};

export default { getLogger, logger };