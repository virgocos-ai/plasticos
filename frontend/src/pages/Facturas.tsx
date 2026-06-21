import { useEffect, useState } from 'react'
import { Plus, Search, FileText, Send, XCircle, X, Trash2 } from 'lucide-react'
import { SkeletonTable } from '../components/Skeleton'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Factura {
  id: number; serie: string; folio: number; uuid: string
  fecha_emision: string; cliente: { razon_social: string; rfc: string }
  subtotal: number; impuesto_trasladado: number; total: number
  estado: 'borrador' | 'timbrada' | 'cancelada'; estado_sat: string
}

interface Cliente { id: number; razon_social: string; rfc: string; uso_cfdi: string; regimen_fiscal: string }
interface Producto { id: number; codigo: string; nombre: string; precio_venta: number; clave_sat: string; unidad_sat: string }

interface FacturaDetalleForm {
  producto_id: string; cantidad: string; precio_unitario: string; descuento: string; tasa_cuota: string
  descripcion: string; clave_prod_serv: string; clave_unidad: string
}

interface FacturaForm {
  cliente_id: string; serie: string; fecha_emision: string
  forma_pago: string; metodo_pago: string; moneda: string
  detalles: FacturaDetalleForm[]
}

const emptyDetalle = (): FacturaDetalleForm => ({
  producto_id: '', cantidad: '1', precio_unitario: '', descuento: '0',
  tasa_cuota: '0.16', descripcion: '', clave_prod_serv: '30311507', clave_unidad: 'H87'
})

