import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Factory, User, Calendar, Clock, Wrench,
  CheckCircle, XCircle, PlayCircle, Package, AlertTriangle,
  ClipboardList, ChevronRight, RefreshCw, Printer, TrendingUp,
  Layers, ShieldCheck, Timer, Gauge, BarChart2, AlertCircle
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'

interface DetalleProd {
  id: number
  producto?: { nombre: string; codigo: string }
  material?: { nombre: string; codigo: string }
  cantidad_solicitada: number
  cantidad_producida: number
  cantidad_defectuosa: number
  tiempo_ciclo_real_seg: number
  temperatura_inyeccion_real: number
  presion_inyeccion_real: number
  ciclos_completados?: number
  peso_pieza_gr?: number
}

interface OrdenDetalle {
  id: number
  folio: string
  fecha_orden: string
  fecha_entrega: string
  estado: 'pendiente' | 'en_produccion' | 'completada' | 'cancelada'
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  maquina_asignada: string
  turno: string
  observaciones: string
  tiempo_estimado_min?: number
  tiempo_real_min?: number
  cliente?: { razon_social: string }
  usuario?: { nombre: string }
  maquina?: { nombre: string; modelo: string }
  operador?: { nombre: string }
  cotizacion?: { folio: string }
  detalles: DetalleProd[]
}

interface InspeccionResumen {
  id: number
  folio: string
  fecha_inspeccion: string
  tipo_inspeccion: string
  resultado: 'aprobado' | 'rechazado' | 'condicional' | 'pendiente'
  cantidad_inspeccionada: number
  porcentaje_defectos: number
  producto?: { nombre: string }
  inspector?: { nombre: string }
}

interface LoteResumen {
  id: number
  numero_lote: string
  estado: string
  cantidad_actual: number
  cantidad_inicial: number
  unidad_medida: string
  producto?: { nombre: string }
  almacen?: { nombre: string }
}

