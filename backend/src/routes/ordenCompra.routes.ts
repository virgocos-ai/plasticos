import { Router } from 'express';
import { Op } from 'sequelize';
import { OrdenCompra, OrdenCompraDetalle, Proveedor, Material, InventarioMovimiento } from '../models';
import sequelize from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Listar órdenes de compra
router.get('/', async (req, res) => {
  try {
    const { estado, proveedor_id, fecha_inicio, fecha_fin } = req.query;
    const where: any = {};
    
    if (estado) where.estado = estado;
    if (proveedor_id) where.proveedor_id = proveedor_id;
    if (fecha_inicio && fecha_fin) {
      where.fecha_orden = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const ordenes = await OrdenCompra.findAll({
      where,
      include: [
        { model: Proveedor, as: 'proveedor', attributes: ['razon_social', 'rfc'] }
      ],
      order: [['fecha_orden', 'DESC']]
    });
    
    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: 'Error al obtener órdenes de compra' });
  }
});

// Obtener orden por ID
router.get('/:id', async (req, res) => {
  try {
    const orden = await OrdenCompra.findByPk(req.params.id, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        {
          model: OrdenCompraDetalle,
          as: 'detalles',
          include: [
            { model: Material, as: 'material' }
          ]
        }
      ]
    });
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    res.json(orden);
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ error: 'Error al obtener orden de compra' });
  }
});

// Crear orden de compra
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { detalles, ...ordenData } = req.body;
    
    // Generar folio
    const fecha = new Date();
    const anio = fecha.getFullYear().toString().substr(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `OC${anio}${mes}`;
    
    const ultimaOrden = await OrdenCompra.findOne({
      where: { folio: { [Op.like]: `${prefix}%` } },
      order: [['folio', 'DESC']]
    });
    
    const consecutivo = ultimaOrden 
      ? parseInt(ultimaOrden.folio.slice(-4)) + 1 
      : 1;
    const folio = `${prefix}${consecutivo.toString().padStart(4, '0')}`;
    
    // Calcular totales
    let subtotal = 0;
    const detallesCalculados = detalles.map((det: any) => {
      const importe = (det.cantidad_solicitada * det.precio_unitario) - det.descuento;
      subtotal += importe;
      return { ...det, importe };
    });
    
    const impuesto_trasladado = subtotal * 0.16;
    const total = subtotal + impuesto_trasladado;
    
    const orden = await OrdenCompra.create({
      ...ordenData,
      folio,
      subtotal,
      impuesto_trasladado,
      total
    }, { transaction });
    
    // Crear detalles
    await OrdenCompraDetalle.bulkCreate(
      detallesCalculados.map((det: any) => ({
        ...det,
        orden_compra_id: orden.id
      })),
      { transaction }
    );
    
    await transaction.commit();
    res.status(201).json(orden);
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden de compra' });
  }
});

// Actualizar orden
router.put('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { detalles, ...ordenData } = req.body;
    const orden = await OrdenCompra.findByPk(req.params.id);
    
    if (!orden) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // Recalcular totales si hay detalles
    if (detalles) {
      let subtotal = 0;
      const detallesCalculados = detalles.map((det: any) => {
        const importe = (det.cantidad_solicitada * det.precio_unitario) - det.descuento;
        subtotal += importe;
        return { ...det, importe, orden_compra_id: orden.id };
      });
      
      const impuesto_trasladado = subtotal * 0.16;
      const total = subtotal + impuesto_trasladado;
      
      await orden.update({
        ...ordenData,
        subtotal,
        impuesto_trasladado,
        total
      }, { transaction });
      
      // Eliminar detalles antiguos y crear nuevos
      await OrdenCompraDetalle.destroy({
        where: { orden_compra_id: orden.id },
        transaction
      });
      
      await OrdenCompraDetalle.bulkCreate(detallesCalculados, { transaction });
    } else {
      await orden.update(ordenData, { transaction });
    }
    
    await transaction.commit();
    res.json(orden);
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
});

// Cambiar estado
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const orden = await OrdenCompra.findByPk(req.params.id);
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    await orden.update({ estado });
    res.json(orden);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// Registrar recepción de material → actualiza stock automáticamente
router.post('/:id/recepcion', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { detalles } = req.body;
    const usuario_id = (req as any).user?.id;

    if (!detalles || detalles.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Detalles de recepción requeridos' });
    }

    const orden = await OrdenCompra.findByPk(req.params.id, {
      include: [{ model: OrdenCompraDetalle, as: 'detalles' }]
    });

    if (!orden) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (!['enviada', 'parcial'].includes((orden as any).estado)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Solo se pueden recepcionar órdenes enviadas o parciales' });
    }

    const movimientos: any[] = [];

    for (const det of detalles) {
      const cantidadRecibida = parseFloat(det.cantidad_recibida) || 0;
      if (cantidadRecibida < 0) continue;

      // Actualizar detalle de la OC
      if (det.id) {
        const detOrden = await OrdenCompraDetalle.findByPk(det.id);
        if (detOrden) {
          const yaRecibido = parseFloat((detOrden as any).cantidad_recibida?.toString() || '0');
          const totalRecibido = yaRecibido + cantidadRecibida;
          await detOrden.update({
            cantidad_recibida: totalRecibido,
          }, { transaction });
        }
      }

      // ── Actualizar stock del material ──
      if (det.material_id && cantidadRecibida > 0) {
        const material = await Material.findByPk(det.material_id, { transaction });
        if (material) {
          const stockActual = parseFloat((material as any).stock_actual_kg?.toString() || '0');
          await material.update(
            { stock_actual_kg: stockActual + cantidadRecibida },
            { transaction }
          );

          // Registrar movimiento de inventario
          movimientos.push({
            material_id: det.material_id,
            tipo_movimiento: 'entrada',
            cantidad: cantidadRecibida,
            motivo: `Recepción OC ${(orden as any).folio}`,
            referencia_id: orden.id,
            referencia_tipo: 'orden_compra',
            usuario_id,
            fecha_movimiento: new Date()
          });
        }
      }
    }

    // Registrar movimientos de inventario en bulk
    if (movimientos.length > 0) {
      await InventarioMovimiento.bulkCreate(movimientos, { transaction });
    }

    // Verificar si todos los detalles están completos para cerrar la OC
    const detallesOrden = await OrdenCompraDetalle.findAll({
      where: { orden_compra_id: orden.id },
      transaction
    });

    const todosCompletados = detallesOrden.every(d =>
      parseFloat((d as any).cantidad_recibida?.toString() || '0') >= parseFloat((d as any).cantidad_solicitada?.toString() || '0')
    );

    await orden.update(
      { estado: todosCompletados ? 'completada' : 'parcial' },
      { transaction }
    );

    await transaction.commit();

    logger.info(`Recepción OC ${(orden as any).folio} registrada. Stock actualizado para ${movimientos.length} materiales.`);
    res.json({
      message: `Recepción registrada. Stock actualizado para ${movimientos.length} material(es).`,
      estado_orden: todosCompletados ? 'completada' : 'parcial'
    });
  } catch (error: any) {
    await transaction.rollback();
    logger.error('Error al registrar recepción OC', { error: error.message });
    res.status(500).json({ error: 'Error al registrar recepción' });
  }
});

// Eliminar orden
router.delete('/:id', async (req, res) => {
  try {
    const orden = await OrdenCompra.findByPk(req.params.id);
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    await orden.destroy();
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
});

export default router;
