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
              <div className="mx-3 my-2 border-t border-slate-800/60" />
              {visibleItems.map(item => {
                const active = location.pathname === item.href
                return (
                  <div key={item.href} className="relative group px-2 mb-0.5">
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 ${
                        active 
                          ? 'bg-brand-accent/10 text-brand-glow shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-brand-accent/20' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-brand-glow drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : ''}`} />
                    </Link>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                      <div className="bg-brand-dark text-slate-200 text-[11px] font-bold tracking-widest uppercase rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-slate-700">
                        {item.name}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-700" />
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
                  const active = location.pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
                        active 
                          ? 'bg-brand-accent/10 text-brand-glow border-l-2 border-brand-glow shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]' 
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 hover:translate-x-1'
                      }`}
                    >
                      <item.icon className={`mr-3 h-4 w-4 flex-shrink-0 transition-colors ${
                        active ? 'text-brand-glow drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-slate-500 group-hover:text-slate-300'
                      }`} />
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
  const sidebarW = sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
  const contentPl = sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* ── Sidebar móvil ── */}
      <div className={`fixed inset-0 z-40 lg:hidden ${mobileSidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileSidebarOpen(false)}
        />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-brand-dark border-r border-slate-800 shadow-2xl transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-accent to-blue-800 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Factory className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-heading font-bold text-white tracking-wide">Plasticos <span className="text-brand-glow">ERP</span></span>
            </div>
            <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav rol={rol} collapsed={false} onClose={() => setMobileSidebarOpen(false)} />
          <div className="border-t border-slate-800/50 p-3 flex items-center gap-3 bg-brand-darker/30">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-glow text-sm font-bold shadow-inner">
              {user?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.nombre}</p>
              <p className="text-[11px] text-brand-glow/80 uppercase tracking-widest font-semibold">{rol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sidebar desktop (colapsable) ── */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-brand-dark border-r border-slate-800/80 transition-all duration-300 ease-in-out ${sidebarW} overflow-hidden shadow-2xl`}>
        {/* Header del sidebar */}
        <div className={`flex h-[72px] items-center border-b border-slate-800/60 gap-3 flex-shrink-0 bg-brand-darker/20 ${sidebarCollapsed ? 'justify-center px-2' : 'px-5'}`}>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-accent to-blue-800 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Factory className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-heading font-bold text-white tracking-wide whitespace-nowrap overflow-hidden">Plasticos <span className="text-brand-glow">ERP</span></span>
          )}
        </div>

        {/* Nav */}
        <SidebarNav rol={rol} collapsed={sidebarCollapsed} />

        {/* Footer usuario */}
        <div className={`border-t border-slate-800/60 p-3 flex items-center gap-3 flex-shrink-0 bg-brand-darker/30 transition-all ${sidebarCollapsed ? 'justify-center' : 'px-4'}`}>
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-glow text-sm font-bold flex-shrink-0 shadow-inner hover:ring-2 ring-brand-glow/50 transition-all cursor-pointer">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1 animate-fade-in">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.nombre}</p>
              <p className="text-[10px] text-brand-glow/80 uppercase tracking-widest font-bold mt-0.5">{rol}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${contentPl} relative`}>
        {/* Header */}
        <header className="glass-panel sticky top-0 z-30 flex h-[72px] items-center gap-3 px-6 shadow-sm mb-4 mx-4 mt-4 rounded-2xl">
          {/* Botón menú móvil */}
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-brand-accent hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Botón colapsar sidebar desktop */}
          <button
            type="button"
            className="hidden lg:flex p-2 text-slate-400 hover:text-brand-accent hover:bg-brand-accent/5 rounded-lg transition-all"
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {sidebarCollapsed
              ? <PanelLeftOpen className="h-5 w-5" />
              : <PanelLeftClose className="h-5 w-5" />
            }
          </button>

          <div className="flex flex-1 justify-end items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-full border border-slate-200/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-8 pb-8 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
