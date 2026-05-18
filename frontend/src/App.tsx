import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Proveedores from './pages/Proveedores'
import Productos from './pages/Productos'
import Materiales from './pages/Materiales'
import OrdenesProduccion from './pages/OrdenesProduccion'
import Facturas from './pages/Facturas'
import Inventario from './pages/Inventario'
import Reportes from './pages/Reportes'
import RegimenesFiscales from './pages/RegimenesFiscales'
import Almacenes from './pages/Almacenes'
import Lotes from './pages/Lotes'
import Configuracion from './pages/Configuracion'
import Maquinas from './pages/Maquinas'
import Operadores from './pages/Operadores'
import Cotizaciones from './pages/Cotizaciones'
import OrdenesCompra from './pages/OrdenesCompra'
import Calidad from './pages/Calidad'
import Usuarios from './pages/Usuarios'
import OrdenProduccionDetalle from './pages/OrdenProduccionDetalle'
import Login from './pages/Login'
import { useAuthStore } from './store/authStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  return token ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="productos" element={<Productos />} />
          <Route path="materiales" element={<Materiales />} />
          <Route path="ordenes-produccion" element={<OrdenesProduccion />} />
          <Route path="ordenes-produccion/:id" element={<OrdenProduccionDetalle />} />
          <Route path="facturas" element={<Facturas />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="regimenes-fiscales" element={<RegimenesFiscales />} />
          <Route path="almacenes" element={<Almacenes />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="lotes" element={<Lotes />} />
          <Route path="maquinas" element={<Maquinas />} />
          <Route path="operadores" element={<Operadores />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="ordenes-compra" element={<OrdenesCompra />} />
          <Route path="calidad" element={<Calidad />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
