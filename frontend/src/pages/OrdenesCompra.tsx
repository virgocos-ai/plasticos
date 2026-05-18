import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Package, CheckCircle, Truck } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

interface OrdenCompra {
  id: number
  folio: string
  fecha_orden: string
  fecha_entrega_esperada?: string
  proveedor: { razon_social: string; rfc: string }
  contacto?: string
  total: number
  moneda: 'MXN' | 'USD'
  estado: 'borrador' | 'enviada' | 'parcial' | 'completada' | 'cancelada'
  metodo_entrega?: string
}

interface Proveedor {
  id: number
  razon_social: string
}

interface Material {
  id: number
  codigo: string
  nombre: string
  costo_por_kg: number
}

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showRecepcionModal, setShowRecepcionModal] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [detalles, setDetalles] = useState<any[]>([{ material_id: '', cantidad_solicitada: 1, precio_unitario: 0, descuento: 0 }])
  const [formData, setFormData] = useState({
    proveedor_id: '',
    contacto: '',
    email: '',
    telefono: '',
    fecha_entrega_esperada: '',
    condiciones_pago: '',
    metodo_entrega: '',
    direccion_entrega: '',
    moneda: 'MXN',
    tipo_cambio: 1,
    observaciones: ''
  })

  useEffect(() => {
    loadOrdenes()
    loadProveedores()
    loadMateriales()
  }, [])

  const loadOrdenes = async () => {
    try {
      const response = await api.get('/ordenes-compra')
      setOrdenes(response.data)
    } catch (error) {
      toast.error('Error al cargar órdenes')
    }
  }

  const loadProveedores = async () => {
    try {
      const response = await api.get('/proveedores')
      setProveedores(response.data)
    } catch (error) {
      console.error('Error al cargar proveedores')
    }
  }

  const loadMateriales = async () => {
    try {
      const response = await api.get('/materiales')
      setMateriales(response.data)
    } catch (error) {
      console.error('Error al cargar materiales')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const detallesValidos = detalles.filter(d => d.material_id && d.cantidad_solicitada > 0)
      await api.post('/ordenes-compra', { ...formData, detalles: detallesValidos })
      toast.success('Orden de compra creada')
      setShowModal(false)
      resetForm()
      loadOrdenes()
    } catch (error) {
      toast.error('Error al crear orden')
    }
  }

  const resetForm = () => {
    setFormData({
      proveedor_id: '',
      contacto: '',
      email: '',
      telefono: '',
      fecha_entrega_esperada: '',
      condiciones_pago: '',
      metodo_entrega: '',
      direccion_entrega: '',
      moneda: 'MXN',
      tipo_cambio: 1,
      observaciones: ''
    })
    setDetalles([{ material_id: '', cantidad_solicitada: 1, precio_unitario: 0, descuento: 0 }])
  }

  const addDetalle = () => {
    setDetalles([...detalles, { material_id: '', cantidad_solicitada: 1, precio_unitario: 0, descuento: 0 }])
  }

  const removeDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const updateDetalle = (index: number, field: string, value: any) => {
    const nuevosDetalles = [...detalles]
    nuevosDetalles[index][field] = value
    if (field === 'material_id') {
      const material = materiales.find(m => m.id === parseInt(value))
      if (material) {
        nuevosDetalles[index].precio_unitario = material.costo_por_kg
      }
    }
    setDetalles(nuevosDetalles)
  }

  const calcularTotales = () => {
    return detalles.reduce((sum, d) => {
      const importe = (d.cantidad_solicitada * d.precio_unitario) - d.descuento
      return sum + importe
    }, 0)
  }

  const handleCambiarEstado = async (id: number, estado: string) => {
    try {
      await api.put(`/ordenes-compra/${id}/estado`, { estado })
      toast.success('Estado actualizado')
      loadOrdenes()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  const handleRecepcion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrden) return
    try {
      await api.post(`/ordenes-compra/${selectedOrden.id}/recepcion`, { detalles })
      toast.success('Recepción registrada')
      setShowRecepcionModal(false)
      loadOrdenes()
    } catch (error) {
      toast.error('Error al registrar recepción')
    }
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      borrador: 'bg-gray-100 text-gray-800',
      enviada: 'bg-blue-100 text-blue-800',
      parcial: 'bg-yellow-100 text-yellow-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    }
    return <span className={`px-2 py-1 rounded text-xs ${colors[estado]}`}>{estado.toUpperCase()}</span>
  }

  const filteredOrdenes = ordenes.filter(o =>
    o.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.proveedor?.razon_social.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const subtotal = calcularTotales()
  const iva = subtotal * 0.16
  const total = subtotal + iva

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes de Compra</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Orden
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por folio o proveedor..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrdenes.map(orden => (
              <tr key={orden.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{orden.folio}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(orden.fecha_orden).toLocaleDateString('es-MX')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{orden.proveedor?.razon_social}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${orden.total?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {orden.moneda}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(orden.estado)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {orden.estado === 'borrador' && (
                    <button onClick={() => handleCambiarEstado(orden.id, 'enviada')} className="text-blue-600 hover:text-blue-900 mr-2" title="Enviar"><Package className="h-4 w-4" /></button>
                  )}
                  {(orden.estado === 'enviada' || orden.estado === 'parcial') && (
                    <button 
                      onClick={() => { setSelectedOrden(orden); setShowRecepcionModal(true); }} 
                      className="text-green-600 hover:text-green-900 mr-2" 
                      title="Registrar recepción"
                    >
                      <Truck className="h-4 w-4" />
                    </button>
                  )}
                  <button className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Orden de Compra" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Proveedor</label>
              <select
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.proveedor_id}
                onChange={e => setFormData({ ...formData, proveedor_id: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
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
              <label className="block text-sm font-medium text-gray-700">Fecha Entrega Esperada</label>
              <input
                type="date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.fecha_entrega_esperada}
                onChange={e => setFormData({ ...formData, fecha_entrega_esperada: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Materiales</h3>
              <button type="button" onClick={addDetalle} className="text-sm text-blue-600 hover:text-blue-800">+ Agregar material</button>
            </div>
            {detalles.map((detalle, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                <select
                  className="border border-gray-300 rounded-md p-2"
                  value={detalle.material_id}
                  onChange={e => updateDetalle(index, 'material_id', e.target.value)}
                >
                  <option value="">Material...</option>
                  {materiales.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Cantidad (kg)"
                  className="border border-gray-300 rounded-md p-2"
                  value={detalle.cantidad_solicitada}
                  onChange={e => updateDetalle(index, 'cantidad_solicitada', parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  placeholder="Precio/kg"
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

          <div className="grid grid-cols-3 gap-4 border-t pt-4">
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
              <label className="block text-sm font-medium text-gray-700">Método de Entrega</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.metodo_entrega}
                onChange={e => setFormData({ ...formData, metodo_entrega: e.target.value })}
                placeholder="Ej: Entrega en planta"
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
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Crear Orden</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
