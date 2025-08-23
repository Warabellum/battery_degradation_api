/**
 * Advanced degradation model v2 (temperature + DoD dependent)
 *
 * Total Fade (%) = Cycle Fade + Calendar Fade
 * Cycle Fade = k_c * (DoD_factor) * sqrt(cycles)
 *   where DoD_factor = (DoD/100)^alpha
 * Calendar Fade = k_t * Arrhenius(T) * time_years^beta
 *   Arrhenius(T) = exp(-Ea / (R * (T+273.15)))
 *
 * Inputs (payload):
 * - chargeCycles: number of full equivalent cycles
 * - avgTemperature: °C
 * - nominalCapacity: Ah or kWh (used for capacity points)
 * - currentCapacity: optional (if provided, overrides model for health)
 * - dodPct: Depth of Discharge in % (0-100)
 * - cRate: optional charge/discharge rate (0-5)
 * - calendarAgeMonths or calendarAgeYears
 */

const R = 8.314; // J/mol·K

function arrhenius(Tk, Ea) {
  return Math.exp(-Ea / (R * Tk));
}

export function computeDegradation(payload, calibrationFactor = 1.0) {
  const {
    chargeCycles = 0,
    avgTemperature = 25,
    nominalCapacity = 100,
    currentCapacity = null,
    dodPct = 80,
    cRate = 0.8,
    calendarAgeMonths,
    calendarAgeYears,
  } = payload;

  const years = typeof calendarAgeYears === 'number'
    ? Math.max(calendarAgeYears, 0)
    : Math.max((calendarAgeMonths || 0) / 12, 0);

  // --- Tunable coefficients (empirical placeholders) ---
  const k_c_base = 0.015 * calibrationFactor; // cycle coefficient (reduced from 0.02)
  const alpha = 0.6;     // DoD sensitivity exponent
  const k_t_base = 0.01 * calibrationFactor; // calendar coefficient (reduced from 0.03)
  const Ea = 25000;      // J/mol activation energy (reduced from 35000)
  const beta = 0.7;      // time exponent (increased from 0.5)

  // Account for higher C-rate stress (linear uplift beyond 1C)
  const cRateAccel = cRate > 1 ? 1 + (cRate - 1) * 0.5 : 1.0;

  // Cycle fade (fraction of nominal)
  const DoD_factor = Math.pow(Math.max(dodPct, 0) / 100, alpha);
  const cycleFadeFraction = k_c_base * DoD_factor * Math.sqrt(Math.max(chargeCycles, 0)) * cRateAccel;

  // Calendar fade (fraction of nominal)
  const Tk = (avgTemperature ?? 25) + 273.15;
  const calendarFadeFraction = years > 0 ? k_t_base * arrhenius(Tk, Ea) * Math.pow(years, beta) : 0;

  const totalFadePct = (cycleFadeFraction + calendarFadeFraction) * 100; // to %

  // Observed health (if currentCapacity provided)
  const modelHealthPct = Math.max(0, 100 - totalFadePct);
  const observedHealthPct = currentCapacity
    ? Math.max(0, Math.min(100, (currentCapacity / nominalCapacity) * 100))
    : modelHealthPct;

  // State of Health & EoL estimate
  const soh = observedHealthPct;
  const eolPct = 70; // configurable

  // Approx monthly fade at current conditions (for naive RUL)
  const yearsElapsed = Math.max(years, 0.1); // Avoid division by zero
  const monthsElapsed = Math.max(1, yearsElapsed * 12);
  const currentFadePct = 100 - soh;
  const monthlyFadeRate = Math.max(currentFadePct / monthsElapsed, 0.05); // %/month
  const remainingFadeNeeded = soh - eolPct;
  const monthsToEol = Math.max(0, remainingFadeNeeded / monthlyFadeRate);

  return {
    healthPct: observedHealthPct,
    soh,
    eolPct,
    estimatedRUIMonths: Math.round(monthsToEol),
    modelHealthPct, // Add this for calibration purposes
    components: {
      cycleFadePct: +(cycleFadeFraction * 100).toFixed(2),
      calendarFadePct: +(calendarFadeFraction * 100).toFixed(2),
    },
  };
}