const ESTADO_CONFIG = {
  pendiente:     { label: 'Pendiente',   color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300', icon: Clock },
  en_produccion: { label: 'En Proceso',  color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-300',   icon: PlayCircle },
  completada:    { label: 'Completada',  color: 'text-green-700',  bg: 'bg-green-100',  border: 'border-green-300',  icon: CheckCircle },
  cancelada:     { label: 'Cancelada',   color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300',    icon: XCircle },
} as const

const PRIORIDAD_CONFIG = {
  baja:    { label: 'Baja',    color: 'text-gray-500',   dot: 'bg-gray-400' },
  media:   { label: 'Media',   color: 'text-blue-600',   dot: 'bg-blue-500' },
  alta:    { label: 'Alta',    color: 'text-orange-600', dot: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'text-red-600',    dot: 'bg-red-500' },
} as const

const RESULTADO_CONFIG = {
  aprobado:    { label: 'Aprobado',    color: 'text-green-700', bg: 'bg-green-100' },
  rechazado:   { label: 'Rechazado',   color: 'text-red-700',   bg: 'bg-red-100' },
  condicional: { label: 'Condicional', color: 'text-yellow-700',bg: 'bg-yellow-100' },
  pendiente:   { label: 'Pendiente',   color: 'text-gray-600',  bg: 'bg-gray-100' },
} as const

function CircularProgress({ value, size = 80 }: { value: number; size?: number }) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  const color = value >= 90 ? '#16a34a' : value >= 70 ? '#d97706' : '#dc2626'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={8} fill="none" stroke="#f1f5f9" />
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={8} fill="none"
        stroke={color} strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  )
}

export default function OrdenProduccionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [orden, setOrden] = useState<OrdenDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [inspecciones, setInspecciones] = useState<InspeccionResumen[]>([])
  const [lotes, setLotes] = useState<LoteResumen[]>([])
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [confirmEstado, setConfirmEstado] = useState<{ estado: string; mensaje: string } | null>(null)
  const [showAvance, setShowAvance] = useState(false)
  const [savingAvance, setSavingAvance] = useState(false)
  const [avanceData, setAvanceData] = useState<Record<number, {
    cantidad_producida: string
    cantidad_defectuosa: string
    temperatura_inyeccion_real: string
    presion_inyeccion_real: string
    tiempo_ciclo_real_seg: string
    ciclos_completados: string
  }>>({})

  useEffect(() => { loadOrden() }, [id])

  const loadOrden = async () => {
    setLoading(true)
    try {
      const [opRes, calRes, lotesRes] = await Promise.allSettled([
        api.get(`/ordenes-produccion/${id}`),
        api.get(`/calidad?orden_produccion_id=${id}`),
        api.get(`/lotes?search=&estado=activo&limit=50`),
      ])
      if (opRes.status === 'fulfilled') setOrden(opRes.value.data)
      else { toast.error('Error al cargar la orden'); navigate('/ordenes-produccion'); return }
      if (calRes.status === 'fulfilled') setInspecciones(calRes.value.data || [])
      if (lotesRes.status === 'fulfilled') {
        const allLotes: LoteResumen[] = lotesRes.value.data?.data || []
        // Filtrar lotes relacionados a esta OP via orden_produccion_id si está disponible
        const opId = opRes.value.data?.id
        setLotes(allLotes.filter((l: any) => l.orden_produccion_id === opId))
      }
    } finally { setLoading(false) }
  }

  const mensajesEstado: Record<string, string> = {
    en_produccion: '¿Iniciar esta orden de producción?',
    completada: '¿Marcar como completada? Asegúrate de que la producción está lista.',
    cancelada: '¿Cancelar esta orden? Esta acción no se puede deshacer.'
  }

  const handleCambiarEstado = async (nuevoEstado: string) => {
    setCambiandoEstado(true)
    setConfirmEstado(null)
    try {
      await api.put(`/ordenes-produccion/${id}/estado`, { estado: nuevoEstado })
      toast.success('Estado actualizado')
      loadOrden()
    } catch { toast.error('Error al cambiar estado') }
    finally { setCambiandoEstado(false) }
  }

  const openAvance = () => {
    if (!orden) return
    const init: typeof avanceData = {}
    orden.detalles.forEach(d => {
      init[d.id] = {
        cantidad_producida: String(d.cantidad_producida || ''),
        cantidad_defectuosa: String(d.cantidad_defectuosa || ''),
        temperatura_inyeccion_real: String(d.temperatura_inyeccion_real || ''),
        presion_inyeccion_real: String(d.presion_inyeccion_real || ''),
        tiempo_ciclo_real_seg: String(d.tiempo_ciclo_real_seg || ''),
        ciclos_completados: String((d as any).ciclos_completados || ''),
      }
    })
    setAvanceData(init)
    setShowAvance(true)
  }

  const handleRegistrarAvance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orden) return
    setSavingAvance(true)
    try {
      const detalles = Object.entries(avanceData).map(([detalle_id, vals]) => ({
        detalle_id: Number(detalle_id),
        cantidad_producida: vals.cantidad_producida ? Number(vals.cantidad_producida) : undefined,
        cantidad_defectuosa: vals.cantidad_defectuosa ? Number(vals.cantidad_defectuosa) : undefined,
        temperatura_inyeccion_real: vals.temperatura_inyeccion_real ? Number(vals.temperatura_inyeccion_real) : undefined,
        presion_inyeccion_real: vals.presion_inyeccion_real ? Number(vals.presion_inyeccion_real) : undefined,
        tiempo_ciclo_real_seg: vals.tiempo_ciclo_real_seg ? Number(vals.tiempo_ciclo_real_seg) : undefined,
        ciclos_completados: vals.ciclos_completados ? Number(vals.ciclos_completados) : undefined,
      }))
      const res = await api.post(`/ordenes-produccion/${id}/registrar-avance`, { detalles })
      toast.success(`Avance registrado. ${res.data.materiales_descontados} material(es) descontados del inventario.`)
      setShowAvance(false)
      loadOrden()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al registrar avance')
    } finally { setSavingAvance(false) }
  }

  const updAvance = (detId: number, field: string, value: string) =>
    setAvanceData(prev => ({ ...prev, [detId]: { ...prev[detId], [field]: value } }))

  const handleImprimirPDF = () => {
    const token = useAuthStore.getState().token
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/pdf/orden-produccion/${id}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) return r.json().then(e => Promise.reject(new Error(e.error || `HTTP ${r.status}`)))
        return r.blob()
      })
      .then(blob => {
        const objUrl = URL.createObjectURL(blob as Blob)
        const a = document.createElement('a')
        a.href = objUrl
        a.download = `op-${orden?.folio || id}.pdf`
        a.click()
        URL.revokeObjectURL(objUrl)
      })
      .catch((e: Error) => toast.error(`Error al generar PDF: ${e.message}`))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  )
  if (!orden) return null

  const estadoConf = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.pendiente
  const EstadoIcon = estadoConf.icon
  const prioConf = PRIORIDAD_CONFIG[orden.prioridad] ?? PRIORIDAD_CONFIG.media

  const totalSolicitado = orden.detalles.reduce((s, d) => s + Number(d.cantidad_solicitada), 0)
  const totalProducido  = orden.detalles.reduce((s, d) => s + Number(d.cantidad_producida),  0)
  const totalDefectuoso = orden.detalles.reduce((s, d) => s + Number(d.cantidad_defectuosa), 0)
  const totalBuenas     = totalProducido - totalDefectuoso
  const eficiencia      = totalSolicitado > 0 ? (totalProducido / totalSolicitado) * 100 : 0
  const rechazo         = totalProducido  > 0 ? (totalDefectuoso / totalProducido) * 100  : 0

  // Días para entrega
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const entrega = orden.fecha_entrega ? new Date(orden.fecha_entrega + 'T00:00:00') : null
  const diasRestantes = entrega ? Math.ceil((entrega.getTime() - hoy.getTime()) / 86400000) : null
  const entregaVencida = diasRestantes !== null && diasRestantes < 0 && orden.estado !== 'completada'
  const entregaUrgente = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 2 && orden.estado !== 'completada'

  return (
    <div className="space-y-5">

      {/* Alerta de vencimiento */}
      {entregaVencida && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          Esta orden lleva {Math.abs(diasRestantes!)} día(s) de retraso en su fecha de entrega.
        </div>
      )}
      {entregaUrgente && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {diasRestantes === 0 ? 'La entrega es hoy.' : `Quedan ${diasRestantes} día(s) para la fecha de entrega.`}
        </div>
      )}

      {/* Breadcrumb + header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
            <Link to="/ordenes-produccion" className="hover:text-blue-600">Órdenes de Producción</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-800 font-medium">{orden.folio}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{orden.folio}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${estadoConf.bg} ${estadoConf.color} ${estadoConf.border}`}>
              <EstadoIcon className="h-3.5 w-3.5" />
              {estadoConf.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${prioConf.color}`}>
              <span className={`inline-block h-2 w-2 rounded-full ${prioConf.dot}`} />
              {prioConf.label}
            </span>
            {diasRestantes !== null && orden.estado !== 'completada' && orden.estado !== 'cancelada' && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                entregaVencida ? 'bg-red-100 text-red-700' :
                entregaUrgente ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {entregaVencida ? `${Math.abs(diasRestantes)}d vencida` :
                 diasRestantes === 0 ? 'Hoy' : `${diasRestantes}d restantes`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => navigate('/ordenes-produccion')}
            className="flex items-center gap-1.5 text-sm border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <button onClick={handleImprimirPDF}
            className="flex items-center gap-1.5 text-sm border border-rose-200 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-50">
            <Printer className="h-4 w-4" /> PDF
          </button>
          {(orden.estado === 'en_produccion' || orden.estado === 'pendiente') && (
            <button onClick={openAvance}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              <ClipboardList className="h-4 w-4" /> Registrar Avance
            </button>
          )}
          {orden.estado === 'pendiente' && (
            <button onClick={() => setConfirmEstado({ estado: 'en_produccion', mensaje: mensajesEstado.en_produccion })}
              disabled={cambiandoEstado}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <PlayCircle className="h-4 w-4" /> Iniciar
            </button>
          )}
          {orden.estado === 'en_produccion' && (
            <button onClick={() => setConfirmEstado({ estado: 'completada', mensaje: mensajesEstado.completada })}
              disabled={cambiandoEstado}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
              <CheckCircle className="h-4 w-4" /> Completar
            </button>
          )}
          {(orden.estado === 'pendiente' || orden.estado === 'en_produccion') && (
            <button onClick={() => setConfirmEstado({ estado: 'cancelada', mensaje: mensajesEstado.cancelada })}
              disabled={cambiandoEstado}
              className="flex items-center gap-1.5 text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Cancelar
            </button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-500">Solicitadas</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSolicitado.toLocaleString('es-MX')}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="h-4 w-4 text-green-500" />
            <p className="text-xs text-gray-500">Producidas</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{totalProducido.toLocaleString('es-MX')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{totalBuenas.toLocaleString()} buenas</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-xs text-gray-500">Defectuosas</p>
          </div>
          <p className={`text-2xl font-bold ${totalDefectuoso > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {totalDefectuoso.toLocaleString('es-MX')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{rechazo.toFixed(1)}% de rechazo</p>
        </div>

        {/* Eficiencia circular */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <CircularProgress value={eficiencia} size={64} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
              {eficiencia.toFixed(0)}%
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Eficiencia</p>
            <p className={`text-sm font-semibold mt-0.5 ${eficiencia >= 90 ? 'text-green-600' : eficiencia >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {eficiencia >= 90 ? 'Excelente' : eficiencia >= 70 ? 'Aceptable' : eficiencia > 0 ? 'Bajo' : '—'}
            </p>
          </div>
        </div>

        {/* Tiempo */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="h-4 w-4 text-purple-400" />
            <p className="text-xs text-gray-500">Tiempo</p>
          </div>
          {orden.tiempo_estimado_min ? (
            <>
              <p className="text-xl font-bold text-purple-700">{orden.tiempo_estimado_min} min</p>
              {orden.tiempo_real_min && (
                <p className={`text-xs mt-0.5 font-medium ${orden.tiempo_real_min <= orden.tiempo_estimado_min ? 'text-green-600' : 'text-red-600'}`}>
                  Real: {orden.tiempo_real_min} min
                </p>
              )}
            </>
          ) : (
            <p className="text-xl font-bold text-gray-300">—</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">estimado / real</p>
        </div>
      </div>

      {/* Fila media: Datos + Progreso + Flujo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Datos generales */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-400" /> Datos Generales
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {[
              { icon: User,    label: 'Cliente',     value: orden.cliente?.razon_social },
              { icon: Factory, label: 'Máquina',     value: orden.maquina?.nombre || orden.maquina_asignada,
                sub: orden.maquina?.modelo },
              { icon: Calendar,label: 'Fecha Orden', value: new Date(orden.fecha_orden + 'T00:00:00').toLocaleDateString('es-MX') },
              { icon: Calendar,label: 'Fecha Entrega', value: entrega ? entrega.toLocaleDateString('es-MX') : '—',
                highlight: entregaVencida ? 'text-red-600' : entregaUrgente ? 'text-yellow-600' : undefined },
              { icon: Clock,   label: 'Turno',       value: orden.turno ? orden.turno.charAt(0).toUpperCase() + orden.turno.slice(1) : '—' },
              { icon: Wrench,  label: 'Operador',    value: orden.operador?.nombre },
              { icon: User,    label: 'Creada por',  value: orden.usuario?.nombre },
              ...(orden.cotizacion ? [{ icon: TrendingUp, label: 'Cotización', value: orden.cotizacion.folio, link: '/cotizaciones' }] : []),
            ].map(({ icon: Icon, label, value, sub, highlight, link }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  {link ? (
                    <Link to={link} className="font-medium text-blue-600 hover:underline text-sm">{value}</Link>
                  ) : (
                    <p className={`font-medium text-sm ${highlight ?? 'text-gray-800'}`}>{value || '—'}</p>
                  )}
                  {sub && <p className="text-xs text-gray-400">{sub}</p>}
                </div>
              </div>
            ))}
          </div>
          {orden.observaciones && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Observaciones</p>
              <p className="text-sm text-gray-700 leading-relaxed">{orden.observaciones}</p>
            </div>
          )}
        </div>

        {/* Progreso + Flujo */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-gray-400" /> Progreso
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Producidas / Solicitadas</span>
                  <span className="font-semibold">{eficiencia.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${eficiencia >= 90 ? 'bg-green-500' : eficiencia >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(eficiencia, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{totalProducido.toLocaleString()} prod.</span>
                  <span>{totalSolicitado.toLocaleString()} sol.</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Tasa de Rechazo</span>
                  <span className={`font-semibold ${rechazo <= 2 ? 'text-green-600' : rechazo <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {rechazo.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${rechazo <= 2 ? 'bg-green-400' : rechazo <= 5 ? 'bg-yellow-400' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(rechazo * 5, 100)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                <div>
                  <p className="text-xs text-gray-500">Buenas</p>
                  <p className="text-base font-bold text-green-700">{totalBuenas.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Defect.</p>
                  <p className="text-base font-bold text-red-600">{totalDefectuoso.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pendiente</p>
                  <p className="text-base font-bold text-gray-500">{Math.max(0, totalSolicitado - totalProducido).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stepper de estado */}
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-gray-500 mb-3">Flujo de estado</p>
            <div className="relative">
              {orden.estado !== 'cancelada' && (
                <div className="absolute left-3 top-3 bottom-3 w-px bg-gray-200" />
              )}
              {(['pendiente', 'en_produccion', 'completada'] as const).map(est => {
                const conf = ESTADO_CONFIG[est]
                const Icon = conf.icon
                const stateOrder = ['pendiente', 'en_produccion', 'completada']
                const currIdx = stateOrder.indexOf(orden.estado)
                const estIdx  = stateOrder.indexOf(est)
                const done    = orden.estado !== 'cancelada' && currIdx > estIdx
                const active  = est === orden.estado
                return (
                  <div key={est} className="flex items-center gap-3 mb-3 relative">
                    <div className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white
                      ${active ? `${conf.bg} ring-2 ring-offset-1` : done ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-3.5 w-3.5 ${active ? conf.color : done ? 'text-green-600' : 'text-gray-300'}`} />
                    </div>
                    <span className={`text-sm ${active ? `font-semibold ${conf.color}` : done ? 'text-green-600' : 'text-gray-400'}`}>
                      {conf.label}
                    </span>
                    {done && <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-auto" />}
                  </div>
                )
              })}
              {orden.estado === 'cancelada' && (
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <span className="text-sm font-semibold text-red-700">Cancelada</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla líneas de producción */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <Package className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-800">Líneas de Producción</h2>
          <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {orden.detalles.length} línea(s)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Producto / Material</th>
                <th className="px-4 py-3 text-right">Solicitada</th>
                <th className="px-4 py-3 text-right">Producida</th>
                <th className="px-4 py-3 text-right">Defectuosa</th>
                <th className="px-4 py-3 min-w-[120px]">Avance</th>
                <th className="px-4 py-3 text-right">Eficiencia</th>
                <th className="px-4 py-3 text-right">Ciclo (s)</th>
                <th className="px-4 py-3 text-right">Temp (°C)</th>
                <th className="px-4 py-3 text-right">Presión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orden.detalles.length > 0 ? orden.detalles.map(det => {
                const ef = det.cantidad_solicitada > 0
                  ? (det.cantidad_producida / det.cantidad_solicitada) * 100 : 0
                const avancePct = Math.min(ef, 100)
                return (
                  <tr key={det.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900">{det.producto?.nombre || '—'}</p>
                      <p className="text-xs text-gray-400">{det.material?.nombre || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {Number(det.cantidad_solicitada).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">
                      {Number(det.cantidad_producida).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {det.cantidad_defectuosa > 0
                        ? <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            {Number(det.cantidad_defectuosa).toLocaleString('es-MX')}
                          </span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${ef >= 90 ? 'bg-green-500' : ef >= 70 ? 'bg-yellow-500' : ef > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
                            style={{ width: `${avancePct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{ef.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-semibold ${ef >= 90 ? 'text-green-600' : ef >= 70 ? 'text-yellow-600' : ef > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                        {det.cantidad_solicitada > 0 ? `${ef.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{det.tiempo_ciclo_real_seg || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{det.temperatura_inyeccion_real || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{det.presion_inyeccion_real || '—'}</td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center">
                    <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Sin líneas de producción registradas</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspecciones de calidad */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <ShieldCheck className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-800">Inspecciones de Calidad</h2>
          <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {inspecciones.length} inspección(es)
          </span>
          <Link to="/calidad" className="text-xs text-blue-600 hover:underline ml-2">Ver todas</Link>
        </div>
        {inspecciones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Folio</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-right">Inspeccionadas</th>
                  <th className="px-4 py-3 text-right">% Defectos</th>
                  <th className="px-4 py-3 text-left">Resultado</th>
                  <th className="px-4 py-3 text-left">Inspector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inspecciones.map(ic => {
                  const rc = RESULTADO_CONFIG[ic.resultado] ?? RESULTADO_CONFIG.pendiente
                  return (
                    <tr key={ic.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-mono font-medium text-gray-700">{ic.folio}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(ic.fecha_inspeccion + 'T00:00:00').toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{ic.tipo_inspeccion}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{ic.producto?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {Number(ic.cantidad_inspeccionada).toLocaleString('es-MX')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={ic.porcentaje_defectos > 5 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {Number(ic.porcentaje_defectos).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rc.bg} ${rc.color}`}>
                          {rc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ic.inspector?.nombre || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center">
            <ShieldCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Sin inspecciones de calidad para esta orden</p>
            <Link to="/calidad" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              Registrar inspección →
            </Link>
          </div>
        )}
      </div>

      {/* Lotes generados */}
      {lotes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b">
            <Layers className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-gray-800">Lotes Generados</h2>
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {lotes.length} lote(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Número de Lote</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Almacén</th>
                  <th className="px-4 py-3 text-right">Cant. Inicial</th>
                  <th className="px-4 py-3 text-right">Cant. Actual</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lotes.map(lote => (
                  <tr key={lote.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-mono font-medium text-gray-700">{lote.numero_lote}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{lote.producto?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lote.almacen?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {Number(lote.cantidad_inicial).toLocaleString('es-MX')} {lote.unidad_medida}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">
                      {Number(lote.cantidad_actual).toLocaleString('es-MX')} {lote.unidad_medida}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                        ${lote.estado === 'activo' ? 'bg-green-100 text-green-700' :
                          lote.estado === 'cuarentena' ? 'bg-yellow-100 text-yellow-700' :
                          lote.estado === 'agotado' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                        {lote.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmEstado !== null}
        title="Cambiar estado"
        message={confirmEstado?.mensaje || ''}
        confirmText="Confirmar"
        type={confirmEstado?.estado === 'cancelada' ? 'danger' : 'info'}
        onConfirm={() => confirmEstado && handleCambiarEstado(confirmEstado.estado)}
        onClose={() => setConfirmEstado(null)}
      />

      {/* Modal registrar avance */}
      <Modal isOpen={showAvance} onClose={() => setShowAvance(false)} title="Registrar Avance de Producción" size="xl">
        <form onSubmit={handleRegistrarAvance} className="space-y-4">
          <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs rounded-lg p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>El sistema descontará automáticamente el material consumido del inventario según el peso por pieza registrado.</span>
          </div>

          {orden.detalles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Esta orden no tiene líneas de producción registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Producto</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Solicitada</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-indigo-600 uppercase tracking-wide">Producida *</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Defectuosa</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Temp °C</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Presión bar</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Ciclo s</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Ciclos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orden.detalles.map(det => {
                    const av = avanceData[det.id] || {}
                    const producida = Number(av.cantidad_producida) || 0
                    const avPct = det.cantidad_solicitada > 0 ? (producida / det.cantidad_solicitada * 100).toFixed(0) : 0
                    return (
                      <tr key={det.id} className="hover:bg-indigo-50/30">
                        <td className="px-3 py-3">
                          <p className="font-semibold text-gray-900">{det.producto?.nombre || '—'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{det.material?.nombre}</p>
                          {producida > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(Number(avPct), 100)}%` }} />
                              </div>
                              <span className="text-xs text-indigo-600 font-medium">{avPct}%</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-500 font-medium">
                          {Number(det.cantidad_solicitada).toLocaleString('es-MX')}
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" min={0} step="1"
                            className="w-24 border border-indigo-300 rounded-lg px-2 py-1.5 text-sm text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none block mx-auto"
                            value={av.cantidad_producida || ''}
                            onChange={e => updAvance(det.id, 'cantidad_producida', e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" min={0} step="1"
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:ring-1 focus:ring-gray-400 outline-none block mx-auto"
                            value={av.cantidad_defectuosa || ''}
                            onChange={e => updAvance(det.id, 'cantidad_defectuosa', e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" step="0.1"
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:ring-1 focus:ring-gray-400 outline-none block mx-auto"
                            value={av.temperatura_inyeccion_real || ''}
                            onChange={e => updAvance(det.id, 'temperatura_inyeccion_real', e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" step="0.1"
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:ring-1 focus:ring-gray-400 outline-none block mx-auto"
                            value={av.presion_inyeccion_real || ''}
                            onChange={e => updAvance(det.id, 'presion_inyeccion_real', e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" step="0.1"
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:ring-1 focus:ring-gray-400 outline-none block mx-auto"
                            value={av.tiempo_ciclo_real_seg || ''}
                            onChange={e => updAvance(det.id, 'tiempo_ciclo_real_seg', e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" step="1" min={0}
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:ring-1 focus:ring-gray-400 outline-none block mx-auto"
                            value={av.ciclos_completados || ''}
                            onChange={e => updAvance(det.id, 'ciclos_completados', e.target.value)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setShowAvance(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={savingAvance || orden.detalles.length === 0}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {savingAvance && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Guardar Avance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
