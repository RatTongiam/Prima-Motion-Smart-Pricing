import React, { useState } from 'react';
import { CalculatorInputs, CalculationResult } from '../types';
import { analyzeQuote } from '../services/geminiService';

interface AIInsightsProps {
  inputs: CalculatorInputs;
  results: CalculationResult;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ inputs, results }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeQuote(inputs, results);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-xl shadow-lg p-6 text-white mt-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-5"></div>
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-5"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Price Analyst
        </h3>
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors border border-white/20"
          >
            Analyze Quote
          </button>
        )}
      </div>

      <div className="relative z-10 min-h-[100px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-indigo-200 text-sm animate-pulse">Generating strategic insights with Gemini...</p>
          </div>
        ) : analysis ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="whitespace-pre-line text-indigo-100/90 leading-relaxed">
              {analysis}
            </div>
            <button 
              onClick={() => setAnalysis(null)}
              className="mt-4 text-xs text-indigo-300 hover:text-white underline"
            >
              Clear Analysis
            </button>
          </div>
        ) : (
          <p className="text-indigo-200 text-sm leading-relaxed">
            Use Google Gemini to audit this price structure. The AI will assess your FX risk, profitability against industry standards, and suggest negotiation room.
          </p>
        )}
      </div>
    </div>
  );
};