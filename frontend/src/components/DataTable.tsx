import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  actions?: (row: any) => React.ReactNode;
}

export default function DataTable({ 
  columns, 
  data, 
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  actions
}: DataTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 glass-panel rounded-2xl">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-xl animate-pulse"></div>
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-brand-accent relative z-10" />
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="glass-panel rounded-2xl flex flex-col items-center justify-center py-16 text-slate-400">
        <div className="w-16 h-16 bg-slate-100/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-200">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-400 opacity-50"></div>
        </div>
        <p className="text-sm font-semibold tracking-wide uppercase">No se encontraron registros</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden bg-white/60 backdrop-blur-md relative animate-slide-up">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200/60">
          <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200/80">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className="px-6 py-4 text-left text-[11px] font-heading font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-left text-[11px] font-heading font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/40">
            {data.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-brand-accent/[0.02] transition-colors group">
                {columns.map((col) => (
                  <td 
                    key={col.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white/50 border-t border-slate-200/60 backdrop-blur-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando página <span className="font-bold text-brand-accent">{page}</span> de <span className="font-bold text-slate-700">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex shadow-sm rounded-xl gap-2">
                <button
                  onClick={() => onPageChange?.(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-brand-accent disabled:opacity-50 transition-all hover:shadow-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onPageChange?.(page + 1)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-brand-accent disabled:opacity-50 transition-all hover:shadow-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
