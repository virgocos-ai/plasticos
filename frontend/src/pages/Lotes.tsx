import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Package, AlertTriangle, CheckCircle, XCircle, ClipboardList } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Lote {
  id: number
  numero_lote: string
  tipo: 'producto' | 'material'
  producto?: { id: number; codigo: string; nombre: string }
  material?: { id: number; codigo: string; nombre: string }
  almacen?: { id: number; codigo: string; nombre: string }
  cantidad_inicial: number
  cantidad_actual: number
  unidad_medida: string
  fecha_produccion?: string
  fecha_caducidad?: string
  fecha_entrada: string
  estado: 'activo' | 'cuarentena' | 'bloqueado' | 'agotado' | 'caducado'
  temperatura_almacenamiento?: string
  humedad_almacenamiento?: string
  certificado_calidad?: string
}

const estadosLote = {
  activo: { label: 'Activo', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cuarentena: { label: 'Cuarentena', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  bloqueado: { label: 'Bloqueado', color: 'bg-red-100 text-red-800', icon: XCircle },
  agotado: { label: 'Agotado', color: 'bg-gray-100 text-gray-800', icon: Package },
  caducado: { label: 'Caducado', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
}

export default function Lotes() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingLote, setEditingLote] = useState<Lote | null>(null)
  const [productos, setProductos] = useState([])
  const [materiales, setMateriales] = useState([])
  const [almacenes, setAlmacenes] = useState([])
  const [formData, setFormData] = useState({
    numero_lote: '',
    tipo: 'producto' as const,
    producto_id: '',
    material_id: '',
    almacen_id: '',
    cantidad_inicial: '',
    unidad_medida: 'PZ',
    fecha_produccion: '',
    fecha_caducidad: '',
    temperatura_almacenamiento: '',
    humedad_almacenamiento: '',
    observaciones: '',
    certificado_calidad: ''
  })

  useEffect(() => {
    loadLotes()
    loadCatalogos()
  }, [])

  const loadLotes = async () => {
    try {
      const response = await api.get('/lotes')
      setLotes(response.data)
    } catch (error) {
      toast.error('Error al cargar lotes')
    } finally {
      setLoading(false)
    }
  }

  const loadCatalogos = async () => {
    try {
      const [prodRes, matRes, almRes] = await Promise.all([
        api.get('/productos'),
        api.get('/materiales'),
        api.get('/almacenes')
      ])
      setProductos(prodRes.data)
      setMateriales(matRes.data)
      setAlmacenes(almRes.data)
    } catch (error) {
      console.error('Error cargando catálogos')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        producto_id: formData.tipo === 'producto' ? parseInt(formData.producto_id) : null,
        material_id: formData.tipo === 'material' ? parseInt(formData.material_id) : null,
        almacen_id: parseInt(formData.almacen_id),
        cantidad_inicial: parseFloat(formData.cantidad_inicial)
      }

      if (editingLote) {
        await api.put(`/lotes/${editingLote.id}`, data)
        toast.success('Lote actualizado')
      } else {
        await api.post('/lotes', data)
        toast.success('Lote creado')
      }
      setShowForm(false)
      setEditingLote(null)
      resetForm()
      loadLotes()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar lote')
    }
  }

  const resetForm = () => {
    setFormData({
      numero_lote: '',
      tipo: 'producto',
      producto_id: '',
      material_id: '',
      almacen_id: '',
      cantidad_inicial: '',
      unidad_medida: 'PZ',
      fecha_produccion: '',
      fecha_caducidad: '',
      temperatura_almacenamiento: '',
      humedad_almacenamiento: '',
      observaciones: '',
      certificado_calidad: ''
    })
  }

  const handleEdit = (lote: Lote) => {
    setEditingLote(lote)
    setFormData({
      numero_lote: lote.numero_lote,
      tipo: lote.tipo,
      producto_id: lote.producto?.id?.toString() || '',
      material_id: lote.material?.id?.toString() || '',
      almacen_id: lote.almacen?.id?.toString() || '',
      cantidad_inicial: lote.cantidad_inicial.toString(),
      unidad_medida: lote.unidad_medida,
      fecha_produccion: lote.fecha_produccion ? lote.fecha_produccion.split('T')[0] : '',
      fecha_caducidad: lote.fecha_caducidad ? lote.fecha_caducidad.split('T')[0] : '',
      temperatura_almacenamiento: lote.temperatura_almacenamiento || '',
      humedad_almacenamiento: lote.humedad_almacenamiento || '',
      observaciones: '',
      certificado_calidad: lote.certificado_calidad || ''
    })
    setShowForm(true)
  }

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      await api.put(`/lotes/${id}/estado`, { estado: nuevoEstado })
      toast.success(`Lote marcado como ${nuevoEstado}`)
      loadLotes()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  const handleVerTrazabilidad = async (id: number) => {
    try {
      const response = await api.get(`/lotes/${id}/trazabilidad`)
      const trazabilidad = response.data.trazabilidad
      alert(JSON.stringify(trazabilidad, null, 2))
    } catch (error) {
      toast.error('Error al obtener trazabilidad')
    }
  }

  const filteredLotes = lotes.filter(l => 
    l.numero_lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.material?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lotesProximosCaducar = lotes.filter(l => {
    if (!l.fecha_caducidad || l.estado !== 'activo') return false
    const diasRestantes = Math.ceil((new Date(l.fecha_caducidad).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return diasRestantes <= 30 && diasRestantes > 0
  })

  if (showForm) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          {editingLote ? 'Editar Lote' : 'Nuevo Lote'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Lote *</label>
              <input
                required
                maxLength={30}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.numero_lote}
                onChange={e => setFormData({...formData, numero_lote: e.target.value.toUpperCase()})}
                placeholder="LOT-2024-001"
                disabled={!!editingLote}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo *</label>
              <select
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value as any})}
              >
                <option value="producto">Producto</option>
                <option value="material">Material</option>
              </select>
            </div>
            {formData.tipo === 'producto' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Producto *</label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.producto_id}
                  onChange={e => setFormData({...formData, producto_id: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {productos.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">Material *</label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.material_id}
                  onChange={e => setFormData({...formData, material_id: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {materiales.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Almacén *</label>
              <select
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.almacen_id}
                onChange={e => setFormData({...formData, almacen_id: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {almacenes.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cantidad Inicial *</label>
              <input
                type="number"
                step="0.01"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.cantidad_inicial}
                onChange={e => setFormData({...formData, cantidad_inicial: e.target.value})}
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unidad de Medida *</label>
              <select
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.unidad_medida}
                onChange={e => setFormData({...formData, unidad_medida: e.target.value})}
              >
                <option value="PZ">PZ - Pieza</option>
                <option value="KGM">KGM - Kilogramo</option>
                <option value="LTR">LTR - Litro</option>
                <option value="XBX">XBX - Caja</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Producción</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.fecha_produccion}
                onChange={e => setFormData({...formData, fecha_produccion: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Caducidad</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.fecha_caducidad}
                onChange={e => setFormData({...formData, fecha_caducidad: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Temperatura Almacenamiento</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.temperatura_almacenamiento}
                onChange={e => setFormData({...formData, temperatura_almacenamiento: e.target.value})}
                placeholder="20-25°C"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Humedad Almacenamiento</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.humedad_almacenamiento}
                onChange={e => setFormData({...formData, humedad_almacenamiento: e.target.value})}
                placeholder="40-60% HR"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Certificado de Calidad (URL)</label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.certificado_calidad}
                onChange={e => setFormData({...formData, certificado_calidad: e.target.value})}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingLote(null)
                resetForm()
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {lotesProximosCaducar.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800 font-semibold">
            <AlertTriangle className="h-5 w-5" />
            <span>Alerta: {lotesProximosCaducar.length} lotes próximos a caducar</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-blue-600" />
          Control de Lotes
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Lote
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por número de lote o producto..."
          className="flex-1 outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto/Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Almacén</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caducidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
              </tr>
            ) : filteredLotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron lotes.
                </td>
              </tr>
            ) : (
              filteredLotes.map(lote => {
                const EstadoIcon = estadosLote[lote.estado].icon
                return (
                  <tr key={lote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lote.numero_lote}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lote.producto?.nombre || lote.material?.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lote.almacen?.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lote.cantidad_actual} / {lote.cantidad_inicial} {lote.unidad_medida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lote.fecha_caducidad ? new Date(lote.fecha_caducidad).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${estadosLote[lote.estado].color}`}>
                        <EstadoIcon className="h-3 w-3" />
                        {estadosLote[lote.estado].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleVerTrazabilidad(lote.id)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        title="Ver trazabilidad"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(lote)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {lote.estado === 'activo' && (
                        <button
                          onClick={() => handleCambiarEstado(lote.id, 'cuarentena')}
                          className="text-yellow-600 hover:text-yellow-900 mr-2"
                          title="Cuarentena"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
