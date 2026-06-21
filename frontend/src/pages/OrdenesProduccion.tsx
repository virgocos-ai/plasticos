import { useEffect, useState } from 'react'
import { Plus, Search, Factory, CheckCircle, Clock, X, PlayCircle, XCircle, Eye } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { SkeletonTable } from '../components/Skeleton'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Cliente { id: number; razon_social: string }
interface Producto { id: number; codigo: string; nombre: string }
interface Material { id: number; codigo: string; nombre: string }

interface Orden {
  id: number
  folio: string
  fecha_orden: string
  fecha_entrega: string
  cliente: Cliente | null
  estado: 'pendiente' | 'en_produccion' | 'completada' | 'cancelada'
  maquina_asignada: string
  turno: string
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  observaciones?: string
  tiempo_estimado_min?: number
}

interface OrdenForm {
  cliente_id: string
  fecha_entrega: string
  prioridad: string
  maquina_asignada: string
  turno: string
  tiempo_estimado_min: string
  observaciones: string
  detalles: Array<{
    producto_id: string
    material_id: string
    cantidad_solicitada: string
    peso_pieza_gr: string
  }>
}

const emptyForm = (): OrdenForm => ({
  cliente_id: '',
  fecha_entrega: '',
  prioridad: 'media',
  maquina_asignada: '',
  turno: 'matutino',
  tiempo_estimado_min: '',
  observaciones: '',
  detalles: [{ producto_id: '', material_id: '', cantidad_solicitada: '', peso_pieza_gr: '' }]
})

