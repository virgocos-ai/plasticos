import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  helpText?: string;
}

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  error,
  placeholder,
  maxLength,
  min,
  max,
  step,
  disabled = false,
  helpText
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="mb-5 relative group">
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-accent">
        {label}
        {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`w-full px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-4 transition-all duration-300 bg-white/70 backdrop-blur-sm ${
            error 
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
              : 'border-slate-200 focus:border-brand-accent focus:ring-brand-glow/20 hover:border-slate-300'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200/50' : 'text-slate-800'} ${type === 'password' ? 'pr-12' : ''}`}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-accent hover:bg-slate-100 rounded-lg transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-500 animate-slide-up">{error}</p>}
      {helpText && !error && <p className="mt-1.5 text-xs font-medium text-slate-400">{helpText}</p>}
    </div>
  );
}
