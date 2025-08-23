import { describe, it, expect } from 'jest';
import { calculateDegradation } from '../src/utils/degradationCalculator';

describe('Battery Degradation Calculator', () => {
  it('should calculate degradation based on temperature and DoD', () => {
    const result = calculateDegradation(25, 0.5); // Example values
    expect(result).toBeDefined();
    expect(result).toBeGreaterThan(0);
  });

  it('should return 0 degradation for ideal conditions', () => {
    const result = calculateDegradation(20, 0); // Ideal conditions
    expect(result).toBe(0);
  });

  it('should handle extreme temperatures', () => {
    const resultHigh = calculateDegradation(45, 0.5); // High temperature
    const resultLow = calculateDegradation(-10, 0.5); // Low temperature
    expect(resultHigh).toBeDefined();
    expect(resultLow).toBeDefined();
  });
});