export default function OrdenesProduccion() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<OrdenForm>(emptyForm())
  const [confirmCancelar, setConfirmCancelar] = useState<number | null>(null)
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])

  useEffect(() => { loadCatalogos() }, [])
  useEffect(() => {
    const timer = setTimeout(() => loadOrdenes(search, filterEstado), 350)
    return () => clearTimeout(timer)
  }, [search, filterEstado])

  const loadOrdenes = async (q = '', estado = '') => {
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      if (estado) params.set('estado', estado)
      const response = await api.get(`/ordenes-produccion?${params}`)
      setOrdenes(response.data.data ?? response.data)
    } catch { toast.error('Error al cargar órdenes') }
    finally { setLoading(false) }
  }

  const loadCatalogos = async () => {
    try {
      const [c, p, m] = await Promise.all([
        api.get('/clientes'),
        api.get('/productos?activo=1'),
        api.get('/materiales?activo=1')
      ])
      setClientes(c.data.data ?? c.data)
      setProductos(p.data.data ?? p.data)
      setMateriales(m.data.data ?? m.data)
    } catch { /* silencioso */ }
  }

  const handleSave = async () => {
    if (!form.maquina_asignada.trim()) { toast.error('Ingresa la máquina asignada'); return }
    if (form.detalles.some(d => !d.producto_id || !d.cantidad_solicitada)) {
      toast.error('Completa todos los productos del detalle'); return
    }
    setSaving(true)
    try {
      await api.post('/ordenes-produccion', {
        cliente_id: form.cliente_id || null,
        fecha_entrega: form.fecha_entrega || null,
        prioridad: form.prioridad,
        maquina_asignada: form.maquina_asignada,
        turno: form.turno,
        tiempo_estimado_min: form.tiempo_estimado_min ? parseInt(form.tiempo_estimado_min) : null,
        observaciones: form.observaciones || null,
        detalles: form.detalles.map(d => ({
          producto_id: parseInt(d.producto_id),
          material_id: d.material_id ? parseInt(d.material_id) : null,
          cantidad_solicitada: parseFloat(d.cantidad_solicitada),
          peso_pieza_gr: d.peso_pieza_gr ? parseFloat(d.peso_pieza_gr) : null,
          cantidad_producida: 0,
          cantidad_defectuosa: 0
        }))
      })
      toast.success('Orden creada correctamente')
      setShowModal(false)
      setForm(emptyForm())
      loadOrdenes()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al crear orden')
      setSaving(false)
    }
  }

  const handleCambiarEstado = async (id: number, estado: string) => {
    try {
      await api.put(`/ordenes-produccion/${id}/estado`, { estado })
      toast.success(`Estado actualizado: ${estado.replace('_', ' ')}`)
      loadOrdenes()
    } catch { toast.error('Error al actualizar estado') }
  }

  const addDetalle = () => setForm(f => ({
    ...f,
    detalles: [...f.detalles, { producto_id: '', material_id: '', cantidad_solicitada: '', peso_pieza_gr: '' }]
  }))

  const removeDetalle = (idx: number) => setForm(f => ({
    ...f,
    detalles: f.detalles.filter((_, i) => i !== idx)
  }))

  const updateDetalle = (idx: number, field: string, value: string) => setForm(f => ({
    ...f,
    detalles: f.detalles.map((d, i) => i === idx ? { ...d, [field]: value } : d)
  }))

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium"><Clock className="h-3 w-3"/> Pendiente</span>
      case 'en_produccion': return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"><Factory className="h-3 w-3"/> En Producción</span>
      case 'completada': return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium"><CheckCircle className="h-3 w-3"/> Completada</span>
      case 'cancelada': return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium"><XCircle className="h-3 w-3"/> Cancelada</span>
      default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">{estado}</span>
    }
  }

  const getPrioridadBadge = (p: string) => {
    const map: Record<string, string> = { baja: 'bg-gray-100 text-gray-600', media: 'bg-blue-100 text-blue-700', alta: 'bg-orange-100 text-orange-700', urgente: 'bg-red-100 text-red-700 font-bold' }
    return <span className={`px-2 py-0.5 rounded-full text-xs ${map[p] || 'bg-gray-100 text-gray-600'}`}>{p?.toUpperCase()}</span>
  }

  const filtered = ordenes

  if (loading) return <SkeletonTable rows={6} cols={6} />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes de Producción</h1>
        <button
          onClick={() => { setForm(emptyForm()); setShowModal(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          <Plus className="h-4 w-4" /> Nueva Orden
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por folio o cliente..."
            className="flex-1 outline-none text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_produccion">En Producción</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Entrega</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Máquina / Turno</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(orden => (
              <tr key={orden.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-700">{orden.folio}</td>
                <td className="px-4 py-3 whitespace-nowrap">{getPrioridadBadge(orden.prioridad)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {orden.fecha_entrega ? new Date(orden.fecha_entrega + 'T00:00:00').toLocaleDateString('es-MX') : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{orden.cliente?.razon_social || <span className="text-gray-400 italic">Sin cliente</span>}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{orden.maquina_asignada || '-'} / <span className="capitalize">{orden.turno}</span></td>
                <td className="px-4 py-3 whitespace-nowrap">{getEstadoBadge(orden.estado)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => navigate(`/ordenes-produccion/${orden.id}`)}
                      title="Ver detalle"
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {orden.estado === 'pendiente' && (
                      <button
                        onClick={() => handleCambiarEstado(orden.id, 'en_produccion')}
                        title="Iniciar producción"
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </button>
                    )}
                    {orden.estado === 'en_produccion' && (
                      <button
                        onClick={() => handleCambiarEstado(orden.id, 'completada')}
                        title="Marcar completada"
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {(orden.estado === 'pendiente' || orden.estado === 'en_produccion') && (
                      <button
                        onClick={() => setConfirmCancelar(orden.id)}
                        title="Cancelar"
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No hay órdenes{search ? ' que coincidan' : ' registradas'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmCancelar !== null}
        onClose={() => setConfirmCancelar(null)}
        onConfirm={() => { if (confirmCancelar !== null) handleCambiarEstado(confirmCancelar, 'cancelada'); setConfirmCancelar(null) }}
        title="Cancelar orden de producción"
        message="¿Estás seguro de cancelar esta orden? Esta acción no se puede deshacer."
        confirmText="Cancelar orden"
        type="danger"
      />

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen p-4 pt-10">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Nueva Orden de Producción</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (opcional)</label>
                    <select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                      <option value="">Sin cliente</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                    <input type="date" value={form.fecha_entrega} onChange={e => setForm(f => ({ ...f, fecha_entrega: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
                    <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno *</label>
                    <select value={form.turno} onChange={e => setForm(f => ({ ...f, turno: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                      <option value="matutino">Matutino</option>
                      <option value="vespertino">Vespertino</option>
                      <option value="nocturno">Nocturno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Máquina Asignada *</label>
                    <input type="text" value={form.maquina_asignada} onChange={e => setForm(f => ({ ...f, maquina_asignada: e.target.value }))} placeholder="Ej: INY-01" className="w-full border border-gray-300 rounded-md p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo estimado (min)</label>
                    <input type="number" min="1" value={form.tiempo_estimado_min} onChange={e => setForm(f => ({ ...f, tiempo_estimado_min: e.target.value }))} placeholder="480" className="w-full border border-gray-300 rounded-md p-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md p-2 text-sm" placeholder="Instrucciones especiales..." />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Productos a producir *</label>
                    <button onClick={addDetalle} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"><Plus className="h-3 w-3"/> Agregar línea</button>
                  </div>
                  <div className="space-y-2">
                    {form.detalles.map((det, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                        <div className="col-span-4">
                          <select value={det.producto_id} onChange={e => updateDetalle(idx, 'producto_id', e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs">
                            <option value="">Seleccionar producto</option>
                            {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>)}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <select value={det.material_id} onChange={e => updateDetalle(idx, 'material_id', e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs">
                            <option value="">Material (opc.)</option>
                            {materiales.map(m => <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="1" value={det.cantidad_solicitada} onChange={e => updateDetalle(idx, 'cantidad_solicitada', e.target.value)} placeholder="Cantidad" className="w-full border border-gray-300 rounded p-1.5 text-xs" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="0" step="0.01" value={det.peso_pieza_gr} onChange={e => updateDetalle(idx, 'peso_pieza_gr', e.target.value)} placeholder="Peso (gr)" className="w-full border border-gray-300 rounded p-1.5 text-xs" />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {form.detalles.length > 1 && (
                            <button onClick={() => removeDetalle(idx)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-12 gap-2 mt-1 px-2">
                    <div className="col-span-4 text-xs text-gray-400">Producto</div>
                    <div className="col-span-3 text-xs text-gray-400">Material</div>
                    <div className="col-span-2 text-xs text-gray-400">Cantidad</div>
                    <div className="col-span-2 text-xs text-gray-400">Peso (gr)</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Crear Orden'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
