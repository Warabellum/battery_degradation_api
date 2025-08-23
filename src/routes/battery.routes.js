import express from 'express';
import { BatteryController } from '../controllers/battery.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { batteryAnalysisSchema, batteryHealthSchema } from '../schemas/battery.schema.js';

const router = express.Router();

// Main battery analysis endpoint (full analysis with trend)
router.post('/analyze',
    validateRequest(batteryAnalysisSchema),
    BatteryController.analyzeHealth
);

// Simplified health summary endpoint
router.post('/health',
    validateRequest(batteryHealthSchema),
    BatteryController.getHealthSummary
);

// Trend data only endpoint
router.post('/trend',
    validateRequest(batteryAnalysisSchema),
    BatteryController.getTrend
);

// API health check
router.get('/status', BatteryController.healthCheck);

// Legacy compatibility routes (if needed)
router.post('/calculate',
    validateRequest(batteryAnalysisSchema),
    BatteryController.analyzeHealth
);

export default router;