import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import sequelize from './config/database';
import { verifyToken, requireRole } from './middleware/auth.middleware';
import logger from './utils/logger';
import { setupSwagger } from './docs/swagger';

// Importar rutas
import authRoutes from './routes/auth.routes';
import clienteRoutes from './routes/cliente.routes';
import proveedorRoutes from './routes/proveedor.routes';
import productoRoutes from './routes/producto.routes';
import facturaRoutes from './routes/factura.routes';
import ordenProduccionRoutes from './routes/ordenProduccion.routes';
import inventarioRoutes from './routes/inventario.routes';
import cfdiRoutes from './routes/cfdi.routes';
import catalogoRoutes from './routes/catalogo.routes';
import reporteRoutes from './routes/reporte.routes';
import regimenFiscalRoutes from './routes/regimenFiscal.routes';
import almacenRoutes from './routes/almacen.routes';
import materialRoutes from './routes/material.routes';
import loteRoutes from './routes/lote.routes';
import configuracionRoutes from './routes/configuracion.routes';
import maquinaRoutes from './routes/maquina.routes';
import operadorRoutes from './routes/operador.routes';
import cotizacionRoutes from './routes/cotizacion.routes';
import ordenCompraRoutes from './routes/ordenCompra.routes';
import calidadRoutes from './routes/calidad.routes';
import usuarioRoutes from './routes/usuario.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite por IP
});
app.use('/api/', limiter);

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
// Documentación Swagger
setupSwagger(app);

// Middleware de logging de requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip
    });
  });
  next();
});

// Rutas públicas
app.use('/api/auth', authRoutes);
app.use('/api/catalogos', catalogoRoutes);

// Rutas protegidas por rol
// Admin: acceso total
// Contador: facturas, reportes, regimenes fiscales
// Almacen: inventario, almacenes, lotes, materiales
// Operador: lectura general, órdenes de producción
app.use('/api/clientes', verifyToken, clienteRoutes);
app.use('/api/proveedores', verifyToken, proveedorRoutes);
app.use('/api/productos', verifyToken, productoRoutes);
app.use('/api/facturas', verifyToken, requireRole('admin', 'contador'), facturaRoutes);
app.use('/api/ordenes-produccion', verifyToken, ordenProduccionRoutes);
app.use('/api/inventario', verifyToken, requireRole('admin', 'almacen', 'operador'), inventarioRoutes);
app.use('/api/cfdi', verifyToken, requireRole('admin', 'contador'), cfdiRoutes);
app.use('/api/reportes', verifyToken, requireRole('admin', 'contador'), reporteRoutes);
app.use('/api/regimenes-fiscales', verifyToken, requireRole('admin', 'contador'), regimenFiscalRoutes);
app.use('/api/almacenes', verifyToken, requireRole('admin', 'almacen'), almacenRoutes);
app.use('/api/materiales', verifyToken, requireRole('admin', 'almacen'), materialRoutes);
app.use('/api/lotes', verifyToken, requireRole('admin', 'almacen'), loteRoutes);
app.use('/api/configuracion', verifyToken, requireRole('admin'), configuracionRoutes);
app.use('/api/maquinas', verifyToken, maquinaRoutes);
app.use('/api/operadores', verifyToken, operadorRoutes);
app.use('/api/cotizaciones', verifyToken, cotizacionRoutes);
app.use('/api/ordenes-compra', verifyToken, requireRole('admin', 'almacen'), ordenCompraRoutes);
app.use('/api/calidad', verifyToken, calidadRoutes);
app.use('/api/usuarios', verifyToken, requireRole('admin'), usuarioRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error 404
app.use((req, res) => {
  logger.warn(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error interno del servidor', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Sincronizar base de datos y arrancar servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a MySQL establecida correctamente.');
    
    // Sincronizar modelos (en desarrollo) - sync() sin alter para evitar errores de FK en MySQL
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      logger.info('Modelos sincronizados.');
    }
    
    app.listen(PORT, () => {
      logger.info(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error: any) {
    logger.error('Error al conectar con la base de datos', { error: error.message });
    process.exit(1);
  }
};

startServer();
