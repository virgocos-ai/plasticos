import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  backButton?: boolean;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, backButton, action }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-8 glass-panel bg-white/40 p-6 rounded-2xl animate-fade-in border border-slate-200/60 shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 to-transparent pointer-events-none"></div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          {backButton && (
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 text-slate-400 hover:text-brand-accent bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:-translate-x-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-slate-800 tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 text-sm font-medium text-slate-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent/50"></span>
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0 animate-slide-up" style={{ animationDelay: '100ms' }}>{action}</div>}
      </div>
    </div>
  );
}
