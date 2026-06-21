import { useEffect, useState } from 'react'
import { Plus, Search, AlertTriangle, Trash2, Edit2 } from 'lucide-react'
import { SkeletonTable } from '../components/Skeleton'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

interface Molde {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  numero_cavidades: number
  material_molde?: string
  numero_serie?: string
  vida_util_disparos: number
  disparos_actuales: number
  disparos_ultimo_mantenimiento: number
  estado: 'disponible' | 'en_maquina' | 'mantenimiento' | 'baja'
  ubicacion?: string
  tiempo_cambio_min?: number
  peso_kg?: number
  dimensiones?: string
  observaciones?: string
  producto?: { codigo: string; nombre: string }
  maquina?: { codigo: string; nombre: string }
}

interface Producto { id: number; codigo: string; nombre: string }
interface Maquina { id: number; codigo: string; nombre: string }

const ESTADO_COLOR: Record<string, string> = {
  disponible: 'bg-green-100 text-green-800',
  en_maquina: 'bg-blue-100 text-blue-800',
  mantenimiento: 'bg-yellow-100 text-yellow-800',
  baja: 'bg-red-100 text-red-800',
}

function ShotBar({ actual, maximo }: { actual: number; maximo: number }) {
  const pct = Math.min(100, (actual / maximo) * 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-0.5">
        <span>{actual.toLocaleString('es-MX')}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right text-xs text-gray-400">{maximo.toLocaleString('es-MX')} máx</div>
    </div>
  )
}

const emptyForm = {
  codigo: '', nombre: '', descripcion: '', producto_id: '', maquina_id: '',
  numero_cavidades: 1, material_molde: '', numero_serie: '', proveedor_molde: '',
  vida_util_disparos: 500000, ubicacion: '', tiempo_cambio_min: '',
  peso_kg: '', dimensiones: '', estado: 'disponible', observaciones: ''
}

