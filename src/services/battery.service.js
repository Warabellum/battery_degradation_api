import { computeDegradation, buildTrend, getModelConfidence } from '../utils/degradationCalculator.js';

export class BatteryService {

  /**
   * Analyze battery health and degradation
   * @param {Object} input - Battery parameters
   * @returns {Object} Complete battery analysis
   */
  static analyzeBatteryHealth(input) {
    try {
      // Validate required fields
      if (!input.nominalCapacity || input.nominalCapacity <= 0) {
        throw new Error('nominalCapacity must be a positive number');
      }

      // Compute degradation analysis
      const degradationResult = computeDegradation(input);
      const trend = buildTrend(input);
      const confidence = getModelConfidence(input);

      // Determine battery status
      const status = this.determineBatteryStatus(degradationResult.soh, input.currentCapacity);

      // Build comprehensive response
      const result = {
        meta: {
          unitCapacity: input.unit || "Ah",
          modelVersion: "v1.0-calibrated",
          generatedAt: new Date().toISOString(),
          assumptions: {
            tempAccelerationAbove30C: 1.5,
            baseCycleFadePer100: 2,
            calibrationApplied: !!input.currentCapacity
          }
        },
        input: {
          chargeCycles: input.chargeCycles || 0,
          avgTemperature: input.avgTemperature || 25,
          nominalCapacity: input.nominalCapacity,
          currentCapacity: input.currentCapacity || null,
          cRate: input.cRate || 0.8,
          dodPct: input.dodPct || 80,
          calendarAgeMonths: input.calendarAgeMonths || 0,
          unit: input.unit || "Ah"
        },
        results: {
          healthPercentage: degradationResult.healthPct,
          stateOfHealthSOH: degradationResult.soh,
          endOfLifeThresholdPct: degradationResult.eolPct,
          estimatedRemainingUsefulLifeMonths: degradationResult.estimatedRUIMonths,
          status: status.status,
          statusDescription: status.description,
          confidence: {
            level: confidence.level,
            description: confidence.description,
            accuracy: confidence.accuracy
          },
          degradationComponents: {
            cycleFadePct: degradationResult.components.cycleFadePct,
            calendarFadePct: degradationResult.components.calendarFadePct,
            totalFadePct: +(degradationResult.components.cycleFadePct + degradationResult.components.calendarFadePct).toFixed(2)
          },
          trend: trend,
          recommendations: this.generateRecommendations(input, degradationResult)
        }
      };

      return result;

    } catch (error) {
      throw new Error(`Battery analysis failed: ${error.message}`);
    }
  }

  /**
   * Determine battery status based on SOH
   * @param {number} soh - State of Health percentage
   * @param {number|null} currentCapacity - Current measured capacity
   * @returns {Object} Status information
   */
  static determineBatteryStatus(soh, currentCapacity = null) {
    const dataSource = currentCapacity ? 'measured' : 'estimated';

    if (soh >= 90) {
      return {
        status: 'Excellent',
        description: `Battery health is excellent (${dataSource})`,
        color: 'green'
      };
    } else if (soh >= 80) {
      return {
        status: 'Good',
        description: `Battery health is good (${dataSource})`,
        color: 'lightgreen'
      };
    } else if (soh >= 70) {
      return {
        status: 'Fair',
        description: `Battery health is fair - monitor closely (${dataSource})`,
        color: 'yellow'
      };
    } else if (soh >= 60) {
      return {
        status: 'Poor',
        description: `Battery health is poor - consider replacement (${dataSource})`,
        color: 'orange'
      };
    } else {
      return {
        status: 'Critical',
        description: `Battery health is critical - replacement needed (${dataSource})`,
        color: 'red'
      };
    }
  }

  /**
   * Generate actionable recommendations
   * @param {Object} input - Original input parameters
   * @param {Object} degradationResult - Degradation analysis result
   * @returns {Array} Array of recommendations
   */
  static generateRecommendations(input, degradationResult) {
    const recommendations = [];
    const { avgTemperature, dodPct, cRate, chargeCycles } = input;
    const { soh } = degradationResult;

    // Temperature recommendations
    if (avgTemperature > 35) {
      recommendations.push({
        category: 'Temperature Management',
        priority: 'High',
        message: `Operating temperature of ${avgTemperature}°C is high. Consider improving cooling to extend battery life.`,
        impact: 'High temperature significantly accelerates degradation'
      });
    } else if (avgTemperature > 30) {
      recommendations.push({
        category: 'Temperature Management',
        priority: 'Medium',
        message: `Operating temperature of ${avgTemperature}°C is elevated. Monitor thermal management.`,
        impact: 'Moderate temperature acceleration detected'
      });
    }

    // DoD recommendations
    if (dodPct > 90) {
      recommendations.push({
        category: 'Usage Pattern',
        priority: 'Medium',
        message: `Depth of discharge (${dodPct}%) is high. Consider reducing to 80-85% for longer life.`,
        impact: 'Deep discharge cycles increase degradation rate'
      });
    }

    // C-Rate recommendations
    if (cRate > 1.5) {
      recommendations.push({
        category: 'Charging Rate',
        priority: 'Medium',
        message: `Charge rate of ${cRate}C is high. Consider slower charging when time permits.`,
        impact: 'High charge rates can accelerate capacity loss'
      });
    }

    // Health-based recommendations
    if (soh < 75) {
      recommendations.push({
        category: 'Maintenance',
        priority: 'High',
        message: 'Battery health is declining. Plan for replacement within 6-12 months.',
        impact: 'Performance and reliability may be compromised'
      });
    }

    // Cycle-based recommendations
    if (chargeCycles > 1000) {
      recommendations.push({
        category: 'Lifecycle Management',
        priority: 'Low',
        message: 'Battery has accumulated significant cycles. Monitor performance trends closely.',
        impact: 'High cycle count batteries may degrade faster'
      });
    }

    // Default recommendation if none apply
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'Maintenance',
        priority: 'Low',
        message: 'Battery is operating within optimal parameters. Continue current usage patterns.',
        impact: 'Current conditions support good battery longevity'
      });
    }

    return recommendations;
  }

  /**
   * Get simplified health summary
   * @param {Object} input - Battery parameters
   * @returns {Object} Simplified health summary
   */
  static getHealthSummary(input) {
    try {
      // Apply smart defaults for missing data
      const enhancedInput = {
        ...input,
        // Estimate calendar age based on cycles if not provided
        calendarAgeMonths: input.calendarAgeMonths || Math.max(12, Math.floor(input.chargeCycles / 20)), // Rough estimate: 20 cycles per month
        avgTemperature: input.avgTemperature || 25,
        dodPct: input.dodPct || 80
      };

      const degradationResult = computeDegradation(enhancedInput);
      const confidence = getModelConfidence(enhancedInput);
      const status = this.determineBatteryStatus(degradationResult.soh, input.currentCapacity);

      return {
        healthPercentage: degradationResult.healthPct,
        status: status.status,
        estimatedMonthsRemaining: degradationResult.estimatedRUIMonths,
        confidence: confidence.level,
        dataSource: input.currentCapacity ? 'measured' : 'estimated',
        assumptions: {
          estimatedCalendarAge: !input.calendarAgeMonths ? enhancedInput.calendarAgeMonths : null,
          defaultTemperature: !input.avgTemperature ? 25 : null,
          defaultDoD: !input.dodPct ? 80 : null
        }
      };
    } catch (error) {
      throw new Error(`Health summary failed: ${error.message}`);
    }
  }
}