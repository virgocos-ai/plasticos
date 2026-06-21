import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { SkeletonTable } from '../components/Skeleton'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { REGIMENES_FISCALES } from '../constants/satCatalogs'

interface Cliente {
  id: number
  rfc: string
  razon_social: string
  nombre_comercial: string
  email: string
  telefono: string
  codigo_postal: string
  regimen_fiscal: string
  activo: boolean
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    rfc: '',
    razon_social: '',
    nombre_comercial: '',
    email: '',
    telefono: '',
    codigo_postal: '',
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    municipio: '',
    estado: '',
    regimen_fiscal: '601',
    uso_cfdi: 'G03',
    limite_credito: 0,
    dias_credito: 0
  })

  const loadClientes = async (search = '') => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const response = await api.get(`/clientes?${params}`)
      setClientes(response.data.data ?? response.data)
    } catch (error) {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadClientes(searchTerm), 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.id}`, formData)
        toast.success('Cliente actualizado')
      } else {
        await api.post('/clientes', formData)
        toast.success('Cliente creado')
      }
      setShowForm(false)
      setEditingCliente(null)
      loadClientes(searchTerm)
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Error al guardar cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      rfc: cliente.rfc,
      razon_social: cliente.razon_social,
      nombre_comercial: cliente.nombre_comercial || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      codigo_postal: cliente.codigo_postal,
      calle: '',
      numero_exterior: '',
      numero_interior: '',
      colonia: '',
      municipio: '',
      estado: '',
      regimen_fiscal: cliente.regimen_fiscal,
      uso_cfdi: 'G03',
      limite_credito: 0,
      dias_credito: 0
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    try {
      await api.delete(`/clientes/${id}`)
      toast.success('Cliente eliminado')
      loadClientes()
    } catch (error) {
      toast.error('Error al eliminar cliente')
    }
  }

  const filteredClientes = clientes

  if (loading && clientes.length === 0) return <SkeletonTable rows={6} cols={5} />

  if (showForm) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">
          {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">RFC *</label>
              <input
                required
                maxLength={13}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.rfc}
                onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Razón Social *</label>
              <input
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.razon_social}
                onChange={e => setFormData({...formData, razon_social: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre Comercial</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.nombre_comercial}
                onChange={e => setFormData({...formData, nombre_comercial: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Código Postal *</label>
              <input
                required
                maxLength={5}
                pattern="\d{5}"
                placeholder="64000"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.codigo_postal}
                onChange={e => setFormData({...formData, codigo_postal: e.target.value.replace(/\D/g, '').slice(0, 5)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Calle</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.calle}
                onChange={e => setFormData({...formData, calle: e.target.value})}
                placeholder="Av. Industrial"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Número Exterior</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.numero_exterior}
                onChange={e => setFormData({...formData, numero_exterior: e.target.value})}
                placeholder="123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Número Interior</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.numero_interior}
                onChange={e => setFormData({...formData, numero_interior: e.target.value})}
                placeholder="A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Colonia</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.colonia}
                onChange={e => setFormData({...formData, colonia: e.target.value})}
                placeholder="Industrial"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Municipio / Alcaldía</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.municipio}
                onChange={e => setFormData({...formData, municipio: e.target.value})}
                placeholder="Monterrey"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
                placeholder="Nuevo León"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Régimen Fiscal *</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.regimen_fiscal}
                onChange={e => setFormData({...formData, regimen_fiscal: e.target.value})}
              >
                {REGIMENES_FISCALES.map(regimen => (
                  <option key={regimen.clave} value={regimen.clave}>
                    {regimen.clave} - {regimen.descripcion}
                  </option>
                ))}
              </select>
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
              onClick={() => setShowForm(false)}
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
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por RFC o Razón Social..."
          className="flex-1 outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RFC</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón Social</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClientes.map(cliente => (
              <tr key={cliente.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {cliente.rfc}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cliente.razon_social}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cliente.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cliente.codigo_postal}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => handleEdit(cliente)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cliente.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
