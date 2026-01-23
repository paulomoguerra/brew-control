
export type Unit = 'lbs' | 'kg';
export type Currency = 'USD' | 'BRL';

// --- Finance ---
export interface CalculationResult {
  roastedWeight: number;
  greenCost: number;
  shrinkageLossLbs: number;
  totalCost: number;
  costPerRoastedLb: number;
  marginAnalysis: {
    suggestedWholesalePrice: number;
    suggestedRetailPrice: number;
    wholesaleMarginPercent: number;
    retailMarginPercent: number;
  };
}
