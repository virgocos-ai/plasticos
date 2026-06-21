import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';

const router = Router();

// Dashboard - Resumen general
router.get('/dashboard', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    // Build ventas query with optional date range
    let ventasQuery: string;
    let ventasReplacements: any;
    if (fecha_inicio && fecha_fin) {
      ventasQuery = `SELECT COALESCE(SUM(total), 0) as ventas_totales, COUNT(*) as total_facturas
         FROM facturas WHERE estado = 'timbrada' AND fecha_emision BETWEEN :fecha_inicio AND :fecha_fin`;
      ventasReplacements = { fecha_inicio, fecha_fin };
    } else {
      ventasQuery = `SELECT COALESCE(SUM(total), 0) as ventas_totales, COUNT(*) as total_facturas
         FROM facturas WHERE estado = 'timbrada'`;
      ventasReplacements = {};
    }

    const [ventas, ordenes, inventario, clientes] = await Promise.all([
      sequelize.query(ventasQuery, { replacements: ventasReplacements, type: QueryTypes.SELECT }),
      sequelize.query(
        `SELECT estado, COUNT(*) as total FROM ordenes_produccion GROUP BY estado`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT 
          (SELECT COUNT(*) FROM productos WHERE activo = 1) as total_productos,
          (SELECT COUNT(*) FROM materiales WHERE activo = 1) as total_materiales,
          (SELECT COUNT(*) FROM productos WHERE activo = 1 AND stock_actual <= stock_minimo) as productos_bajos,
          (SELECT COUNT(*) FROM materiales WHERE activo = 1 AND stock_actual_kg <= stock_minimo_kg) as materiales_bajos`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COUNT(*) as total_clientes FROM clientes WHERE activo = 1`,
        { type: QueryTypes.SELECT }
      )
    ]);

    res.json({
      ventas: ventas[0] || { ventas_totales: 0, total_facturas: 0 },
      ordenes_produccion: ordenes,
      inventario: inventario[0] || {},
      clientes: clientes[0] || { total_clientes: 0 }
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
});

// Reporte de ventas por período
router.get('/ventas', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, agrupar = 'dia' } = req.query;

    // Whitelist de formatos permitidos — nunca interpolar input del usuario en SQL
    const formatosPermitidos: Record<string, string> = {
      mes: '%Y-%m',
      semana: '%Y-%u',
      dia: '%Y-%m-%d',
    };
    const formatoFecha = formatosPermitidos[agrupar as string] ?? '%Y-%m-%d';

    const ventas = await sequelize.query(
      `SELECT
        DATE_FORMAT(fecha_emision, '${formatoFecha}') as periodo,
        COUNT(*) as total_facturas,
        SUM(subtotal) as subtotal,
        SUM(impuesto_trasladado) as iva,
        SUM(total) as total
      FROM facturas
      WHERE estado = 'timbrada'
        AND fecha_emision BETWEEN :fecha_inicio AND :fecha_fin
      GROUP BY DATE_FORMAT(fecha_emision, '${formatoFecha}')
      ORDER BY periodo`,
      {
        replacements: { fecha_inicio, fecha_fin },
        type: QueryTypes.SELECT
      }
    );

    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener reporte de ventas:', error);
    res.status(500).json({ error: 'Error al obtener reporte de ventas' });
  }
});

// Reporte de producción
router.get('/produccion', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, maquina } = req.query;
    
    const produccion = await sequelize.query(
      `SELECT 
        op.folio,
        op.fecha_orden,
        op.fecha_entrega,
        op.estado,
        op.maquina_asignada,
        op.turno,
        c.razon_social as cliente,
        opd.cantidad_solicitada,
        opd.cantidad_producida,
        opd.cantidad_defectuosa,
        p.nombre as producto,
        m.nombre as material,
        opd.tiempo_ciclo_real_seg,
        opd.temperatura_inyeccion_real,
        opd.presion_inyeccion_real
      FROM ordenes_produccion op
      LEFT JOIN clientes c ON op.cliente_id = c.id
      LEFT JOIN ordenes_produccion_detalle opd ON op.id = opd.orden_id
      LEFT JOIN productos p ON opd.producto_id = p.id
      LEFT JOIN materiales m ON opd.material_id = m.id
      WHERE op.fecha_orden BETWEEN :fecha_inicio AND :fecha_fin
        ${maquina ? 'AND op.maquina_asignada = :maquina' : ''}
      ORDER BY op.fecha_orden DESC`,
      {
        replacements: { fecha_inicio, fecha_fin, maquina },
        type: QueryTypes.SELECT
      }
    );

    res.json(produccion);
  } catch (error) {
    console.error('Error al obtener reporte de producción:', error);
    res.status(500).json({ error: 'Error al obtener reporte de producción' });
  }
});

