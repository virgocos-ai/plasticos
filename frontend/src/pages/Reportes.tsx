import { useEffect, useState } from 'react'
import {
  BarChart as BarChartIcon, Download, TrendingUp, Factory, Package,
  RefreshCw, DollarSign, ShoppingBag, FileSpreadsheet, Truck,
  Wrench, ShieldCheck, ShoppingCart, AlertTriangle, CheckCircle
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

const COLORS: string[] = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
const fmt = (n: number) => `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

function exportCSV(filename: string, headers: string[], rows: Record<string, unknown>[], keys: string[]) {
  const csv = [headers.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename })
  a.click(); URL.revokeObjectURL(a.href)
}

type Tab = 'ventas' | 'produccion' | 'inventario' | 'calidad' | 'mantenimiento' | 'logistica' | 'compras'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'ventas', label: 'Ventas', icon: DollarSign },
  { id: 'produccion', label: 'Producción', icon: Factory },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'calidad', label: 'Calidad', icon: ShieldCheck },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { id: 'logistica', label: 'Logística', icon: Truck },
  { id: 'compras', label: 'Compras', icon: ShoppingCart },
]

export default function Reportes() {
  const [activeTab, setActiveTab] = useState<Tab>('ventas')
  const [loading, setLoading] = useState(false)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])

  // Datos por módulo
  const [ventasData, setVentasData] = useState<any[]>([])
  const [produccionData, setProduccionData] = useState<any[]>([])
  const [topProductos, setTopProductos] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [inventario, setInventario] = useState<any>(null)
  const [calidad, setCalidad] = useState<any>(null)
  const [mantenimiento, setMantenimiento] = useState<any>(null)
  const [logistica, setLogistica] = useState<any>(null)
  const [compras, setCompras] = useState<any>(null)

  useEffect(() => { loadTab(activeTab) }, [activeTab, fechaInicio, fechaFin])

  const params = `fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`

  const loadTab = async (tab: Tab) => {
    setLoading(true)
    try {
      if (tab === 'ventas') {
        const [v, top, dash] = await Promise.all([
          api.get(`/reportes/ventas?${params}&agrupar=mes`),
          api.get(`/reportes/top-productos?${params}&limite=8`),
          api.get(`/reportes/dashboard?${params}`),
        ])
        setVentasData(v.data); setTopProductos(top.data); setDashboard(dash.data)
      } else if (tab === 'produccion') {
        const [p, dash] = await Promise.all([
          api.get(`/reportes/produccion?${params}`),
          api.get(`/reportes/dashboard?${params}`),
        ])
        setProduccionData(p.data); setDashboard(dash.data)
      } else if (tab === 'inventario') {
        const r = await api.get(`/reportes/inventario`)
        setInventario(r.data)
      } else if (tab === 'calidad') {
        const r = await api.get(`/reportes/calidad?${params}`)
        setCalidad(r.data)
      } else if (tab === 'mantenimiento') {
        const r = await api.get(`/reportes/mantenimiento?${params}`)
        setMantenimiento(r.data)
      } else if (tab === 'logistica') {
        const r = await api.get(`/reportes/logistica?${params}`)
        setLogistica(r.data)
      } else if (tab === 'compras') {
        const r = await api.get(`/reportes/compras?${params}`)
        setCompras(r.data)
      }
    } catch {
      toast.error('Error al cargar reporte')
    } finally { setLoading(false) }
  }

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()
    if (activeTab === 'ventas' && ventasData.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Período', 'Facturas', 'Subtotal', 'IVA', 'Total'],
        ...ventasData.map((r: any) => [r.periodo, r.total_facturas, r.subtotal, r.iva, r.total])
      ]), 'Ventas')
    }
    if (activeTab === 'produccion' && produccionData.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Folio', 'Fecha', 'Cliente', 'Producto', 'Material', 'Máquina', 'Solicitada', 'Producida', 'Defectuosa', 'Estado'],
        ...produccionData.map((r: any) => [r.folio, r.fecha_orden, r.cliente, r.producto, r.material, r.maquina_asignada, r.cantidad_solicitada, r.cantidad_producida, r.cantidad_defectuosa, r.estado])
      ]), 'Producción')
    }
    if (activeTab === 'mantenimiento' && mantenimiento?.por_mes?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Mes', 'Total', 'Costo', 'Minutos Paro'],
        ...mantenimiento.por_mes.map((r: any) => [r.mes, r.total, r.costo, r.minutos_paro])
      ]), 'Mantenimiento')
    }
    if (activeTab === 'compras' && compras?.por_proveedor?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Proveedor', 'Órdenes', 'Gasto Total', 'Última Compra'],
        ...compras.por_proveedor.map((r: any) => [r.proveedor, r.total_ordenes, r.gasto_total, r.ultima_compra])
      ]), 'Compras')
    }
    if (wb.SheetNames.length === 0) { toast.error('No hay datos para exportar'); return }
    XLSX.writeFile(wb, `reporte_${activeTab}_${fechaInicio}_${fechaFin}.xlsx`)
    toast.success('Excel generado')
  }

  const eficienciaMaquina = produccionData.reduce((acc: any[], row: any) => {
    const maq = row.maquina_asignada || 'Sin máquina'
    const ex = acc.find(a => a.maquina === maq)
    if (ex) { ex.producida += Number(row.cantidad_producida || 0); ex.defectuosa += Number(row.cantidad_defectuosa || 0) }
    else acc.push({ maquina: maq, producida: Number(row.cantidad_producida || 0), defectuosa: Number(row.cantidad_defectuosa || 0) })
    return acc
  }, [])

  const totalVentas = Number(dashboard?.ventas?.ventas_totales || 0)
  const totalFacturas = Number(dashboard?.ventas?.total_facturas || 0)
  const ordenesProduccion: any[] = dashboard?.ordenes_produccion || []
  const totalOrdenes = ordenesProduccion.reduce((s: number, o: any) => s + Number(o.total), 0)
  const totalClientes = Number(dashboard?.clientes?.total_clientes || 0)

  const needsFecha = activeTab !== 'inventario'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-sm text-gray-500 mt-0.5">Período: {fechaInicio} → {fechaFin}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {needsFecha && <>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <span className="text-gray-400 text-sm">a</span>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </>}
          <button onClick={() => loadTab(activeTab)} className="flex items-center gap-1.5 border border-gray-300 px-3 py-2 rounded-md text-sm hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-md text-sm hover:bg-emerald-700">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
        {TABS.map(t => {
          const active = activeTab === t.id
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB: VENTAS ── */}
      {activeTab === 'ventas' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Ventas Timbradas', value: fmt(totalVentas), icon: DollarSign, color: 'blue' },
              { label: 'Facturas', value: totalFacturas, icon: ShoppingBag, color: 'green' },
              { label: 'Órdenes Prod.', value: totalOrdenes, icon: Factory, color: 'purple' },
              { label: 'Clientes Activos', value: totalClientes, icon: TrendingUp, color: 'amber' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${color}-50 rounded-lg`}><Icon className={`h-5 w-5 text-${color}-600`} /></div>
                  <div><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-bold text-gray-900">{value}</p></div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Ventas por Mes" icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
              onExport={() => exportCSV(`ventas_${fechaInicio}.csv`, ['Período','Facturas','Subtotal','IVA','Total'], ventasData, ['periodo','total_facturas','subtotal','iva','total'])}>
              {ventasData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="subtotal" name="Subtotal" fill="#93C5FD" radius={[3,3,0,0]} />
                    <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Top Productos" icon={<Package className="h-4 w-4 text-purple-600" />}
              onExport={() => exportCSV(`top_${fechaInicio}.csv`, ['Código','Producto','Cantidad','Total'], topProductos, ['codigo','nombre','cantidad_vendida','total_ventas'])}>
              {topProductos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topProductos} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                      dataKey="cantidad_vendida" nameKey="nombre"
                      label={({ name, percent }) => `${name?.slice(0,10)} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={10}>
                      {topProductos.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, _: any, p: any) => [`${v} uds`, p.payload.nombre]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          {/* Tabla top productos */}
          <SimpleTable
            title="Top Productos — Detalle"
            columns={['#', 'Código', 'Producto', 'Cant. Vendida', 'Total Ventas']}
            rows={topProductos}
            renderRow={(p: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.codigo}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nombre}</td>
                <td className="px-4 py-3 text-sm text-right">{Number(p.cantidad_vendida).toLocaleString('es-MX')}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">{fmt(parseFloat(p.total_ventas))}</td>
              </tr>
            )}
          />
        </div>
      )}

      {/* ── TAB: PRODUCCIÓN ── */}
      {activeTab === 'produccion' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Producción por Orden" icon={<Factory className="h-4 w-4 text-green-600" />}
              onExport={() => exportCSV(`produccion_${fechaInicio}.csv`, ['Folio','Fecha','Producto','Solicitada','Producida','Defectuosa'], produccionData, ['folio','fecha_orden','producto','cantidad_solicitada','cantidad_producida','cantidad_defectuosa'])}>
              {produccionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={produccionData.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="folio" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="cantidad_solicitada" name="Solicitada" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cantidad_producida" name="Producida" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cantidad_defectuosa" name="Defectuosa" stroke="#EF4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Eficiencia por Máquina" icon={<BarChartIcon className="h-4 w-4 text-orange-600" />}>
              {eficienciaMaquina.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eficienciaMaquina}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="maquina" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="producida" name="Producida" fill="#10B981" radius={[3,3,0,0]} />
                    <Bar dataKey="defectuosa" name="Defectuosa" fill="#EF4444" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <SimpleTable
            title={`Detalle de Órdenes (${produccionData.length})`}
            columns={['Folio','Fecha','Cliente','Producto','Máquina','Solicitada','Producida','Defect.','Estado']}
            rows={produccionData.slice(0, 50)}
            renderRow={(r: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs font-mono font-bold text-blue-700">{r.folio}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{r.fecha_orden}</td>
                <td className="px-3 py-2 text-xs text-gray-700 max-w-[120px] truncate">{r.cliente}</td>
                <td className="px-3 py-2 text-xs text-gray-700 max-w-[120px] truncate">{r.producto}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{r.maquina_asignada || '—'}</td>
                <td className="px-3 py-2 text-xs text-right">{Number(r.cantidad_solicitada).toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-right text-green-700 font-medium">{Number(r.cantidad_producida || 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-right text-red-600">{Number(r.cantidad_defectuosa || 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-xs"><EstadoBadge estado={r.estado} /></td>
              </tr>
            )}
          />
        </div>
      )}

      {/* ── TAB: INVENTARIO ── */}
      {activeTab === 'inventario' && inventario && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Movimientos por Tipo" icon={<Package className="h-4 w-4 text-blue-600" />}>
              {inventario.movimientos_por_tipo?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventario.movimientos_por_tipo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="tipo_movimiento" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Movimientos por Almacén" icon={<Package className="h-4 w-4 text-green-600" />}>
              {inventario.por_almacen?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventario.por_almacen}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="almacen" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="entradas_totales" name="Entradas" fill="#10B981" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="font-semibold text-sm text-gray-800">Productos con Stock Bajo ({inventario.stock_bajo?.length ?? 0})</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Código','Producto','Stock Actual','Stock Mínimo','Diferencia','Unidad'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(inventario.stock_bajo ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Sin productos con stock bajo
                  </td></tr>
                ) : inventario.stock_bajo.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-red-50/40">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.codigo}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-600">{Number(p.stock_actual).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{Number(p.stock_minimo).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-700">{Number(p.diferencia).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.unidad_medida}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: CALIDAD ── */}
      {activeTab === 'calidad' && calidad && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Resultados de Inspección" icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}>
              {calidad.resumen?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={calidad.resumen} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                      dataKey="total" nameKey="resultado"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {calidad.resumen.map((_: any, i: number) => <Cell key={i} fill={['#10B981','#EF4444','#F59E0B'][i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Defectos más Frecuentes" icon={<AlertTriangle className="h-4 w-4 text-red-600" />}>
              {calidad.por_defecto?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calidad.por_defecto} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="tipo_defecto" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total" fill="#EF4444" radius={[0,3,3,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <SimpleTable
            title="Calidad por Producto"
            columns={['Producto','Total','Aprobados','Rechazados','Reprocesos','Tasa Aprobación']}
            rows={calidad.por_producto ?? []}
            renderRow={(r: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.producto}</td>
                <td className="px-4 py-3 text-sm text-center">{r.total_inspecciones}</td>
                <td className="px-4 py-3 text-sm text-center text-green-700 font-medium">{r.aprobados}</td>
                <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{r.rechazados}</td>
                <td className="px-4 py-3 text-sm text-center text-amber-600">{r.reprocesos}</td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`font-bold ${Number(r.tasa_aprobacion) >= 95 ? 'text-green-600' : Number(r.tasa_aprobacion) >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                    {r.tasa_aprobacion}%
                  </span>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      {/* ── TAB: MANTENIMIENTO ── */}
      {activeTab === 'mantenimiento' && mantenimiento && (
        <div className="space-y-5">
          {/* Resumen por tipo */}
          {mantenimiento.por_tipo?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mantenimiento.por_tipo.map((t: any) => (
                <div key={t.tipo} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${t.tipo === 'preventivo' ? 'bg-blue-100 text-blue-800' : t.tipo === 'correctivo' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>{t.tipo}</span>
                    <span className="font-bold text-gray-700">{t.total} registros</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Paro: {Number(t.minutos_paro || 0)} min</span>
                    <span>Costo: {fmt(Number(t.costo_total || 0))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Costo de Mantenimiento por Mes" icon={<Wrench className="h-4 w-4 text-amber-600" />}
              onExport={() => exportCSV(`mantenimiento_${fechaInicio}.csv`, ['Mes','Total','Costo','Min Paro'], mantenimiento.por_mes ?? [], ['mes','total','costo','minutos_paro'])}>
              {mantenimiento.por_mes?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mantenimiento.por_mes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="costo" name="Costo" fill="#F59E0B" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Tiempo de Paro por Mes (min)" icon={<BarChartIcon className="h-4 w-4 text-red-600" />}>
              {mantenimiento.por_mes?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mantenimiento.por_mes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="minutos_paro" name="Min Paro" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <SimpleTable
            title="Top Equipos por Costo de Mantenimiento"
            columns={['Tipo','ID Equipo','Mantenimientos','Min Paro','Costo Total','Último']}
            rows={mantenimiento.por_equipo ?? []}
            renderRow={(r: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${r.entidad_tipo === 'maquina' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-700'}`}>{r.entidad_tipo}</span></td>
                <td className="px-4 py-3 text-sm text-gray-700">#{r.entidad_id}</td>
                <td className="px-4 py-3 text-sm text-center">{r.total_mantenimientos}</td>
                <td className="px-4 py-3 text-sm text-right text-amber-700">{Number(r.minutos_paro || 0)} min</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">{fmt(Number(r.costo_total || 0))}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.ultimo_mantenimiento}</td>
              </tr>
            )}
          />
        </div>
      )}

      {/* ── TAB: LOGÍSTICA ── */}
      {activeTab === 'logistica' && logistica && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Envíos por Estado" icon={<Truck className="h-4 w-4 text-blue-600" />}>
              {logistica.por_estado?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={logistica.por_estado} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                      dataKey="total" nameKey="estado"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {logistica.por_estado.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Envíos por Mes" icon={<TrendingUp className="h-4 w-4 text-green-600" />}
              onExport={() => exportCSV(`logistica_${fechaInicio}.csv`, ['Mes','Total','Entregados'], logistica.por_mes ?? [], ['mes','total','entregados'])}>
              {logistica.por_mes?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logistica.por_mes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="total" name="Total" fill="#93C5FD" radius={[3,3,0,0]} />
                    <Bar dataKey="entregados" name="Entregados" fill="#10B981" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <SimpleTable
            title="Desempeño por Transportista"
            columns={['Transportista','Envíos','Entregados','Devueltos','Tasa Entrega']}
            rows={logistica.por_transportista ?? []}
            renderRow={(r: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.transportista}</td>
                <td className="px-4 py-3 text-sm text-center">{r.total_envios}</td>
                <td className="px-4 py-3 text-sm text-center text-green-700 font-medium">{r.entregados}</td>
                <td className="px-4 py-3 text-sm text-center text-red-600">{r.devueltos}</td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`font-bold ${Number(r.tasa_entrega) >= 95 ? 'text-green-600' : Number(r.tasa_entrega) >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                    {r.tasa_entrega}%
                  </span>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      {/* ── TAB: COMPRAS ── */}
      {activeTab === 'compras' && compras && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Gasto de Compras por Mes" icon={<ShoppingCart className="h-4 w-4 text-blue-600" />}
              onExport={() => exportCSV(`compras_${fechaInicio}.csv`, ['Mes','Órdenes','Gasto'], compras.por_mes ?? [], ['mes','total_ordenes','gasto'])}>
              {compras.por_mes?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compras.por_mes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="gasto" name="Gasto" fill="#8B5CF6" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard title="Órdenes por Estado" icon={<BarChartIcon className="h-4 w-4 text-purple-600" />}>
              {compras.por_estado?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={compras.por_estado} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                      dataKey="total" nameKey="estado"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {compras.por_estado.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <SimpleTable
            title="Top Proveedores por Gasto"
            columns={['Proveedor','Órdenes','Gasto Total','Última Compra']}
            rows={compras.por_proveedor ?? []}
            renderRow={(r: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.proveedor}</td>
                <td className="px-4 py-3 text-sm text-center">{r.total_ordenes}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-purple-700">{fmt(Number(r.gasto_total))}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.ultima_compra}</td>
              </tr>
            )}
          />
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50 pointer-events-none">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}
    </div>
  )
}

/* ── Componentes reutilizables ── */
function ChartCard({ title, icon, children, onExport }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; onExport?: () => void
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">{icon}<h3 className="font-semibold text-sm">{title}</h3></div>
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-1 text-xs text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-50">
            <Download className="h-3 w-3" /> CSV
          </button>
        )}
      </div>
      <div className="h-64">{children}</div>
    </div>
  )
}

function EmptyChart() {
  return <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos en el período</div>
}

function SimpleTable({ title, columns, rows, renderRow }: {
  title: string; columns: string[]; rows: any[]; renderRow: (row: any, i: number) => React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
        <span className="text-xs text-gray-400">{rows.length} registros</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>{columns.map(c => <th key={c} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{c}</th>)}</tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.length === 0
              ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-400">Sin datos</td></tr>
              : rows.map(renderRow)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    en_produccion: 'bg-blue-100 text-blue-800',
    completada: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800',
  }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[estado] ?? 'bg-gray-100 text-gray-700'}`}>{estado?.replace('_', ' ')}</span>
}
