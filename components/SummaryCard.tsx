import React, { useMemo } from 'react';
import { CalculationResult, ChartData } from '../types';
import { formatCurrencyDecimals } from '../services/calculator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SummaryCardProps {
  result: CalculationResult;
}

// Colors: Slate(Landed), Amber(Risk), Blue(Service/Ops), Purple(Fin/Tax), Emerald(Profit)
const COLORS = ['#64748b', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

export const SummaryCard: React.FC<SummaryCardProps> = ({ result }) => {
  if (!result.isValid) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
        <h3 className="text-lg font-bold mb-2">Calculation Error</h3>
        <p>{result.error}</p>
      </div>
    );
  }

  const chartData: ChartData[] = useMemo(() => [
    { label: 'Landed Cost', value: result.landedCost, color: COLORS[0] },
    { label: 'Risk Buffer', value: result.sponsorshipAmt, color: COLORS[1] },
    { label: 'Service & Ops', value: result.serviceAmt + result.operationAmt, color: COLORS[2] },
    { label: 'Fin/Tax/Bond', value: result.taxAmt + result.financialAmt + result.bondFeeAmt, color: COLORS[3] },
    { label: 'Net Profit', value: result.targetNetProfitAmt, color: COLORS[4] },
  ], [result]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 p-6 text-white">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Target Price (Ex-VAT)</h2>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
          <span className="text-3xl sm:text-4xl font-bold font-mono">{formatCurrencyDecimals(result.targetPriceExVat)}</span>
          <span className="text-slate-400 text-sm font-medium">THB</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex flex-col sm:flex-row sm:gap-4 border-t border-slate-800 pt-2">
           <span className="flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
             VAT-Inc: {formatCurrencyDecimals(result.targetPriceExVat * 1.07)}
           </span>
           <span className="flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-blue-500"></span>
             Rate: {result.exchangeRateUsed.toFixed(2)}
           </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Price Structure</h3>
        
        <div className="h-64 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                nameKey="label"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrencyDecimals(value)} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {/* Direct Costs */}
          <div className="pb-2 border-b border-slate-100">
            <RowItem label="Landed Cost" value={result.landedCost} color="border-l-4 border-slate-500" />
            <RowItem label="Risk Buffer" value={result.sponsorshipAmt} color="border-l-4 border-amber-500" />
          </div>
          
          {/* Allocations */}
          <div className="pb-2 pt-2 border-b border-slate-100">
            <RowItem label="Service & Ops" value={result.serviceAmt + result.operationAmt} color="border-l-4 border-blue-500" />
            <RowItem label="Fin / Tax / Bond" value={result.financialAmt + result.bondFeeAmt + result.taxAmt} color="border-l-4 border-purple-500" />
          </div>

          {/* Profit */}
          <div className="pt-2">
             <RowItem label="Net Profit" value={result.targetNetProfitAmt} color="border-l-4 border-emerald-500" highlight />
          </div>
        </div>
      </div>
    </div>
  );
};

const RowItem = ({ label, value, highlight, color }: { label: string, value: number, highlight?: boolean, color?: string }) => (
  <div className={`flex justify-between items-center px-3 py-2 rounded-lg ${highlight ? 'bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-100' : 'hover:bg-slate-50'} ${color || ''}`}>
    <span className={`text-sm ${highlight ? 'font-bold' : 'text-slate-600'}`}>{label}</span>
    <span className={`font-mono ${highlight ? 'font-bold text-emerald-700' : 'font-medium text-slate-700'}`}>{formatCurrencyDecimals(value)}</span>
  </div>
);