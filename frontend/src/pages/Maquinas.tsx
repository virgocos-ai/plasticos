import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Wrench, CheckCircle, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

interface Maquina {
  id: number
  codigo: string
  nombre: string
  modelo?: string
  marca?: string
  capacidad_ton?: number
  anio_fabricacion?: number
  numero_serie?: string
  ubicacion?: string
  estado: 'activa' | 'mantenimiento' | 'inactiva'
  ultimo_mantenimiento?: string
  proximo_mantenimiento?: string
  observaciones?: string
}

export default function Maquinas() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMaquina, setEditingMaquina] = useState<Maquina | null>(null)
  const [formData, setFormData] = useState<Partial<Maquina>>({
    estado: 'activa'
  })

  useEffect(() => {
    loadMaquinas()
  }, [])

  const loadMaquinas = async () => {
    try {
      const response = await api.get('/maquinas')
      setMaquinas(response.data)
    } catch (error) {
      toast.error('Error al cargar máquinas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMaquina) {
        await api.put(`/maquinas/${editingMaquina.id}`, formData)
        toast.success('Máquina actualizada')
      } else {
        await api.post('/maquinas', formData)
        toast.success('Máquina creada')
      }
      setShowModal(false)
      setEditingMaquina(null)
      setFormData({ estado: 'activa' })
      loadMaquinas()
    } catch (error) {
      toast.error('Error al guardar máquina')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta máquina?')) return
    try {
      await api.delete(`/maquinas/${id}`)
      toast.success('Máquina eliminada')
      loadMaquinas()
    } catch (error) {
      toast.error('Error al eliminar máquina')
    }
  }

  const handleMantenimiento = async (id: number) => {
    try {
      await api.post(`/maquinas/${id}/mantenimiento`, { fecha: new Date().toISOString().split('T')[0] })
      toast.success('Mantenimiento registrado')
      loadMaquinas()
    } catch (error) {
      toast.error('Error al registrar mantenimiento')
    }
  }

  const openEditModal = (maquina: Maquina) => {
    setEditingMaquina(maquina)
    setFormData(maquina)
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingMaquina(null)
    setFormData({ estado: 'activa' })
    setShowModal(true)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Activa</span>
      case 'mantenimiento':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center gap-1"><Wrench className="h-3 w-3"/> Mantenimiento</span>
      case 'inactiva':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Inactiva</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{estado}</span>
    }
  }

  const filteredMaquinas = maquinas.filter(m =>
    m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Máquinas de Inyección</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Máquina
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código, nombre o marca..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca/Modelo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Próx. Mant.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMaquinas.map(maquina => (
              <tr key={maquina.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{maquina.codigo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maquina.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maquina.marca} {maquina.modelo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maquina.capacidad_ton} tn</td>
                <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(maquina.estado)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {maquina.proximo_mantenimiento ? new Date(maquina.proximo_mantenimiento).toLocaleDateString('es-MX') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button onClick={() => openEditModal(maquina)} className="text-blue-600 hover:text-blue-900 mr-2">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleMantenimiento(maquina.id)} className="text-green-600 hover:text-green-900 mr-2" title="Registrar mantenimiento">
                    <Wrench className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(maquina.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMaquina ? 'Editar Máquina' : 'Nueva Máquina'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.codigo || ''}
                onChange={e => setFormData({ ...formData, codigo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.nombre || ''}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marca</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.marca || ''}
                onChange={e => setFormData({ ...formData, marca: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Modelo</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.modelo || ''}
                onChange={e => setFormData({ ...formData, modelo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacidad (ton)</label>
              <input
                type="number"
                step="0.1"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.capacidad_ton || ''}
                onChange={e => setFormData({ ...formData, capacidad_ton: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Año Fabricación</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.anio_fabricacion || ''}
                onChange={e => setFormData({ ...formData, anio_fabricacion: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.numero_serie || ''}
                onChange={e => setFormData({ ...formData, numero_serie: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ubicación</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.ubicacion || ''}
                onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.estado || 'activa'}
                onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
              >
                <option value="activa">Activa</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.observaciones || ''}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
