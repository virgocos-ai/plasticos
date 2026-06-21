import { useEffect, useState } from 'react'
import { Plus, Search, Copy, ToggleLeft, ToggleRight, Trash2, Edit2, ChevronDown, ChevronRight, Thermometer, Gauge } from 'lucide-react'
import { SkeletonTable } from '../components/Skeleton'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

interface Receta {
  id: number
  codigo: string
  nombre: string
  activa: boolean
  version: number
  ciclo_total_seg?: number
  peso_pieza_gr?: number
  piezas_por_ciclo?: number
  producto?: { codigo: string; nombre: string }
  material?: { codigo: string; nombre: string; tipo: string }
  molde?: { codigo: string; nombre: string; numero_cavidades: number }
  maquina?: { codigo: string; nombre: string; capacidad_ton: number }
  // temperaturas
  temp_zona1?: number; temp_zona2?: number; temp_zona3?: number
  temp_zona4?: number; temp_zona5?: number; temp_zona6?: number
  temp_boquilla?: number; temp_molde_fijo?: number; temp_molde_movil?: number
  // inyección
  vel_inyeccion_pct?: number; presion_inyeccion_bar?: number
  presion_sostenimiento_bar?: number; tiempo_inyeccion_seg?: number; tiempo_sostenimiento_seg?: number
  // enfriamiento
  tiempo_enfriamiento_seg?: number; temp_agua_enfriamiento_c?: number
  // plastificación
  tiempo_plastificacion_seg?: number; contrapresion_bar?: number
  rpm_husillo?: number; colchon_mm?: number; posicion_disparo_mm?: number
  peso_disparo_gr?: number
}

interface Producto { id: number; codigo: string; nombre: string }
interface Material { id: number; codigo: string; nombre: string }
interface Molde { id: number; codigo: string; nombre: string }
interface Maquina { id: number; codigo: string; nombre: string }

const emptyForm: Record<string, string | number | boolean> = {
  codigo: '', nombre: '', producto_id: '', material_id: '', molde_id: '', maquina_id: '',
  temp_zona1: '', temp_zona2: '', temp_zona3: '', temp_zona4: '', temp_zona5: '', temp_zona6: '',
  temp_boquilla: '', temp_molde_fijo: '', temp_molde_movil: '',
  vel_inyeccion_pct: '', presion_inyeccion_bar: '', presion_sostenimiento_bar: '',
  tiempo_inyeccion_seg: '', tiempo_sostenimiento_seg: '',
  tiempo_enfriamiento_seg: '', temp_agua_enfriamiento_c: '',
  tiempo_plastificacion_seg: '', contrapresion_bar: '', rpm_husillo: '',
  colchon_mm: '', posicion_disparo_mm: '',
  ciclo_total_seg: '', peso_disparo_gr: '', peso_pieza_gr: '', piezas_por_ciclo: '',
  observaciones: '', activa: true
}

