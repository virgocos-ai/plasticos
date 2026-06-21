import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Truck, Package, Factory,
  FileText, BarChart3, LogOut, Menu, X,
  Building2, ClipboardList, Settings, Wrench, UserCircle,
  FileSpreadsheet, ShoppingCart, ShieldCheck, Boxes,
  UserCog, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  LayoutList, Store, CalendarDays, Layers, FlaskConical, PackageCheck, ClipboardCheck
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

type Rol = 'admin' | 'operador' | 'contador' | 'almacen'

interface NavItem { name: string; href: string; icon: any; roles?: Rol[] }
interface NavSection { label: string; items: NavItem[]; roles?: Rol[] }

const navSections: NavSection[] = [
  {
    label: 'General',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Comercial',
    items: [
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Cotizaciones', href: '/cotizaciones', icon: FileSpreadsheet },
      { name: 'Facturas', href: '/facturas', icon: FileText, roles: ['admin', 'contador'] },
    ]
  },
  {
    label: 'Compras',
    items: [
      { name: 'Proveedores', href: '/proveedores', icon: Truck },
      { name: 'Órdenes de Compra', href: '/ordenes-compra', icon: ShoppingCart, roles: ['admin', 'almacen'] },
    ]
  },
  {
    label: 'Producción',
    items: [
      { name: 'Órdenes Prod.', href: '/ordenes-produccion', icon: Factory },
      { name: 'Planificación', href: '/gantt', icon: CalendarDays },
      { name: 'Productos', href: '/productos', icon: Package },
      { name: 'Materiales', href: '/materiales', icon: Boxes, roles: ['admin', 'almacen'] },
      { name: 'Máquinas', href: '/maquinas', icon: Wrench },
      { name: 'Moldes', href: '/moldes', icon: Layers },
      { name: 'Recetas Inyección', href: '/recetas-inyeccion', icon: FlaskConical },
      { name: 'Operadores', href: '/operadores', icon: UserCircle },
      { name: 'Mantenimiento', href: '/mantenimiento', icon: ClipboardCheck },
      { name: 'Calidad', href: '/calidad', icon: ShieldCheck },
    ]
  },
  {
    label: 'Inventario',
    roles: ['admin', 'almacen'],
    items: [
      { name: 'Inventario', href: '/inventario', icon: LayoutList },
      { name: 'Almacenes', href: '/almacenes', icon: Store },
      { name: 'Lotes', href: '/lotes', icon: ClipboardList },
    ]
  },
  {
    label: 'Logística',
    roles: ['admin', 'almacen'],
    items: [
      { name: 'Envíos y Distribución', href: '/logistica', icon: PackageCheck },
    ]
  },
  {
    label: 'Reportes',
    roles: ['admin', 'contador'],
    items: [
      { name: 'Reportes', href: '/reportes', icon: BarChart3 },
    ]
  },
  {
    label: 'Administración',
    roles: ['admin'],
    items: [
      { name: 'Usuarios y Roles', href: '/usuarios', icon: UserCog },
      { name: 'Configuración', href: '/configuracion', icon: Settings },
      { name: 'Regímenes SAT', href: '/regimenes-fiscales', icon: Building2 },
    ]
  },
]

interface SidebarNavProps {
  rol: string
  collapsed: boolean
  onClose?: () => void
}

