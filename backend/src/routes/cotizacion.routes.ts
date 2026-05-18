import { Router } from 'express';
import { Op } from 'sequelize';
import { Cotizacion, CotizacionDetalle, Cliente, Producto, Material, OrdenProduccion, OrdenProduccionDetalle } from '../models';
import sequelize from '../config/database';

const router = Router();

// Listar cotizaciones
router.get('/', async (req, res) => {
  try {
    const { estado, cliente_id, fecha_inicio, fecha_fin } = req.query;
    const where: any = {};
    
    if (estado) where.estado = estado;
    if (cliente_id) where.cliente_id = cliente_id;
    if (fecha_inicio && fecha_fin) {
      where.fecha_cotizacion = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const cotizaciones = await Cotizacion.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['razon_social', 'rfc'] }
      ],
      order: [['fecha_cotizacion', 'DESC']]
    });
    
    res.json(cotizaciones);
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
});

// Obtener cotización por ID
router.get('/:id', async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        {
          model: CotizacionDetalle,
          as: 'detalles',
          include: [
            { model: Producto, as: 'producto' },
            { model: Material, as: 'material' }
          ]
        }
      ]
    });
    
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    
    res.json(cotizacion);
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({ error: 'Error al obtener cotización' });
  }
});

// Crear cotización
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { detalles, ...cotizacionData } = req.body;
    
    // Generar folio
    const fecha = new Date();
    const anio = fecha.getFullYear().toString().substr(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `COT${anio}${mes}`;
    
    const ultimaCotizacion = await Cotizacion.findOne({
      where: { folio: { [Op.like]: `${prefix}%` } },
      order: [['folio', 'DESC']]
    });
    
    const consecutivo = ultimaCotizacion 
      ? parseInt(ultimaCotizacion.folio.slice(-4)) + 1 
      : 1;
    const folio = `${prefix}${consecutivo.toString().padStart(4, '0')}`;
    
    // Calcular totales
    let subtotal = 0;
    const detallesCalculados = detalles.map((det: any) => {
      const importe = (det.cantidad * det.precio_unitario) - det.descuento;
      subtotal += importe;
      return { ...det, importe };
    });
    
    const impuesto_trasladado = subtotal * 0.16;
    const total = subtotal + impuesto_trasladado;
    
    const cotizacion = await Cotizacion.create({
      ...cotizacionData,
      folio,
      subtotal,
      impuesto_trasladado,
      total
    }, { transaction });
    
    // Crear detalles
    await CotizacionDetalle.bulkCreate(
      detallesCalculados.map((det: any) => ({
        ...det,
        cotizacion_id: cotizacion.id
      })),
      { transaction }
    );
    
    await transaction.commit();
    res.status(201).json(cotizacion);
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear cotización:', error);
    res.status(500).json({ error: 'Error al crear cotización' });
  }
});

// Actualizar cotización
router.put('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { detalles, ...cotizacionData } = req.body;
    const cotizacion = await Cotizacion.findByPk(req.params.id);
    
    if (!cotizacion) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    
    // Recalcular totales si hay detalles
    if (detalles) {
      let subtotal = 0;
      const detallesCalculados = detalles.map((det: any) => {
        const importe = (det.cantidad * det.precio_unitario) - det.descuento;
        subtotal += importe;
        return { ...det, importe, cotizacion_id: cotizacion.id };
      });
      
      const impuesto_trasladado = subtotal * 0.16;
      const total = subtotal + impuesto_trasladado;
      
      await cotizacion.update({
        ...cotizacionData,
        subtotal,
        impuesto_trasladado,
        total
      }, { transaction });
      
      // Eliminar detalles antiguos y crear nuevos
      await CotizacionDetalle.destroy({
        where: { cotizacion_id: cotizacion.id },
        transaction
      });
      
      await CotizacionDetalle.bulkCreate(detallesCalculados, { transaction });
    } else {
      await cotizacion.update(cotizacionData, { transaction });
    }
    
    await transaction.commit();
    res.json(cotizacion);
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar cotización:', error);
    res.status(500).json({ error: 'Error al actualizar cotización' });
  }
});

// Cambiar estado de cotización
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const cotizacion = await Cotizacion.findByPk(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    
    await cotizacion.update({ estado });
    res.json(cotizacion);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// Convertir cotización a orden de producción
router.post('/:id/convertir', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const cotizacion = await Cotizacion.findByPk(req.params.id, {
      include: [{ model: CotizacionDetalle, as: 'detalles' }]
    });
    
    if (!cotizacion) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    if (cotizacion.estado === 'convertida') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Esta cotización ya fue convertida' });
    }

    // Generar folio para la orden de producción
    const fecha = new Date();
    const anio = fecha.getFullYear().toString().substr(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `OP${anio}${mes}`;
    const ultimaOrden = await OrdenProduccion.findOne({
      where: { folio: { [Op.like]: `${prefix}%` } },
      order: [['folio', 'DESC']]
    });
    const consecutivo = ultimaOrden ? parseInt(ultimaOrden.folio.slice(-4)) + 1 : 1;
    const folio = `${prefix}${consecutivo.toString().padStart(4, '0')}`;

    // Crear orden de producción
    const { fecha_entrega, maquina_asignada, turno, observaciones } = req.body;
    const usuario_id = (req as any).user?.id || 1;

    const orden = await OrdenProduccion.create({
      folio,
      cliente_id: cotizacion.cliente_id,
      cotizacion_id: cotizacion.id,
      fecha_entrega: fecha_entrega || null,
      maquina_asignada: maquina_asignada || null,
      turno: turno || 'matutino',
      estado: 'pendiente',
      prioridad: 'normal',
      observaciones: observaciones || `Generada desde cotización ${cotizacion.folio}`,
      usuario_id
    } as any, { transaction });

    // Crear detalles de la orden desde los detalles de la cotización
    const detalles = (cotizacion as any).detalles || [];
    if (detalles.length > 0) {
      await OrdenProduccionDetalle.bulkCreate(
        detalles.map((det: any) => ({
          orden_id: orden.id,
          producto_id: det.producto_id,
          material_id: det.material_id || null,
          cantidad_solicitada: det.cantidad,
          cantidad_producida: 0,
          cantidad_defectuosa: 0
        })),
        { transaction }
      );
    }

    // Marcar cotización como convertida
    await cotizacion.update({ estado: 'convertida' }, { transaction });

    await transaction.commit();
    res.status(201).json({
      message: `Orden de producción ${folio} creada correctamente`,
      orden_folio: folio,
      orden_id: orden.id
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al convertir cotización:', error);
    res.status(500).json({ error: 'Error al convertir cotización' });
  }
});

// Eliminar cotización
router.delete('/:id', async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findByPk(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    
    await cotizacion.destroy();
    res.json({ message: 'Cotización eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cotización:', error);
    res.status(500).json({ error: 'Error al eliminar cotización' });
  }
});

export default router;
