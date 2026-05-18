import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';

const router = Router();

// Dashboard - Resumen general
router.get('/dashboard', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const whereFecha = fecha_inicio && fecha_fin 
      ? `AND fecha_emision BETWEEN '${fecha_inicio}' AND '${fecha_fin}'`
      : '';

    const queries = await Promise.all([
      // Ventas totales
      sequelize.query(
        `SELECT COALESCE(SUM(total), 0) as ventas_totales, COUNT(*) as total_facturas 
         FROM facturas WHERE estado = 'timbrada' ${whereFecha}`,
        { type: QueryTypes.SELECT }
      ),
      
      // Órdenes de producción
      sequelize.query(
        `SELECT estado, COUNT(*) as total 
         FROM ordenes_produccion 
         GROUP BY estado`,
        { type: QueryTypes.SELECT }
      ),
      
      // Inventario
      sequelize.query(
        `SELECT 
          (SELECT COUNT(*) FROM productos WHERE activo = 1) as total_productos,
          (SELECT COUNT(*) FROM materiales WHERE activo = 1) as total_materiales,
          (SELECT COUNT(*) FROM productos WHERE activo = 1 AND stock_actual <= stock_minimo) as productos_bajos,
          (SELECT COUNT(*) FROM materiales WHERE activo = 1 AND stock_actual_kg <= stock_minimo_kg) as materiales_bajos`,
        { type: QueryTypes.SELECT }
      ),
      
      // Clientes
      sequelize.query(
        `SELECT COUNT(*) as total_clientes FROM clientes WHERE activo = 1`,
        { type: QueryTypes.SELECT }
      )
    ]);

    res.json({
      ventas: queries[0][0],
      ordenes_produccion: queries[1],
      inventario: queries[2][0],
      clientes: queries[3][0]
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
    
    let formatoFecha;
    switch (agrupar) {
      case 'mes': formatoFecha = '%Y-%m'; break;
      case 'semana': formatoFecha = '%Y-%u'; break;
      default: formatoFecha = '%Y-%m-%d';
    }

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
      LIMIT ${limite}`,
      {
        replacements: { fecha_inicio, fecha_fin },
        type: QueryTypes.SELECT
      }
    );

    res.json(topProductos);
  } catch (error) {
    console.error('Error al obtener top productos:', error);
    res.status(500).json({ error: 'Error al obtener top productos' });
  }
});

export default router;
