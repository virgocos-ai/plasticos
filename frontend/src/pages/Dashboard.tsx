import { useEffect, useState } from 'react'
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
      const [dashRes, ordenesRes] = await Promise.all([
        api.get('/reportes/dashboard'),
        api.get('/ordenes-produccion?estado=en_produccion')
      ])
      setData(dashRes.data)
      setOrdenesRecientes(ordenesRes.data.slice(0, 5))
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return <div className="text-center py-10 text-gray-500">Cargando dashboard...</div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Actualizado: {lastUpdate.toLocaleTimeString('es-MX')}</p>
        </div>
        <button onClick={loadDashboard} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.href} className="overflow-hidden rounded-xl bg-white shadow hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{stat.sub}</p>
                </div>
                <div className={`rounded-lg ${stat.color} p-2.5`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alertas de stock */}
      {alertasStock > 0 && (
        <Link to="/inventario" className="block rounded-xl bg-amber-50 border border-amber-200 p-4 hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {alertasStock} alerta{alertasStock !== 1 ? 's' : ''} de inventario
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {data?.inventario?.productos_bajos} producto{data?.inventario?.productos_bajos !== 1 ? 's' : ''} y {data?.inventario?.materiales_bajos} material{data?.inventario?.materiales_bajos !== 1 ? 'es' : ''} con stock bajo — Clic para ver
              </p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Panel órdenes de producción */}
        <div className="rounded-xl bg-white shadow lg:col-span-1">
          <div className="p-5 border-b">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Producción</h3>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Pendientes', count: ordenesEstados.pendiente, color: 'bg-yellow-100 text-yellow-700', icon: Clock },
              { label: 'En producción', count: ordenesEstados.en_produccion, color: 'bg-blue-100 text-blue-700', icon: Factory },
              { label: 'Completadas', count: ordenesEstados.completada, color: 'bg-green-100 text-green-700', icon: CheckCircle },
              { label: 'Canceladas', count: ordenesEstados.cancelada, color: 'bg-red-100 text-red-600', icon: TrendingUp },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <item.icon className="h-4 w-4 text-gray-400" />
                  {item.label}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${item.color}`}>{item.count}</span>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Eficiencia global</span>
                <span className="font-bold text-gray-900">{eficiencia}%</span>
              </div>
              <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full ${eficiencia >= 70 ? 'bg-green-500' : eficiencia >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${eficiencia}%` }} />
              </div>
            </div>
            <Link to="/ordenes-produccion" className="block w-full text-center text-xs text-blue-600 hover:text-blue-800 pt-1">
              Ver todas las órdenes →
            </Link>
          </div>
        </div>

        {/* Órdenes en producción ahora */}
        <div className="rounded-xl bg-white shadow lg:col-span-2">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">En Producción Ahora</h3>
            </div>
            <span className="text-xs text-gray-400">{ordenesRecientes.length} orden{ordenesRecientes.length !== 1 ? 'es' : ''}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {ordenesRecientes.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No hay órdenes en producción actualmente</div>
            ) : (
              ordenesRecientes.map(orden => (
                <div key={orden.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-700">{orden.folio}</span>
                      <span className={`text-xs font-medium ${getPrioridadColor(orden.prioridad)}`}>{orden.prioridad?.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {orden.cliente?.razon_social || 'Sin cliente'} · {orden.maquina_asignada || 'Sin máquina'}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {orden.fecha_entrega ? `Entrega: ${new Date(orden.fecha_entrega + 'T00:00:00').toLocaleDateString('es-MX')}` : 'Sin fecha'}
                  </div>
                </div>
              ))
            )}
          </div>
          {ordenesRecientes.length > 0 && (
            <div className="p-3 border-t text-center">
              <Link to="/ordenes-produccion" className="text-xs text-blue-600 hover:text-blue-800">Ver todas →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Nueva Cotización', href: '/cotizaciones', color: 'text-violet-600 bg-violet-50 hover:bg-violet-100', icon: FileText },
          { label: 'Nueva Factura', href: '/facturas', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100', icon: DollarSign },
          { label: 'Nueva Orden Prod.', href: '/ordenes-produccion', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100', icon: Factory },
          { label: 'Ver Inventario', href: '/inventario', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100', icon: Package },
        ].map(q => (
          <Link key={q.label} to={q.href} className={`flex items-center gap-3 rounded-xl p-4 ${q.color} transition-colors`}>
            <q.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
