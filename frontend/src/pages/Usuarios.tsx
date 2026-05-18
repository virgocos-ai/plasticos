import { useEffect, useState } from 'react'
import {
  Plus, Search, X, Edit, KeyRound,
  ToggleLeft, ToggleRight, ShieldCheck, UserCircle, Calculator, Warehouse
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

type Rol = 'admin' | 'operador' | 'contador' | 'almacen'

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  ultimo_acceso: string | null
  created_at: string
}

interface UsuarioForm {
  nombre: string
  email: string
  password: string
  rol: Rol
  activo: boolean
}

const emptyForm = (): UsuarioForm => ({
  nombre: '', email: '', password: '', rol: 'operador', activo: true
})

const ROLES: { value: Rol; label: string; desc: string; color: string; icon: any }[] = [
  { value: 'admin', label: 'Administrador', desc: 'Acceso total al sistema', color: 'bg-red-100 text-red-700', icon: ShieldCheck },
  { value: 'contador', label: 'Contador', desc: 'Facturas, reportes y regímenes fiscales', color: 'bg-blue-100 text-blue-700', icon: Calculator },
  { value: 'almacen', label: 'Almacén', desc: 'Inventario, almacenes, materiales y lotes', color: 'bg-amber-100 text-amber-700', icon: Warehouse },
  { value: 'operador', label: 'Operador', desc: 'Órdenes de producción y lectura general', color: 'bg-green-100 text-green-700', icon: UserCircle },
]

const getRolInfo = (rol: Rol) => ROLES.find(r => r.value === rol) || ROLES[3]

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRol, setFilterRol] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState<UsuarioForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const [showPassModal, setShowPassModal] = useState(false)
  const [passUserId, setPassUserId] = useState<number | null>(null)
  const [newPass, setNewPass] = useState('')
  const [savingPass, setSavingPass] = useState(false)

  useEffect(() => { loadUsuarios() }, [])

  const loadUsuarios = async () => {
    try {
      const r = await api.get('/usuarios')
      setUsuarios(r.data)
    } catch { toast.error('Error al cargar usuarios') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditando(null)
    setForm(emptyForm())
    setShowModal(true)
  }

  const openEdit = (u: Usuario) => {
    setEditando(u)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, activo: u.activo })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return }
    if (!form.email.trim()) { toast.error('El email es requerido'); return }
    if (!editando && form.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }

    setSaving(true)
    try {
      if (editando) {
        await api.put(`/usuarios/${editando.id}`, {
          nombre: form.nombre, email: form.email, rol: form.rol, activo: form.activo
        })
        toast.success('Usuario actualizado')
      } else {
        await api.post('/usuarios', form)
        toast.success('Usuario creado correctamente')
      }
      setShowModal(false)
      loadUsuarios()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al guardar usuario')
    } finally { setSaving(false) }
  }

  const handleToggle = async (u: Usuario) => {
    try {
      await api.patch(`/usuarios/${u.id}/toggle`)
      toast.success(u.activo ? 'Usuario desactivado' : 'Usuario activado')
      loadUsuarios()
    } catch { toast.error('Error al cambiar estado') }
  }

  const openPassword = (id: number) => {
    setPassUserId(id)
    setNewPass('')
    setShowPassModal(true)
  }

  const handleChangePass = async () => {
    if (newPass.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    setSavingPass(true)
    try {
      await api.put(`/usuarios/${passUserId}/password`, { password: newPass })
      toast.success('Contraseña actualizada')
      setShowPassModal(false)
    } catch { toast.error('Error al cambiar contraseña') }
    finally { setSavingPass(false) }
  }

  const filtered = usuarios.filter(u => {
    const matchSearch = !search || u.nombre.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRol = !filterRol || u.rol === filterRol
    return matchSearch && matchRol
  })

  if (loading) return <div className="text-center py-10 text-gray-500">Cargando usuarios...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios y Roles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de acceso al sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          <Plus className="h-4 w-4" /> Nuevo Usuario
        </button>
      </div>

      {/* Tarjetas de roles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(rol => {
          const count = usuarios.filter(u => u.rol === rol.value && u.activo).length
          const Icon = rol.icon
          return (
            <div key={rol.value} className={`rounded-xl p-4 ${rol.color.replace('text-', 'border-l-4 border-').split(' ')[0]} bg-white shadow-sm border border-gray-100`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${rol.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{rol.label}</p>
                  <p className="text-xs text-gray-500">{count} activo{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{rol.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="flex-1 outline-none text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterRol}
          onChange={e => setFilterRol(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos los roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol / Perfil</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permisos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último acceso</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(u => {
              const rolInfo = getRolInfo(u.rol)
              const Icon = rolInfo.icon
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.nombre}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rolInfo.color}`}>
                      <Icon className="h-3 w-3" />
                      {rolInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">{rolInfo.desc}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {u.ultimo_acceso
                      ? new Date(u.ultimo_acceso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                      : <span className="text-gray-300 italic">Nunca</span>
                    }
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button onClick={() => handleToggle(u)} title={u.activo ? 'Desactivar' : 'Activar'}>
                      {u.activo
                        ? <ToggleRight className="h-6 w-6 text-green-500 mx-auto" />
                        : <ToggleLeft className="h-6 w-6 text-gray-300 mx-auto" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        title="Editar"
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openPassword(u.id)}
                        title="Cambiar contraseña"
                        className="p-1 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay usuarios{search || filterRol ? ' que coincidan' : ' registrados'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Juan García López"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="usuario@empresa.com"
                  />
                </div>
                {!editando && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña * <span className="text-gray-400 font-normal">(mín. 6 caracteres)</span></label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Contraseña segura"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rol / Perfil *</label>
                  <div className="space-y-2">
                    {ROLES.map(rol => {
                      const Icon = rol.icon
                      return (
                        <label
                          key={rol.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.rol === rol.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <input
                            type="radio"
                            name="rol"
                            value={rol.value}
                            checked={form.rol === rol.value}
                            onChange={() => setForm(f => ({ ...f, rol: rol.value }))}
                            className="mt-0.5"
                          />
                          <div className={`p-1.5 rounded-md ${rol.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{rol.label}</p>
                            <p className="text-xs text-gray-500">{rol.desc}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
                {editando && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={form.activo}
                      onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor="activo" className="text-sm text-gray-700">Usuario activo</label>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowPassModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><KeyRound className="h-5 w-5 text-amber-500" /> Cambiar Contraseña</h3>
                <button onClick={() => setShowPassModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">Ingresa la nueva contraseña para el usuario seleccionado.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña *</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowPassModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                <button onClick={handleChangePass} disabled={savingPass} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50">
                  {savingPass ? 'Guardando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
