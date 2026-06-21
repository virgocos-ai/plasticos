import { useEffect, useState } from 'react'
import { SkeletonPage } from '../components/Skeleton'
import { 
  DollarSign, Package, Users, AlertTriangle,
  TrendingUp, Factory, FileText, ShoppingCart,
  ArrowUp, Clock, CheckCircle, RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

interface DashboardData {
  ventas: { ventas_totales: number; total_facturas: number }
  ordenes_produccion: Array<{ estado: string; total: number }>
  inventario: { total_productos: number; total_materiales: number; productos_bajos: number; materiales_bajos: number }
  clientes: { total_clientes: number }
}

interface OrdenReciente {
  id: number; folio: string; estado: string; prioridad: string
  maquina_asignada: string; fecha_entrega: string
  cliente: { razon_social: string } | null
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [ordenesRecientes, setOrdenesRecientes] = useState<OrdenReciente[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [dashRes, ordenesRes] = await Promise.allSettled([
        api.get('/reportes/dashboard'),
        api.get('/ordenes-produccion?estado=en_produccion')
      ])
      if (dashRes.status === 'fulfilled') setData(dashRes.value.data)
      else console.error('Error cargando dashboard:', dashRes.reason)
      if (ordenesRes.status === 'fulfilled') setOrdenesRecientes(ordenesRes.value.data.slice(0, 5))
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return <SkeletonPage />
  }

  if (!loading && !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-medium mb-2">No se pudo cargar el dashboard</p>
        <p className="text-gray-400 text-sm mb-4">Verifica que el servidor esté activo</p>
        <button onClick={loadDashboard} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          Reintentar
        </button>
      </div>
    )
  }

  const ordenesEstados = {
    pendiente: data?.ordenes_produccion?.find(o => o.estado === 'pendiente')?.total || 0,
    en_produccion: data?.ordenes_produccion?.find(o => o.estado === 'en_produccion')?.total || 0,
    completada: data?.ordenes_produccion?.find(o => o.estado === 'completada')?.total || 0,
    cancelada: data?.ordenes_produccion?.find(o => o.estado === 'cancelada')?.total || 0,
  }

  const totalOrdenes = Object.values(ordenesEstados).reduce((a, b) => a + b, 0)
  const eficiencia = totalOrdenes > 0 ? Math.round((ordenesEstados.completada / totalOrdenes) * 100) : 0
  const alertasStock = (data?.inventario?.productos_bajos || 0) + (data?.inventario?.materiales_bajos || 0)

  const stats = [
    {
      name: 'Ventas totales',
      value: `$${(data?.ventas?.ventas_totales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sub: `${data?.ventas?.total_facturas || 0} facturas timbradas`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      href: '/facturas'
    },
    {
      name: 'Clientes activos',
      value: data?.clientes?.total_clientes || 0,
      sub: 'en sistema',
      icon: Users,
      color: 'bg-blue-500',
      href: '/clientes'
    },
    {
      name: 'Productos',
      value: data?.inventario?.total_productos || 0,
      sub: `${data?.inventario?.productos_bajos || 0} con stock bajo`,
      icon: Package,
      color: 'bg-violet-500',
      href: '/productos'
    },
    {
      name: 'Materiales',
      value: data?.inventario?.total_materiales || 0,
      sub: `${data?.inventario?.materiales_bajos || 0} con stock bajo`,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      href: '/materiales'
    },
  ]

  const getPrioridadColor = (p: string) => ({ urgente: 'text-red-600', alta: 'text-orange-500', media: 'text-blue-500', baja: 'text-gray-400' }[p] || 'text-gray-400')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/40 p-6 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-sm animate-fade-in">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-800 tracking-tight">Panel de <span className="text-brand-accent">Control</span></h1>
          <p className="mt-1 text-sm font-medium text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Actualizado: {lastUpdate.toLocaleTimeString('es-MX')}
          </p>
        </div>
        <button onClick={loadDashboard} className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md hover:-translate-y-0.5">
          <RefreshCw className={`h-4 w-4 text-brand-accent ${loading ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Link 
            key={stat.name} 
            to={stat.href} 
            className="group glass-panel rounded-2xl hover-glow overflow-hidden relative animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent z-0 pointer-events-none"></div>
            <div className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.name}</p>
                  <p className="mt-2 text-3xl font-heading font-extrabold text-slate-800 tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{stat.sub}</p>
                </div>
                <div className={`rounded-xl ${stat.color} p-3 shadow-lg shadow-${stat.color.split('-')[1]}-500/30 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alertas de stock */}
      {alertasStock > 0 && (
        <Link to="/inventario" className="block rounded-2xl bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 p-5 hover:bg-amber-100/80 transition-all shadow-sm hover:shadow-md animate-fade-in relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-300/30 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600 shadow-sm border border-amber-200">
              <AlertTriangle className="h-6 w-6 flex-shrink-0 animate-pulse" />
            </div>
            <div>
              <p className="text-base font-bold text-amber-900 tracking-wide">
                {alertasStock} alerta{alertasStock !== 1 ? 's' : ''} de inventario crítico
              </p>
              <p className="text-sm font-medium text-amber-700/80 mt-0.5">
                {data?.inventario?.productos_bajos} producto{data?.inventario?.productos_bajos !== 1 ? 's' : ''} y {data?.inventario?.materiales_bajos} material{data?.inventario?.materiales_bajos !== 1 ? 'es' : ''} con stock bajo — Haz clic para revisar
              </p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Panel órdenes de producción */}
        <div className="rounded-2xl glass-panel lg:col-span-1 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="p-6 border-b border-slate-200/60 bg-white/30 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-brand-accent rounded-lg">
                <Factory className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 text-lg">Producción</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Pendientes', count: ordenesEstados.pendiente, color: 'bg-yellow-100 text-yellow-700 border border-yellow-200', icon: Clock },
              { label: 'En producción', count: ordenesEstados.en_produccion, color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: Factory },
              { label: 'Completadas', count: ordenesEstados.completada, color: 'bg-green-100 text-green-700 border border-green-200', icon: CheckCircle },
              { label: 'Canceladas', count: ordenesEstados.cancelada, color: 'bg-red-100 text-red-600 border border-red-200', icon: TrendingUp },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between group hover:bg-slate-50/50 p-2 -mx-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className={`p-1.5 rounded-md bg-white shadow-sm border border-slate-100 ${item.color.split(' ')[1]}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.label}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${item.color}`}>{item.count}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-200/60 mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold text-slate-500">Eficiencia global</span>
                <span className="font-heading font-extrabold text-slate-800 text-lg">{eficiencia}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${eficiencia >= 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : eficiencia >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} style={{ width: `${eficiencia}%` }}>
                  <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <Link to="/ordenes-produccion" className="mt-4 block w-full text-center text-sm font-semibold text-brand-accent hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50 py-2 rounded-xl border border-blue-100 transition-colors">
              Ver todas las órdenes →
            </Link>
          </div>
        </div>

        {/* Órdenes en producción ahora */}
        <div className="rounded-2xl glass-panel lg:col-span-2 flex flex-col animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="p-6 border-b border-slate-200/60 bg-white/30 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <ArrowUp className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 text-lg">En Producción Ahora</h3>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200">{ordenesRecientes.length} activa{ordenesRecientes.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {ordenesRecientes.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-slate-400">
                <Factory className="h-12 w-12 text-slate-200 mb-3" />
                <p className="text-sm font-medium">No hay órdenes en producción actualmente</p>
              </div>
            ) : (
              ordenesRecientes.map(orden => (
                <div key={orden.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-accent group-hover:text-blue-700 transition-colors">{orden.folio}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getPrioridadColor(orden.prioridad).replace('text-', 'bg-').replace('600', '50').replace('500', '50').replace('400', '50')} ${getPrioridadColor(orden.prioridad)}`}>
                        {orden.prioridad}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                      <span className="text-slate-700">{orden.cliente?.razon_social || 'Sin cliente'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>{orden.maquina_asignada || 'Sin máquina'}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    {orden.fecha_entrega ? `Entrega: ${new Date(orden.fecha_entrega + 'T00:00:00').toLocaleDateString('es-MX')}` : 'Sin fecha'}
                  </div>
                </div>
              ))
            )}
          </div>
          {ordenesRecientes.length > 0 && (
            <div className="p-4 border-t border-slate-100 text-center bg-slate-50/50 rounded-b-2xl">
              <Link to="/ordenes-produccion" className="text-sm font-bold text-brand-accent hover:text-blue-800 transition-colors">Ver listado completo →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Nueva Cotización', href: '/cotizaciones', color: 'from-violet-500 to-fuchsia-500 shadow-violet-500/30', icon: FileText },
          { label: 'Nueva Factura', href: '/facturas', color: 'from-emerald-400 to-teal-500 shadow-emerald-500/30', icon: DollarSign },
          { label: 'Nueva Orden Prod.', href: '/ordenes-produccion', color: 'from-blue-500 to-brand-accent shadow-blue-500/30', icon: Factory },
          { label: 'Ver Inventario', href: '/inventario', color: 'from-orange-400 to-amber-500 shadow-orange-500/30', icon: Package },
        ].map((q, i) => (
          <Link 
            key={q.label} 
            to={q.href} 
            className="group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg animate-slide-up"
            style={{ animationDelay: `${(i + 6) * 100}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${q.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10 flex flex-col items-start gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                <q.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-wide">{q.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