// Top productos vendidos
router.get('/top-productos', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, limite = 10 } = req.query;
    // Sanitizar límite: entero entre 1 y 50
    const limiteSeguro = Math.min(50, Math.max(1, parseInt(limite as string) || 10));

    const topProductos = await sequelize.query(
      `SELECT
        p.codigo,
        p.nombre,
        SUM(fd.cantidad) as cantidad_vendida,
        SUM(fd.importe) as total_ventas
      FROM factura_detalles fd
      JOIN facturas f ON fd.factura_id = f.id
      JOIN productos p ON fd.producto_id = p.id
      WHERE f.estado = 'timbrada'
        AND f.fecha_emision BETWEEN :fecha_inicio AND :fecha_fin
      GROUP BY p.id, p.codigo, p.nombre
      ORDER BY cantidad_vendida DESC
      LIMIT :limite`,
      {
        replacements: { fecha_inicio, fecha_fin, limite: limiteSeguro },
        type: QueryTypes.SELECT
      }
    );

    res.json(topProductos);
  } catch (error) {
    console.error('Error al obtener top productos:', error);
    res.status(500).json({ error: 'Error al obtener top productos' });
  }
});

// ── Reporte de Inventario ──────────────────────────────────────────────────
router.get('/inventario', async (req, res) => {
  try {
    const [stockBajo, movimientos, porAlmacen] = await Promise.all([
      sequelize.query(
        `SELECT p.codigo, p.nombre, p.stock_actual, p.stock_minimo,
                (p.stock_actual - p.stock_minimo) AS diferencia, p.unidad_medida
         FROM productos p
         WHERE p.activo = 1 AND p.stock_actual <= p.stock_minimo
         ORDER BY diferencia ASC
         LIMIT 20`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT tipo_movimiento, COUNT(*) AS total,
                SUM(cantidad) AS cantidad_total
         FROM inventario_movimientos
         GROUP BY tipo_movimiento`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT a.nombre AS almacen,
                COUNT(DISTINCT im.producto_id) AS productos_distintos,
                SUM(im.cantidad) AS entradas_totales
         FROM inventario_movimientos im
         JOIN almacenes a ON im.almacen_id = a.id
         WHERE im.tipo_movimiento = 'entrada'
         GROUP BY a.id, a.nombre
         ORDER BY entradas_totales DESC`,
        { type: QueryTypes.SELECT }
      ),
    ]);
    res.json({ stock_bajo: stockBajo, movimientos_por_tipo: movimientos, por_almacen: porAlmacen });
  } catch (error) {
    console.error('Error reporte inventario:', error);
    res.status(500).json({ error: 'Error al obtener reporte de inventario' });
  }
});

// ── Reporte de Calidad ────────────────────────────────────────────────────
router.get('/calidad', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const [resumen, porProducto, porDefecto] = await Promise.all([
      sequelize.query(
        `SELECT resultado, COUNT(*) AS total
         FROM inspecciones_calidad
         WHERE fecha_inspeccion BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY resultado`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT p.nombre AS producto, COUNT(*) AS total_inspecciones,
                SUM(CASE WHEN ic.resultado = 'aprobado' THEN 1 ELSE 0 END) AS aprobados,
                SUM(CASE WHEN ic.resultado = 'rechazado' THEN 1 ELSE 0 END) AS rechazados,
                SUM(CASE WHEN ic.resultado = 'reproceso' THEN 1 ELSE 0 END) AS reprocesos,
                ROUND(SUM(CASE WHEN ic.resultado = 'aprobado' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS tasa_aprobacion
         FROM inspecciones_calidad ic
         JOIN productos p ON ic.producto_id = p.id
         WHERE ic.fecha_inspeccion BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY p.id, p.nombre
         ORDER BY rechazados DESC
         LIMIT 10`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT tipo_defecto, COUNT(*) AS total
         FROM inspecciones_calidad
         WHERE fecha_inspeccion BETWEEN :fecha_inicio AND :fecha_fin
           AND tipo_defecto IS NOT NULL
         GROUP BY tipo_defecto
         ORDER BY total DESC
         LIMIT 8`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
    ]);
    res.json({ resumen, por_producto: porProducto, por_defecto: porDefecto });
  } catch (error) {
    console.error('Error reporte calidad:', error);
    res.status(500).json({ error: 'Error al obtener reporte de calidad' });
  }
});

// ── Reporte de Mantenimiento ──────────────────────────────────────────────
router.get('/mantenimiento', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const [porTipo, porEquipo, costoMensual] = await Promise.all([
      sequelize.query(
        `SELECT tipo, COUNT(*) AS total,
                COALESCE(SUM(tiempo_paro_min), 0) AS minutos_paro,
                COALESCE(SUM(costo), 0) AS costo_total
         FROM mantenimiento_registros
         WHERE fecha BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY tipo`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT entidad_tipo, entidad_id, COUNT(*) AS total_mantenimientos,
                COALESCE(SUM(tiempo_paro_min), 0) AS minutos_paro,
                COALESCE(SUM(costo), 0) AS costo_total,
                MAX(fecha) AS ultimo_mantenimiento
         FROM mantenimiento_registros
         WHERE fecha BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY entidad_tipo, entidad_id
         ORDER BY costo_total DESC
         LIMIT 10`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes,
                COUNT(*) AS total,
                COALESCE(SUM(costo), 0) AS costo,
                COALESCE(SUM(tiempo_paro_min), 0) AS minutos_paro
         FROM mantenimiento_registros
         WHERE fecha BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY DATE_FORMAT(fecha, '%Y-%m')
         ORDER BY mes`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
    ]);
    res.json({ por_tipo: porTipo, por_equipo: porEquipo, por_mes: costoMensual });
  } catch (error) {
    console.error('Error reporte mantenimiento:', error);
    res.status(500).json({ error: 'Error al obtener reporte de mantenimiento' });
  }
});