export default function RecetasInyeccion() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({ ...emptyForm })
  const [productos, setProductos] = useState<Producto[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [moldes, setMoldes] = useState<Molde[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])

  useEffect(() => {
    loadRecetas()
    api.get('/productos').then(r => setProductos(r.data)).catch(() => {})
    api.get('/materiales').then(r => setMateriales(r.data)).catch(() => {})
    api.get('/moldes').then(r => setMoldes(r.data)).catch(() => {})
    api.get('/maquinas').then(r => setMaquinas(r.data)).catch(() => {})
  }, [])

  const loadRecetas = async () => {
    try {
      const r = await api.get('/recetas')
      setRecetas(r.data)
    } catch { toast.error('Error al cargar recetas') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditId(null); setFormData({ ...emptyForm }); setShowModal(true) }

  const openEdit = (r: Receta) => {
    setEditId(r.id)
    const fd: Record<string, string | number | boolean> = { activa: r.activa }
    const keys = Object.keys(emptyForm)
    keys.forEach(k => {
      const v = (r as any)[k]
      fd[k] = v != null ? v : ''
    })
    // FK ids
    if ((r as any).producto_id) fd.producto_id = (r as any).producto_id
    if ((r as any).material_id) fd.material_id = (r as any).material_id
    if ((r as any).molde_id) fd.molde_id = (r as any).molde_id
    if ((r as any).maquina_id) fd.maquina_id = (r as any).maquina_id
    setFormData(fd)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Convertir strings vacíos a null para campos numéricos
      const payload: Record<string, string | number | boolean | null> = {}
      Object.entries(formData).forEach(([k, v]) => {
        if (v === '' || v === null) { payload[k] = null }
        else if (typeof v === 'string' && !isNaN(Number(v)) && k !== 'codigo' && k !== 'nombre' && k !== 'observaciones') {
          payload[k] = Number(v)
        } else { payload[k] = v }
      })

      if (editId) {
        await api.put(`/recetas/${editId}`, payload)
        toast.success('Receta actualizada (v' + (Number(formData.version || 1) + 1) + ')')
      } else {
        await api.post('/recetas', payload)
        toast.success('Receta creada')
      }
      setShowModal(false)
      loadRecetas()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDuplicar = async (id: number) => {
    try {
      await api.post(`/recetas/${id}/duplicar`)
      toast.success('Receta duplicada')
      loadRecetas()
    } catch { toast.error('Error al duplicar') }
  }

  const handleToggleActiva = async (r: Receta) => {
    try {
      await api.put(`/recetas/${r.id}/activa`, { activa: !r.activa })
      loadRecetas()
    } catch { toast.error('Error al cambiar estado') }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/recetas/${id}`)
      toast.success('Receta eliminada')
      loadRecetas()
    } catch { toast.error('Error al eliminar') }
  }

  const upd = (k: string, v: string | number | boolean) => setFormData(f => ({ ...f, [k]: v }))
  const filtered = recetas.filter(r =>
    r.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const TempField = ({ label, k }: { label: string; k: string }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label} (°C)</label>
      <input type="number" step="0.1" className="block w-full border border-gray-300 rounded p-1.5 text-sm"
        value={String(formData[k] ?? '')} onChange={e => upd(k, e.target.value)} />
    </div>
  )

  const NumField = ({ label, k, unit, step = '0.1' }: { label: string; k: string; unit?: string; step?: string }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}{unit ? ` (${unit})` : ''}</label>
      <input type="number" step={step} className="block w-full border border-gray-300 rounded p-1.5 text-sm"
        value={String(formData[k] ?? '')} onChange={e => upd(k, e.target.value)} />
    </div>
  )

  if (loading) return <SkeletonTable rows={5} cols={6} />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recetas de Inyección</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nueva Receta
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow">
        <Search className="h-4 w-4 text-gray-400" />
        <input placeholder="Buscar por código, nombre o producto..." className="flex-1 outline-none text-sm"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(r => {
          const isOpen = expanded === r.id
          return (
            <div key={r.id} className={`bg-white rounded-lg shadow border ${r.activa ? 'border-gray-100' : 'border-dashed border-gray-300 opacity-70'}`}>
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <button onClick={() => setExpanded(isOpen ? null : r.id)} className="text-gray-400 hover:text-gray-600">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-700">{r.codigo}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${r.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {r.activa ? 'Activa' : 'Inactiva'} · v{r.version}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{r.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {r.producto?.nombre}
                    {r.material && ` · ${r.material.nombre}`}
                    {r.molde && ` · ${r.molde.nombre} (${r.molde.numero_cavidades} cav)`}
                    {r.maquina && ` · ${r.maquina.nombre}`}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {r.ciclo_total_seg && <span className="flex items-center gap-0.5"><Gauge className="h-3.5 w-3.5" />{r.ciclo_total_seg}s ciclo</span>}
                  {r.peso_pieza_gr && <span className="flex items-center gap-0.5"><Thermometer className="h-3.5 w-3.5" />{r.peso_pieza_gr}g/pza</span>}
                  {r.piezas_por_ciclo && <span>{r.piezas_por_ciclo} pza/ciclo</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggleActiva(r)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                    {r.activa ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button onClick={() => handleDuplicar(r.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500" title="Duplicar">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button onClick={() => openEdit(r)} className="p-1 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-600">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(r.id)} className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Parámetros expandidos */}
              {isOpen && (
                <div className="border-t px-4 pb-4 pt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1"><Thermometer className="h-3.5 w-3.5 text-red-500" />Temperaturas (°C)</p>
                    <div className="space-y-1">
                      {[['Zona 1', r.temp_zona1], ['Zona 2', r.temp_zona2], ['Zona 3', r.temp_zona3],
                        ['Zona 4', r.temp_zona4], ['Zona 5', r.temp_zona5], ['Zona 6', r.temp_zona6],
                        ['Boquilla', r.temp_boquilla], ['Molde fijo', r.temp_molde_fijo], ['Molde móvil', r.temp_molde_movil]
                      ].filter(([, v]) => v != null).map(([label, val]) => (
                        <div key={String(label)} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-mono font-semibold text-gray-800">{val}°C</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1"><Gauge className="h-3.5 w-3.5 text-blue-500" />Inyección</p>
                    <div className="space-y-1">
                      {[
                        ['Vel. inyección', r.vel_inyeccion_pct, '%'],
                        ['Presión iny.', r.presion_inyeccion_bar, 'bar'],
                        ['Presión sosten.', r.presion_sostenimiento_bar, 'bar'],
                        ['T. inyección', r.tiempo_inyeccion_seg, 's'],
                        ['T. sostenimiento', r.tiempo_sostenimiento_seg, 's'],
                        ['T. enfriamiento', r.tiempo_enfriamiento_seg, 's'],
                      ].filter(([, v]) => v != null).map(([label, val, unit]) => (
                        <div key={String(label)} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-mono font-semibold text-gray-800">{val} {unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">Plastificación / Resultados</p>
                    <div className="space-y-1">
                      {[
                        ['Contrapresión', r.contrapresion_bar, 'bar'],
                        ['RPM husillo', r.rpm_husillo, 'rpm'],
                        ['Colchón', r.colchon_mm, 'mm'],
                        ['Pos. disparo', r.posicion_disparo_mm, 'mm'],
                        ['Ciclo total', r.ciclo_total_seg, 's'],
                        ['Peso disparo', r.peso_disparo_gr, 'g'],
                        ['Peso pieza', r.peso_pieza_gr, 'g'],
                        ['Piezas/ciclo', r.piezas_por_ciclo, ''],
                      ].filter(([, v]) => v != null).map(([label, val, unit]) => (
                        <div key={String(label)} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-mono font-semibold text-gray-800">{val} {unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400 text-sm">
            No hay recetas de inyección registradas
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Eliminar receta"
        message="¿Eliminar esta receta de inyección? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar Receta' : 'Nueva Receta de Inyección'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Identificación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input required className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={String(formData.codigo)} onChange={e => upd('codigo', e.target.value)} placeholder="REC-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input required className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={String(formData.nombre)} onChange={e => upd('nombre', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
              <select required className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={String(formData.producto_id)} onChange={e => upd('producto_id', e.target.value)}>
                <option value="">Seleccionar...</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <select className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={String(formData.material_id)} onChange={e => upd('material_id', e.target.value)}>
                <option value="">Cualquiera</option>
                {materiales.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Molde</label>
              <select className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={String(formData.molde_id)} onChange={e => upd('molde_id', e.target.value)}>
                <option value="">Cualquiera</option>
                {moldes.map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máquina</label>
              <select className="block w-full border border-gray-300 rounded-md p-2 text-sm"
                value={String(formData.maquina_id)} onChange={e => upd('maquina_id', e.target.value)}>
                <option value="">Cualquiera</option>
                {maquinas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Temperaturas */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Thermometer className="h-4 w-4 text-red-500" />Temperaturas del Barril y Molde</p>
            <div className="grid grid-cols-4 md:grid-cols-9 gap-2">
              {['temp_zona1','temp_zona2','temp_zona3','temp_zona4','temp_zona5','temp_zona6'].map((k, i) => (
                <TempField key={k} label={`Z${i+1}`} k={k} />
              ))}
              <TempField label="Boquilla" k="temp_boquilla" />
              <TempField label="M.Fijo" k="temp_molde_fijo" />
              <TempField label="M.Móvil" k="temp_molde_movil" />
            </div>
          </div>

          {/* Inyección */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Gauge className="h-4 w-4 text-blue-500" />Parámetros de Inyección</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <NumField label="Vel. inyección" k="vel_inyeccion_pct" unit="%" />
              <NumField label="Presión iny." k="presion_inyeccion_bar" unit="bar" />
              <NumField label="P. sostenimiento" k="presion_sostenimiento_bar" unit="bar" />
              <NumField label="T. inyección" k="tiempo_inyeccion_seg" unit="s" />
              <NumField label="T. sostenimiento" k="tiempo_sostenimiento_seg" unit="s" />
              <NumField label="T. enfriamiento" k="tiempo_enfriamiento_seg" unit="s" />
            </div>
          </div>

          {/* Plastificación */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Plastificación</p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              <NumField label="Contrapresión" k="contrapresion_bar" unit="bar" />
              <NumField label="RPM husillo" k="rpm_husillo" unit="rpm" step="1" />
              <NumField label="Colchón" k="colchon_mm" unit="mm" />
              <NumField label="Pos. disparo" k="posicion_disparo_mm" unit="mm" />
              <NumField label="T. agua enfr." k="temp_agua_enfriamiento_c" unit="°C" />
            </div>
          </div>

          {/* Resultados esperados */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Resultados Esperados</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <NumField label="Ciclo total" k="ciclo_total_seg" unit="s" />
              <NumField label="Peso disparo" k="peso_disparo_gr" unit="g" />
              <NumField label="Peso pieza" k="peso_pieza_gr" unit="g" />
              <NumField label="Piezas/ciclo" k="piezas_por_ciclo" unit="pzas" step="1" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea rows={2} className="block w-full border border-gray-300 rounded-md p-2 text-sm"
              value={String(formData.observaciones)} onChange={e => upd('observaciones', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Receta'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
