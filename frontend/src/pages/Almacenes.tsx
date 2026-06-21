import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Warehouse, RefreshCw } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ConfirmDialog'

interface Almacen {
  id: number
  codigo: string
  nombre: string
  tipo: 'principal' | 'secundario' | 'cuarentena' | 'merma' | 'transito'
  ubicacion: string
  responsable?: string
  telefono?: string
  activo: boolean
}

const tiposAlmacen = {
  principal: 'Principal',
  secundario: 'Secundario',
  cuarentena: 'Cuarentena',
  merma: 'Merma',
  transito: 'Tránsito'
}

type TipoAlmacen = 'principal' | 'secundario' | 'cuarentena' | 'merma' | 'transito'

export default function Almacenes() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAlmacen, setEditingAlmacen] = useState<Almacen | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [confirmSeed, setConfirmSeed] = useState(false)
  const [formData, setFormData] = useState<{
    codigo: string; nombre: string; tipo: TipoAlmacen;
    ubicacion: string; responsable: string; telefono: string
  }>({
    codigo: '',
    nombre: '',
    tipo: 'principal',
    ubicacion: '',
    responsable: '',
    telefono: ''
  })

  useEffect(() => {
    loadAlmacenes()
  }, [])

  const loadAlmacenes = async () => {
    try {
      const response = await api.get('/almacenes/all')
      setAlmacenes(response.data)
    } catch (error) {
      toast.error('Error al cargar almacenes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAlmacen) {
        await api.put(`/almacenes/${editingAlmacen.id}`, formData)
        toast.success('Almacén actualizado')
      } else {
        await api.post('/almacenes', formData)
        toast.success('Almacén creado')
      }
      setShowForm(false)
      setEditingAlmacen(null)
      resetForm()
      loadAlmacenes()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar almacén')
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      tipo: 'principal' as TipoAlmacen,
      ubicacion: '',
      responsable: '',
      telefono: ''
    })
  }

  const handleEdit = (almacen: Almacen) => {
    setEditingAlmacen(almacen)
    setFormData({
      codigo: almacen.codigo,
      nombre: almacen.nombre,
      tipo: almacen.tipo,
      ubicacion: almacen.ubicacion,
      responsable: almacen.responsable || '',
      telefono: almacen.telefono || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/almacenes/${id}`)
      toast.success('Almacén eliminado')
      loadAlmacenes()
    } catch (error) {
      toast.error('Error al eliminar almacén')
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleSeed = async () => {
    setConfirmSeed(false)
    try {
      const response = await api.post('/almacenes/seed')
      toast.success(response.data.message)
      loadAlmacenes()
    } catch (error) {
      toast.error('Error al crear almacenes por defecto')
    }
  }

  const filteredAlmacenes = almacenes.filter(a => 
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (showForm) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Warehouse className="h-6 w-6 text-blue-600" />
          {editingAlmacen ? 'Editar Almacén' : 'Nuevo Almacén'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código *</label>
              <input
                required
                maxLength={10}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.codigo}
                onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                placeholder="ALM-001"
                disabled={!!editingAlmacen}
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
                placeholder="Almacén Principal"
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
                <option value="principal">Principal</option>
                <option value="secundario">Secundario</option>
                <option value="cuarentena">Cuarentena</option>
                <option value="merma">Merma</option>
                <option value="transito">Tránsito</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ubicación *</label>
              <input
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.ubicacion}
                onChange={e => setFormData({...formData, ubicacion: e.target.value})}
                placeholder="Edificio A - Nave 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Responsable</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.responsable}
                onChange={e => setFormData({...formData, responsable: e.target.value})}
                placeholder="Jefe de Almacén"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
                placeholder="8112345678"
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
                setEditingAlmacen(null)
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
          <Warehouse className="h-8 w-8 text-blue-600" />
          Almacenes
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmSeed(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <RefreshCw className="h-4 w-4" />
            Crear Default
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Almacén
          </button>
        </div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
              </tr>
            ) : filteredAlmacenes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron almacenes.
                  <button onClick={handleSeed} className="text-blue-600 hover:underline ml-2">
                    Crear por defecto
                  </button>
                </td>
              </tr>
            ) : (
              filteredAlmacenes.map(almacen => (
                <tr key={almacen.id} className={!almacen.activo ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {almacen.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {almacen.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tiposAlmacen[almacen.tipo]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {almacen.ubicacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {almacen.responsable || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${almacen.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {almacen.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEdit(almacen)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {almacen.activo && (
                      <button
                        onClick={() => setConfirmDelete(almacen.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
        title="Eliminar almacén"
        message="¿Estás seguro de eliminar este almacén? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
      />
      <ConfirmDialog
        isOpen={confirmSeed}
        onClose={() => setConfirmSeed(false)}
        onConfirm={handleSeed}
        title="Crear almacenes por defecto"
        message="Se crearán los almacenes estándar (Principal, Cuarentena, Merma). ¿Continuar?"
        confirmText="Crear"
        type="info"
      />
    </div>
  )
}
