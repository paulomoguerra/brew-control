
import { CalculationResult } from '../types';

/**
 * Calculates the true roasted cost based on green inputs and moisture loss.
 */
export const calculateRoastEconomics = (
  greenWeightLbs: number,
  shrinkagePercent: number,
  costPerLb: number,
  operationalCost: number = 0
): CalculationResult => {
  const shrinkageMultiplier = 1 - (shrinkagePercent / 100);
  const roastedWeight = greenWeightLbs * shrinkageMultiplier;
  
  const greenCostTotal = greenWeightLbs * costPerLb;
  const totalCost = greenCostTotal + operationalCost;
  
  const costPerRoastedLb = roastedWeight > 0 ? totalCost / roastedWeight : 0;
  
  // Suggested pricing (35% wholesale margin, 50% retail margin)
  const suggestedWholesale = costPerRoastedLb / 0.65;
  const suggestedRetail = costPerRoastedLb / 0.50;

  return {
    roastedWeight,
    greenCost: greenCostTotal,
    shrinkageLossLbs: greenWeightLbs - roastedWeight,
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

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};
