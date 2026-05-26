import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, RefreshCw, Factory, Calendar, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import { SkeletonPage } from '../components/Skeleton'

/* ─────────────────────────────── tipos ─────────────────────────────── */
interface OrdenGantt {
  id: number
  folio: string
  estado: 'pendiente' | 'en_produccion' | 'completada' | 'cancelada'
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  turno: 'matutino' | 'vespertino' | 'nocturno'
  fecha_orden: string
  fecha_entrega: string | null
  tiempo_estimado_min: number | null
  cliente: string | null
  operador: string | null
  maquina_nombre: string | null
}

interface MaquinaGantt {
  maquina: string
  total_ordenes: number
  ordenes: OrdenGantt[]
}

interface GanttData {
  fecha_inicio: string
  fecha_fin: string
  maquinas: MaquinaGantt[]
}

/* ─────────────────────────────── helpers ─────────────────────────────── */
const ESTADO_BAR: Record<string, string> = {
  pendiente: 'bg-yellow-400',
  en_produccion: 'bg-blue-500',
  completada: 'bg-emerald-500',
  cancelada: 'bg-red-400',
}

const PRIORIDAD_RING: Record<string, string> = {
  baja: 'ring-slate-300',
  media: 'ring-blue-300',
  alta: 'ring-orange-400',
  urgente: 'ring-red-500',
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getWeekRange(referenceDate: string): { inicio: string; fin: string } {
  const d = new Date(referenceDate + 'T00:00:00')
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1
  const lunes = new Date(d)
  lunes.setDate(d.getDate() - day)
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)
  return {
    inicio: lunes.toISOString().split('T')[0],
    fin: domingo.toISOString().split('T')[0]
  }
}

function buildDaysArray(inicio: string, fin: string): string[] {
  const days: string[] = []
  let curr = inicio
  while (curr <= fin) {
    days.push(curr)
    curr = addDays(curr, 1)
  }
  return days
}

