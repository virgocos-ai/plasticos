import { useEffect, useState } from 'react'
import { Plus, Search, FileCheck, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

interface Inspeccion {
  id: number
  folio: string
  fecha_inspeccion: string
  producto: { codigo: string; nombre: string }
  ordenProduccion?: { folio: string }
  lote?: { codigo: string }
  tipo_inspeccion: 'entrada' | 'proceso' | 'salida' | 'final'
  resultado: 'aprobado' | 'rechazado' | 'condicional' | 'pendiente'
  cantidad_inspeccionada: number
  cantidad_defectuosa: number
  porcentaje_defectos: number
  inspector?: { nombre: string }
}

export default function Calidad() {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [formData, setFormData] = useState({
    producto_id: '',
    orden_produccion_id: '',
    lote_id: '',
    tipo_inspeccion: 'proceso',
    cantidad_inspeccionada: 0,
    cantidad_defectuosa: 0,
    defectos_encontrados: '',
    criterios_inspeccion: '',
    observaciones: ''
  })

  useEffect(() => {
    loadInspecciones()
    loadEstadisticas()
  }, [])

  const loadInspecciones = async () => {
    try {
      const response = await api.get('/calidad')
      setInspecciones(response.data)
    } catch (error) {
      toast.error('Error al cargar inspecciones')
    }
  }

  const loadEstadisticas = async () => {
    try {
      const response = await api.get('/calidad/estadisticas/resumen')
      setEstadisticas(response.data)
    } catch (error) {
      console.error('Error al cargar estadísticas')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/calidad', formData)
      toast.success('Inspección registrada')
      setShowModal(false)
      resetForm()
      loadInspecciones()
      loadEstadisticas()
    } catch (error) {
      toast.error('Error al registrar inspección')
    }
  }

  const resetForm = () => {
    setFormData({
      producto_id: '',
      orden_produccion_id: '',
      lote_id: '',
      tipo_inspeccion: 'proceso',
      cantidad_inspeccionada: 0,
      cantidad_defectuosa: 0,
      defectos_encontrados: '',
      criterios_inspeccion: '',
      observaciones: ''
    })
  }

  const handleCambiarResultado = async (id: number, resultado: string) => {
    try {
      await api.put(`/calidad/${id}/resultado`, { resultado })
      toast.success('Resultado actualizado')
      loadInspecciones()
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      entrada: 'bg-blue-100 text-blue-800',
      proceso: 'bg-yellow-100 text-yellow-800',
      salida: 'bg-green-100 text-green-800',
      final: 'bg-purple-100 text-purple-800'
    }
    return <span className={`px-2 py-1 rounded text-xs ${colors[tipo]}`}>{tipo.toUpperCase()}</span>
  }

  const getResultadoBadge = (resultado: string) => {
    const colors: Record<string, string> = {
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
      condicional: 'bg-yellow-100 text-yellow-800',
      pendiente: 'bg-gray-100 text-gray-800'
    }
    const icons: Record<string, any> = {
      aprobado: <CheckCircle className="h-3 w-3" />,
      rechazado: <XCircle className="h-3 w-3" />,
      condicional: <AlertCircle className="h-3 w-3" />,
      pendiente: <Clock className="h-3 w-3" />
    }
    return (
      <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${colors[resultado]}`}>
        {icons[resultado]}
        {resultado.toUpperCase()}
      </span>
    )
  }

  const filteredInspecciones = inspecciones.filter(i =>
    i.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Control de Calidad</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Inspección
        </button>
      </div>

      {estadisticas && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Inspecciones</div>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-600">Aprobadas</div>
            <div className="text-2xl font-bold text-green-700">{estadisticas.aprobadas}</div>
            <div className="text-sm text-green-600">{estadisticas.porcentaje_aprobacion}%</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-sm text-red-600">Rechazadas</div>
            <div className="text-2xl font-bold text-red-700">{estadisticas.rechazadas}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-sm text-yellow-600">Defectos Globales</div>
            <div className="text-2xl font-bold text-yellow-700">{estadisticas.porcentaje_defectos_global}%</div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por folio o producto..."
          className="flex-1 outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Defectos %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInspecciones.map(inspeccion => (
              <tr key={inspeccion.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inspeccion.folio}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(inspeccion.fecha_inspeccion).toLocaleDateString('es-MX')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspeccion.producto?.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getTipoBadge(inspeccion.tipo_inspeccion)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {inspeccion.cantidad_inspeccionada}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {inspeccion.porcentaje_defectos.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getResultadoBadge(inspeccion.resultado)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {inspeccion.resultado === 'pendiente' && (
                    <>
                      <button onClick={() => handleCambiarResultado(inspeccion.id, 'aprobado')} className="text-green-600 hover:text-green-900 mr-2"><CheckCircle className="h-4 w-4" /></button>
                      <button onClick={() => handleCambiarResultado(inspeccion.id, 'rechazado')} className="text-red-600 hover:text-red-900 mr-2"><XCircle className="h-4 w-4" /></button>
                    </>
                  )}
                  {inspeccion.resultado === 'aprobado' && (
                    <button className="text-blue-600 hover:text-blue-900" title="Generar certificado"><FileCheck className="h-4 w-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Inspección de Calidad" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Inspección</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.tipo_inspeccion}
                onChange={e => setFormData({ ...formData, tipo_inspeccion: e.target.value as any })}
              >
                <option value="entrada">Entrada</option>
                <option value="proceso">En Proceso</option>
                <option value="salida">Salida</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Producto ID</label>
              <input
                type="number"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.producto_id}
                onChange={e => setFormData({ ...formData, producto_id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Orden Producción ID</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.orden_produccion_id}
                onChange={e => setFormData({ ...formData, orden_produccion_id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lote ID</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.lote_id}
                onChange={e => setFormData({ ...formData, lote_id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cantidad Inspeccionada</label>
              <input
                type="number"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.cantidad_inspeccionada}
                onChange={e => setFormData({ ...formData, cantidad_inspeccionada: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cantidad Defectuosa</label>
              <input
                type="number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.cantidad_defectuosa}
                onChange={e => setFormData({ ...formData, cantidad_defectuosa: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Defectos Encontrados</label>
            <textarea
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.defectos_encontrados}
              onChange={e => setFormData({ ...formData, defectos_encontrados: e.target.value })}
              placeholder="Describa los defectos encontrados..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Criterios de Inspección</label>
            <textarea
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.criterios_inspeccion}
              onChange={e => setFormData({ ...formData, criterios_inspeccion: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.observaciones}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Inspección</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