// ── Reporte de Logística ──────────────────────────────────────────────────
router.get('/logistica', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const [porEstado, porTransportista, tiemposEntrega] = await Promise.all([
      sequelize.query(
        `SELECT estado, COUNT(*) AS total
         FROM envios
         WHERE fecha_envio BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY estado`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT t.nombre AS transportista, COUNT(e.id) AS total_envios,
                SUM(CASE WHEN e.estado = 'entregado' THEN 1 ELSE 0 END) AS entregados,
                SUM(CASE WHEN e.estado = 'devuelto' THEN 1 ELSE 0 END) AS devueltos,
                ROUND(SUM(CASE WHEN e.estado = 'entregado' THEN 1 ELSE 0 END) * 100.0 / COUNT(e.id), 1) AS tasa_entrega
         FROM envios e
         JOIN transportistas t ON e.transportista_id = t.id
         WHERE e.fecha_envio BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY t.id, t.nombre
         ORDER BY total_envios DESC`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DATE_FORMAT(fecha_envio, '%Y-%m') AS mes,
                COUNT(*) AS total,
                SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) AS entregados
         FROM envios
         WHERE fecha_envio BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY DATE_FORMAT(fecha_envio, '%Y-%m')
         ORDER BY mes`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
    ]);
    res.json({ por_estado: porEstado, por_transportista: porTransportista, por_mes: tiemposEntrega });
  } catch (error) {
    console.error('Error reporte logística:', error);
    res.status(500).json({ error: 'Error al obtener reporte de logística' });
  }
});

// ── Reporte de Compras ────────────────────────────────────────────────────
router.get('/compras', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const [porProveedor, porEstado, porMes] = await Promise.all([
      sequelize.query(
        `SELECT p.razon_social AS proveedor, COUNT(oc.id) AS total_ordenes,
                COALESCE(SUM(oc.total), 0) AS gasto_total,
                MAX(oc.fecha_orden) AS ultima_compra
         FROM ordenes_compra oc
         JOIN proveedores p ON oc.proveedor_id = p.id
         WHERE oc.fecha_orden BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY p.id, p.razon_social
         ORDER BY gasto_total DESC
         LIMIT 10`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT estado, COUNT(*) AS total,
                COALESCE(SUM(total), 0) AS monto
         FROM ordenes_compra
         WHERE fecha_orden BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY estado`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DATE_FORMAT(fecha_orden, '%Y-%m') AS mes,
                COUNT(*) AS total_ordenes,
                COALESCE(SUM(total), 0) AS gasto
         FROM ordenes_compra
         WHERE fecha_orden BETWEEN :fecha_inicio AND :fecha_fin
         GROUP BY DATE_FORMAT(fecha_orden, '%Y-%m')
         ORDER BY mes`,
        { replacements: { fecha_inicio, fecha_fin }, type: QueryTypes.SELECT }
      ),
    ]);
    res.json({ por_proveedor: porProveedor, por_estado: porEstado, por_mes: porMes });
  } catch (error) {
    console.error('Error reporte compras:', error);
    res.status(500).json({ error: 'Error al obtener reporte de compras' });
  }
});

export default router;

