import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Truck, Package, Factory,
  FileText, Warehouse, BarChart3, LogOut, Menu, X,
  Building2, ClipboardList, Settings, Wrench, UserCircle,
  FileSpreadsheet, ShoppingCart, ShieldCheck, Boxes,
  UserCog, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

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
      { name: 'Productos', href: '/productos', icon: Package },
      { name: 'Materiales', href: '/materiales', icon: Boxes, roles: ['admin', 'almacen'] },
      { name: 'Máquinas', href: '/maquinas', icon: Wrench },
      { name: 'Operadores', href: '/operadores', icon: UserCircle },
      { name: 'Calidad', href: '/calidad', icon: ShieldCheck },
    ]
  },
  {
    label: 'Inventario',
    roles: ['admin', 'almacen'],
    items: [
      { name: 'Inventario', href: '/inventario', icon: Warehouse },
      { name: 'Almacenes', href: '/almacenes', icon: Warehouse },
      { name: 'Lotes', href: '/lotes', icon: ClipboardList },
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

  return (
    <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
      {navSections.map(section => {
        if (!isVisible(section.roles)) return null
        const visibleItems = section.items.filter(i => isVisible(i.roles))
        if (visibleItems.length === 0) return null
        const isOpen = !sectionsCollapsed[section.label]

        if (collapsed) {
          return (
            <div key={section.label} className="mb-1">
              {/* Divider between sections when collapsed */}
              <div className="mx-3 my-1 border-t border-gray-100" />
              {visibleItems.map(item => {
                const active = location.pathname === item.href
                return (
                  <div key={item.href} className="relative group px-2 mb-0.5">
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-center rounded-md p-2.5 transition-colors ${
                        active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                    </Link>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-gray-900 text-white text-xs rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                        {item.name}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
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
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 rounded"
            >
              <span>{section.label}</span>
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {isOpen && (
              <div className="space-y-0.5 mb-1">
                {visibleItems.map(item => {
                  const active = location.pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-3 h-4 w-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
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
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => { logout(); navigate('/login') }

  const rol = user?.rol || 'operador'
  const sidebarW = sidebarCollapsed ? 'lg:w-14' : 'lg:w-60'
  const contentPl = sidebarCollapsed ? 'lg:pl-14' : 'lg:pl-60'

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ── Sidebar móvil ── */}
      <div className={`fixed inset-0 z-40 lg:hidden ${mobileSidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-gray-600 transition-opacity duration-300 ${mobileSidebarOpen ? 'opacity-75' : 'opacity-0'}`}
          onClick={() => setMobileSidebarOpen(false)}
        />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Factory className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">Plasticos ERP</span>
            </div>
            <button onClick={() => setMobileSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav rol={rol} collapsed={false} onClose={() => setMobileSidebarOpen(false)} />
          <div className="border-t p-3 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
              {user?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.nombre}</p>
              <p className="text-xs text-gray-400 capitalize">{rol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sidebar desktop (colapsable) ── */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 transition-all duration-300 ${sidebarW} overflow-hidden`}>
        {/* Header del sidebar */}
        <div className={`flex h-16 items-center border-b gap-2 flex-shrink-0 ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'}`}>
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Factory className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-base font-bold text-gray-900 whitespace-nowrap overflow-hidden">Plasticos ERP</span>
          )}
        </div>

        {/* Nav */}
        <SidebarNav rol={rol} collapsed={sidebarCollapsed} />

        {/* Footer usuario */}
        <div className={`border-t p-2 flex items-center gap-2 flex-shrink-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.nombre}</p>
              <p className="text-xs text-gray-400 capitalize">{rol}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${contentPl}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm">
          {/* Botón menú móvil */}
          <button
            type="button"
            className="p-1.5 text-gray-600 hover:text-gray-900 lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Botón colapsar sidebar desktop */}
          <button
            type="button"
            className="hidden lg:flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {sidebarCollapsed
              ? <PanelLeftOpen className="h-5 w-5" />
              : <PanelLeftClose className="h-5 w-5" />
            }
          </button>

          <div className="flex flex-1 justify-end items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-500 truncate max-w-xs">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
