
import { CalculationResult } from '../types';

/**
 * Interface for roast economics calculations
 * All weights in KG (metric-first architecture)
 */
export interface RoastEconomics {
  // Input values
  greenWeightKg: number;
  roastedWeightKg: number;
  greenCostPerKg: number;
  
  // Calculated shrinkage
  shrinkagePercent: number;
  shrinkageLossKg: number;
  
  // Cost breakdown
  greenCost: number;
  operationalCost: number;
  totalCost: number;
  costPerRoastedKg: number;
  
  // Pricing recommendations
  breakeven: number;
  margin30: number;
  margin50: number;
  customMargin: (marginPercent: number) => number;
}

/**
 * Options for operational costs (all optional)
 */
export interface OperationalCostOptions {
  laborRate?: number;        // per hour
  durationMinutes?: number;  // roast duration
  gasCostPerBatch?: number;  // fixed cost per roast
  utilityCostPerBatch?: number; // electricity, etc.
  otherOverhead?: number;    // miscellaneous costs
}

/**
 * Calculate comprehensive roast economics
 * Metric-first: all inputs/outputs in KG
 * 
 * @param greenWeightKg - Green coffee input in kg
 * @param roastedWeightKg - Roasted coffee output in kg
 * @param greenCostPerKg - Cost per kg of green coffee
 * @param options - Optional operational costs
 * @returns Complete economic breakdown
 */
export const calculateRoastEconomics = (
  greenWeightKg: number,
  roastedWeightKg: number,
  greenCostPerKg: number,
  options?: OperationalCostOptions
): RoastEconomics => {
  // Validation
  if (greenWeightKg <= 0 || roastedWeightKg <= 0) {
    throw new Error("Weights must be positive");
  }
  if (roastedWeightKg > greenWeightKg) {
    throw new Error("Roasted weight cannot exceed green weight (violates physics)");
  }
  if (greenCostPerKg < 0) {
    throw new Error("Cost cannot be negative");
  }
  
  // Calculate shrinkage
  const shrinkagePercent = ((greenWeightKg - roastedWeightKg) / greenWeightKg) * 100;
  const shrinkageLossKg = greenWeightKg - roastedWeightKg;
  
  // Green coffee cost
  const greenCost = greenWeightKg * greenCostPerKg;
  
  // Operational costs (all optional, default to 0)
  let operationalCost = 0;
  
  if (options?.laborRate && options?.durationMinutes) {
    operationalCost += (options.laborRate * (options.durationMinutes / 60));
  }
  if (options?.gasCostPerBatch) {
    operationalCost += options.gasCostPerBatch;
  }
  if (options?.utilityCostPerBatch) {
    operationalCost += options.utilityCostPerBatch;
  }
  if (options?.otherOverhead) {
    operationalCost += options.otherOverhead;
  }
  
  // Total cost
  const totalCost = greenCost + operationalCost;
  const costPerRoastedKg = totalCost / roastedWeightKg;
  
  // Pricing calculations
  const breakeven = costPerRoastedKg;
  const margin30 = breakeven / 0.70; // 30% margin
  const margin50 = breakeven / 0.50; // 50% margin
  
  // Custom margin calculator
  const customMargin = (marginPercent: number): number => {
    if (marginPercent >= 100 || marginPercent < 0) {
      throw new Error("Margin must be between 0 and 100%");
    }
    return breakeven / (1 - marginPercent / 100);
  };
  
  return {
    greenWeightKg,
    roastedWeightKg,
    greenCostPerKg,
    shrinkagePercent,
    shrinkageLossKg,
    greenCost,
    operationalCost,
    totalCost,
    costPerRoastedKg,
    breakeven,
    margin30,
    margin50,
    customMargin,
  };
};

/**
 * Reverse calculation: from target roasted output to required green input
 * 
 * @param targetRoastedKg - Desired roasted output in kg
 * @param expectedShrinkagePercent - Expected shrinkage percentage
 * @returns Required green coffee weight in kg
 */
export const calculateGreenRequired = (
  targetRoastedKg: number,
  expectedShrinkagePercent: number
): number => {
  if (targetRoastedKg <= 0) {
    throw new Error("Target roasted weight must be positive");
  }
  if (expectedShrinkagePercent >= 100 || expectedShrinkagePercent < 0) {
    throw new Error("Shrinkage must be between 0 and 100%");
  }
  
  return targetRoastedKg / (1 - expectedShrinkagePercent / 100);
};

