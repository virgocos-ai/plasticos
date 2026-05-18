interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  options: Option[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  helpText?: string;
}

export default function FormSelect({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
  error,
  disabled = false,
  helpText
}: FormSelectProps) {
  return (
    <div className="mb-5 group">
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-1.5 transition-colors group-focus-within:text-brand-accent">
        {label}
        {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-4 transition-all duration-300 bg-white/70 backdrop-blur-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-no-repeat bg-[position:right_1rem_center] pr-10 ${
          error 
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
            : 'border-slate-200 focus:border-brand-accent focus:ring-brand-glow/20 hover:border-slate-300'
        } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200/50' : 'text-slate-800'}`}
      >
        <option value="" disabled className="text-slate-400">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-slate-800 font-medium">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-500 animate-slide-up">{error}</p>}
      {helpText && !error && <p className="mt-1.5 text-xs font-medium text-slate-400">{helpText}</p>}
    </div>
  );
}
