
import { CalculationResult } from '../types';

/**
 * Calculates the true roasted cost based on green inputs and moisture loss.
 * Standardizes math across the entire system.
 */
export const calculateRoastEconomics = (
  greenWeightLbs: number,
  roastedWeightOutLbs: number,
  costPerLb: number,
  operationalCost: number = 0
): CalculationResult => {
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
