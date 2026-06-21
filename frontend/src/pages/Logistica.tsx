import { useEffect, useState } from 'react'
import { Plus, Search, Truck, Package, MapPin, CheckCircle, XCircle, RefreshCw, Trash2, Eye } from 'lucide-react'
import { SkeletonTable } from '../components/Skeleton'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

type TabType = 'envios' | 'transportistas'

interface Envio {
  id: number
  folio: string
  fecha_programada: string
  fecha_real?: string
  estado: 'pendiente' | 'preparando' | 'en_ruta' | 'entregado' | 'devuelto' | 'cancelado'
  peso_total_kg?: number
  bultos?: number
  costo_envio?: number
  numero_remision?: string
  nombre_receptor?: string
  observaciones?: string
  cliente: { razon_social: string; rfc: string }
  transportista?: { nombre: string; placa: string; tipo: string }
  detalles?: EnvioDetalle[]
}

interface EnvioDetalle {
  id?: number
  producto_id: string | number
  lote_id?: string | number
  cantidad: number
  peso_kg?: number
  observaciones?: string
  producto?: { codigo: string; nombre: string }
}

interface Transportista {
  id: number
  codigo: string
  nombre: string
  tipo: 'propio' | 'tercero'
  tipo_vehiculo?: string
  placa?: string
  marca_vehiculo?: string
  modelo_vehiculo?: string
  capacidad_kg?: number
  telefono?: string
  licencia_vencimiento?: string
  activo: boolean
}

interface Cliente { id: number; razon_social: string }
interface Producto { id: number; codigo: string; nombre: string }

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pendiente:   { label: 'Pendiente',   color: 'bg-gray-100 text-gray-700',   icon: Package },
  preparando:  { label: 'Preparando',  color: 'bg-yellow-100 text-yellow-800', icon: Package },
  en_ruta:     { label: 'En ruta',     color: 'bg-blue-100 text-blue-800',   icon: Truck },
  entregado:   { label: 'Entregado',   color: 'bg-green-100 text-green-800', icon: CheckCircle },
  devuelto:    { label: 'Devuelto',    color: 'bg-orange-100 text-orange-800', icon: RefreshCw },
  cancelado:   { label: 'Cancelado',   color: 'bg-red-100 text-red-800',     icon: XCircle },
}

const NEXT_ESTADO: Record<string, string> = {
  pendiente: 'preparando',
  preparando: 'en_ruta',
  en_ruta: 'entregado',
}

