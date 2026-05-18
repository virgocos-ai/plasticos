import { useEffect, useState } from 'react'
import { BarChart as BarChartIcon, Download, Calendar, TrendingUp, Factory, Package } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function Reportes() {
  const [ventasData, setVentasData] = useState([])
  const [produccionData, setProduccionData] = useState([])
  const [topProductos, setTopProductos] = useState([])
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadReportes()
  }, [fechaInicio, fechaFin])

  const loadReportes = async () => {
    try {
      const [ventas, produccion, top] = await Promise.all([
        api.get(`/reportes/ventas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&agrupar=mes`),
        api.get(`/reportes/produccion?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        api.get(`/reportes/top-productos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&limite=10`)
      ])
      setVentasData(ventas.data)
      setProduccionData(produccion.data)
      setTopProductos(top.data)
    } catch (error) {
      toast.error('Error al cargar reportes')
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="border border-gray-300 rounded-md p-2"
            />
            <span className="text-gray-500">a</span>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="border border-gray-300 rounded-md p-2"
            />
          </div>
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Ventas por Período</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value?.toLocaleString('es-MX')}`} />
                <Legend />
                <Bar dataKey="total" name="Ventas" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Factory className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Producción</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={produccionData.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="folio" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cantidad_solicitada" name="Solicitada" stroke="#3B82F6" />
                <Line type="monotone" dataKey="cantidad_producida" name="Producida" stroke="#10B981" />
                <Line type="monotone" dataKey="cantidad_defectuosa" name="Defectuosa" stroke="#EF4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Top Productos Vendidos</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProductos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nombre, porcentaje }) => `${nombre}: ${porcentaje}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cantidad_vendida"
                  nameKey="nombre"
                >
                  {topProductos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string, props: any) => [`${value} unidades`, props.payload.nombre]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <BarChartIcon className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">Eficiencia de Producción</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={produccionData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="maquina_asignada" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad_producida" name="Producida" fill="#10B981" />
                <Bar dataKey="cantidad_defectuosa" name="Defectuosa" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Top Productos Vendidos - Detalle</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad Vendida</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Ventas</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topProductos.length > 0 ? topProductos.map((producto, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.codigo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{producto.cantidad_vendida}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(producto.total_ventas).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              </tr>
            )) : (
              <tr>
                <td className="px-6 py-4 text-sm text-gray-500" colSpan={4}>No hay datos disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