/**
 * Calculate blend economics (weighted average of multiple origins)
 * 
 * @param components - Array of {greenBatchCostPerKg, percentage}
 * @param targetShrinkagePercent - Expected blend shrinkage
 * @param options - Optional operational costs (spread across blend)
 * @returns Weighted cost per roasted kg
 */
export interface BlendComponent {
  greenCostPerKg: number;
  percentage: number; // 0-100
}

export const calculateBlendCost = (
  components: BlendComponent[],
  targetShrinkagePercent: number,
  options?: OperationalCostOptions
): {
  weightedGreenCost: number;
  greenCostPerRoasted: number;
  operationalCostPerKg: number;
  totalCostPerRoastedKg: number;
} => {
  // Validate percentages sum to 100
  const totalPct = components.reduce((sum, c) => sum + c.percentage, 0);
  if (Math.abs(totalPct - 100) > 0.1) {
    throw new Error(`Blend components must sum to 100% (currently ${totalPct}%)`);
  }
  
  // Calculate weighted average green cost
  const weightedGreenCost = components.reduce((sum, c) => {
    return sum + (c.greenCostPerKg * (c.percentage / 100));
  }, 0);
  
  // Adjust for shrinkage to get cost per roasted kg
  const greenCostPerRoasted = weightedGreenCost / (1 - targetShrinkagePercent / 100);
  
  // Operational costs per kg (requires estimated batch size)
  // Assume 10kg average batch for now - can be parameterized later
  const avgBatchSizeKg = 10;
  let operationalCostPerKg = 0;
  
  if (options?.laborRate && options?.durationMinutes) {
    const laborCostPerBatch = options.laborRate * (options.durationMinutes / 60);
    operationalCostPerKg += laborCostPerBatch / avgBatchSizeKg;
  }
  if (options?.gasCostPerBatch) {
    operationalCostPerKg += options.gasCostPerBatch / avgBatchSizeKg;
  }
  if (options?.utilityCostPerBatch) {
    operationalCostPerKg += options.utilityCostPerBatch / avgBatchSizeKg;
  }
  if (options?.otherOverhead) {
    operationalCostPerKg += options.otherOverhead / avgBatchSizeKg;
  }
  
  const totalCostPerRoastedKg = greenCostPerRoasted + operationalCostPerKg;
  
  return {
    weightedGreenCost,
    greenCostPerRoasted,
    operationalCostPerKg,
    totalCostPerRoastedKg,
  };
};

/**
 * Legacy function for backward compatibility
 * Converts lbs-based input to kg, calculates, converts back
 * 
 * @deprecated Use calculateRoastEconomics with kg inputs instead
 */
export const calculateRoastEconomicsLegacy = (
  greenWeightLbs: number,
  roastedWeightOutLbs: number,
  costPerLb: number,
  operationalCost: number = 0
): CalculationResult => {
  const LBS_TO_KG = 0.45359237;
  
  if (greenWeightLbs <= 0) {
    return {
      roastedWeight: 0,
      greenCost: 0,
      shrinkageLossLbs: 0,
      totalCost: 0,
      costPerRoastedLb: 0,
      marginAnalysis: {
        suggestedWholesalePrice: 0,
        suggestedRetailPrice: 0,
        wholesaleMarginPercent: 35,
        retailMarginPercent: 50,
      }
    };
  }

  const shrinkagePercent = ((greenWeightLbs - roastedWeightOutLbs) / greenWeightLbs) * 100;
  const greenCostTotal = greenWeightLbs * costPerLb;
  const totalCost = greenCostTotal + operationalCost;
  
  const costPerRoastedLb = roastedWeightOutLbs > 0 ? totalCost / roastedWeightOutLbs : 0;
  
  // Suggested pricing (35% wholesale margin, 50% retail margin)
  const suggestedWholesale = costPerRoastedLb / 0.65;
  const suggestedRetail = costPerRoastedLb / 0.50;

  return {
    roastedWeight: roastedWeightOutLbs,
    greenCost: greenCostTotal,
    shrinkageLossLbs: greenWeightLbs - roastedWeightOutLbs,
    totalCost,
    costPerRoastedLb,
    marginAnalysis: {
      suggestedWholesalePrice: suggestedWholesale,
      suggestedRetailPrice: suggestedRetail,
      wholesaleMarginPercent: 35,
      retailMarginPercent: 50,
    }
  };
};
