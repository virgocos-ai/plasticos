import { Router } from 'express';
import { Op } from 'sequelize';
import { OrdenCompra, OrdenCompraDetalle, Proveedor, Material } from '../models';
import sequelize from '../config/database';

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

// Registrar recepción de material
router.post('/:id/recepcion', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { detalles } = req.body;
    const orden = await OrdenCompra.findByPk(req.params.id, {
      include: [{ model: OrdenCompraDetalle, as: 'detalles' }]
    });
    
    if (!orden) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    // Actualizar cantidades recibidas
    for (const det of detalles) {
      await OrdenCompraDetalle.update(
        { 
          cantidad_recibida: det.cantidad_recibida,
          estado: det.cantidad_recibida >= det.cantidad_solicitada ? 'completado' : 'parcial'
        },
        { where: { id: det.id }, transaction }
      );
    }
    
    // Verificar si todos los detalles están completos
    const detallesOrden = await OrdenCompraDetalle.findAll({
      where: { orden_compra_id: orden.id }
    });
    
    const todosCompletados = detallesOrden.every(d => 
      parseFloat(d.cantidad_recibida.toString()) >= parseFloat(d.cantidad_solicitada.toString())
    );
    
    await orden.update({
      estado: todosCompletados ? 'completada' : 'parcial'
    }, { transaction });
    
    await transaction.commit();
    res.json({ message: 'Recepción registrada correctamente' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar recepción:', error);
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
