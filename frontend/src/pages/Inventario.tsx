import { useEffect, useState } from 'react'
import { AlertTriangle, Package, Factory, CheckCircle, Plus, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface AlertaStock {
  productos_bajos: Array<{ id: number; codigo: string; nombre: string; stock_actual: number; stock_minimo: number }>
  materiales_bajos: Array<{ id: number; codigo: string; nombre: string; tipo: string; stock_actual_kg: number; stock_minimo_kg: number }>
  total_alertas: number
}

interface ProductoStock {
  id: number; codigo: string; nombre: string; unidad_medida: string
  stock_actual: number; stock_minimo: number; stock_maximo: number
  precio_venta: number
}

interface MaterialStock {
  id: number; codigo: string; nombre: string; tipo: string; marca: string; color: string
  stock_actual_kg: number; stock_minimo_kg: number; stock_maximo_kg: number; costo_por_kg: number
}

interface MovimientoForm {
  tipo: 'entrada' | 'salida' | 'ajuste' | 'merma'
  producto_id?: number
  material_id?: number
  cantidad: string
  motivo: string
}

export default function Inventario() {
  const [alertas, setAlertas] = useState<AlertaStock | null>(null)
  const [productos, setProductos] = useState<ProductoStock[]>([])
  const [materiales, setMateriales] = useState<MaterialStock[]>([])
  const [activeTab, setActiveTab] = useState<'alertas' | 'productos' | 'materiales'>('alertas')
  const [showMovModal, setShowMovModal] = useState(false)
  const [movForm, setMovForm] = useState<MovimientoForm>({ tipo: 'entrada', cantidad: '', motivo: '' })
  const [savingMov, setSavingMov] = useState(false)

  useEffect(() => { loadAlertas() }, [])
  useEffect(() => {
    if (activeTab === 'productos') loadProductos()
    if (activeTab === 'materiales') loadMateriales()
  }, [activeTab])

  const loadAlertas = async () => {
    try {
      const response = await api.get('/inventario/alertas')
      setAlertas(response.data)
    } catch { toast.error('Error al cargar alertas') }
  }

  const loadProductos = async () => {
    try {
      const response = await api.get('/inventario/productos')
      setProductos(response.data)
    } catch { toast.error('Error al cargar productos') }
  }

  const loadMateriales = async () => {
    try {
      const response = await api.get('/inventario/materiales')
      setMateriales(response.data)
    } catch { toast.error('Error al cargar materiales') }
  }

  const openMovModal = (tipo: 'entrada' | 'salida' | 'ajuste' | 'merma', productoId?: number, materialId?: number) => {
    setMovForm({ tipo, producto_id: productoId, material_id: materialId, cantidad: '', motivo: '' })
    setShowMovModal(true)
  }

  const handleSaveMovimiento = async () => {
    if (!movForm.cantidad || parseFloat(movForm.cantidad) <= 0) {
      toast.error('Ingresa una cantidad válida')
      return
    }
    if (!movForm.motivo.trim()) {
      toast.error('Ingresa un motivo')
      return
    }
    setSavingMov(true)
    try {
      await api.post('/inventario/movimientos', {
        tipo: movForm.tipo,
        producto_id: movForm.producto_id || null,
        material_id: movForm.material_id || null,
        cantidad: parseFloat(movForm.cantidad),
        motivo: movForm.motivo
      })
      toast.success('Movimiento registrado')
      setShowMovModal(false)
      loadAlertas()
      if (activeTab === 'productos') loadProductos()
      if (activeTab === 'materiales') loadMateriales()
    } catch { toast.error('Error al registrar movimiento') }
    finally { setSavingMov(false) }
  }

  const getStockColor = (actual: number, minimo: number) => {
    if (actual <= 0) return 'text-red-700 font-bold'
    if (actual <= minimo) return 'text-red-600 font-semibold'
    if (actual <= minimo * 1.5) return 'text-orange-600 font-semibold'
    return 'text-green-700 font-semibold'
  }

  const getStockBar = (actual: number, maximo: number) => {
    const pct = Math.min(100, Math.round((actual / (maximo || 1)) * 100))
    const color = pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-orange-400' : 'bg-green-500'
    return (
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <button
          onClick={() => { loadAlertas(); if (activeTab === 'productos') loadProductos(); if (activeTab === 'materiales') loadMateriales() }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {([
          { key: 'alertas', label: `Alertas${alertas?.total_alertas ? ` (${alertas.total_alertas})` : ''}`, icon: AlertTriangle, activeClass: 'border-red-500 text-red-600' },
          { key: 'productos', label: 'Productos', icon: Package, activeClass: 'border-blue-500 text-blue-600' },
          { key: 'materiales', label: 'Materiales', icon: Factory, activeClass: 'border-green-500 text-green-600' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? tab.activeClass : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'alertas' && (
        <div className="space-y-4">
          {alertas?.productos_bajos && alertas.productos_bajos.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b bg-red-50">
                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos con Stock Bajo ({alertas.productos_bajos.length})
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alertas.productos_bajos.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.codigo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{p.stock_actual}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.stock_minimo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => openMovModal('entrada', p.id)} className="flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-medium">
                          <ArrowUp className="h-3 w-3" /> Entrada
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {alertas?.materiales_bajos && alertas.materiales_bajos.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b bg-orange-50">
                <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Materiales con Stock Bajo ({alertas.materiales_bajos.length})
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual (KG)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mínimo (KG)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alertas.materiales_bajos.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.codigo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{m.tipo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{m.stock_actual_kg} kg</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.stock_minimo_kg} kg</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => openMovModal('entrada', undefined, m.id)} className="flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-medium">
                          <ArrowUp className="h-3 w-3" /> Entrada
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {alertas?.total_alertas === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-800 font-medium">¡Todo bien! No hay alertas de inventario.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'productos' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Stock de Productos Terminados</h3>
            <button onClick={() => openMovModal('entrada')} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
              <Plus className="h-4 w-4" /> Registrar Movimiento
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mín/Máx</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nivel</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.codigo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.unidad_medida}</td>
                  <td className={`px-4 py-3 text-sm text-right ${getStockColor(p.stock_actual, p.stock_minimo)}`}>{p.stock_actual}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 text-right">{p.stock_minimo} / {p.stock_maximo}</td>
                  <td className="px-4 py-3 text-center">{getStockBar(p.stock_actual, p.stock_maximo)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">${p.precio_venta?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openMovModal('entrada', p.id)} title="Entrada" className="text-green-600 hover:text-green-800"><ArrowUp className="h-4 w-4" /></button>
                      <button onClick={() => openMovModal('salida', p.id)} title="Salida" className="text-red-500 hover:text-red-700"><ArrowDown className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No hay productos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'materiales' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Stock de Materiales (Resinas y Aditivos)</h3>
            <button onClick={() => openMovModal('entrada', undefined, undefined)} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
              <Plus className="h-4 w-4" /> Registrar Movimiento
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock (KG)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mín/Máx (KG)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nivel</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">$/KG</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materiales.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.codigo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 capitalize">{m.tipo}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{m.color || '-'}</td>
                  <td className={`px-4 py-3 text-sm text-right ${getStockColor(m.stock_actual_kg, m.stock_minimo_kg)}`}>{m.stock_actual_kg} kg</td>
                  <td className="px-4 py-3 text-xs text-gray-500 text-right">{m.stock_minimo_kg} / {m.stock_maximo_kg}</td>
                  <td className="px-4 py-3 text-center">{getStockBar(m.stock_actual_kg, m.stock_maximo_kg)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">${m.costo_por_kg?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openMovModal('entrada', undefined, m.id)} title="Entrada" className="text-green-600 hover:text-green-800"><ArrowUp className="h-4 w-4" /></button>
                      <button onClick={() => openMovModal('salida', undefined, m.id)} title="Salida" className="text-red-500 hover:text-red-700"><ArrowDown className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {materiales.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No hay materiales registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showMovModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowMovModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Movimiento de Inventario</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
                  <select
                    value={movForm.tipo}
                    onChange={e => setMovForm(f => ({ ...f, tipo: e.target.value as MovimientoForm['tipo'] }))}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                    <option value="ajuste">Ajuste de inventario</option>
                    <option value="merma">Merma / Pérdida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad {movForm.material_id !== undefined && !movForm.producto_id ? '(KG)' : '(piezas)'}
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={movForm.cantidad}
                    onChange={e => setMovForm(f => ({ ...f, cantidad: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Referencia</label>
                  <textarea
                    value={movForm.motivo}
                    onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    rows={2}
                    placeholder="Ej: Recepción OC-2024-0001, ajuste inventario físico..."
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setShowMovModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMovimiento}
                  disabled={savingMov}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingMov ? 'Guardando...' : 'Guardar Movimiento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
