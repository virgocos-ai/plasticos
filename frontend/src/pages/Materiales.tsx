import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Factory } from 'lucide-react'
import { SkeletonTable } from '../components/Skeleton'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Material {
  id: number
  codigo: string
  nombre: string
  tipo: 'resina' | 'masterbatch' | 'aditivo' | 'pigmento' | 'carga'
  unidad_medida: string
  peso_gr: number
  precio_kg: number
  stock_actual: number
  stock_minimo: number
  stock_maximo: number
  temperatura_inyeccion?: number
  presion_inyeccion?: number
  tiempo_ciclo?: number
  activo: boolean
}

const tiposMaterial = {
  resina: 'Resina',
  masterbatch: 'Masterbatch',
  aditivo: 'Aditivo',
  pigmento: 'Pigmento',
  carga: 'Carga'
}

export default function Materiales() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'resina' as 'resina' | 'masterbatch' | 'aditivo' | 'pigmento' | 'carga',
    unidad_medida: 'KGM',
    peso_gr: 0,
    precio_kg: 0,
    stock_minimo: 0,
    stock_maximo: 0,
    temperatura_inyeccion: 0,
    presion_inyeccion: 0,
    tiempo_ciclo: 0
  })

  useEffect(() => {
    const timer = setTimeout(() => loadMateriales(searchTerm), 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadMateriales = async (search = '') => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const response = await api.get(`/materiales${params}`)
      setMateriales(response.data.data ?? response.data)
    } catch (error) {
      toast.error('Error al cargar materiales')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingMaterial) {
        await api.put(`/materiales/${editingMaterial.id}`, formData)
        toast.success('Material actualizado')
      } else {
        await api.post('/materiales', formData)
        toast.success('Material creado')
      }
      setShowForm(false)
      setEditingMaterial(null)
      resetForm()
      loadMateriales()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Error al guardar material')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      tipo: 'resina',
      unidad_medida: 'KGM',
      peso_gr: 0,
      precio_kg: 0,
      stock_minimo: 0,
      stock_maximo: 0,
      temperatura_inyeccion: 0,
      presion_inyeccion: 0,
      tiempo_ciclo: 0
    })
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      codigo: material.codigo,
      nombre: material.nombre,
      tipo: material.tipo,
      unidad_medida: material.unidad_medida,
      peso_gr: material.peso_gr || 0,
      precio_kg: material.precio_kg || 0,
      stock_minimo: material.stock_minimo || 0,
      stock_maximo: material.stock_maximo || 0,
      temperatura_inyeccion: material.temperatura_inyeccion || 0,
      presion_inyeccion: material.presion_inyeccion || 0,
      tiempo_ciclo: material.tiempo_ciclo || 0
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este material?')) return
    try {
      await api.delete(`/materiales/${id}`)
      toast.success('Material eliminado')
      loadMateriales()
    } catch (error) {
      toast.error('Error al eliminar material')
    }
  }

  const filteredMateriales = materiales.filter(m => 
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && materiales.length === 0) return <SkeletonTable rows={6} cols={5} />

  if (showForm) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Factory className="h-6 w-6 text-blue-600" />
          {editingMaterial ? 'Editar Material' : 'Nuevo Material'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código *</label>
              <input
                required
                maxLength={20}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.codigo}
                onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                placeholder="RES-PP-001"
                disabled={!!editingMaterial}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                required
                maxLength={100}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                placeholder="Polipropileno Homopolimero"
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
                <option value="resina">Resina</option>
                <option value="masterbatch">Masterbatch</option>
                <option value="aditivo">Aditivo</option>
                <option value="pigmento">Pigmento</option>
                <option value="carga">Carga</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unidad de Medida *</label>
              <select
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.unidad_medida}
                onChange={e => setFormData({...formData, unidad_medida: e.target.value})}
              >
                <option value="KGM">KGM - Kilogramo</option>
                <option value="GRM">GRM - Gramo</option>
                <option value="LTR">LTR - Litro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Peso (gramos)</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.peso_gr}
                onChange={e => setFormData({...formData, peso_gr: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio por KG ($)</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.precio_kg}
                onChange={e => setFormData({...formData, precio_kg: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.stock_minimo}
                onChange={e => setFormData({...formData, stock_minimo: parseFloat(e.target.value) || 0})}
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Máximo</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.stock_maximo}
                onChange={e => setFormData({...formData, stock_maximo: parseFloat(e.target.value) || 0})}
                placeholder="1000"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Parámetros de Inyección</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.temperatura_inyeccion}
                  onChange={e => setFormData({...formData, temperatura_inyeccion: parseFloat(e.target.value) || 0})}
                  placeholder="200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Presión (bar)</label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.presion_inyeccion}
                  onChange={e => setFormData({...formData, presion_inyeccion: parseFloat(e.target.value) || 0})}
                  placeholder="800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiempo de Ciclo (seg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.tiempo_ciclo}
                  onChange={e => setFormData({...formData, tiempo_ciclo: parseFloat(e.target.value) || 0})}
                  placeholder="15.0"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingMaterial(null)
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Factory className="h-8 w-8 text-blue-600" />
          Materiales
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Material
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          className="flex-1 outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio/KG</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
              </tr>
            ) : filteredMateriales.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron materiales.
                </td>
              </tr>
            ) : (
              filteredMateriales.map(material => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {material.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tiposMaterial[material.tipo]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      material.stock_actual <= material.stock_minimo 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {material.stock_actual} {material.unidad_medida}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${material.precio_kg?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEdit(material)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