export default function Moldes() {
  const [moldes, setMoldes] = useState<Molde[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [productos, setProductos] = useState<Producto[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])

  useEffect(() => {
    loadMoldes()
    api.get('/productos').then(r => setProductos(r.data)).catch(() => {})
    api.get('/maquinas').then(r => setMaquinas(r.data)).catch(() => {})
  }, [])

  const loadMoldes = async () => {
    try {
      const r = await api.get('/moldes')
      setMoldes(r.data)
    } catch {
      toast.error('Error al cargar moldes')
    } finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditId(null)
    setFormData({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (m: Molde) => {
    setEditId(m.id)
    setFormData({
      codigo: m.codigo, nombre: m.nombre, descripcion: m.descripcion || '',
      producto_id: m.producto ? String((m as any).producto_id || '') : '',
      maquina_id: m.maquina ? String((m as any).maquina_id || '') : '',
      numero_cavidades: m.numero_cavidades, material_molde: m.material_molde || '',
      numero_serie: m.numero_serie || '', proveedor_molde: (m as any).proveedor_molde || '',
      vida_util_disparos: m.vida_util_disparos, ubicacion: m.ubicacion || '',
      tiempo_cambio_min: String(m.tiempo_cambio_min || ''), peso_kg: String(m.peso_kg || ''),
      dimensiones: m.dimensiones || '', estado: m.estado, observaciones: m.observaciones || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formData,
        numero_cavidades: Number(formData.numero_cavidades),
        vida_util_disparos: Number(formData.vida_util_disparos),
        tiempo_cambio_min: formData.tiempo_cambio_min ? Number(formData.tiempo_cambio_min) : null,
        peso_kg: formData.peso_kg ? Number(formData.peso_kg) : null,
        producto_id: formData.producto_id ? Number(formData.producto_id) : null,
        maquina_id: formData.maquina_id ? Number(formData.maquina_id) : null,
      }
      if (editId) {
        await api.put(`/moldes/${editId}`, payload)
        toast.success('Molde actualizado')
      } else {
        await api.post('/moldes', payload)
        toast.success('Molde creado')
      }
      setShowModal(false)
      loadMoldes()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/moldes/${id}`)
      toast.success('Molde eliminado')
      loadMoldes()
    } catch { toast.error('Error al eliminar') }
  }

  const upd = (k: string, v: string | number) => setFormData(f => ({ ...f, [k]: v }))

  const filtered = moldes.filter(m => {
    const matchSearch = m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchAlerta = !soloAlertas || m.disparos_actuales >= m.vida_util_disparos * 0.8
    return matchSearch && matchAlerta
  })

  const alertasCount = moldes.filter(m => m.disparos_actuales >= m.vida_util_disparos * 0.8).length

  if (loading) return <SkeletonTable rows={5} cols={7} />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moldes de Inyección</h1>
          {alertasCount > 0 && (
            <p className="text-sm text-orange-600 flex items-center gap-1 mt-0.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {alertasCount} molde(s) requieren revisión de mantenimiento
            </p>
          )}
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nuevo Molde
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow flex-1 min-w-48">
          <Search className="h-4 w-4 text-gray-400" />
          <input placeholder="Buscar por código o nombre..." className="flex-1 outline-none text-sm"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={soloAlertas} onChange={e => setSoloAlertas(e.target.checked)} className="rounded" />
          <span className="text-orange-600 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Solo alertas ({alertasCount})
          </span>
        </label>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código / Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cavidades</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Máquina</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Vida útil (disparos)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(m => {
              const pct = (m.disparos_actuales / m.vida_util_disparos) * 100
              const alerta = pct >= 80
              return (
                <tr key={m.id} className={alerta ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      {alerta && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />}
                      {m.codigo}
                    </p>
                    <p className="text-xs text-gray-500">{m.nombre}</p>
                    {m.material_molde && <p className="text-xs text-gray-400">{m.material_molde}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.producto?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                      {m.numero_cavidades}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.maquina?.nombre || '—'}</td>
                  <td className="px-4 py-3"><ShotBar actual={m.disparos_actuales} maximo={m.vida_util_disparos} /></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ESTADO_COLOR[m.estado]}`}>
                      {m.estado.replace('_', ' ').toUpperCase()}
                    </span>
                    {m.ubicacion && <p className="text-xs text-gray-400 mt-0.5">{m.ubicacion}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(m)} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(m.id)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No hay moldes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Eliminar molde"
        message="¿Eliminar este molde? Se perderá toda la información registrada."
        confirmText="Eliminar"
        type="danger"
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar Molde' : 'Nuevo Molde'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input required className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.codigo} onChange={e => upd('codigo', e.target.value)} placeholder="MOL-001" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input required className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.nombre} onChange={e => upd('nombre', e.target.value)} placeholder="Molde tapa 250ml" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
              <select className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.producto_id} onChange={e => upd('producto_id', e.target.value)}>
                <option value="">Sin asignar</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máquina asignada</label>
              <select className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.maquina_id} onChange={e => upd('maquina_id', e.target.value)}>
                <option value="">Sin montar</option>
                {maquinas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.estado} onChange={e => upd('estado', e.target.value)}>
                <option value="disponible">Disponible</option>
                <option value="en_maquina">En máquina</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Cavidades *</label>
              <input type="number" required min={1} className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.numero_cavidades} onChange={e => upd('numero_cavidades', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vida útil (disparos)</label>
              <input type="number" min={1} className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.vida_util_disparos} onChange={e => upd('vida_util_disparos', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material molde</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.material_molde} onChange={e => upd('material_molde', e.target.value)} placeholder="Acero P20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">T. cambio (min)</label>
              <input type="number" className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.tiempo_cambio_min} onChange={e => upd('tiempo_cambio_min', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Serie</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.numero_serie} onChange={e => upd('numero_serie', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor molde</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.proveedor_molde} onChange={e => upd('proveedor_molde', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.ubicacion} onChange={e => upd('ubicacion', e.target.value)} placeholder="Rack A-03" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input type="number" step="0.01" className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.peso_kg} onChange={e => upd('peso_kg', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensiones (LxAxH mm)</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={formData.dimensiones} onChange={e => upd('dimensiones', e.target.value)} placeholder="400x350x280" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea rows={2} className="block w-full border border-gray-300 rounded-md p-2 text-sm"
              value={formData.observaciones} onChange={e => upd('observaciones', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
