import { Router } from 'express';
import { Op } from 'sequelize';
import { OrdenProduccion, OrdenProduccionDetalle, Cliente, Producto, Material, Usuario } from '../models';

const router = Router();

// Listar órdenes de producción
router.get('/', async (req, res) => {
  try {
    const { estado, fecha_inicio, fecha_fin } = req.query;
    const where: any = {};
    
    if (estado) where.estado = estado;
    if (fecha_inicio && fecha_fin) {
      where.fecha_orden = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const ordenes = await OrdenProduccion.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', required: false, attributes: ['razon_social'] },
        { model: Usuario, as: 'usuario', attributes: ['nombre'] }
      ],
      order: [['fecha_orden', 'DESC']]
    });
    
    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: 'Error al obtener órdenes de producción' });
  }
});

// Obtener orden por ID
router.get('/:id', async (req, res) => {
  try {
    const orden = await OrdenProduccion.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
        { 
          model: OrdenProduccionDetalle, 
          as: 'detalles',
          include: [
            { model: Producto, as: 'producto' },
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
    res.status(500).json({ error: 'Error al obtener orden de producción' });
  }
});

// Crear orden de producción
router.post('/', async (req, res) => {
  try {
    const { detalles, ...ordenData } = req.body;
    
    // Generar folio
    const fecha = new Date();
    const anio = fecha.getFullYear().toString().substr(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `OP${anio}${mes}`;
    
    const ultimaOrden = await OrdenProduccion.findOne({
      where: { folio: { [Op.like]: `${prefix}%` } },
      order: [['folio', 'DESC']]
    });
    
    const consecutivo = ultimaOrden 
      ? parseInt(ultimaOrden.folio.slice(-4)) + 1 
      : 1;
    const folio = `${prefix}${consecutivo.toString().padStart(4, '0')}`;
    
    const orden = await OrdenProduccion.create({
      ...ordenData,
      folio,
      estado: 'pendiente'
    });
    
    // Crear detalles
    await OrdenProduccionDetalle.bulkCreate(
      detalles.map((det: any) => ({
        ...det,
        orden_id: orden.id
      }))
    );
    
    res.status(201).json(orden);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden de producción' });
  }
});

// Actualizar estado de orden
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const orden = await OrdenProduccion.findByPk(req.params.id);
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    await orden.update({ estado });
    res.json(orden);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
});

// Actualizar producción (cantidades reales)
router.put('/:id/produccion', async (req, res) => {
  try {
    const { detalles } = req.body;
    
    for (const det of detalles) {
      await OrdenProduccionDetalle.update(
        {
          cantidad_producida: det.cantidad_producida,
          cantidad_defectuosa: det.cantidad_defectuosa,
          temperatura_inyeccion_real: det.temperatura_inyeccion_real,
          presion_inyeccion_real: det.presion_inyeccion_real,
          tiempo_ciclo_real_seg: det.tiempo_ciclo_real_seg
        },
        { where: { id: det.id } }
      );
    }
    
    res.json({ message: 'Producción actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar producción:', error);
    res.status(500).json({ error: 'Error al actualizar producción' });
  }
});

export default router;
