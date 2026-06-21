import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Wrench, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

interface Registro {
  id: number
  folio: string
  fecha: string
  entidad_tipo: 'maquina' | 'molde'
  entidad_id: number
  tipo: 'preventivo' | 'correctivo' | 'predictivo'
  descripcion: string
  trabajo_realizado?: string
  tecnico: string
  tiempo_paro_min?: number
  costo?: number
  piezas_reemplazadas?: string
  proximo_mantenimiento?: string
  disparos_en_mantenimiento?: number
  estado: 'pendiente' | 'en_progreso' | 'completado'
  observaciones?: string
}

interface Maquina { id: number; codigo: string; nombre: string }
interface Molde { id: number; codigo: string; nombre: string }

interface KPIs {
  total: number
  por_tipo: { tipo: string; total: number; minutos_paro: number; costo_total: number }[]
  maquinas_en_mantenimiento: number
  moldes_en_mantenimiento: number
}

const TIPO_COLORS: Record<string, string> = {
  preventivo: 'bg-blue-100 text-blue-800',
  correctivo: 'bg-red-100 text-red-800',
  predictivo: 'bg-purple-100 text-purple-800',
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  en_progreso: 'bg-orange-100 text-orange-800',
  completado: 'bg-green-100 text-green-800',
}

const fmt = (n: number) => `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

export default function Mantenimiento() {
  const location = useLocation()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [moldes, setMoldes] = useState<Molde[]>([])
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterEntidad, setFilterEntidad] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Registro | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Registro>>({
    entidad_tipo: 'maquina',
    tipo: 'preventivo',
    estado: 'completado',
    fecha: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadAll()
  }, [])

  // Si venimos desde Maquinas/Moldes con state de navegación, pre-llenar y abrir modal
  useEffect(() => {
    const state = location.state as { entidad_tipo?: string; entidad_id?: number; entidad_nombre?: string } | null
    if (state?.entidad_tipo && state?.entidad_id) {
      setFormData(prev => ({
        ...prev,
        entidad_tipo: state.entidad_tipo as 'maquina' | 'molde',
        entidad_id: state.entidad_id,
      }))
      setShowModal(true)
      // Limpiar state para que un F5 no vuelva a abrir el modal
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [regRes, maqRes, molRes, kpiRes] = await Promise.all([
        api.get('/mantenimiento'),
        api.get('/maquinas'),
        api.get('/moldes'),
        api.get('/mantenimiento/kpis/resumen'),
      ])
      setRegistros(regRes.data)
      setMaquinas(maqRes.data)
      setMoldes(molRes.data)
      setKpis(kpiRes.data)
    } catch {
      toast.error('Error al cargar datos de mantenimiento')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/mantenimiento/${editing.id}`, formData)
        toast.success('Registro actualizado')
      } else {
        await api.post('/mantenimiento', formData)
        toast.success('Registro creado')
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      loadAll()
    } catch {
      toast.error('Error al guardar registro')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/mantenimiento/${id}`)
      toast.success('Registro eliminado')
      loadAll()
    } catch {
      toast.error('Error al eliminar registro')
    } finally {
      setConfirmDelete(null)
    }
  }

  const resetForm = () => setFormData({
    entidad_tipo: 'maquina',
    tipo: 'preventivo',
    estado: 'completado',
    fecha: new Date().toISOString().split('T')[0],
  })

  const openCreate = () => { setEditing(null); resetForm(); setShowModal(true) }
  const openEdit = (r: Registro) => { setEditing(r); setFormData(r); setShowModal(true) }

  const entidadNombre = (r: Registro) => {
    if (r.entidad_tipo === 'maquina') {
      const m = maquinas.find(m => m.id === r.entidad_id)
      return m ? `${m.codigo} — ${m.nombre}` : `Máq. #${r.entidad_id}`
    }
    const m = moldes.find(m => m.id === r.entidad_id)
    return m ? `${m.codigo} — ${m.nombre}` : `Molde #${r.entidad_id}`
  }

  const filtered = registros.filter(r => {
    const text = `${r.folio} ${r.tecnico} ${r.descripcion}`.toLowerCase()
    if (searchTerm && !text.includes(searchTerm.toLowerCase())) return false
    if (filterTipo && r.tipo !== filterTipo) return false
    if (filterEstado && r.estado !== filterEstado) return false
    if (filterEntidad && r.entidad_tipo !== filterEntidad) return false
    return true
  })

  const costoTotal = kpis?.por_tipo.reduce((s, t) => s + Number(t.costo_total || 0), 0) ?? 0
  const minutosParo = kpis?.por_tipo.reduce((s, t) => s + Number(t.minutos_paro || 0), 0) ?? 0

  const entidadesDisponibles = formData.entidad_tipo === 'maquina' ? maquinas : moldes

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mantenimiento</h1>
          <p className="text-sm text-gray-500 mt-0.5">Historial de mantenimiento de máquinas y moldes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} className="flex items-center gap-1.5 border border-gray-300 px-3 py-2 rounded-md text-sm hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
            <Plus className="h-4 w-4" /> Nuevo Registro
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Wrench className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Registros</p>
              <p className="text-lg font-bold text-gray-900">{kpis?.total ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Tiempo de Paro</p>
              <p className="text-lg font-bold text-gray-900">{minutosParo} min</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">En Mantenimiento</p>
              <p className="text-lg font-bold text-gray-900">
                {(kpis?.maquinas_en_mantenimiento ?? 0) + (kpis?.moldes_en_mantenimiento ?? 0)} equipos
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Costo Total</p>
              <p className="text-lg font-bold text-gray-900">{fmt(costoTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por tipo */}
      {kpis && kpis.por_tipo.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {kpis.por_tipo.map(t => (
            <div key={t.tipo} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${TIPO_COLORS[t.tipo]}`}>{t.tipo}</span>
                <span className="text-sm font-bold text-gray-700">{t.total} registros</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Paro: {Number(t.minutos_paro || 0)} min</span>
                <span>Costo: {fmt(Number(t.costo_total || 0))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por folio, técnico, descripción..."
            className="flex-1 outline-none text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1.5 text-sm">
          <option value="">Todos los tipos</option>
          <option value="preventivo">Preventivo</option>
          <option value="correctivo">Correctivo</option>
          <option value="predictivo">Predictivo</option>
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En progreso</option>
          <option value="completado">Completado</option>
        </select>
        <select value={filterEntidad} onChange={e => setFilterEntidad(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1.5 text-sm">
          <option value="">Máquinas y Moldes</option>
          <option value="maquina">Solo Máquinas</option>
          <option value="molde">Solo Moldes</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">{filtered.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paro</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">No hay registros</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-bold text-blue-700">{r.folio}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className={`mr-1.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.entidad_tipo === 'maquina' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>
                      {r.entidad_tipo === 'maquina' ? 'Máq' : 'Molde'}
                    </span>
                    {entidadNombre(r)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${TIPO_COLORS[r.tipo]}`}>{r.tipo}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.tecnico}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={r.descripcion}>{r.descripcion}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{r.tiempo_paro_min ? `${r.tiempo_paro_min} min` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">{r.costo ? fmt(Number(r.costo)) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_COLORS[r.estado]}`}>
                      {r.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(r.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
        title="Eliminar registro"
        message="¿Eliminar este registro de mantenimiento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Registro' : 'Nuevo Registro de Mantenimiento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input type="date" required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.fecha || ''}
                onChange={e => setFormData({ ...formData, fecha: e.target.value })}
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.tipo || 'preventivo'}
                onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
              >
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
                <option value="predictivo">Predictivo</option>
              </select>
            </div>

            {/* Entidad tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Equipo</label>
              <select required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.entidad_tipo || 'maquina'}
                onChange={e => setFormData({ ...formData, entidad_tipo: e.target.value as any, entidad_id: undefined })}
              >
                <option value="maquina">Máquina</option>
                <option value="molde">Molde</option>
              </select>
            </div>

            {/* Entidad id */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formData.entidad_tipo === 'maquina' ? 'Máquina' : 'Molde'}
              </label>
              <select required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.entidad_id || ''}
                onChange={e => setFormData({ ...formData, entidad_id: Number(e.target.value) })}
              >
                <option value="">Seleccionar...</option>
                {entidadesDisponibles.map(e => (
                  <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>
                ))}
              </select>
            </div>

            {/* Técnico */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Técnico</label>
              <input type="text" required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.tecnico || ''}
                onChange={e => setFormData({ ...formData, tecnico: e.target.value })}
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.estado || 'completado'}
                onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            {/* Tiempo de paro */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tiempo de Paro (min)</label>
              <input type="number" min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.tiempo_paro_min || ''}
                onChange={e => setFormData({ ...formData, tiempo_paro_min: Number(e.target.value) || undefined })}
              />
            </div>

            {/* Costo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Costo ($)</label>
              <input type="number" step="0.01" min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.costo || ''}
                onChange={e => setFormData({ ...formData, costo: Number(e.target.value) || undefined })}
              />
            </div>

            {/* Próximo mantenimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Próximo Mantenimiento</label>
              <input type="date"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.proximo_mantenimiento || ''}
                onChange={e => setFormData({ ...formData, proximo_mantenimiento: e.target.value || undefined })}
              />
            </div>

            {/* Disparos (solo moldes) */}
            {formData.entidad_tipo === 'molde' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Disparos al momento</label>
                <input type="number" min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={formData.disparos_en_mantenimiento || ''}
                  onChange={e => setFormData({ ...formData, disparos_en_mantenimiento: Number(e.target.value) || undefined })}
                />
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción del problema / motivo</label>
            <textarea required rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
              value={formData.descripcion || ''}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          {/* Trabajo realizado */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Trabajo Realizado</label>
            <textarea rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
              value={formData.trabajo_realizado || ''}
              onChange={e => setFormData({ ...formData, trabajo_realizado: e.target.value })}
            />
          </div>

          {/* Piezas reemplazadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Piezas Reemplazadas</label>
            <input type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
              placeholder="Ej: Correa de transmisión, filtro de aceite..."
              value={formData.piezas_reemplazadas || ''}
              onChange={e => setFormData({ ...formData, piezas_reemplazadas: e.target.value })}
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
              value={formData.observaciones || ''}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              {editing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