/* ─────────────────────────────── subcomponente: card de OP ─────────────────────────────── */
function OrdenCard({ orden, navigate }: { orden: OrdenGantt; navigate: ReturnType<typeof useNavigate> }) {
  const ring = PRIORIDAD_RING[orden.prioridad]
  const bar = ESTADO_BAR[orden.estado]

  return (
    <button
      onClick={() => navigate(`/ordenes-produccion/${orden.id}`)}
      className={`w-full text-left rounded-lg border bg-white shadow-sm hover:shadow-md transition-all ring-2 ${ring} overflow-hidden`}
    >
      {/* barra de estado superior */}
      <div className={`h-1.5 w-full ${bar}`} />
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-blue-700 truncate">{orden.folio}</span>
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            orden.prioridad === 'urgente' ? 'bg-red-100 text-red-700'
            : orden.prioridad === 'alta' ? 'bg-orange-100 text-orange-700'
            : orden.prioridad === 'media' ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600'
          }`}>{orden.prioridad}</span>
        </div>
        {orden.cliente && (
          <p className="text-[11px] text-slate-600 truncate">{orden.cliente}</p>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="capitalize">{orden.turno}</span>
          {orden.fecha_entrega && (
            <span className={`font-semibold ${orden.fecha_entrega < new Date().toISOString().split('T')[0] && orden.estado !== 'completada' ? 'text-red-500' : 'text-slate-500'}`}>
              ⏎ {formatDate(orden.fecha_entrega)}
            </span>
          )}
        </div>
        {orden.operador && (
          <p className="text-[10px] text-slate-400 truncate">👤 {orden.operador}</p>
        )}
        {orden.tiempo_estimado_min && (
          <p className="text-[10px] text-slate-400">⏱ {orden.tiempo_estimado_min} min</p>
        )}
      </div>
    </button>
  )
}

/* ─────────────────────────────── página principal ─────────────────────────────── */
export default function Gantt() {
  const navigate = useNavigate()
  const hoy = new Date().toISOString().split('T')[0]
  const [semanaRef, setSemanaRef] = useState(hoy)
  const [data, setData] = useState<GanttData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'semana' | 'dos_semanas'>('semana')

  const { inicio, fin } = useMemo(() => {
    const base = getWeekRange(semanaRef)
    if (viewMode === 'dos_semanas') {
      return { inicio: base.inicio, fin: addDays(base.inicio, 13) }
    }
    return base
  }, [semanaRef, viewMode])

  const dias = useMemo(() => buildDaysArray(inicio, fin), [inicio, fin])

  useEffect(() => { loadGantt() }, [inicio, fin])

  const loadGantt = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/gantt?fecha_inicio=${inicio}&fecha_fin=${fin}`)
      setData(res.data)
    } catch {
      // silencioso — mostrar estado vacío
    } finally {
      setLoading(false)
    }
  }

  const prevSemana = () => setSemanaRef(addDays(inicio, -7))
  const nextSemana = () => setSemanaRef(addDays(inicio, 7))
  const irHoy = () => setSemanaRef(hoy)

  if (loading && !data) return <SkeletonPage />

  const maquinas = data?.maquinas ?? []
  const totalOrdenes = maquinas.reduce((s, m) => s + m.total_ordenes, 0)

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Planificación de Producción</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDate(inicio)} → {formatDate(fin)} · {totalOrdenes} órdenes
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle semana / 2 semanas */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setViewMode('semana')}
              className={`px-3 py-1.5 transition-colors ${viewMode === 'semana' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              1 semana
            </button>
            <button
              onClick={() => setViewMode('dos_semanas')}
              className={`px-3 py-1.5 transition-colors ${viewMode === 'dos_semanas' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              2 semanas
            </button>
          </div>

          {/* Navegación */}
          <div className="flex items-center gap-1">
            <button onClick={prevSemana} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={irHoy} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-600">Hoy</button>
            <button onClick={nextSemana} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <button onClick={loadGantt} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Leyenda ── */}
      <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500">
        {[
          { label: 'Pendiente', color: 'bg-yellow-400' },
          { label: 'En producción', color: 'bg-blue-500' },
          { label: 'Completada', color: 'bg-emerald-500' },
          { label: 'Cancelada', color: 'bg-red-400' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
            {l.label}
          </div>
        ))}
        <div className="ml-3 flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full ring-2 ring-red-500 bg-white" /> Urgente
          <div className="h-2.5 w-2.5 rounded-full ring-2 ring-orange-400 bg-white ml-2" /> Alta
          <div className="h-2.5 w-2.5 rounded-full ring-2 ring-blue-300 bg-white ml-2" /> Media
        </div>
      </div>

      {/* ── Gantt grid ── */}
      {maquinas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Factory className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay órdenes de producción en este período</p>
          <button onClick={() => navigate('/ordenes-produccion')} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-semibold">
            Ir a Órdenes de Producción →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Cabecera de días */}
            <div
              className="grid gap-px bg-slate-200 rounded-t-xl overflow-hidden"
              style={{ gridTemplateColumns: `200px repeat(${dias.length}, minmax(100px, 1fr))` }}
            >
              {/* celda esquina */}
              <div className="bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider px-4 py-3 flex items-center gap-2">
                <Factory className="h-4 w-4" /> Máquina
              </div>
              {dias.map(d => {
                const isToday = d === hoy
                const esFinDeSemana = new Date(d + 'T00:00:00').getDay() % 6 === 0
                return (
                  <div
                    key={d}
                    className={`text-center text-[11px] font-bold py-3 px-1 ${
                      isToday ? 'bg-blue-600 text-white' : esFinDeSemana ? 'bg-slate-600 text-slate-300' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="uppercase">{new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short' })}</div>
                    <div className={isToday ? 'text-white font-extrabold' : 'text-slate-400'}>
                      {new Date(d + 'T00:00:00').getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Filas por máquina */}
            <div className="divide-y divide-slate-200 border border-t-0 border-slate-200 rounded-b-xl bg-white overflow-hidden">
              {maquinas.map(({ maquina, ordenes }) => (
                <div
                  key={maquina}
                  className="grid gap-px bg-slate-100"
                  style={{ gridTemplateColumns: `200px repeat(${dias.length}, minmax(100px, 1fr))` }}
                >
                  {/* Etiqueta de máquina */}
                  <div className="bg-white flex items-start gap-2.5 px-4 py-3 border-r border-slate-200">
                    <div className="mt-0.5 p-1.5 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                      <Factory className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{maquina}</p>
                      <p className="text-[10px] text-slate-400">{ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''}</p>
                    </div>
                  </div>

                  {/* Celdas por día */}
                  {dias.map(dia => {
                    const esFinDeSemana = new Date(dia + 'T00:00:00').getDay() % 6 === 0
                    const isToday = dia === hoy

                    // Solo mostrar la tarjeta el primer día (fecha_orden) para evitar duplicados
                    const ordenesAMostrar = ordenes.filter(op => op.fecha_orden === dia)
                    // Pero marcar visualmente si hay OP en curso
                    const tieneEnCurso = ordenes.some(op =>
                      op.estado === 'en_produccion' &&
                      op.fecha_orden < dia &&
                      (!op.fecha_entrega || op.fecha_entrega >= dia)
                    )

                    return (
                      <div
                        key={dia}
                        className={`bg-white min-h-[90px] p-1.5 space-y-1 ${
                          isToday ? 'bg-blue-50/40' : esFinDeSemana ? 'bg-slate-50/70' : ''
                        }`}
                      >
                        {/* Indicador de OP que continúa */}
                        {tieneEnCurso && ordenesAMostrar.length === 0 && (
                          <div className="h-1.5 rounded bg-blue-300/50 w-full" title="Orden en producción continúa" />
                        )}
                        {ordenesAMostrar.map(op => (
                          <OrdenCard key={op.id} orden={op} navigate={navigate} />
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Alerta órdenes vencidas ── */}
      {(() => {
        const vencidas = maquinas.flatMap(m =>
          m.ordenes.filter(op =>
            op.fecha_entrega &&
            op.fecha_entrega < hoy &&
            (op.estado === 'pendiente' || op.estado === 'en_produccion')
          )
        )
        if (vencidas.length === 0) return null
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-sm">
                {vencidas.length} orden{vencidas.length !== 1 ? 'es' : ''} con fecha de entrega vencida
              </p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {vencidas.map(op => (
                  <button
                    key={op.id}
                    onClick={() => navigate(`/ordenes-produccion/${op.id}`)}
                    className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded transition-colors"
                  >
                    {op.folio} — {op.fecha_entrega}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
