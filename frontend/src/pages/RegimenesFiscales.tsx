import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface RegimenFiscal {
  id: number
  clave: string
  descripcion: string
  activo: boolean
  created_at: string
  updated_at: string
}

export default function RegimenesFiscales() {
  const [regimenes, setRegimenes] = useState<RegimenFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRegimen, setEditingRegimen] = useState<RegimenFiscal | null>(null)
  const [formData, setFormData] = useState({
    clave: '',
    descripcion: '',
    activo: true
  })

  useEffect(() => {
    loadRegimenes()
  }, [])

  const loadRegimenes = async () => {
    try {
      const response = await api.get('/regimenes-fiscales/all')
      setRegimenes(response.data)
    } catch (error) {
      toast.error('Error al cargar regímenes fiscales')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRegimen) {
        await api.put(`/regimenes-fiscales/${editingRegimen.id}`, formData)
        toast.success('Régimen fiscal actualizado')
      } else {
        await api.post('/regimenes-fiscales', formData)
        toast.success('Régimen fiscal creado')
      }
      setShowForm(false)
      setEditingRegimen(null)
      setFormData({ clave: '', descripcion: '', activo: true })
      loadRegimenes()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar régimen fiscal')
    }
  }

  const handleEdit = (regimen: RegimenFiscal) => {
    setEditingRegimen(regimen)
    setFormData({
      clave: regimen.clave,
      descripcion: regimen.descripcion,
      activo: regimen.activo
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este régimen fiscal?')) return
    try {
      await api.delete(`/regimenes-fiscales/${id}`)
      toast.success('Régimen fiscal eliminado')
      loadRegimenes()
    } catch (error) {
      toast.error('Error al eliminar régimen fiscal')
    }
  }

  const handleSeed = async () => {
    if (!confirm('¿Cargar catálogo oficial del SAT? Esto agregará los 19 regímenes fiscales oficiales.')) return
    try {
      const response = await api.post('/regimenes-fiscales/seed')
      toast.success(response.data.message)
      loadRegimenes()
    } catch (error) {
      toast.error('Error al cargar catálogo del SAT')
    }
  }

  const filteredRegimenes = regimenes.filter(r => 
    r.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.clave.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (showForm) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">
          {editingRegimen ? 'Editar Régimen Fiscal' : 'Nuevo Régimen Fiscal'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Clave * (3 dígitos)</label>
              <input
                required
                maxLength={3}
                minLength={3}
                pattern="\d{3}"
                placeholder="601"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.clave}
                onChange={e => setFormData({...formData, clave: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                disabled={!!editingRegimen}
              />
              <p className="text-xs text-gray-500 mt-1">Ejemplo: 601, 612, 626</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.activo ? 'true' : 'false'}
                onChange={e => setFormData({...formData, activo: e.target.value === 'true'})}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descripción *</label>
              <input
                required
                maxLength={200}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.descripcion}
                onChange={e => setFormData({...formData, descripcion: e.target.value})}
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
                setEditingRegimen(null)
                setFormData({ clave: '', descripcion: '', activo: true })
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
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Regímenes Fiscales (SAT)</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSeed}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            title="Cargar catálogo oficial del SAT"
          >
            <RefreshCw className="h-4 w-4" />
            Cargar SAT
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Régimen
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por clave o descripción..."
          className="flex-1 outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clave</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actualizado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : filteredRegimenes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron regímenes fiscales. 
                  <button onClick={handleSeed} className="text-blue-600 hover:underline ml-2">
                    Cargar catálogo SAT
                  </button>
                </td>
              </tr>
            ) : (
              filteredRegimenes.map(regimen => (
                <tr key={regimen.id} className={!regimen.activo ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {regimen.clave}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {regimen.descripcion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${regimen.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {regimen.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(regimen.updated_at).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEdit(regimen)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {regimen.activo && (
                      <button
                        onClick={() => handleDelete(regimen.id)}
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Información</h3>
        <p className="text-sm text-blue-800">
          Este catálogo contiene los regímenes fiscales del SAT utilizados para la facturación electrónica (CFDI 4.0). 
          Puedes agregar nuevos regímenes, editar descripciones o desactivar los que ya no estén vigentes.
        </p>
        <p className="text-sm text-blue-800 mt-2">
          Total de regímenes: <strong>{regimenes.length}</strong> | 
          Activos: <strong>{regimenes.filter(r => r.activo).length}</strong>
        </p>
      </div>
    </div>
  )
}
