// Battery Degradation API - RapidAPI Ready
// Updated server.js with RapidAPI integration
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import batteryRoutes from './src/routes/battery.routes.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandlers.js';
import { getLogger, logger } from './src/config/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration - Updated for RapidAPI compatibility
app.use(cors({
  origin: [
    'http://localhost:3000',      // Local development
    'http://localhost:5173',      // Vite dev server
    'https://rapidapi.com',       // RapidAPI testing interface
    'https://rapidapi.com/*',     // RapidAPI subdomains
    'https://*.rapidapi.com'      // All RapidAPI domains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-RapidAPI-Key',
    'X-RapidAPI-Host',
    'X-RapidAPI-User'
  ]
}));

// Logging middleware
app.use(getLogger());

// RapidAPI Integration Middleware (Production Only)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/battery', (req, res, next) => {
    // Extract RapidAPI headers
    const rapidAPIKey = req.headers['x-rapidapi-key'];
    const rapidAPIHost = req.headers['x-rapidapi-host'];
    const rapidAPIUser = req.headers['x-rapidapi-user'];

    // Log RapidAPI request details
    if (rapidAPIKey) {
      logger.info('RapidAPI Request Received:', {
        hasKey: !!rapidAPIKey,
        host: rapidAPIHost,
        user: rapidAPIUser || 'anonymous',
        endpoint: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      // Store RapidAPI info in request for analytics
      req.rapidAPI = {
        key: rapidAPIKey,
        host: rapidAPIHost,
        user: rapidAPIUser
      };
    }

    next();
  });

  // Simple usage analytics (Production Only)
  app.use('/api/battery', (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('Request Analytics:', {
        user: req.rapidAPI?.user || 'anonymous',
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    });

    next();
  });
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint - Enhanced for RapidAPI
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Battery Degradation Analysis API',
    version: '1.0.0',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    rapidAPI_ready: process.env.NODE_ENV === 'production',
    timestamp: new Date().toISOString(),
    endpoints: {
      analyze: {
        method: 'POST',
        path: '/api/battery/analyze',
        description: 'Complete battery health analysis with predictions'
      },
      health: {
        method: 'POST',
        path: '/api/battery/health',
        description: 'Quick battery health summary and status'
      },
      trend: {
        method: 'POST',
        path: '/api/battery/trend',
        description: 'Degradation trend data for visualization'
      },
      status: {
        method: 'GET',
        path: '/api/battery/status',
        description: 'API status and system information'
      }
    },
  });
});

// API routes
app.use('/api/battery', batteryRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Battery Degradation API server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    rapidAPI_ready: process.env.NODE_ENV === 'production',
    timestamp: new Date().toISOString(),
    urls: {
      local: `http://localhost:${PORT}`,
      health: `http://localhost:${PORT}/`,
      api: `http://localhost:${PORT}/api/battery`
    }
  });

  // Show startup message
  console.log('\n🔋 Battery Degradation API v1.0');
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ RapidAPI Ready: ${process.env.NODE_ENV === 'production' ? 'YES' : 'NO (dev mode)'}`);
  console.log('\n📚 Available endpoints:');
  console.log('  GET  /                     - API information');
  console.log('  POST /api/battery/analyze  - Complete analysis');
  console.log('  POST /api/battery/health   - Health summary');
  console.log('  POST /api/battery/trend    - Trend data');
  console.log('  GET  /api/battery/status   - System status');
  console.log('\n🚀 Ready for RapidAPI integration!\n');
});

export default app;