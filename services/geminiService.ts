import { GoogleGenAI } from "@google/genai";
import { CalculatorInputs, CalculationResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeQuote = async (inputs: CalculatorInputs, results: CalculationResult): Promise<string> => {
  try {
    const prompt = `
      Act as a Senior Financial Analyst & Pricing Strategist for a Government Contractor.
      Analyze this pricing structure for a government tender project.

      **Project Financials (THB):**
      - Landed Cost (Base): ${results.landedCost.toLocaleString()}
      - Total Markup Retained (Profit/Ops/Sponsor): ${results.totalNetRetained.toLocaleString()}
      - Tax Liability (Gross-up): ${results.taxAmt.toLocaleString()}
      - Target Selling Price (Ex-VAT): ${results.targetPriceExVat.toLocaleString()}
      - Suggested List Price (Ex-VAT): ${results.listPriceExVat.toLocaleString()} (Includes ${inputs.maxDiscountPercent}% discount buffer)

      **Key Margins & Ratios:**
      - Net Profit Markup: ${inputs.targetNetProfitPercent}% on Cost
      - Sponsorship/Lobbying Buffer: ${inputs.sponsorshipMarkupPercent}% on Cost
      - Corporate Tax Rate: ${inputs.corporateTaxRatePercent}%
      - Financial Cost of Fund: ${inputs.financialRatePercent}% of Sales

      **Task:**
      Provide a strategic assessment in markdown format (max 150 words).
      1. **Profitability Health**: Is the Net Profit markup of ${inputs.targetNetProfitPercent}% sufficient given the ${inputs.maxDiscountPercent}% discount buffer?
      2. **Risk Assessment**: Comment on the "Sponsorship" and "Operations" buffers. Are they excessive or standard for government contracts?
      3. **Strategic Advice**: Suggest one adjustment to optimize the winning chance without sacrificing too much margin.

      Tone: Professional, direct, and insightful. Use bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate analysis at this time. Please check your API key or network connection.";
  }
};