const emptyForm = (): FacturaForm => ({
  cliente_id: '', serie: 'A', fecha_emision: new Date().toISOString().split('T')[0],
  forma_pago: '03', metodo_pago: 'PUE', moneda: 'MXN',
  detalles: [emptyDetalle()]
})

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FacturaForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  useEffect(() => { loadCatalogos() }, [])
  useEffect(() => {
    const timer = setTimeout(() => loadFacturas(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  const loadFacturas = async (q = '') => {
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      const r = await api.get(`/facturas?${params}`)
      setFacturas(r.data.data ?? r.data)
    } catch { toast.error('Error al cargar facturas') }
    finally { setLoading(false) }
  }

  const loadCatalogos = async () => {
    try {
      const [c, p] = await Promise.all([api.get('/clientes'), api.get('/productos?activo=1')])
      setClientes(c.data.data ?? c.data)
      setProductos(p.data.data ?? p.data)
    } catch { /* silencioso */ }
  }

  const calcTotales = () => {
    let subtotal = 0; let iva = 0
    form.detalles.forEach(d => {
      const cant = parseFloat(d.cantidad) || 0
      const precio = parseFloat(d.precio_unitario) || 0
      const desc = parseFloat(d.descuento) || 0
      const tasa = parseFloat(d.tasa_cuota) || 0.16
      const importe = cant * precio - desc
      subtotal += importe
      iva += importe * tasa
    })
    return { subtotal, iva, total: subtotal + iva }
  }

  const { subtotal, iva, total } = calcTotales()

  const handleProductoChange = (idx: number, productoId: string) => {
    const prod = productos.find(p => p.id === parseInt(productoId))
    const updated = form.detalles.map((d, i) => i === idx ? {
      ...d,
      producto_id: productoId,
      precio_unitario: prod?.precio_venta?.toString() || '',
      descripcion: prod?.nombre || '',
      clave_prod_serv: prod?.clave_sat || '30311507',
      clave_unidad: prod?.unidad_sat || 'H87'
    } : d)
    setForm(f => ({ ...f, detalles: updated }))
  }

  const updateDetalle = (idx: number, field: string, value: string) => {
    setForm(f => ({ ...f, detalles: f.detalles.map((d, i) => i === idx ? { ...d, [field]: value } : d) }))
  }

  const handleSave = async () => {
    if (!form.cliente_id) { toast.error('Selecciona un cliente'); return }
    if (form.detalles.some(d => !d.producto_id || !d.cantidad || !d.precio_unitario)) {
      toast.error('Completa todos los conceptos'); return
    }
    setSaving(true)
    try {
      await api.post('/facturas', {
        cliente_id: parseInt(form.cliente_id),
        serie: form.serie,
        fecha_emision: form.fecha_emision,
        forma_pago: form.forma_pago,
        metodo_pago: form.metodo_pago,
        moneda: form.moneda,
        tipo_comprobante: 'I',
        usuario_id: 1,
        detalles: form.detalles.map(d => ({
          producto_id: parseInt(d.producto_id),
          descripcion: d.descripcion,
          clave_prod_serv: d.clave_prod_serv,
          clave_unidad: d.clave_unidad,
          cantidad: parseFloat(d.cantidad),
          precio_unitario: parseFloat(d.precio_unitario),
          descuento: parseFloat(d.descuento) || 0,
          tasa_cuota: parseFloat(d.tasa_cuota),
          importe: parseFloat(d.cantidad) * parseFloat(d.precio_unitario) - (parseFloat(d.descuento) || 0)
        }))
      })
      toast.success('Factura creada en borrador')
      setShowModal(false)
      setForm(emptyForm())
      loadFacturas()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al crear factura')
    } finally { setSaving(false) }
  }

  const handleTimbrar = async (id: number) => {
    try {
      await api.post(`/facturas/${id}/timbrar`)
      toast.success('Factura timbrada correctamente')
      loadFacturas()
    } catch { toast.error('Error al timbrar') }
  }

  const handleCancelar = async (id: number) => {
    if (!confirm('¿Confirmas la cancelación de esta factura ante el SAT?')) return
    try {
      await api.post(`/facturas/${id}/cancelar`, { motivo: '01' })
      toast.success('Factura cancelada')
      loadFacturas()
    } catch { toast.error('Error al cancelar') }
  }

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      timbrada: 'bg-green-100 text-green-800', borrador: 'bg-gray-100 text-gray-700', cancelada: 'bg-red-100 text-red-800'
    }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-700'}`}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
  }

  const filtered = facturas.filter(f =>
    !search || `${f.serie}-${f.folio}`.includes(search) || f.cliente?.razon_social?.toLowerCase().includes(search.toLowerCase()) || f.uuid?.includes(search)
  )

  if (loading) return <SkeletonTable rows={6} cols={6} />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Facturas CFDI 4.0</h1>
        <button onClick={() => { setForm(emptyForm()); setShowModal(true) }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
          <Plus className="h-4 w-4" /> Nueva Factura
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow">
        <Search className="h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Buscar por folio, cliente o UUID..." className="flex-1 outline-none text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IVA</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-700">
                  {f.serie}-{f.folio}
                  {f.uuid && <div className="text-xs text-gray-400 font-normal">UUID: {f.uuid.slice(0, 13)}...</div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(f.fecha_emision).toLocaleDateString('es-MX')}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {f.cliente?.razon_social}
                  <div className="text-xs text-gray-400">{f.cliente?.rfc}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">${f.subtotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${f.impuesto_trasladado?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${f.total?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 whitespace-nowrap text-center">{getEstadoBadge(f.estado)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button title="Ver XML" className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"><FileText className="h-4 w-4" /></button>
                    {f.estado === 'borrador' && (
                      <button onClick={() => handleTimbrar(f.id)} title="Timbrar" className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"><Send className="h-4 w-4" /></button>
                    )}
                    {f.estado === 'timbrada' && (
                      <button onClick={() => handleCancelar(f.id)} title="Cancelar" className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"><XCircle className="h-4 w-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No hay facturas{search ? ' que coincidan' : ' registradas'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen p-4 pt-6">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Nueva Factura CFDI 4.0</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                    <select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                      <option value="">Seleccionar cliente</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social} ({c.rfc})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
                    <input type="text" value={form.serie} onChange={e => setForm(f => ({ ...f, serie: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2 text-sm" maxLength={10} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión</label>
                    <input type="date" value={form.fecha_emision} onChange={e => setForm(f => ({ ...f, fecha_emision: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
                    <select value={form.forma_pago} onChange={e => setForm(f => ({ ...f, forma_pago: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                      <option value="01">01 - Efectivo</option>
                      <option value="03">03 - Transferencia</option>
                      <option value="04">04 - Tarjeta crédito</option>
                      <option value="28">28 - Tarjeta débito</option>
                      <option value="99">99 - Por definir</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                    <select value={form.metodo_pago} onChange={e => setForm(f => ({ ...f, metodo_pago: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                      <option value="PUE">PUE - Pago en una sola exhibición</option>
                      <option value="PPD">PPD - Pago en parcialidades o diferido</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Conceptos *</label>
                    <button onClick={() => setForm(f => ({ ...f, detalles: [...f.detalles, emptyDetalle()] }))} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"><Plus className="h-3 w-3"/> Agregar concepto</button>
                  </div>
                  <div className="space-y-2">
                    {form.detalles.map((det, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-5">
                            <label className="text-xs text-gray-500">Producto</label>
                            <select value={det.producto_id} onChange={e => handleProductoChange(idx, e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs mt-0.5">
                              <option value="">Seleccionar</option>
                              {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500">Cantidad</label>
                            <input type="number" min="0.001" step="0.001" value={det.cantidad} onChange={e => updateDetalle(idx, 'cantidad', e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs mt-0.5" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500">Precio Unit.</label>
                            <input type="number" min="0" step="0.01" value={det.precio_unitario} onChange={e => updateDetalle(idx, 'precio_unitario', e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs mt-0.5" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500">IVA</label>
                            <select value={det.tasa_cuota} onChange={e => updateDetalle(idx, 'tasa_cuota', e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs mt-0.5">
                              <option value="0.16">16%</option>
                              <option value="0.08">8%</option>
                              <option value="0">Exento</option>
                            </select>
                          </div>
                          <div className="col-span-1 flex items-end justify-center pb-1">
                            {form.detalles.length > 1 && (
                              <button onClick={() => setForm(f => ({ ...f, detalles: f.detalles.filter((_, i) => i !== idx) }))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Descripción para CFDI</label>
                          <input type="text" value={det.descripcion} onChange={e => updateDetalle(idx, 'descripcion', e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs mt-0.5" placeholder="Descripción del producto/servicio" />
                        </div>
                        <div className="text-right text-xs text-gray-600 font-medium">
                          Importe: ${((parseFloat(det.cantidad)||0) * (parseFloat(det.precio_unitario)||0) - (parseFloat(det.descuento)||0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-gray-600"><span>IVA:</span><span>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between font-bold text-gray-900 text-base border-t border-blue-200 pt-1 mt-1"><span>Total:</span><span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Crear Borrador'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
