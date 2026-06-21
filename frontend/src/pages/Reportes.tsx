import { useEffect, useState } from 'react'
import { BarChart as BarChartIcon, Download, TrendingUp, Factory, Package, RefreshCw, DollarSign, ShoppingBag, FileSpreadsheet } from 'lucide-react'
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
  const csvHeaders = headers.join(',')
  const csvRows = rows.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))
  const csv = [csvHeaders, ...csvRows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}


export default function Reportes() {
  const [ventasData, setVentasData] = useState<any[]>([])
  const [produccionData, setProduccionData] = useState<any[]>([])
  const [topProductos, setTopProductos] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { loadReportes() }, [fechaInicio, fechaFin])

  const loadReportes = async () => {
    setLoading(true)
    try {
      const [ventas, produccion, top, dash] = await Promise.all([
        api.get(`/reportes/ventas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&agrupar=mes`),
        api.get(`/reportes/produccion?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        api.get(`/reportes/top-productos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&limite=8`),
        api.get(`/reportes/dashboard?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
      ])
      setVentasData(ventas.data)
      setProduccionData(produccion.data)
      setTopProductos(top.data)
      setDashboard(dash.data)
    } catch {
      toast.error('Error al cargar reportes')
    } finally { setLoading(false) }
  }

  const handleExportVentas = () => {
    if (!ventasData.length) { toast.error('No hay datos de ventas para exportar'); return }
    exportCSV(
      `ventas_${fechaInicio}_${fechaFin}.csv`,
      ['Período', 'Facturas', 'Subtotal', 'IVA', 'Total'],
      ventasData,
      ['periodo', 'total_facturas', 'subtotal', 'iva', 'total']
    )
    toast.success('Archivo descargado')
  }

  const handleExportProduccion = () => {
    if (!produccionData.length) { toast.error('No hay datos de producción para exportar'); return }
    exportCSV(
      `produccion_${fechaInicio}_${fechaFin}.csv`,
      ['Folio', 'Fecha', 'Cliente', 'Producto', 'Material', 'Máquina', 'Solicitada', 'Producida', 'Defectuosa', 'Estado'],
      produccionData,
      ['folio', 'fecha_orden', 'cliente', 'producto', 'material', 'maquina_asignada', 'cantidad_solicitada', 'cantidad_producida', 'cantidad_defectuosa', 'estado']
    )
    toast.success('Archivo descargado')
  }

  const handleExportTopProductos = () => {
    if (!topProductos.length) { toast.error('No hay datos para exportar'); return }
    exportCSV(
      `top_productos_${fechaInicio}_${fechaFin}.csv`,
      ['Código', 'Producto', 'Cantidad Vendida', 'Total Ventas'],
      topProductos,
      ['codigo', 'nombre', 'cantidad_vendida', 'total_ventas']
    )
    toast.success('Archivo descargado')
  }

  const handleExportExcel = () => {
    if (!ventasData.length && !produccionData.length && !topProductos.length) {
      toast.error('No hay datos para exportar')
      return
    }
    const wb = XLSX.utils.book_new()

    if (ventasData.length) {
      const wsVentas = XLSX.utils.aoa_to_sheet([
        ['Período', 'Facturas', 'Subtotal', 'IVA', 'Total'],
        ...ventasData.map((r: any) => [r.periodo, r.total_facturas, r.subtotal, r.iva, r.total])
      ])
      wsVentas['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas')
    }

    if (produccionData.length) {
      const wsProd = XLSX.utils.aoa_to_sheet([
        ['Folio', 'Fecha', 'Cliente', 'Producto', 'Material', 'Máquina', 'Solicitada', 'Producida', 'Defectuosa', 'Estado'],
        ...produccionData.map((r: any) => [r.folio, r.fecha_orden, r.cliente, r.producto, r.material, r.maquina_asignada, r.cantidad_solicitada, r.cantidad_producida, r.cantidad_defectuosa, r.estado])
      ])
      wsProd['!cols'] = [10, 12, 20, 20, 20, 16, 10, 10, 10, 12].map(wch => ({ wch }))
      XLSX.utils.book_append_sheet(wb, wsProd, 'Producción')
    }

    if (topProductos.length) {
      const wsTop = XLSX.utils.aoa_to_sheet([
        ['Código', 'Producto', 'Cantidad Vendida', 'Total Ventas'],
        ...topProductos.map((r: any) => [r.codigo, r.nombre, r.cantidad_vendida, r.total_ventas])
      ])
      wsTop['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 16 }, { wch: 16 }]
      XLSX.utils.book_append_sheet(wb, wsTop, 'Top Productos')
    }

    XLSX.writeFile(wb, `reporte_erp_${fechaInicio}_${fechaFin}.xlsx`)
    toast.success('Excel generado correctamente')
  }

  // Agrupar producción por máquina para gráfica de eficiencia
  const eficienciaMaquina = produccionData.reduce((acc: any[], row: any) => {
    const maq = row.maquina_asignada || 'Sin máquina'
    const existing = acc.find(a => a.maquina === maq)
    if (existing) {
      existing.producida += Number(row.cantidad_producida || 0)
      existing.defectuosa += Number(row.cantidad_defectuosa || 0)
    } else {
      acc.push({ maquina: maq, producida: Number(row.cantidad_producida || 0), defectuosa: Number(row.cantidad_defectuosa || 0) })
    }
    return acc
  }, [])

  const totalVentas = Number(dashboard?.ventas?.ventas_totales || 0)
  const totalFacturas = Number(dashboard?.ventas?.total_facturas || 0)
  const totalClientes = Number(dashboard?.clientes?.total_clientes || 0)
  const ordenesProduccion: any[] = dashboard?.ordenes_produccion || []
  const totalOrdenes = ordenesProduccion.reduce((s: number, o: any) => s + Number(o.total), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-sm text-gray-500 mt-0.5">Período seleccionado: {fechaInicio} → {fechaFin}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <span className="text-gray-400 text-sm">a</span>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <button onClick={loadReportes} className="flex items-center gap-1.5 border border-gray-300 px-3 py-2 rounded-md text-sm hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-md text-sm hover:bg-emerald-700">
            <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><DollarSign className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Ventas Timbradas</p>
              <p className="text-lg font-bold text-gray-900">{fmt(totalVentas)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><ShoppingBag className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Facturas Timbradas</p>
              <p className="text-lg font-bold text-gray-900">{totalFacturas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Factory className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Órdenes de Prod.</p>
              <p className="text-lg font-bold text-gray-900">{totalOrdenes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Clientes Activos</p>
              <p className="text-lg font-bold text-gray-900">{totalClientes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas fila 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Ventas por Mes</h3>
            </div>
            <button onClick={handleExportVentas} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 border border-green-200 rounded px-2 py-1 hover:bg-green-50">
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
          <div className="h-64">
            {ventasData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="subtotal" name="Subtotal" fill="#93C5FD" radius={[3,3,0,0]} />
                  <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos en el período</div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Factory className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Producción por Orden</h3>
            </div>
            <button onClick={handleExportProduccion} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 border border-green-200 rounded px-2 py-1 hover:bg-green-50">
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
          <div className="h-64">
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
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos en el período</div>
            )}
          </div>
        </div>
      </div>

      {/* Gráficas fila 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-sm">Top Productos Vendidos</h3>
            </div>
            <button onClick={handleExportTopProductos} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 border border-green-200 rounded px-2 py-1 hover:bg-green-50">
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
          <div className="h-64">
            {topProductos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topProductos} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                    dataKey="cantidad_vendida" nameKey="nombre" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false} fontSize={10}
                  >
                    {topProductos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, _: any, p: any) => [`${v} uds`, p.payload.nombre]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos en el período</div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChartIcon className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold text-sm">Eficiencia por Máquina</h3>
          </div>
          <div className="h-64">
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
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos en el período</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla detalle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Top Productos — Detalle</h3>
          <span className="text-xs text-gray-400">{topProductos.length} productos</span>
        </div>
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant. Vendida</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Ventas</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {topProductos.length > 0 ? topProductos.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.codigo}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nombre}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">{Number(p.cantidad_vendida).toLocaleString('es-MX')}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">{fmt(parseFloat(p.total_ventas))}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No hay datos disponibles en el período seleccionado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
