import { z } from 'zod';

// Full battery analysis schema
export const batteryAnalysisSchema = z.object({
  chargeCycles: z.number().min(0).max(10000).optional().default(0),
  avgTemperature: z.number().min(-40).max(80).optional().default(25),
  nominalCapacity: z.number().min(0.1).max(10000),
  currentCapacity: z.number().min(0).max(10000).optional().nullable(),
  cRate: z.number().min(0.1).max(5).optional().default(0.8),
  dodPct: z.number().min(10).max(100).optional().default(80),
  calendarAgeMonths: z.number().min(0).max(360).optional(),
  calendarAgeYears: z.number().min(0).max(30).optional(),
  unit: z.enum(['Ah', 'kWh', 'Wh']).optional().default('Ah')
});

// Simplified health check schema (fewer required fields)
export const batteryHealthSchema = z.object({
  nominalCapacity: z.number().min(0.1).max(10000),
  currentCapacity: z.number().min(0).max(10000).optional().nullable(),
  chargeCycles: z.number().min(0).max(10000).optional().default(0),
  avgTemperature: z.number().min(-40).max(80).optional().default(25),
  calendarAgeMonths: z.number().min(0).max(360).optional().default(12), // Default to 1 year instead of 0
  dodPct: z.number().min(10).max(100).optional().default(80),
  unit: z.enum(['Ah', 'kWh', 'Wh']).optional().default('Ah')
});

// Validation for trend-only requests
export const batteryTrendSchema = batteryAnalysisSchema;