function SidebarNav({ rol, collapsed, onClose }: SidebarNavProps) {
  const location = useLocation()
  const [sectionsCollapsed, setSectionsCollapsed] = useState<Record<string, boolean>>({})

  const toggleSection = (label: string) =>
    setSectionsCollapsed(c => ({ ...c, [label]: !c[label] }))

  const isVisible = (roles?: Rol[]) => !roles || roles.includes(rol as Rol)

  // Exact match for '/', prefix match for the rest (only if path segment boundary)
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return (
    <nav className="flex-1 overflow-y-auto py-2">
      {navSections.map(section => {
        if (!isVisible(section.roles)) return null
        const visibleItems = section.items.filter(i => isVisible(i.roles))
        if (visibleItems.length === 0) return null
        const isOpen = !sectionsCollapsed[section.label]

        if (collapsed) {
          return (
            <div key={section.label} className="mb-1">
              <div className="mx-3 my-1.5 border-t border-slate-700/50" />
              {visibleItems.map(item => {
                const active = isActive(item.href)
                return (
                  <div key={item.href} className="relative group px-2 mb-0.5">
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-center rounded-lg p-2.5 transition-colors ${
                        active
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                    </Link>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[100] hidden group-hover:block">
                      <div className="bg-slate-800 text-slate-100 text-xs font-semibold rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg border border-slate-600">
                        {item.name}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }

        return (
          <div key={section.label} className="px-2 mb-1">
            <button
              onClick={() => toggleSection(section.label)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors rounded"
            >
              <span>{section.label}</span>
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {isOpen && (
              <div className="space-y-0.5 mb-1">
                {visibleItems.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                          : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
                      }`}
                    >
                      <item.icon className={`mr-3 h-4 w-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [empresaLogo, setEmpresaLogo] = useState<string>('')
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    api.get('/configuracion/EMPRESA_LOGO').then(r => {
      if (r.data?.valor) setEmpresaLogo(`http://localhost:5000${r.data.valor}`)
    }).catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const rol = user?.rol || 'operador'

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* ── Overlay móvil ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col bg-brand-dark border-r border-slate-800 transition-all duration-300 ease-in-out overflow-hidden ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}
      >
        {/* Logo */}
        <div className={`flex h-16 items-center border-b border-slate-800/60 flex-shrink-0 ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'}`}>
          {sidebarCollapsed ? (
            empresaLogo ? (
              <img src={empresaLogo} alt="Logo" className="h-9 w-9 object-contain" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-accent to-blue-800 flex items-center justify-center flex-shrink-0">
                <Factory className="h-5 w-5 text-white" />
              </div>
            )
          ) : (
            empresaLogo ? (
              <img src={empresaLogo} alt="Logo empresa" className="h-11 w-auto max-w-[180px] object-contain" />
            ) : (
              <img src="/logo.svg" alt="Sistema Plásticos" className="h-9 w-auto max-w-[180px] brightness-0 invert" />
            )
          )}
        </div>

        {/* Nav */}
        <SidebarNav rol={rol} collapsed={sidebarCollapsed} />

        {/* Footer usuario */}
        <div className={`border-t border-slate-800/60 p-3 flex items-center gap-3 flex-shrink-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-blue-400 text-sm font-bold flex-shrink-0">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.nombre}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{rol}</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Sidebar móvil ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-brand-dark border-r border-slate-800 transition-transform duration-300 lg:hidden
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/50 flex-shrink-0">
          {empresaLogo
            ? <img src={empresaLogo} alt="Logo empresa" className="h-10 w-auto max-w-[160px] object-contain" />
            : <img src="/logo.svg" alt="Sistema Plásticos" className="h-8 w-auto brightness-0 invert" />
          }
          <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarNav rol={rol} collapsed={false} onClose={() => setMobileSidebarOpen(false)} />
        <div className="border-t border-slate-800/50 p-3 flex items-center gap-3 flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-blue-400 text-sm font-bold">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.nombre}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{rol}</p>
          </div>
        </div>
      </aside>

      {/* ── Área de contenido ── */}
      <div
        className={`flex flex-col flex-1 min-h-0 transition-all duration-300 ease-in-out w-full ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}
      >

        {/* Header */}
        <header className="flex-shrink-0 flex h-14 items-center gap-3 px-4 bg-white border-b border-gray-200 shadow-sm">
          {/* Botón menú móvil */}
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 rounded-lg lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Botón colapsar sidebar desktop */}
          <button
            type="button"
            className="hidden lg:flex p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <div className="flex flex-1 justify-end items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {user?.email}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
