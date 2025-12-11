import React from 'react';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
  suffix?: string;
  step?: number;
  min?: number;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  icon,
  suffix,
  step = 0.01,
  min = 0,
  className
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-sm font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-slate-500 sm:text-sm">{icon}</span>
          </div>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          min={min}
          className={`block w-full rounded-md border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
            icon ? 'pl-10' : 'pl-3'
          } ${suffix ? 'pr-12' : 'pr-3'} transition-all`}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-slate-500 sm:text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};