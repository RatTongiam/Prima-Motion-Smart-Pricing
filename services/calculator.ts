import { CalculatorInputs, CalculationResult } from '../types';

// Simulated Real-time Rates
export const EXCHANGE_RATES = {
  EUR: 37.08,
  USD: 31.83
};

export const SAFE_BUFFER = 5.0; 
export const BANK_LG_FEE_RATE = 2.0; 

export const DEFAULT_INPUTS: CalculatorInputs = {
  currency: 'EUR',
  customExchangeRate: EXCHANGE_RATES['EUR'] + SAFE_BUFFER,
  productCostOrigin: 4550,
  freightInsuranceThb: 5000,
  dutyRatePercent: 10,
  localClearanceFees: 6000,
  isServiceEnabled: true,
  serviceMarkupPercent: 20,
  operationMarkupPercent: 30,
  sponsorshipMarkupPercent: 30, 
  targetNetProfitPercent: 60,
  corporateTaxRatePercent: 15,
  financialRatePercent: 2,   
  performanceBondPercent: 5, 
  maxDiscountPercent: 25, 
};

export const calculateSmartPrice = (inputs: CalculatorInputs): CalculationResult => {
  const {
    customExchangeRate,
    productCostOrigin,
    freightInsuranceThb,
    dutyRatePercent,
    localClearanceFees,
    isServiceEnabled,
    serviceMarkupPercent,
    operationMarkupPercent,
    sponsorshipMarkupPercent,
    targetNetProfitPercent,
    corporateTaxRatePercent,
    financialRatePercent,
    performanceBondPercent,
    maxDiscountPercent
  } = inputs;

  const exchangeRateUsed = customExchangeRate;

  // 1. Calculate CIF & Landed Cost
  const productCostThb = productCostOrigin * exchangeRateUsed;
  const cifValue = productCostThb + freightInsuranceThb;
  const dutyAmount = cifValue * (dutyRatePercent / 100);
  const landedCost = cifValue + dutyAmount + localClearanceFees;

  // 2. Base Cost
  const baseCost = landedCost; 

  // 3. Calculate Reserves & Profit (Markups on Cost)
  const serviceAmt = isServiceEnabled ? baseCost * (serviceMarkupPercent / 100) : 0;
  const operationAmt = baseCost * (operationMarkupPercent / 100);
  const sponsorshipAmt = baseCost * (sponsorshipMarkupPercent / 100);
  const targetNetProfitAmt = baseCost * (targetNetProfitPercent / 100);

  const totalNetRetained = serviceAmt + operationAmt + sponsorshipAmt + targetNetProfitAmt;

  // 4. Tax Gross-Up
  // We need to generate enough Pre-Tax Income so that after Tax, we have TotalNetRetained left.
  // PreTax * (1 - TaxRate) = Retained
  const taxFactor = 1 - (corporateTaxRatePercent / 100);
  const preTaxIncomeNeeded = taxFactor > 0 ? totalNetRetained / taxFactor : 0;
  const taxAmt = preTaxIncomeNeeded - totalNetRetained;

  // 5. Total Cost Stack (The amount we must cover before Sales Deductions)
  const grossCostForPricing = baseCost + preTaxIncomeNeeded;

  // 6. Calculate Target Price (Accounting for Sales Deductions)
  // TargetPrice = GrossCost / (1 - SalesDeductions%)
  const bondFeeRateEffective = (performanceBondPercent / 100) * (BANK_LG_FEE_RATE / 100);
  // Note: Inputs are in percent, so divide by 100. 
  // financialRatePercent is 2 (meaning 2%).
  const totalSalesRate = (financialRatePercent / 100) + bondFeeRateEffective;
  
  const denominator = 1 - totalSalesRate;
  
  if (denominator <= 0) {
     return {
         exchangeRateUsed, cifValue, dutyAmount, landedCost,
         serviceAmt, operationAmt, sponsorshipAmt, targetNetProfitAmt,
         totalNetRetained, preTaxIncomeNeeded, taxAmt,
         grossCostForPricing, targetPriceExVat: 0, listPriceExVat: 0, listPriceIncVat: 0,
         financialAmt: 0, bondFeeAmt: 0,
         isValid: false,
         error: "Deductions exceed 100% of price"
     }
  }

  const targetPriceExVatRaw = grossCostForPricing / denominator;

  // 7. Calculate List Price (Buffer for Discount)
  // ListPrice * (1 - Discount%) = TargetPrice
  // ListPrice = TargetPrice / (1 - Discount%)
  const discountFactor = 1 - (maxDiscountPercent / 100);
  let listPriceExVat = discountFactor > 0 ? targetPriceExVatRaw / discountFactor : 0;
  
  // 8. Rounding Logic (Round Up to nearest 100)
  listPriceExVat = Math.ceil(listPriceExVat / 100) * 100;
  const listPriceIncVat = listPriceExVat * 1.07;

  // Recalculate Actual Target Price based on rounded List Price
  const targetPriceExVat = listPriceExVat * discountFactor;

  // Back-calculated Deductions based on actual Target Price
  const financialAmt = targetPriceExVat * (financialRatePercent / 100);
  const bondFeeAmt = targetPriceExVat * bondFeeRateEffective;

  return {
    exchangeRateUsed,
    cifValue,
    dutyAmount,
    landedCost,
    serviceAmt,
    operationAmt,
    sponsorshipAmt,
    targetNetProfitAmt,
    totalNetRetained,
    preTaxIncomeNeeded,
    taxAmt,
    grossCostForPricing,
    targetPriceExVat,
    listPriceExVat,
    listPriceIncVat,
    financialAmt,
    bondFeeAmt,
    isValid: true
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCurrencyDecimals = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};