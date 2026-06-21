import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, UserCheck, Clock } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

interface Operador {
  id: number
  codigo: string
  nombre: string
  apellido_paterno?: string
  apellido_materno?: string
  rfc?: string
  curp?: string
  telefono?: string
  email?: string
  fecha_ingreso?: string
  turno: 'matutino' | 'vespertino' | 'nocturno' | 'mixto'
  especialidad?: string
  certificaciones?: string
  estado: 'activo' | 'inactivo' | 'vacaciones'
  observaciones?: string
}

export default function Operadores() {
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingOperador, setEditingOperador] = useState<Operador | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Operador>>({
    turno: 'matutino',
    estado: 'activo'
  })

  useEffect(() => {
    loadOperadores()
  }, [])

  const loadOperadores = async () => {
    try {
      const response = await api.get('/operadores')
      setOperadores(response.data)
    } catch (error) {
      toast.error('Error al cargar operadores')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingOperador) {
        await api.put(`/operadores/${editingOperador.id}`, formData)
        toast.success('Operador actualizado')
      } else {
        await api.post('/operadores', formData)
        toast.success('Operador creado')
      }
      setShowModal(false)
      setEditingOperador(null)
      setFormData({ turno: 'matutino', estado: 'activo' })
      loadOperadores()
    } catch (error) {
      toast.error('Error al guardar operador')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/operadores/${id}`)
      toast.success('Operador eliminado')
      loadOperadores()
    } catch (error) {
      toast.error('Error al eliminar operador')
    } finally {
      setConfirmDelete(null)
    }
  }

  const openEditModal = (operador: Operador) => {
    setEditingOperador(operador)
    setFormData(operador)
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingOperador(null)
    setFormData({ turno: 'matutino', estado: 'activo' })
    setShowModal(true)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1"><UserCheck className="h-3 w-3"/> Activo</span>
      case 'vacaciones':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1"><Clock className="h-3 w-3"/> Vacaciones</span>
      case 'inactivo':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Inactivo</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{estado}</span>
    }
  }

  const getTurnoBadge = (turno: string) => {
    const colors: Record<string, string> = {
      matutino: 'bg-yellow-100 text-yellow-800',
      vespertino: 'bg-orange-100 text-orange-800',
      nocturno: 'bg-indigo-100 text-indigo-800',
      mixto: 'bg-purple-100 text-purple-800'
    }
    return <span className={`px-2 py-1 rounded text-xs ${colors[turno] || 'bg-gray-100'}`}>{turno}</span>
  }

  const filteredOperadores = operadores.filter(o =>
    o.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.especialidad?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Operadores</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Operador
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código, nombre o especialidad..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOperadores.map(operador => (
              <tr key={operador.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{operador.codigo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {operador.nombre} {operador.apellido_paterno} {operador.apellido_materno}
                  <div className="text-xs text-gray-400">{operador.rfc}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getTurnoBadge(operador.turno)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{operador.especialidad || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(operador.estado)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button onClick={() => openEditModal(operador)} className="text-blue-600 hover:text-blue-900 mr-2">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(operador.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
        title="Eliminar operador"
        message="¿Estás seguro de eliminar este operador? Se perderá toda la información asociada."
        confirmText="Eliminar"
        type="danger"
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingOperador ? 'Editar Operador' : 'Nuevo Operador'}>
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
              <label className="block text-sm font-medium text-gray-700">Apellido Paterno</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.apellido_paterno || ''}
                onChange={e => setFormData({ ...formData, apellido_paterno: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido Materno</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.apellido_materno || ''}
                onChange={e => setFormData({ ...formData, apellido_materno: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">RFC</label>
              <input
                type="text"
                maxLength={13}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.rfc || ''}
                onChange={e => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CURP</label>
              <input
                type="text"
                maxLength={18}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.curp || ''}
                onChange={e => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.telefono || ''}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Ingreso</label>
              <input
                type="date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.fecha_ingreso || ''}
                onChange={e => setFormData({ ...formData, fecha_ingreso: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Turno</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.turno || 'matutino'}
                onChange={e => setFormData({ ...formData, turno: e.target.value as any })}
              >
                <option value="matutino">Matutino</option>
                <option value="vespertino">Vespertino</option>
                <option value="nocturno">Nocturno</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Especialidad</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.especialidad || ''}
                onChange={e => setFormData({ ...formData, especialidad: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.estado || 'activo'}
                onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
              >
                <option value="activo">Activo</option>
                <option value="vacaciones">Vacaciones</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Certificaciones</label>
            <textarea
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.certificaciones || ''}
              onChange={e => setFormData({ ...formData, certificaciones: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              rows={2}
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
