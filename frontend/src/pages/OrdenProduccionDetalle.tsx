import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Factory, User, Calendar, Clock, Wrench,
  CheckCircle, XCircle, PlayCircle, Package, AlertTriangle,
  ClipboardList, ChevronRight, RefreshCw
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface OrdenDetalle {
  id: number
  folio: string
  fecha_orden: string
  fecha_entrega: string
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente'
  maquina_asignada: string
  turno: string
  observaciones: string
  cliente?: { razon_social: string }
  usuario?: { nombre: string }
  maquina?: { nombre: string; modelo: string }
  operador?: { nombre: string }
  cotizacion?: { folio: string }
  detalles: {
    id: number
    producto?: { nombre: string; codigo: string }
    material?: { nombre: string; codigo: string }
    cantidad_solicitada: number
    cantidad_producida: number
    cantidad_defectuosa: number
    tiempo_ciclo_real_seg: number
    temperatura_inyeccion_real: number
    presion_inyeccion_real: number
  }[]
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendiente:   { label: 'Pendiente',   color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  en_proceso:  { label: 'En Proceso',  color: 'text-blue-700',   bg: 'bg-blue-100',   icon: PlayCircle },
  completada:  { label: 'Completada',  color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  cancelada:   { label: 'Cancelada',   color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle },
}

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  baja:    { label: 'Baja',    color: 'text-gray-500' },
  normal:  { label: 'Normal',  color: 'text-blue-600' },
  alta:    { label: 'Alta',    color: 'text-orange-600' },
  urgente: { label: 'Urgente', color: 'text-red-600' },
}

export default function OrdenProduccionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [orden, setOrden] = useState<OrdenDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  useEffect(() => { loadOrden() }, [id])

  const loadOrden = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/ordenes-produccion/${id}`)
      setOrden(res.data)
    } catch {
      toast.error('Error al cargar la orden')
      navigate('/ordenes-produccion')
    } finally { setLoading(false) }
  }

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!orden) return
    const mensajes: Record<string, string> = {
      en_proceso: '¿Iniciar esta orden de producción?',
      completada: '¿Marcar como completada?',
      cancelada: '¿Cancelar esta orden? Esta acción no se puede deshacer.'
    }
    if (!confirm(mensajes[nuevoEstado])) return
    setCambiandoEstado(true)
    try {
      await api.put(`/ordenes-produccion/${id}/estado`, { estado: nuevoEstado })
      toast.success('Estado actualizado')
      loadOrden()
    } catch {
      toast.error('Error al cambiar estado')
    } finally { setCambiandoEstado(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!orden) return null

  const estadoConf = ESTADO_CONFIG[orden.estado] || ESTADO_CONFIG.pendiente
  const EstadoIcon = estadoConf.icon
  const prioConf = PRIORIDAD_CONFIG[orden.prioridad] || PRIORIDAD_CONFIG.normal

  const totalSolicitado = orden.detalles.reduce((s, d) => s + Number(d.cantidad_solicitada), 0)
  const totalProducido = orden.detalles.reduce((s, d) => s + Number(d.cantidad_producida), 0)
  const totalDefectuoso = orden.detalles.reduce((s, d) => s + Number(d.cantidad_defectuosa), 0)
  const eficiencia = totalSolicitado > 0 ? ((totalProducido / totalSolicitado) * 100).toFixed(1) : '0'
  const rechazo = totalProducido > 0 ? ((totalDefectuoso / totalProducido) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
            <Link to="/ordenes-produccion" className="hover:text-blue-600">Órdenes de Producción</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-800 font-medium">{orden.folio}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{orden.folio}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${estadoConf.bg} ${estadoConf.color}`}>
              <EstadoIcon className="h-4 w-4" />
              {estadoConf.label}
            </span>
            <span className={`text-sm font-semibold ${prioConf.color}`}>● {prioConf.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => navigate('/ordenes-produccion')}
            className="flex items-center gap-1.5 text-sm border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>

          {orden.estado === 'pendiente' && (
            <button onClick={() => handleCambiarEstado('en_proceso')} disabled={cambiandoEstado}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
              <PlayCircle className="h-4 w-4" /> Iniciar
            </button>
          )}
          {orden.estado === 'en_proceso' && (
            <button onClick={() => handleCambiarEstado('completada')} disabled={cambiandoEstado}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
              <CheckCircle className="h-4 w-4" /> Completar
            </button>
          )}
          {(orden.estado === 'pendiente' || orden.estado === 'en_proceso') && (
            <button onClick={() => handleCambiarEstado('cancelada')} disabled={cambiandoEstado}
              className="flex items-center gap-1.5 text-sm bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Cancelar
            </button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Piezas Solicitadas</p>
          <p className="text-2xl font-bold text-gray-900">{totalSolicitado.toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Piezas Producidas</p>
          <p className="text-2xl font-bold text-green-700">{totalProducido.toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Eficiencia</p>
          <p className={`text-2xl font-bold ${Number(eficiencia) >= 90 ? 'text-green-600' : Number(eficiencia) >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {eficiencia}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">% Rechazo</p>
          <p className={`text-2xl font-bold ${Number(rechazo) <= 2 ? 'text-green-600' : Number(rechazo) <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
            {rechazo}%
          </p>
          <p className="text-xs text-gray-400">{totalDefectuoso} piezas</p>
        </div>
      </div>

      {/* Info general + progreso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Datos generales */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-500" /> Datos Generales
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="font-medium text-gray-800">{orden.cliente?.razon_social || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Factory className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Máquina</p>
                <p className="font-medium text-gray-800">
                  {orden.maquina?.nombre || orden.maquina_asignada || '—'}
                  {orden.maquina?.modelo && <span className="text-gray-400 text-xs ml-1">({orden.maquina.modelo})</span>}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Fecha Orden</p>
                <p className="font-medium text-gray-800">
                  {new Date(orden.fecha_orden).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Fecha Entrega</p>
                <p className="font-medium text-gray-800">
                  {orden.fecha_entrega
                    ? new Date(orden.fecha_entrega).toLocaleDateString('es-MX')
                    : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Turno</p>
                <p className="font-medium text-gray-800 capitalize">{orden.turno}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Wrench className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Operador</p>
                <p className="font-medium text-gray-800">{orden.operador?.nombre || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Creada por</p>
                <p className="font-medium text-gray-800">{orden.usuario?.nombre || '—'}</p>
              </div>
            </div>
            {orden.cotizacion && (
              <div className="flex items-start gap-2">
                <ClipboardList className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Cotización origen</p>
                  <Link to="/cotizaciones" className="font-medium text-blue-600 hover:underline">
                    {orden.cotizacion.folio}
                  </Link>
                </div>
              </div>
            )}
          </div>
          {orden.observaciones && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Observaciones</p>
              <p className="text-sm text-gray-700">{orden.observaciones}</p>
            </div>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Progreso</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Producidas vs Solicitadas</span>
                <span className="font-medium">{eficiencia}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${Number(eficiencia) >= 90 ? 'bg-green-500' : Number(eficiencia) >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Number(eficiencia), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{totalProducido.toLocaleString()} prod.</span>
                <span>{totalSolicitado.toLocaleString()} sol.</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Tasa de Rechazo</span>
                <span className={`font-medium ${Number(rechazo) <= 2 ? 'text-green-600' : 'text-red-600'}`}>{rechazo}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${Number(rechazo) <= 2 ? 'bg-green-400' : Number(rechazo) <= 5 ? 'bg-yellow-400' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Number(rechazo) * 5, 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Buenas</span>
                <span className="font-semibold text-green-700">{(totalProducido - totalDefectuoso).toLocaleString('es-MX')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Defectuosas</span>
                <span className="font-semibold text-red-600">{totalDefectuoso.toLocaleString('es-MX')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pendientes</span>
                <span className="font-semibold text-gray-700">
                  {Math.max(0, totalSolicitado - totalProducido).toLocaleString('es-MX')}
                </span>
              </div>
            </div>

            {/* Estado steps */}
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-3">Flujo de estado</p>
              {['pendiente', 'en_proceso', 'completada'].map((est, i) => {
                const conf = ESTADO_CONFIG[est]
                const Icon = conf.icon
                const states = ['pendiente', 'en_proceso', 'completada', 'cancelada']
                const currentIdx = states.indexOf(orden.estado)
                const estIdx = states.indexOf(est)
                const done = orden.estado === 'cancelada' ? false : currentIdx > estIdx
                const active = est === orden.estado
                return (
                  <div key={est} className="flex items-center gap-2 mb-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${active ? conf.bg : done ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-3.5 w-3.5 ${active ? conf.color : done ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-xs ${active ? 'font-semibold text-gray-800' : done ? 'text-green-700' : 'text-gray-400'}`}>
                      {conf.label}
                    </span>
                    {i < 2 && <div className={`flex-1 h-px ${done ? 'bg-green-300' : 'bg-gray-200'}`} />}
                  </div>
                )
              })}
              {orden.estado === 'cancelada' && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <span className="text-xs font-semibold text-red-700">Cancelada</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de detalles */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b">
          <Package className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-800">Líneas de Producción</h2>
          <span className="ml-auto text-xs text-gray-400">{orden.detalles.length} línea(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solicitada</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Producida</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Defectuosa</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Eficiencia</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">T. Ciclo (s)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Temp (°C)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Presión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orden.detalles.length > 0 ? orden.detalles.map(det => {
                const ef = det.cantidad_solicitada > 0
                  ? ((det.cantidad_producida / det.cantidad_solicitada) * 100).toFixed(1)
                  : '—'
                return (
                  <tr key={det.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{det.producto?.nombre || '—'}</p>
                      <p className="text-xs text-gray-400">{det.producto?.codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{det.material?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{Number(det.cantidad_solicitada).toLocaleString('es-MX')}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-700">{Number(det.cantidad_producida).toLocaleString('es-MX')}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {det.cantidad_defectuosa > 0
                        ? <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{Number(det.cantidad_defectuosa).toLocaleString('es-MX')}</span>
                        : <span className="text-gray-400">0</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-semibold ${Number(ef) >= 90 ? 'text-green-600' : Number(ef) >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {ef}{ef !== '—' ? '%' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{det.tiempo_ciclo_real_seg || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{det.temperatura_inyeccion_real || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{det.presion_inyeccion_real || '—'}</td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">Sin líneas de producción registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