export default function Logistica() {
  const [tab, setTab] = useState<TabType>('envios')
  const [envios, setEnvios] = useState<Envio[]>([])
  const [transportistas, setTransportistas] = useState<Transportista[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState<Envio | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; tipo: TabType } | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [detalles, setDetalles] = useState<EnvioDetalle[]>([{ producto_id: '', cantidad: 1 }])

  const [envioForm, setEnvioForm] = useState({
    cliente_id: '', transportista_id: '', fecha_programada: '',
    direccion_calle: '', direccion_colonia: '', direccion_ciudad: '',
    direccion_estado_mx: '', direccion_cp: '',
    peso_total_kg: '', bultos: '', costo_envio: '',
    numero_remision: '', observaciones: ''
  })

  const [tForm, setTForm] = useState({
    codigo: '', nombre: '', tipo: 'propio', tipo_vehiculo: '', placa: '',
    marca_vehiculo: '', modelo_vehiculo: '', anio_vehiculo: '',
    capacidad_kg: '', telefono: '', licencia_numero: '',
    licencia_tipo: '', licencia_vencimiento: '', activo: true
  })

  useEffect(() => {
    loadAll()
    api.get('/clientes').then(r => setClientes(r.data.data ?? r.data)).catch(() => {})
    api.get('/productos').then(r => setProductos(r.data)).catch(() => {})
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [e, t] = await Promise.all([
        api.get('/logistica/envios'),
        api.get('/logistica/transportistas')
      ])
      setEnvios(e.data)
      setTransportistas(t.data)
    } catch { toast.error('Error al cargar datos') }
    finally { setLoading(false) }
  }

  const openCreateEnvio = () => {
    setEditId(null)
    setEnvioForm({ cliente_id: '', transportista_id: '', fecha_programada: '', direccion_calle: '', direccion_colonia: '', direccion_ciudad: '', direccion_estado_mx: '', direccion_cp: '', peso_total_kg: '', bultos: '', costo_envio: '', numero_remision: '', observaciones: '' })
    setDetalles([{ producto_id: '', cantidad: 1 }])
    setShowModal(true)
  }

  const openCreateTransportista = () => {
    setEditId(null)
    setTForm({ codigo: '', nombre: '', tipo: 'propio', tipo_vehiculo: '', placa: '', marca_vehiculo: '', modelo_vehiculo: '', anio_vehiculo: '', capacidad_kg: '', telefono: '', licencia_numero: '', licencia_tipo: '', licencia_vencimiento: '', activo: true })
    setShowModal(true)
  }

  const openDetail = async (envio: Envio) => {
    try {
      const r = await api.get(`/logistica/envios/${envio.id}`)
      setShowDetailModal(r.data)
    } catch { toast.error('Error al cargar detalle') }
  }

  const handleSubmitEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...envioForm,
        cliente_id: Number(envioForm.cliente_id),
        transportista_id: envioForm.transportista_id ? Number(envioForm.transportista_id) : null,
        peso_total_kg: envioForm.peso_total_kg ? Number(envioForm.peso_total_kg) : null,
        bultos: envioForm.bultos ? Number(envioForm.bultos) : null,
        costo_envio: envioForm.costo_envio ? Number(envioForm.costo_envio) : null,
        detalles: detalles.filter(d => d.producto_id && d.cantidad > 0).map(d => ({
          producto_id: Number(d.producto_id),
          cantidad: Number(d.cantidad),
          peso_kg: d.peso_kg ? Number(d.peso_kg) : null,
        }))
      }
      if (editId) {
        await api.put(`/logistica/envios/${editId}`, payload)
        toast.success('Envío actualizado')
      } else {
        await api.post('/logistica/envios', payload)
        toast.success('Envío creado')
      }
      setShowModal(false)
      loadAll()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleSubmitTransportista = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...tForm,
        capacidad_kg: tForm.capacidad_kg ? Number(tForm.capacidad_kg) : null,
        anio_vehiculo: tForm.anio_vehiculo ? Number(tForm.anio_vehiculo) : null,
      }
      if (editId) {
        await api.put(`/logistica/transportistas/${editId}`, payload)
        toast.success('Transportista actualizado')
      } else {
        await api.post('/logistica/transportistas', payload)
        toast.success('Transportista creado')
      }
      setShowModal(false)
      loadAll()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleAvanzarEstado = async (envio: Envio) => {
    const next = NEXT_ESTADO[envio.estado]
    if (!next) return
    try {
      await api.put(`/logistica/envios/${envio.id}/estado`, { estado: next })
      toast.success(`Envío marcado como: ${ESTADO_CONFIG[next].label}`)
      loadAll()
    } catch { toast.error('Error al cambiar estado') }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      if (confirmDelete.tipo === 'envios') await api.delete(`/logistica/envios/${confirmDelete.id}`)
      else await api.delete(`/logistica/transportistas/${confirmDelete.id}`)
      toast.success('Eliminado correctamente')
      loadAll()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar')
    } finally { setConfirmDelete(null) }
  }

  const addDetalle = () => setDetalles([...detalles, { producto_id: '', cantidad: 1 }])
  const removeDetalle = (i: number) => setDetalles(detalles.filter((_, idx) => idx !== i))
  const updDetalle = (i: number, k: string, v: string | number) => {
    const nd = [...detalles]; (nd[i] as any)[k] = v; setDetalles(nd)
  }

  const filteredEnvios = envios.filter(e =>
    e.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cliente?.razon_social.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredTransportistas = transportistas.filter(t =>
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Logística y Distribución</h1>
        <button
          onClick={() => { tab === 'envios' ? openCreateEnvio() : openCreateTransportista() }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> {tab === 'envios' ? 'Nuevo Envío' : 'Nuevo Transportista'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([['envios', 'Envíos', Truck], ['transportistas', 'Transportistas', MapPin]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow">
        <Search className="h-4 w-4 text-gray-400" />
        <input placeholder="Buscar..." className="flex-1 outline-none text-sm"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? <SkeletonTable rows={5} cols={6} /> : tab === 'envios' ? (
        /* ── Tabla Envíos ── */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">F. Programada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transportista</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carga</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEnvios.map(envio => {
                const conf = ESTADO_CONFIG[envio.estado]
                const Icon = conf.icon
                const next = NEXT_ESTADO[envio.estado]
                return (
                  <tr key={envio.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {envio.folio}
                      {envio.numero_remision && <p className="text-xs text-gray-400">Rem: {envio.numero_remision}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{envio.cliente?.razon_social}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(envio.fecha_programada + 'T00:00:00').toLocaleDateString('es-MX')}
                      {envio.fecha_real && (
                        <p className="text-xs text-green-600">Entregado: {new Date(envio.fecha_real + 'T00:00:00').toLocaleDateString('es-MX')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {envio.transportista ? (
                        <div>
                          <p>{envio.transportista.nombre}</p>
                          {envio.transportista.placa && <p className="text-xs text-gray-400 font-mono">{envio.transportista.placa}</p>}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {envio.peso_total_kg && <p>{envio.peso_total_kg} kg</p>}
                      {envio.bultos && <p className="text-xs text-gray-400">{envio.bultos} bultos</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${conf.color}`}>
                        <Icon className="h-3 w-3" /> {conf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(envio)} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Ver detalle">
                          <Eye className="h-4 w-4" />
                        </button>
                        {next && (
                          <button onClick={() => handleAvanzarEstado(envio)}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            title={`Avanzar a: ${ESTADO_CONFIG[next].label}`}>
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        {!['en_ruta', 'entregado'].includes(envio.estado) && (
                          <button onClick={() => setConfirmDelete({ id: envio.id, tipo: 'envios' })}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredEnvios.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No hay envíos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Tabla Transportistas ── */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código / Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransportistas.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{t.nombre}</p>
                    <p className="text-xs text-gray-400 font-mono">{t.codigo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.tipo === 'propio' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {t.tipo === 'propio' ? 'Propio' : 'Tercero'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {t.tipo_vehiculo && <p>{t.tipo_vehiculo}</p>}
                    {t.placa && <p className="text-xs font-mono text-gray-500">{t.placa}</p>}
                    {t.marca_vehiculo && <p className="text-xs text-gray-400">{t.marca_vehiculo} {t.modelo_vehiculo}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.capacidad_kg ? `${t.capacidad_kg.toLocaleString('es-MX')} kg` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.telefono || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setConfirmDelete({ id: t.id, tipo: 'transportistas' })}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransportistas.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No hay transportistas registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar este registro?"
        confirmText="Eliminar"
        type="danger"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />

      {/* Modal detalle envío */}
      <Modal isOpen={showDetailModal !== null} onClose={() => setShowDetailModal(null)} title={`Envío ${showDetailModal?.folio}`} size="lg">
        {showDetailModal && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Cliente</p><p className="font-medium">{showDetailModal.cliente?.razon_social}</p></div>
              <div><p className="text-xs text-gray-500">Estado</p>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${ESTADO_CONFIG[showDetailModal.estado]?.color}`}>
                  {ESTADO_CONFIG[showDetailModal.estado]?.label}
                </span>
              </div>
              <div><p className="text-xs text-gray-500">F. Programada</p><p>{new Date(showDetailModal.fecha_programada + 'T00:00:00').toLocaleDateString('es-MX')}</p></div>
              {showDetailModal.fecha_real && <div><p className="text-xs text-gray-500">F. Entrega Real</p><p className="text-green-700 font-medium">{new Date(showDetailModal.fecha_real + 'T00:00:00').toLocaleDateString('es-MX')}</p></div>}
              {showDetailModal.transportista && <div><p className="text-xs text-gray-500">Transportista</p><p>{showDetailModal.transportista.nombre} {showDetailModal.transportista.placa && `(${showDetailModal.transportista.placa})`}</p></div>}
              {showDetailModal.nombre_receptor && <div><p className="text-xs text-gray-500">Receptor</p><p>{showDetailModal.nombre_receptor}</p></div>}
            </div>
            {showDetailModal.detalles && showDetailModal.detalles.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 mb-2">Productos</p>
                <table className="w-full text-xs">
                  <thead><tr className="bg-gray-50"><th className="px-2 py-1 text-left">Producto</th><th className="px-2 py-1 text-right">Cantidad</th><th className="px-2 py-1 text-right">Peso (kg)</th></tr></thead>
                  <tbody>{showDetailModal.detalles.map((d, i) => (
                    <tr key={i} className="border-t"><td className="px-2 py-1">{d.producto?.nombre || d.producto_id}</td><td className="px-2 py-1 text-right">{Number(d.cantidad).toLocaleString('es-MX')}</td><td className="px-2 py-1 text-right">{d.peso_kg || '—'}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {showDetailModal.observaciones && <div><p className="text-xs text-gray-500">Observaciones</p><p>{showDetailModal.observaciones}</p></div>}
          </div>
        )}
      </Modal>

      {/* Modal crear envío */}
      <Modal isOpen={showModal && tab === 'envios'} onClose={() => setShowModal(false)} title="Nuevo Envío" size="xl">
        <form onSubmit={handleSubmitEnvio} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select required className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={envioForm.cliente_id} onChange={e => setEnvioForm(f => ({ ...f, cliente_id: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transportista</label>
              <select className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={envioForm.transportista_id} onChange={e => setEnvioForm(f => ({ ...f, transportista_id: e.target.value }))}>
                <option value="">Sin asignar</option>
                {transportistas.filter(t => t.activo).map(t => <option key={t.id} value={t.id}>{t.nombre} {t.placa ? `(${t.placa})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha programada *</label>
              <input type="date" required className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={envioForm.fecha_programada} onChange={e => setEnvioForm(f => ({ ...f, fecha_programada: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de entrega</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm mb-2"
                placeholder="Calle y número" value={envioForm.direccion_calle}
                onChange={e => setEnvioForm(f => ({ ...f, direccion_calle: e.target.value }))} />
              <div className="grid grid-cols-3 gap-2">
                <input className="border border-gray-300 rounded-md p-2 text-sm" placeholder="Ciudad"
                  value={envioForm.direccion_ciudad} onChange={e => setEnvioForm(f => ({ ...f, direccion_ciudad: e.target.value }))} />
                <input className="border border-gray-300 rounded-md p-2 text-sm" placeholder="Estado"
                  value={envioForm.direccion_estado_mx} onChange={e => setEnvioForm(f => ({ ...f, direccion_estado_mx: e.target.value }))} />
                <input className="border border-gray-300 rounded-md p-2 text-sm" placeholder="CP" maxLength={5}
                  value={envioForm.direccion_cp} onChange={e => setEnvioForm(f => ({ ...f, direccion_cp: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 content-start">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Peso total (kg)</label>
                <input type="number" step="0.01" className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={envioForm.peso_total_kg} onChange={e => setEnvioForm(f => ({ ...f, peso_total_kg: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Bultos</label>
                <input type="number" className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={envioForm.bultos} onChange={e => setEnvioForm(f => ({ ...f, bultos: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">No. Remisión</label>
                <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={envioForm.numero_remision} onChange={e => setEnvioForm(f => ({ ...f, numero_remision: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Costo envío ($)</label>
                <input type="number" step="0.01" className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={envioForm.costo_envio} onChange={e => setEnvioForm(f => ({ ...f, costo_envio: e.target.value }))} /></div>
            </div>
          </div>

          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Productos a enviar</label>
              <button type="button" onClick={addDetalle} className="text-sm text-blue-600 hover:text-blue-800">+ Agregar</button>
            </div>
            {detalles.map((d, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <select className="border border-gray-300 rounded-md p-2 text-sm"
                  value={String(d.producto_id)} onChange={e => updDetalle(i, 'producto_id', e.target.value)}>
                  <option value="">Producto...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <input type="number" placeholder="Cantidad" className="border border-gray-300 rounded-md p-2 text-sm"
                  value={d.cantidad} onChange={e => updDetalle(i, 'cantidad', e.target.value)} />
                <div className="flex gap-2">
                  <input type="number" step="0.01" placeholder="Peso (kg)" className="border border-gray-300 rounded-md p-2 text-sm flex-1"
                    value={d.peso_kg || ''} onChange={e => updDetalle(i, 'peso_kg', e.target.value)} />
                  <button type="button" onClick={() => removeDetalle(i)} className="text-red-500 px-2">×</button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea rows={2} className="block w-full border border-gray-300 rounded-md p-2 text-sm"
              value={envioForm.observaciones} onChange={e => setEnvioForm(f => ({ ...f, observaciones: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear Envío'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal crear transportista */}
      <Modal isOpen={showModal && tab === 'transportistas'} onClose={() => setShowModal(false)} title="Nuevo Transportista" size="lg">
        <form onSubmit={handleSubmitTransportista} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input required className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.codigo} onChange={e => setTForm(f => ({ ...f, codigo: e.target.value }))} placeholder="TRP-001" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Operador *</label>
              <input required className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.nombre} onChange={e => setTForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.tipo} onChange={e => setTForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="propio">Flota propia</option>
                <option value="tercero">Fletero / Tercero</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.telefono} onChange={e => setTForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de vehículo</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.tipo_vehiculo} onChange={e => setTForm(f => ({ ...f, tipo_vehiculo: e.target.value }))} placeholder="Camión 3.5 ton" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.placa} onChange={e => setTForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))} placeholder="ABC-123-X" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (kg)</label>
              <input type="number" className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.capacidad_kg} onChange={e => setTForm(f => ({ ...f, capacidad_kg: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Licencia</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.licencia_numero} onChange={e => setTForm(f => ({ ...f, licencia_numero: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo licencia</label>
              <input className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.licencia_tipo} onChange={e => setTForm(f => ({ ...f, licencia_tipo: e.target.value }))} placeholder="E, Federal..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento licencia</label>
              <input type="date" className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={tForm.licencia_vencimiento} onChange={e => setTForm(f => ({ ...f, licencia_vencimiento: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
