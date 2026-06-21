import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center">
            <Search className="h-10 w-10 text-blue-400" />
          </div>
        </div>

        <h1 className="text-7xl font-black text-slate-200 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Página no encontrada</h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          La ruta que buscas no existe o fue movida. Verifica la URL o regresa al inicio.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Home className="h-4 w-4" />
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