function calculateCalibrationFactor(payload) {
  const { currentCapacity, nominalCapacity, chargeCycles } = payload;

  if (!currentCapacity || chargeCycles < 50) {
    return 1.0; // No calibration if no measurement or too few cycles
  }

  // Get uncalibrated model prediction
  const modelResult = computeDegradation(payload, 1.0);
  const actualHealthPct = (currentCapacity / nominalCapacity) * 100;
  const modelHealthPct = modelResult.modelHealthPct;

  // Calculate how much actual degradation vs model prediction
  const actualFadePct = 100 - actualHealthPct;
  const modelFadePct = 100 - modelHealthPct;

  if (modelFadePct < 0.1) return 1.0; // Avoid division by very small numbers

  return Math.max(0.1, Math.min(3.0, actualFadePct / modelFadePct)); // Constrain between 0.1-3.0
}

export function buildTrend(payload) {
  const {
    chargeCycles = 0,
    avgTemperature = 25,
    nominalCapacity = 100,
    dodPct = 80,
    cRate = 0.8,
    calendarAgeMonths,
    calendarAgeYears,
    currentCapacity = null,
  } = payload;

  const totalCycles = Math.max(chargeCycles, 0);
  const step = Math.max(25, Math.floor(totalCycles / 20) || 25);

  // Calculate calibration factor if we have actual measurement
  const calibrationFactor = calculateCalibrationFactor(payload);

  const points = [];

  // Generate calibrated trend
  for (let i = 0; i <= totalCycles; i += step) {
    const yearsProgress = (
      typeof calendarAgeYears === 'number'
        ? calendarAgeYears
        : (calendarAgeMonths || 0) / 12
    ) * (i / Math.max(totalCycles || 1, 1));

    const sim = computeDegradation({
      chargeCycles: i,
      avgTemperature,
      nominalCapacity,
      currentCapacity: null, // Don't use actual measurement in trend generation
      dodPct,
      cRate,
      calendarAgeYears: yearsProgress,
    }, calibrationFactor);

    const capacity = (sim.healthPct / 100) * nominalCapacity;
    points.push({
      cycle: i,
      healthPct: +sim.healthPct.toFixed(2),
      capacity: +capacity.toFixed(2)
    });
  }

  // Ensure last point is exactly at totalCycles
  if (points[points.length - 1].cycle < totalCycles) {
    const yearsAtEnd = typeof calendarAgeYears === 'number'
      ? calendarAgeYears
      : (calendarAgeMonths || 0) / 12;

    const sim = computeDegradation({
      ...payload,
      currentCapacity: null,
      chargeCycles: totalCycles,
      calendarAgeYears: yearsAtEnd
    }, calibrationFactor);

    const capacity = (sim.healthPct / 100) * nominalCapacity;
    points.push({
      cycle: totalCycles,
      healthPct: +sim.healthPct.toFixed(2),
      capacity: +capacity.toFixed(2)
    });
  }

  return points;
}

// New function to get model confidence based on calibration
export function getModelConfidence(payload) {
  const { currentCapacity, chargeCycles } = payload;

  if (!currentCapacity || chargeCycles < 50) {
    return {
      level: 'low',
      description: 'Insufficient cycle data for accurate prediction',
      accuracy: '±6 months'
    };
  }

  const calibrationFactor = calculateCalibrationFactor(payload);

  if (calibrationFactor >= 0.8 && calibrationFactor <= 1.2) {
    return {
      level: 'high',
      description: 'Model closely matches measured performance',
      accuracy: '±2 months'
    };
  } else if (calibrationFactor >= 0.5 && calibrationFactor <= 2.0) {
    return {
      level: 'medium',
      description: 'Model adjusted based on actual measurements',
      accuracy: '±4 months'
    };
  } else {
    return {
      level: 'low',
      description: 'Significant deviation between model and measurements',
      accuracy: '±6 months'
    };
  }
}