import React, { useState, useEffect, useMemo } from 'react';
import { Save, FolderOpen, Trash2, Calculator, BarChart3, Settings, ArrowRight, DollarSign, Percent, RefreshCw, Activity, Layers, TrendingUp, AlertTriangle, Lock, Unlock } from 'lucide-react';

// --- Types ---
export type Currency = 'EUR' | 'USD';

export interface CalculatorInputs {
  currency: Currency;
  customExchangeRate: number;
  productCostOrigin: number;
  freightInsuranceThb: number;
  dutyRatePercent: number;
  localClearanceFees: number;
  isServiceEnabled: boolean;
  serviceMarkupPercent: number;
  operationMarkupPercent: number;
  sponsorshipMarkupPercent: number;
  financialRiskBufferPercent: number;
  targetNetProfitPercent: number;
  corporateTaxRatePercent: number;
  financialRatePercent: number;
  performanceBondPercent: number;
  maxDiscountPercent: number;
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
}

// --- Constants ---
const APP_PASSWORD = "7024"; // 🔒 PASSWORD SETTING
const EXCHANGE_RATES = { EUR: 37.08, USD: 31.83 };
const SAFE_BUFFER = 5.0;
const BANK_LG_FEE_RATE = 2.0;

const DEFAULT_INPUTS: CalculatorInputs = {
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
  financialRiskBufferPercent: 0.5,
  targetNetProfitPercent: 60,
  corporateTaxRatePercent: 15,
  financialRatePercent: 2,
  performanceBondPercent: 5,
  maxDiscountPercent: 25,
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

// --- Calculation Logic ---
export function calculateSmartPrice(inputs: CalculatorInputs) {
    const productCostThb = inputs.productCostOrigin * inputs.customExchangeRate;
    const cifValue = productCostThb + inputs.freightInsuranceThb;
    const dutyAmount = cifValue * (inputs.dutyRatePercent / 100);
    const landedCost = cifValue + dutyAmount + inputs.localClearanceFees;

    const baseCost = landedCost; 
    
    const serviceAmt = inputs.isServiceEnabled ? baseCost * (inputs.serviceMarkupPercent / 100) : 0;
    const operationAmt = baseCost * (inputs.operationMarkupPercent / 100);
    const sponsorshipAmt = baseCost * (inputs.sponsorshipMarkupPercent / 100);
    const bufferAmt = baseCost * (inputs.financialRiskBufferPercent / 100);
    
    const totalReserves = serviceAmt + operationAmt + sponsorshipAmt + bufferAmt;
    const targetNetProfitAmt = baseCost * (inputs.targetNetProfitPercent / 100);
    const totalNetRetained = totalReserves + targetNetProfitAmt;

    const taxFactor = 1 - (inputs.corporateTaxRatePercent / 100);
    const preTaxIncomeNeeded = taxFactor > 0 ? totalNetRetained / taxFactor : 0;
    const taxAmt = preTaxIncomeNeeded - totalNetRetained;

    const grossCostForPricing = baseCost + preTaxIncomeNeeded;

    const bondFeeRateEffective = (inputs.performanceBondPercent / 100) * (BANK_LG_FEE_RATE / 100) * 100;
    const totalSalesRate = inputs.financialRatePercent + bondFeeRateEffective; 
    
    const denominator = 1 - (totalSalesRate / 100);
    const targetPriceExVatRaw = denominator > 0 ? grossCostForPricing / denominator : 0;

    const discountFactor = 1 - (inputs.maxDiscountPercent / 100);
    let listPriceExVat = discountFactor > 0 ? targetPriceExVatRaw / discountFactor : 0;
    
    listPriceExVat = Math.ceil(listPriceExVat / 100) * 100; 
    const listPriceIncVat = listPriceExVat * 1.07;
    const targetPriceExVat = listPriceExVat * discountFactor;

    const financialAmt = targetPriceExVat * (inputs.financialRatePercent / 100);
    const bondFeeAmt = targetPriceExVat * (bondFeeRateEffective / 100);

    // Profit Verification
    const deductionsAtTarget = (targetPriceExVat * inputs.financialRatePercent / 100) + (targetPriceExVat * bondFeeRateEffective / 100);
    const grossMarginAtTarget = targetPriceExVat - deductionsAtTarget;
    const taxableBaseAtTarget = grossMarginAtTarget - landedCost; 
    const taxAtTarget = taxableBaseAtTarget * (inputs.corporateTaxRatePercent / 100);
    const netProfitAtWinning = taxableBaseAtTarget - taxAtTarget;
    const pureProfitAtWinning = netProfitAtWinning - totalReserves;

    const deductionsAtList = (listPriceExVat * inputs.financialRatePercent / 100) + (listPriceExVat * bondFeeRateEffective / 100);
    const grossMarginAtList = listPriceExVat - deductionsAtList;
    const taxableBaseAtList = grossMarginAtList - landedCost;
    const taxAtList = taxableBaseAtList * (inputs.corporateTaxRatePercent / 100);
    const netProfitAtList = taxableBaseAtList - taxAtList;
    const pureProfitAtList = netProfitAtList - totalReserves;

    return {
      landedCost, serviceAmt, operationAmt, sponsorshipAmt, bufferAmt, targetNetProfitAmt,
      totalReserves, totalNetRetained, preTaxIncomeNeeded, taxAmt,
      targetPriceExVat, listPriceExVat, listPriceIncVat, financialAmt, bondFeeAmt,
      netProfitAtWinning, pureProfitAtWinning, netProfitAtList, pureProfitAtList
    };
}

// --- Components ---

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === APP_PASSWORD) {
            onLogin();
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen bg-[#260762] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
                <div className="bg-[#f0ebfa] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={32} className="text-[#4d2994]" />
                </div>
                <h1 className="text-xl font-extrabold text-[#260762] mb-1">Prima Motion</h1>
                <p className="text-sm text-slate-500 mb-6">Smart Pricing Access</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input 
                            type="password" 
                            placeholder="Enter PIN" 
                            className={`w-full text-center text-2xl font-mono tracking-widest py-3 border-2 rounded-xl focus:outline-none transition-all ${error ? 'border-red-400 bg-red-50 text-red-600' : 'border-[#d0c3f1] focus:border-[#4d2994] text-[#260762]'}`}
                            value={password}
                            onChange={(e) => { setError(false); setPassword(e.target.value); }}
                            autoFocus
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-[#4d2994] hover:bg-[#260762] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Unlock size={18} /> Unlock App
                    </button>
                </form>
            </div>
        </div>
    );
};

const ToggleSwitch = ({ enabled, onChange, label }: { enabled: boolean; onChange: (val: boolean) => void; label: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[10px] font-bold text-[#4d2994] uppercase tracking-wide">{label}</span>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-[#4d2994] ${enabled ? 'bg-[#4d2994]' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

const InputField = ({ label, value, onChange, suffix, prefix, className, step = 1, disabled = false, icon: Icon, isError = false }: any) => (
  <div className={`relative group ${className}`}>
    <label className={`block text-[9px] font-bold uppercase mb-0.5 tracking-wide flex items-center gap-1 truncate ${isError ? 'text-red-500' : 'text-[#4d2994]/80'}`}>
      {Icon && <Icon size={8} />} {label}
    </label>
    <div className="relative rounded shadow-sm">
      {prefix && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500 font-medium text-xs">{prefix}</div>}
      <input
        type="number"
        step={step}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`block w-full rounded border py-1 pl-2 pr-7 text-xs focus:ring-1 disabled:bg-slate-50 disabled:text-slate-400 font-mono transition-all shadow-sm ${prefix ? 'pl-6' : ''} ${
            isError 
            ? 'border-red-300 text-red-600 focus:border-red-500 focus:ring-red-500 bg-red-50' 
            : 'border-[#d0c3f1] text-[#260762] focus:border-[#4d2994] focus:ring-[#4d2994]'
        }`}
      />
      {suffix && <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-[9px] font-bold bg-transparent ${isError ? 'text-red-400' : 'text-slate-400'}`}>{suffix}</div>}
    </div>
  </div>
);

const CostStackedBar = ({ data }: { data: ChartData[] }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  return (
    <div className="w-full">
      <div className="flex h-3 w-full rounded-md overflow-hidden shadow-sm border border-slate-200">
        {data.map((item, index) => {
          if (item.value <= 0) return null;
          const percent = (item.value / total) * 100;
          return (
            <div 
                key={index}
                style={{ width: `${percent}%`, backgroundColor: item.color }}
                className="h-full relative group hover:opacity-90 transition-opacity"
                title={`${item.label}: ${percent.toFixed(1)}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1.5 justify-between">
         {data.map((item, idx) => (
            item.value > 0 && (
                <div key={idx} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: item.color}}></span>
                    <span className="text-[8px] text-slate-500 uppercase font-bold">{item.label}</span>
                    <span className="text-[8px] font-mono text-slate-800">{((item.value/total)*100).toFixed(0)}%</span>
                </div>
            )
         ))}
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  
  const results = useMemo(() => calculateSmartPrice(inputs), [inputs]);
  const marketRate = EXCHANGE_RATES[inputs.currency];
  const safeRateThreshold = marketRate + SAFE_BUFFER;
  const isRateTooLow = inputs.customExchangeRate < safeRateThreshold;

  // Check Auth on Mount
  useEffect(() => {
      const auth = sessionStorage.getItem('prima_auth');
      if (auth === 'true') {
          setIsAuthenticated(true);
      }
  }, []);

  // Load Presets
  useEffect(() => {
    const savedPresets = localStorage.getItem('pricing_presets');
    if (savedPresets) setPresets(JSON.parse(savedPresets));
  }, []);

  const handleLogin = () => {
      setIsAuthenticated(true);
      sessionStorage.setItem('prima_auth', 'true');
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      sessionStorage.removeItem('prima_auth');
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) { alert("Please enter preset name"); return; }
    const newPreset = { id: Date.now().toString(), name: presetName, data: { ...inputs }, updatedAt: new Date().toLocaleString() };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('pricing_presets', JSON.stringify(updated));
    setPresetName('');
  };

  const handleLoadPreset = (id: string) => {
    const p = presets.find(x => x.id === id);
    if (p) { setInputs(p.data); setSelectedPresetId(id); }
  };

  const handleDeletePreset = (id: string) => {
      if (window.confirm("Delete this preset?")) {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        localStorage.setItem('pricing_presets', JSON.stringify(updated));
        if (selectedPresetId === id) setSelectedPresetId('');
      }
  };

  const handleInputChange = (field: keyof CalculatorInputs, value: any) => setInputs(prev => ({ ...prev, [field]: Number(value) }));
  const handleToggle = (field: keyof CalculatorInputs, val: boolean) => setInputs(prev => ({ ...prev, [field]: val }));
  const toggleCurrency = (currency: Currency) => setInputs(prev => ({ ...prev, currency, customExchangeRate: EXCHANGE_RATES[currency] + SAFE_BUFFER }));

  const pieData: ChartData[] = [
    { label: 'Landed', value: results.landedCost, color: '#260762' },
    { label: 'Service', value: results.serviceAmt, color: '#4d2994' },
    { label: 'Ops', value: results.operationAmt, color: '#7c3aed' },
    { label: 'Sponsor', value: results.sponsorshipAmt, color: '#a78bfa' },
    { label: 'Buffer', value: results.bufferAmt, color: '#e879f9' },
    { label: 'Profit', value: results.targetNetProfitAmt, color: '#10B981' },
    { label: 'Tax', value: results.taxAmt, color: '#EF4444' },
  ];

  // --- RENDER ---

  if (!isAuthenticated) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f7fc] font-sans text-slate-800 flex flex-col">
      
      {/* 1. HEADER */}
      <div className="bg-white border-b border-[#d0c3f1] shadow-sm z-50 px-4 py-2 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
               <div className="bg-[#260762] p-1.5 rounded-lg text-white shadow"><Calculator size={16} /></div>
               <h1 className="text-sm font-extrabold text-[#260762] tracking-tight leading-none hidden sm:block">
                   Prima Motion <span className="text-[#4d2994]">- Smart Pricing App</span>
               </h1>
            </div>
            {/* Live Rates */}
            <div className="hidden md:flex items-center gap-3 bg-[#f8f7fc] px-3 py-1 rounded-md border border-[#d0c3f1]">
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] font-bold text-[#4d2994] uppercase">Live</span>
                </div>
                <div className="h-3 w-px bg-[#d0c3f1]"></div>
                <div className="flex gap-3 text-[10px] font-mono font-bold text-[#260762]">
                    <span>EUR: {EXCHANGE_RATES.EUR.toFixed(2)}</span>
                    <span>USD: {EXCHANGE_RATES.USD.toFixed(2)}</span>
                </div>
            </div>
            {/* Controls */}
            <div className="flex items-center gap-3">
                <div className="flex bg-[#f0ebfa] p-0.5 rounded border border-[#d0c3f1]">
                    {['EUR', 'USD'].map((c) => (
                        <button key={c} onClick={() => toggleCurrency(c as Currency)} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${inputs.currency === c ? 'bg-[#4d2994] text-white shadow-sm' : 'text-[#4d2994] hover:bg-[#d0c3f1]/50'}`}>{c}</button>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    <select value={selectedPresetId} onChange={(e) => handleLoadPreset(e.target.value)} className="bg-[#260762] text-white text-[10px] rounded-l px-2 py-1 h-6 outline-none border-r border-[#4d2994] cursor-pointer hover:bg-[#4d2994] w-24 truncate">
                        <option value="">Load Preset...</option>
                        {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="text" placeholder="Save as..." value={presetName} onChange={(e) => setPresetName(e.target.value)} className="bg-white border border-[#d0c3f1] text-[10px] px-2 py-1 h-6 w-20 outline-none focus:border-[#4d2994]" />
                    <button onClick={handleSavePreset} className="bg-[#4d2994] text-white p-1 rounded-r h-6 hover:bg-[#260762]"><Save size={12} /></button>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-[#260762] ml-2 p-1" title="Lock App"><Lock size={14} /></button>
                </div>
            </div>
        </div>
      </div>

      {/* 2. INPUT GRID */}
      <div className="flex-shrink-0 p-3 bg-[#f8f7fc] border-b border-[#d0c3f1]/50 shadow-inner">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-2">
            {/* Col 1 */}
            <div className="bg-white rounded-lg shadow-sm border border-[#d0c3f1] p-2">
                <h2 className="text-[9px] font-bold uppercase text-[#4d2994]/70 mb-1.5 flex items-center gap-1 border-b border-[#d0c3f1]/30 pb-1"><span className="w-1.5 h-1.5 rounded-full bg-[#260762]"></span> Import Costs</h2>
                <div className="space-y-1">
                    <div className="flex gap-2 items-start">
                        <div className="w-1/2">
                            <InputField label="Calc Rate" value={inputs.customExchangeRate} onChange={(v:any) => handleInputChange('customExchangeRate', v)} suffix="THB" className="font-bold" step={0.01} isError={isRateTooLow} />
                            {isRateTooLow && <div className="text-[8px] text-red-500 font-bold mt-0.5 flex items-center gap-0.5 animate-pulse"><AlertTriangle size={8} /> Low</div>}
                        </div>
                        <InputField label="Product" value={inputs.productCostOrigin} onChange={(v:any) => handleInputChange('productCostOrigin', v)} suffix={inputs.currency} className="w-1/2" icon={DollarSign} />
                    </div>
                    <InputField label="Freight" value={inputs.freightInsuranceThb} onChange={(v:any) => handleInputChange('freightInsuranceThb', v)} suffix="THB" />
                    <div className="grid grid-cols-2 gap-1.5">
                        <InputField label="Duty" value={inputs.dutyRatePercent} onChange={(v:any) => handleInputChange('dutyRatePercent', v)} suffix="%" />
                        <InputField label="Clearance" value={inputs.localClearanceFees} onChange={(v:any) => handleInputChange('localClearanceFees', v)} suffix="THB" />
                    </div>
                </div>
            </div>
            {/* Col 2 */}
            <div className="bg-white rounded-lg shadow-sm border border-[#d0c3f1] p-2 ring-1 ring-[#d0c3f1]/50">
                <h2 className="text-[9px] font-bold uppercase text-[#4d2994]/70 mb-1.5 flex items-center gap-1 border-b border-[#d0c3f1]/30 pb-1"><span className="w-1.5 h-1.5 rounded-full bg-[#4d2994]"></span> Reserves (On Cost)</h2>
                <div className="space-y-1">
                    <ToggleSwitch label="Include Service" enabled={inputs.isServiceEnabled} onChange={(val) => handleToggle('isServiceEnabled', val)} />
                    <div className="grid grid-cols-2 gap-1.5">
                        <InputField label="Service" value={inputs.serviceMarkupPercent} onChange={(v:any) => handleInputChange('serviceMarkupPercent', v)} suffix="%" disabled={!inputs.isServiceEnabled} className={!inputs.isServiceEnabled ? 'opacity-40' : ''} />
                        <InputField label="Operations" value={inputs.operationMarkupPercent} onChange={(v:any) => handleInputChange('operationMarkupPercent', v)} suffix="%" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <InputField label="Sponsor" value={inputs.sponsorshipMarkupPercent} onChange={(v:any) => handleInputChange('sponsorshipMarkupPercent', v)} suffix="%" />
                        <InputField label="Risk Buffer" value={inputs.financialRiskBufferPercent} onChange={(v:any) => handleInputChange('financialRiskBufferPercent', v)} suffix="%" className="text-purple-600" />
                    </div>
                </div>
            </div>
            {/* Col 3 */}
            <div className="bg-white rounded-lg shadow-sm border border-[#d0c3f1] p-2 ring-1 ring-emerald-100">
                <h2 className="text-[9px] font-bold uppercase text-emerald-600/70 mb-1.5 flex items-center gap-1 border-b border-emerald-100 pb-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Profit & Tax</h2>
                <div className="space-y-1">
                    <InputField label="Target Net Profit" value={inputs.targetNetProfitPercent} onChange={(v:any) => handleInputChange('targetNetProfitPercent', v)} suffix="%" className="font-bold text-emerald-800" />
                    <InputField label="Corp. Tax Rate" value={inputs.corporateTaxRatePercent} onChange={(v:any) => handleInputChange('corporateTaxRatePercent', v)} suffix="%" />
                    <div className="bg-emerald-50 p-1.5 rounded text-[8px] text-emerald-700 leading-tight mt-1">Gross-up calculated to ensure {inputs.targetNetProfitPercent}% Net Pocket.</div>
                </div>
            </div>
            {/* Col 4 */}
            <div className="bg-white rounded-lg shadow-sm border border-[#d0c3f1] p-2">
                <h2 className="text-[9px] font-bold uppercase text-purple-600/70 mb-1.5 flex items-center gap-1 border-b border-purple-100 pb-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Deductions (On Price)</h2>
                <div className="space-y-1">
                    <div className="grid grid-cols-2 gap-1.5">
                        <InputField label="Finance" value={inputs.financialRatePercent} onChange={(v:any) => handleInputChange('financialRatePercent', v)} suffix="%" />
                        <InputField label="Bond" value={inputs.performanceBondPercent} onChange={(v:any) => handleInputChange('performanceBondPercent', v)} suffix="%" />
                    </div>
                    <div className="pt-1 border-t border-slate-100">
                        <InputField label="Max Discount" value={inputs.maxDiscountPercent} onChange={(v:any) => handleInputChange('maxDiscountPercent', v)} suffix="%" className="text-pink-600 font-bold" icon={Percent} />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 3. DASHBOARD AREA */}
      <div className="p-3">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-3 items-start">
            
            {/* LEFT COLUMN: HERO & PROFIT (5 Cols) */}
            <div className="col-span-5 flex flex-col gap-2">
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-[#260762] to-[#4d2994] text-white rounded-xl shadow-lg p-4 relative overflow-hidden shrink-0">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><BarChart3 size={60} /></div>
                    <div className="relative z-10">
                        <h3 className="text-[#d0c3f1] text-[9px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d0c3f1] animate-pulse"></span> Suggested List Price
                        </h3>
                        <div className="text-4xl font-extrabold text-white tracking-tighter leading-tight">
                            {formatCurrency(results.listPriceExVat)}
                            <span className="text-lg text-[#d0c3f1] font-normal ml-1.5">THB</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-[9px] bg-[#d0c3f1]/20 px-1.5 py-0.5 rounded text-[#d0c3f1]">Inc. VAT: {formatCurrency(results.listPriceIncVat)}</span>
                            <span className="text-[9px] text-[#d0c3f1]/60 flex items-center gap-1"><Settings size={8} /> Rounded 100</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <div className="text-[#d0c3f1] text-[8px] uppercase font-bold">Winning Price (Target)</div>
                                <div className="text-emerald-300 font-mono font-bold text-base">{formatCurrency(results.targetPriceExVat)}</div>
                            </div>
                            <div className="text-white/50 text-[8px] bg-white/10 px-1.5 py-0.5 rounded">After {inputs.maxDiscountPercent}% Disc</div>
                        </div>
                    </div>
                </div>

                {/* Profit Stats (COMPACT & PURE) */}
                <div className="bg-white rounded-xl shadow-sm border border-[#d0c3f1] p-3 flex-1">
                    <h4 className="text-[9px] font-bold uppercase text-[#4d2994] mb-2 border-b border-slate-100 pb-1">Net Profit Analysis</h4>
                    
                    {/* Scenario 1: Target Price */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] font-bold text-slate-500">@ Target Price (-{inputs.maxDiscountPercent}%)</span>
                            <span className="text-[8px] text-slate-400">Winning Scenario</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[8px] text-slate-400">Total Retained</span>
                            <span className="text-slate-600 font-mono text-[10px]">{formatCurrency(results.netProfitAtWinning)}</span>
                        </div>
                        <div className="flex justify-between items-end bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                            <span className="text-[9px] font-bold text-emerald-700">Pure Pocket</span>
                            <span className="text-emerald-600 font-mono font-bold text-sm">+{formatCurrency(results.pureProfitAtWinning)}</span>
                        </div>
                    </div>

                    {/* Scenario 2: List Price */}
                    <div className="pt-2 border-t border-slate-50">
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] font-bold text-slate-500">@ List Price (0% Disc)</span>
                            <span className="text-[8px] text-slate-400">Full Price</span>
                        </div>
                        <div className="flex justify-between items-end bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">
                            <span className="text-[9px] font-bold text-blue-700">Pure Pocket</span>
                            <span className="text-blue-600 font-mono font-bold text-sm">+{formatCurrency(results.pureProfitAtList)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: STRUCTURE (7 Cols) */}
            <div className="col-span-7 bg-white rounded-xl shadow-sm border border-[#d0c3f1] overflow-hidden flex flex-col h-full">
                <div className="px-3 py-2 border-b border-[#d0c3f1]/30 bg-white shrink-0">
                    <div className="flex justify-between items-end mb-1">
                        <h3 className="font-bold text-[#260762] text-[10px] flex items-center gap-1.5"><Layers size={12} className="text-[#4d2994]" /> Cost Structure</h3>
                        <span className="text-[8px] text-slate-400">Breakdown %</span>
                    </div>
                    <CostStackedBar data={pieData} />
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#f8f7fc] text-[#4d2994] font-bold uppercase text-[9px] sticky top-0">
                            <tr><th className="px-3 py-1.5">Item</th><th className="px-3 py-1.5 text-right">Amount</th><th className="px-3 py-1.5 text-right">% Base</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[9px]">
                            <tr className="hover:bg-slate-50"><td className="px-3 py-1 font-bold text-[#260762]">Landed Cost</td><td className="px-3 py-1 text-right font-mono font-bold">{formatCurrency(results.landedCost)}</td><td className="px-3 py-1 text-right text-slate-400">100%</td></tr>
                            {inputs.isServiceEnabled && <tr className="hover:bg-slate-50"><td className="px-3 py-1 pl-5 text-slate-600 relative"><span className="absolute left-2.5 top-1.5 w-1 h-1 rounded-full bg-[#4d2994]"></span>Service</td><td className="px-3 py-1 text-right font-mono">{formatCurrency(results.serviceAmt)}</td><td className="px-3 py-1 text-right text-slate-400">{inputs.serviceMarkupPercent}%</td></tr>}
                            <tr className="hover:bg-slate-50"><td className="px-3 py-1 pl-5 text-slate-600 relative"><span className="absolute left-2.5 top-1.5 w-1 h-1 rounded-full bg-[#7c3aed]"></span>Ops</td><td className="px-3 py-1 text-right font-mono">{formatCurrency(results.operationAmt)}</td><td className="px-3 py-1 text-right text-slate-400">{inputs.operationMarkupPercent}%</td></tr>
                            <tr className="hover:bg-slate-50"><td className="px-3 py-1 pl-5 text-slate-600 relative"><span className="absolute left-2.5 top-1.5 w-1 h-1 rounded-full bg-[#a78bfa]"></span>Sponsor</td><td className="px-3 py-1 text-right font-mono">{formatCurrency(results.sponsorshipAmt)}</td><td className="px-3 py-1 text-right text-slate-400">{inputs.sponsorshipMarkupPercent}%</td></tr>
                            <tr className="hover:bg-slate-50"><td className="px-3 py-1 pl-5 text-slate-600 relative"><span className="absolute left-2.5 top-1.5 w-1 h-1 rounded-full bg-[#e879f9]"></span>Buffer</td><td className="px-3 py-1 text-right font-mono">{formatCurrency(results.bufferAmt)}</td><td className="px-3 py-1 text-right text-slate-400">{inputs.financialRiskBufferPercent}%</td></tr>
                            <tr className="bg-emerald-50/50 hover:bg-emerald-50"><td className="px-3 py-1 pl-5 text-emerald-800 font-bold relative"><span className="absolute left-2.5 top-1.5 w-1 h-1 rounded-full bg-emerald-500"></span>Net Profit (Target)</td><td className="px-3 py-1 text-right font-mono font-bold text-emerald-700">{formatCurrency(results.targetNetProfitAmt)}</td><td className="px-3 py-1 text-right text-emerald-600 font-bold">{inputs.targetNetProfitPercent}%</td></tr>
                            <tr className="bg-red-50/50 hover:bg-red-50"><td className="px-3 py-1 pl-5 text-red-800 relative"><span className="absolute left-2.5 top-1.5 w-1 h-1 rounded-full bg-red-500"></span>Corp Tax</td><td className="px-3 py-1 text-right font-mono text-red-600">{formatCurrency(results.taxAmt)}</td><td className="px-3 py-1 text-right text-red-400">Gross-up</td></tr>
                            <tr className="bg-[#f8f7fc] text-[#4d2994] font-bold text-[8px]"><td colSpan={3} className="px-3 py-1 border-t border-[#d0c3f1]/30">Sales Deductions</td></tr>
                            <tr className="hover:bg-slate-50"><td className="px-3 py-1 pl-5 text-slate-600 relative"><span className="absolute left-2.5 top-1.5 w-1 h-1 rounded-full bg-purple-500"></span>Fin/Bond</td><td className="px-3 py-1 text-right font-mono">{(results.financialAmt + results.bondFeeAmt).toLocaleString(undefined, {maximumFractionDigits:0})}</td><td className="px-3 py-1 text-right text-slate-400">Calc.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default App;