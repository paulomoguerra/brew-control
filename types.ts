
export type Unit = 'lbs' | 'kg';

// --- Inventory ---
export interface GreenBatch {
  id: string;
  batch_number: string;
  origin: string;
  process: string;
  variety?: string;
  quantity_lbs: number;
  cost_per_lb: number;
  status: 'active' | 'archived';
  timestamp?: any;
}

export interface RoastedProduct {
  id: string;
  roastLogId?: string;
  productName: string;
  quantity_lbs: number;
  costPerLb: number;
  wholesale_price_per_lb?: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
  timestamp?: any;
}

// --- Production ---
export interface RoastLog {
  id: string;
  batchId: string;
  batchNumber: string;
  productName: string;
  greenWeightIn: number;
  roastedWeightOut: number;
  shrinkage: number;
  costPerLb: number;
  timestamp: any;
}

// --- Sales ---
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface WholesaleOrder {
  id: string;
  clientName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'fulfilled' | 'paid';
  itemCount: number;
  timestamp: any;
}

// --- Quality ---
export interface QualityLog {
  id: string;
  roastLogId: string;
  productName: string;
  batchNumber: string;
  score: number;
  costPerLb: number;
  notes: string;
  timestamp: any;
}

// --- Marketing/Leads ---
export interface CalculatorLead {
  id: string;
  greenCost: number;
  shrinkage: number;
  shipping: number;
  email: string;
  calculatedRoastedCost: number;
  timestamp: any;
}

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
