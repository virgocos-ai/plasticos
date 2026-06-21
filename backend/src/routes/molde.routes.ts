import { Router } from 'express';
import { Op } from 'sequelize';
import { Molde, Producto, Maquina, MantenimientoRegistro } from '../models';
import logger from '../utils/logger';

const router = Router();

// Listar moldes
router.get('/', async (req, res) => {
  try {
    const { estado, producto_id, alerta } = req.query;
    const where: any = {};
    if (estado) where.estado = estado;
    if (producto_id) where.producto_id = producto_id;

    const moldes = await Molde.findAll({
      where,
      include: [
        { model: Producto as any, as: 'producto', attributes: ['codigo', 'nombre'] },
        { model: Maquina as any, as: 'maquina', attributes: ['codigo', 'nombre'] },
      ],
      order: [['codigo', 'ASC']]
    });

    // Filtrar alertas: disparos >= 80% de vida útil
    const resultado = alerta === 'true'
      ? (moldes as any[]).filter(m => m.disparos_actuales >= m.vida_util_disparos * 0.8)
      : moldes;

    res.json(resultado);
  } catch (error: any) {
    logger.error('Error al obtener moldes', { error: error.message });
    res.status(500).json({ error: 'Error al obtener moldes' });
  }
});

// Obtener molde por ID con historial de mantenimiento
router.get('/:id', async (req, res) => {
  try {
    const molde = await Molde.findByPk(req.params.id, {
      include: [
        { model: Producto as any, as: 'producto', attributes: ['codigo', 'nombre'] },
        { model: Maquina as any, as: 'maquina', attributes: ['codigo', 'nombre'] },
      ]
    });
    if (!molde) return res.status(404).json({ error: 'Molde no encontrado' });

    const mantenimientos = await MantenimientoRegistro.findAll({
      where: { entidad_tipo: 'molde', entidad_id: molde.id },
      order: [['fecha', 'DESC']]
    });

    res.json({ ...( molde as any).toJSON(), mantenimientos });
  } catch (error: any) {
    logger.error('Error al obtener molde', { error: error.message });
    res.status(500).json({ error: 'Error al obtener molde' });
  }
});

// Crear molde
router.post('/', async (req, res) => {
  try {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ error: 'El código es obligatorio' });

    const molde = await Molde.create(req.body);
    res.status(201).json(molde);
  } catch (error: any) {
    logger.error('Error al crear molde', { error: error.message });
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un molde con ese código' });
    }
    res.status(500).json({ error: 'Error al crear molde' });
  }
});

// Actualizar molde
router.put('/:id', async (req, res) => {
  try {
    const molde = await Molde.findByPk(req.params.id);
    if (!molde) return res.status(404).json({ error: 'Molde no encontrado' });
    await molde.update(req.body);
    res.json(molde);
  } catch (error: any) {
    logger.error('Error al actualizar molde', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar molde' });
  }
});

// Incrementar contador de disparos
router.post('/:id/disparos', async (req, res) => {
  try {
    const { disparos } = req.body;
    const molde = await Molde.findByPk(req.params.id);
    if (!molde) return res.status(404).json({ error: 'Molde no encontrado' });

    const nuevosDisparos = (molde as any).disparos_actuales + (parseInt(disparos) || 1);
    await molde.update({ disparos_actuales: nuevosDisparos });

    const pct = (nuevosDisparos / (molde as any).vida_util_disparos) * 100;
    const alerta = pct >= 80;

    res.json({
      disparos_actuales: nuevosDisparos,
      vida_util_disparos: (molde as any).vida_util_disparos,
      porcentaje_vida: pct.toFixed(1),
      alerta_mantenimiento: alerta
    });
  } catch (error: any) {
    logger.error('Error al actualizar disparos', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar disparos' });
  }
});

// Cambiar estado
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const molde = await Molde.findByPk(req.params.id);
    if (!molde) return res.status(404).json({ error: 'Molde no encontrado' });
    await molde.update({ estado });
    res.json(molde);
  } catch (error: any) {
    logger.error('Error al cambiar estado molde', { error: error.message });
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// Eliminar molde
router.delete('/:id', async (req, res) => {
  try {
    const molde = await Molde.findByPk(req.params.id);
    if (!molde) return res.status(404).json({ error: 'Molde no encontrado' });
    await molde.destroy();
    res.json({ message: 'Molde eliminado' });
  } catch (error: any) {
    logger.error('Error al eliminar molde', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar molde' });
  }
});

export default router;
