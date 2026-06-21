import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Send, CheckCircle, XCircle, RefreshCw, Eye, FileText } from 'lucide-react'
import { SkeletonTable } from '../components/Skeleton'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

interface Cotizacion {
  id: number
  folio: string
  fecha_cotizacion: string
  fecha_vencimiento?: string
  cliente: { razon_social: string; rfc: string }
  contacto?: string
  total: number
  moneda: 'MXN' | 'USD'
  estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada' | 'convertida'
  validez: string
}

interface Cliente {
  id: number
  razon_social: string
}

interface Producto {
  id: number
  codigo: string
  nombre: string
  precio_venta: number
}

interface Maquina { id: number; nombre: string; modelo: string }

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertId, setConvertId] = useState<number | null>(null)
  const [convertFolio, setConvertFolio] = useState('')
  const [convertForm, setConvertForm] = useState({ fecha_entrega: '', maquina_asignada: '', turno: 'matutino', observaciones: '' })
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [detalles, setDetalles] = useState<any[]>([{ producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0 }])
  const [formData, setFormData] = useState({
    cliente_id: '',
    contacto: '',
    email_contacto: '',
    telefono_contacto: '',
    condiciones_pago: '',
    tiempo_entrega: '',
    validez: '30 días',
    moneda: 'MXN',
    tipo_cambio: 1,
    observaciones: ''
  })

  useEffect(() => {
    loadCotizaciones()
    loadClientes()
    loadProductos()
    loadMaquinas()
  }, [])

  const loadCotizaciones = async () => {
    try {
      const response = await api.get('/cotizaciones')
      setCotizaciones(response.data.data ?? response.data)
    } catch (error) {
      toast.error('Error al cargar cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  const loadClientes = async () => {
    try {
      const response = await api.get('/clientes')
      setClientes(response.data.data ?? response.data)
    } catch (error) {
      console.error('Error al cargar clientes')
    }
  }

  const loadProductos = async () => {
    try {
      const response = await api.get('/productos')
      setProductos(response.data)
    } catch (error) {
      console.error('Error al cargar productos')
    }
  }

  const loadMaquinas = async () => {
    try {
      const response = await api.get('/maquinas')
      setMaquinas(response.data)
    } catch (error) {
      console.error('Error al cargar máquinas')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const detallesValidos = detalles.filter(d => d.producto_id && d.cantidad > 0)
      await api.post('/cotizaciones', { ...formData, detalles: detallesValidos })
      toast.success('Cotización creada')
      setShowModal(false)
      resetForm()
      loadCotizaciones()
    } catch (error) {
      toast.error('Error al crear cotización')
    }
  }

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      contacto: '',
      email_contacto: '',
      telefono_contacto: '',
      condiciones_pago: '',
      tiempo_entrega: '',
      validez: '30 días',
      moneda: 'MXN',
      tipo_cambio: 1,
      observaciones: ''
    })
    setDetalles([{ producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0 }])
  }

  const addDetalle = () => {
    setDetalles([...detalles, { producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0 }])
  }

  const removeDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const updateDetalle = (index: number, field: string, value: any) => {
    const nuevosDetalles = [...detalles]
    nuevosDetalles[index][field] = value
    if (field === 'producto_id') {
      const producto = productos.find(p => p.id === parseInt(value))
      if (producto) {
        nuevosDetalles[index].precio_unitario = producto.precio_venta
      }
    }
    setDetalles(nuevosDetalles)
  }

  const calcularTotales = () => {
    return detalles.reduce((sum, d) => {
      const importe = (d.cantidad * d.precio_unitario) - d.descuento
      return sum + importe
    }, 0)
  }

  const handleCambiarEstado = async (id: number, estado: string) => {
    try {
      await api.put(`/cotizaciones/${id}/estado`, { estado })
      toast.success('Estado actualizado')
      loadCotizaciones()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  const handleConvertir = (id: number, folio: string) => {
    setConvertId(id)
    setConvertFolio(folio)
    setConvertForm({ fecha_entrega: '', maquina_asignada: '', turno: 'matutino', observaciones: '' })
    setShowConvertModal(true)
  }

  const handleDoConvertir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!convertId) return
    setConverting(true)
    try {
      const res = await api.post(`/cotizaciones/${convertId}/convertir`, convertForm)
      toast.success(res.data.message || 'Orden de producción creada')
      setShowConvertModal(false)
      setConvertId(null)
      loadCotizaciones()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al convertir')
    } finally { setConverting(false) }
  }

  const handleEliminar = async (id: number) => {
    try {
      await api.delete(`/cotizaciones/${id}`)
      toast.success('Cotización eliminada')
      loadCotizaciones()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleDescargarPDF = (id: number) => {
    const token = localStorage.getItem('token')
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/pdf/cotizacion/${id}`
    // Abrimos en nueva pestaña pasando el token como query param (solo para descarga directa)
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    // El token se enviará via header en fetch; abrimos con fetch y blob para navegadores modernos
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const objUrl = URL.createObjectURL(blob)
        link.href = objUrl
        link.download = `cotizacion-${id}.pdf`
        link.click()
        URL.revokeObjectURL(objUrl)
      })
      .catch(() => toast.error('Error al generar PDF'))
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      borrador: 'bg-gray-100 text-gray-800',
      enviada: 'bg-blue-100 text-blue-800',
      aceptada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800',
      expirada: 'bg-yellow-100 text-yellow-800',
      convertida: 'bg-purple-100 text-purple-800'
    }
    return <span className={`px-2 py-1 rounded text-xs ${colors[estado]}`}>{estado.toUpperCase()}</span>
  }

  const filteredCotizaciones = cotizaciones.filter(c =>
    c.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cliente?.razon_social.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const subtotal = calcularTotales()
  const iva = subtotal * 0.16
  const total = subtotal + iva

  if (loading) return <SkeletonTable rows={5} cols={6} />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Cotización
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por folio o cliente..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCotizaciones.map(cotizacion => (
              <tr key={cotizacion.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cotizacion.folio}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(cotizacion.fecha_cotizacion).toLocaleDateString('es-MX')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cotizacion.cliente?.razon_social}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${cotizacion.total?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {cotizacion.moneda}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(cotizacion.estado)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Ver detalle">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDescargarPDF(cotizacion.id)} className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded" title="Descargar PDF">
                      <FileText className="h-4 w-4" />
                    </button>
                    {cotizacion.estado === 'borrador' && (
                      <button onClick={() => handleCambiarEstado(cotizacion.id, 'enviada')} className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded" title="Enviar"><Send className="h-4 w-4" /></button>
                    )}
                    {cotizacion.estado === 'enviada' && (
                      <>
                        <button onClick={() => handleCambiarEstado(cotizacion.id, 'aceptada')} className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded" title="Aceptar"><CheckCircle className="h-4 w-4" /></button>
                        <button onClick={() => handleCambiarEstado(cotizacion.id, 'rechazada')} className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded" title="Rechazar"><XCircle className="h-4 w-4" /></button>
                      </>
                    )}
                    {cotizacion.estado === 'aceptada' && (
                      <button onClick={() => handleConvertir(cotizacion.id, cotizacion.folio)} className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded" title="Convertir a Orden de Producción"><RefreshCw className="h-4 w-4" /></button>
                    )}
                    {cotizacion.estado !== 'convertida' && (
                      <button onClick={() => setConfirmDelete(cotizacion.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Convertir a Orden de Producción */}
      <Modal isOpen={showConvertModal} onClose={() => setShowConvertModal(false)} title={`Convertir ${convertFolio} a Orden de Producción`} size="md">
        <form onSubmit={handleDoConvertir} className="space-y-4">
          <p className="text-sm text-gray-600">
            Se creará una Orden de Producción a partir de los productos de esta cotización.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
            <input type="date" className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              value={convertForm.fecha_entrega}
              onChange={e => setConvertForm({ ...convertForm, fecha_entrega: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máquina Asignada</label>
            <select className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              value={convertForm.maquina_asignada}
              onChange={e => setConvertForm({ ...convertForm, maquina_asignada: e.target.value })}>
              <option value="">Sin asignar</option>
              {maquinas.map(m => <option key={m.id} value={m.nombre}>{m.nombre} — {m.modelo}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
            <select className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              value={convertForm.turno}
              onChange={e => setConvertForm({ ...convertForm, turno: e.target.value })}>
              <option value="matutino">Matutino</option>
              <option value="vespertino">Vespertino</option>
              <option value="nocturno">Nocturno</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea rows={2} className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              value={convertForm.observaciones}
              onChange={e => setConvertForm({ ...convertForm, observaciones: e.target.value })}
              placeholder="Instrucciones adicionales..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowConvertModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={converting}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {converting && <RefreshCw className="h-3 w-3 animate-spin" />}
              Crear Orden de Producción
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Eliminar cotización"
        message="¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
        onConfirm={() => confirmDelete !== null && handleEliminar(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Cotización" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cliente</label>
              <select
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.cliente_id}
                onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contacto</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.contacto}
                onChange={e => setFormData({ ...formData, contacto: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Contacto</label>
              <input
                type="email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.email_contacto}
                onChange={e => setFormData({ ...formData, email_contacto: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Productos</h3>
              <button type="button" onClick={addDetalle} className="text-sm text-blue-600 hover:text-blue-800">+ Agregar producto</button>
            </div>
            {detalles.map((detalle, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                <select
                  className="border border-gray-300 rounded-md p-2"
                  value={detalle.producto_id}
                  onChange={e => updateDetalle(index, 'producto_id', e.target.value)}
                >
                  <option value="">Producto...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Cantidad"
                  className="border border-gray-300 rounded-md p-2"
                  value={detalle.cantidad}
                  onChange={e => updateDetalle(index, 'cantidad', parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  placeholder="Precio"
                  className="border border-gray-300 rounded-md p-2"
                  value={detalle.precio_unitario}
                  onChange={e => updateDetalle(index, 'precio_unitario', parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  placeholder="Descuento"
                  className="border border-gray-300 rounded-md p-2"
                  value={detalle.descuento}
                  onChange={e => updateDetalle(index, 'descuento', parseFloat(e.target.value))}
                />
                <button type="button" onClick={() => removeDetalle(index)} className="text-red-600 hover:text-red-800">Eliminar</button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Condiciones de Pago</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.condiciones_pago}
                onChange={e => setFormData({ ...formData, condiciones_pago: e.target.value })}
                placeholder="Ej: 30 días"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tiempo de Entrega</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.tiempo_entrega}
                onChange={e => setFormData({ ...formData, tiempo_entrega: e.target.value })}
                placeholder="Ej: 5-7 días hábiles"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Validez</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.validez}
                onChange={e => setFormData({ ...formData, validez: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Moneda</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.moneda}
                onChange={e => setFormData({ ...formData, moneda: e.target.value as any })}
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Americano</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Subtotal: ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              <div className="text-sm text-gray-600">IVA (16%): ${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              <div className="text-lg font-bold text-gray-900">Total: ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Crear Cotización</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
