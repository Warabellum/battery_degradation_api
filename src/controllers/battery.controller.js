import { BatteryService } from '../services/battery.service.js';

export class BatteryController {

  /**
   * Analyze battery health and degradation with trend
   * POST /api/battery/analyze
   */
  static async analyzeHealth(req, res, next) {
    try {
      const result = BatteryService.analyzeBatteryHealth(req.body);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get simplified health summary
   * POST /api/battery/health
   */
  static async getHealthSummary(req, res, next) {
    try {
      const result = BatteryService.getHealthSummary(req.body);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get trend data only (for charts/visualization)
   * POST /api/battery/trend
   */
  static async getTrend(req, res, next) {
    try {
      const fullAnalysis = BatteryService.analyzeBatteryHealth(req.body);

      res.status(200).json({
        success: true,
        data: {
          trend: fullAnalysis.results.trend,
          metadata: {
            totalCycles: req.body.chargeCycles || 0,
            currentHealth: fullAnalysis.results.healthPercentage,
            confidence: fullAnalysis.results.confidence
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check endpoint
   * GET /api/battery/status
   */
  static async healthCheck(req, res) {
    res.status(200).json({
      success: true,
      message: 'Battery Degradation API is running',
      version: '1.0.0',
      endpoints: {
        analyze: 'POST /api/battery/analyze - Full battery analysis',
        health: 'POST /api/battery/health - Health summary only',
        trend: 'POST /api/battery/trend - Trend data only',
        status: 'GET /api/battery/status - API health check'
      }
    });
  }
}

// Legacy compatibility functions (if you need them)
export function calculateHealthAndTrend(payload) {
  return BatteryService.analyzeBatteryHealth(payload);
}

export function generateTrendOnly(payload) {
  const fullAnalysis = BatteryService.analyzeBatteryHealth(payload);
  return fullAnalysis.results.trend;
}