import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Package, Factory } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Producto {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  tipo: 'producto_terminado' | 'subensamble' | 'pieza'
  unidad_medida: string
  peso_gr: number
  ciclo_inyeccion_seg: number
  cavidades_molde: number
  costo_material_unitario: number
  costo_mano_obra_unitario: number
  costo_energia_unitario: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  stock_maximo: number
  activo: boolean
}

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'producto_terminado' as const,
    unidad_medida: 'PZ',
    peso_gr: 0,
    ciclo_inyeccion_seg: 0,
    cavidades_molde: 1,
    costo_material_unitario: 0,
    costo_mano_obra_unitario: 0,
    costo_energia_unitario: 0,
    precio_venta: 0,
    stock_minimo: 0,
    stock_maximo: 0
  })

  useEffect(() => {
    loadProductos()
  }, [])

  const loadProductos = async () => {
    try {
      const response = await api.get('/productos')
      setProductos(response.data)
    } catch (error) {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProducto) {
        await api.put(`/productos/${editingProducto.id}`, formData)
        toast.success('Producto actualizado')
      } else {
        await api.post('/productos', formData)
        toast.success('Producto creado')
      }
      setShowForm(false)
      setEditingProducto(null)
      resetForm()
      loadProductos()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar producto')
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'producto_terminado',
      unidad_medida: 'PZ',
      peso_gr: 0,
      ciclo_inyeccion_seg: 0,
      cavidades_molde: 1,
      costo_material_unitario: 0,
      costo_mano_obra_unitario: 0,
      costo_energia_unitario: 0,
      precio_venta: 0,
      stock_minimo: 0,
      stock_maximo: 0
    })
  }

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto)
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      tipo: producto.tipo,
      unidad_medida: producto.unidad_medida,
      peso_gr: producto.peso_gr || 0,
      ciclo_inyeccion_seg: producto.ciclo_inyeccion_seg || 0,
      cavidades_molde: producto.cavidades_molde || 1,
      costo_material_unitario: producto.costo_material_unitario || 0,
      costo_mano_obra_unitario: producto.costo_mano_obra_unitario || 0,
      costo_energia_unitario: producto.costo_energia_unitario || 0,
      precio_venta: producto.precio_venta || 0,
      stock_minimo: producto.stock_minimo || 0,
      stock_maximo: producto.stock_maximo || 0
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    try {
      await api.delete(`/productos/${id}`)
      toast.success('Producto eliminado')
      loadProductos()
    } catch (error) {
      toast.error('Error al eliminar producto')
    }
  }

  const calcularCostoTotal = () => {
    return formData.costo_material_unitario + formData.costo_mano_obra_unitario + formData.costo_energia_unitario
  }

  const calcularMargen = () => {
    const costoTotal = calcularCostoTotal()
    if (costoTotal === 0) return 0
    return ((formData.precio_venta - costoTotal) / formData.precio_venta) * 100
  }

  const filteredProductos = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (showForm) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Factory className="h-6 w-6 text-blue-600" />
          {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          {/* Información General */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código SKU *</label>
                <input
                  required
                  maxLength={30}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.codigo}
                  onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                  placeholder="PT-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  required
                  maxLength={150}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Tapa de envase 500ml"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción técnica del producto..."
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
                  <option value="producto_terminado">Producto Terminado</option>
                  <option value="subensamble">Subensamble</option>
                  <option value="pieza">Pieza</option>
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
                  <option value="PZ">PZ - Pieza</option>
                  <option value="KGM">KGM - Kilogramo</option>
                  <option value="XBX">XBX - Caja</option>
                  <option value="XPK">XPK - Paquete</option>
                </select>
              </div>
            </div>
          </div>

          {/* Especificaciones Técnicas */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Especificaciones Técnicas de Inyección
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Peso (gramos)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.peso_gr}
                  onChange={e => setFormData({...formData, peso_gr: parseFloat(e.target.value) || 0})}
                  placeholder="12.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ciclo de Inyección (seg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.ciclo_inyeccion_seg}
                  onChange={e => setFormData({...formData, ciclo_inyeccion_seg: parseFloat(e.target.value) || 0})}
                  placeholder="15.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cavidades del Molde</label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.cavidades_molde}
                  onChange={e => setFormData({...formData, cavidades_molde: parseInt(e.target.value) || 1})}
                  placeholder="4"
                />
              </div>
            </div>
          </div>

          {/* Costos */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Costos por Unidad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Material ($)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.costo_material_unitario}
                  onChange={e => setFormData({...formData, costo_material_unitario: parseFloat(e.target.value) || 0})}
                  placeholder="0.3600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mano de Obra ($)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.costo_mano_obra_unitario}
                  onChange={e => setFormData({...formData, costo_mano_obra_unitario: parseFloat(e.target.value) || 0})}
                  placeholder="0.2500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Energía ($)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.costo_energia_unitario}
                  onChange={e => setFormData({...formData, costo_energia_unitario: parseFloat(e.target.value) || 0})}
                  placeholder="0.0800"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-700">Costo Total</label>
                <p className="text-lg font-bold text-gray-900">
                  ${calcularCostoTotal().toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Precio y Stock */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Precio e Inventario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio de Venta ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.precio_venta}
                  onChange={e => setFormData({...formData, precio_venta: parseFloat(e.target.value) || 0})}
                  placeholder="1.20"
                />
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-green-800">Margen de Ganancia</label>
                <p className={`text-lg font-bold ${calcularMargen() >= 30 ? 'text-green-600' : calcularMargen() >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {calcularMargen().toFixed(1)}%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
                <input
                  type="number"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.stock_minimo}
                  onChange={e => setFormData({...formData, stock_minimo: parseInt(e.target.value) || 0})}
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Máximo</label>
                <input
                  type="number"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.stock_maximo}
                  onChange={e => setFormData({...formData, stock_maximo: parseInt(e.target.value) || 0})}
                  placeholder="5000"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              {editingProducto ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingProducto(null)
                resetForm()
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-medium"
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
          Productos
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
              </tr>
            ) : filteredProductos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron productos. 
                  <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline ml-2">
                    Crear nuevo
                  </button>
                </td>
              </tr>
            ) : (
              filteredProductos.map(producto => (
                <tr key={producto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {producto.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {producto.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {producto.tipo?.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {producto.peso_gr ? `${producto.peso_gr}g` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${producto.precio_venta?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      producto.stock_actual <= producto.stock_minimo 
                        ? 'bg-red-100 text-red-800' 
                        : producto.stock_actual >= producto.stock_maximo
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {producto.stock_actual} / {producto.stock_minimo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => handleEdit(producto)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Productos</p>
          <p className="text-2xl font-bold text-gray-900">{productos.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Productos Terminados</p>
          <p className="text-2xl font-bold text-blue-600">
            {productos.filter(p => p.tipo === 'producto_terminado').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Stock Bajo</p>
          <p className="text-2xl font-bold text-red-600">
            {productos.filter(p => p.stock_actual <= p.stock_minimo).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Valor Inventario</p>
          <p className="text-2xl font-bold text-green-600">
            ${productos.reduce((sum, p) => sum + (p.stock_actual * p.precio_venta), 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
