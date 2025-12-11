export type Currency = 'EUR' | 'USD';

export interface CalculatorInputs {
  currency: Currency;
  customExchangeRate: number; // User defined or auto-calculated safe rate
  
  // 1. Origin & Import Factors
  productCostOrigin: number;    // Ex-Works / FOB
  freightInsuranceThb: number;  // To calculate CIF
  
  // 2. Tax & Clearance
  dutyRatePercent: number;      // %
  localClearanceFees: number;   // Non-VAT THB
  
  // 3. Internal Reserves (Markups on Base Cost)
  isServiceEnabled: boolean;
  serviceMarkupPercent: number;    
  operationMarkupPercent: number;  
  sponsorshipMarkupPercent: number; 
  targetNetProfitPercent: number; // Markup on Cost
  
  // 4. Tax Strategy
  corporateTaxRatePercent: number; 
  
  // 5. Sales Deductions (% of Selling Price)
  financialRatePercent: number;    
  performanceBondPercent: number;  // Bond Amount % (Cost derived via Bank Fee)
  maxDiscountPercent: number;      // To calculate List Price
}

export interface CalculationResult {
  exchangeRateUsed: number;
  
  // Import Costs
  cifValue: number;
  dutyAmount: number;
  landedCost: number; // Base Cost
  
  // Allocations (Amounts)
  serviceAmt: number;
  operationAmt: number;
  sponsorshipAmt: number;
  targetNetProfitAmt: number;
  
  // Tax Analysis
  totalNetRetained: number; // Sum of markups
  preTaxIncomeNeeded: number;
  taxAmt: number;
  
  // Pricing
  grossCostForPricing: number;
  targetPriceExVat: number;
  listPriceExVat: number;
  listPriceIncVat: number;
  
  // Deductions (Hidden Costs)
  financialAmt: number;
  bondFeeAmt: number;
  
  isValid: boolean;
  error?: string;
}

export interface Preset {
  id: string;
  name: string;
  data: CalculatorInputs;
  updatedAt: string;
}

export interface ChartData {
  label: string;
  value: number;
  color: string;
  [key: string]: any;
}