import { Router } from 'express';
import { RecetaInyeccion, Producto, Material, Molde, Maquina } from '../models';
import logger from '../utils/logger';

const router = Router();

// Listar recetas
router.get('/', async (req, res) => {
  try {
    const { producto_id, activa } = req.query;
    const where: any = {};
    if (producto_id) where.producto_id = producto_id;
    if (activa !== undefined) where.activa = activa === 'true';

    const recetas = await RecetaInyeccion.findAll({
      where,
      include: [
        { model: Producto as any, as: 'producto', attributes: ['codigo', 'nombre'] },
        { model: Material as any, as: 'material', attributes: ['codigo', 'nombre', 'tipo'] },
        { model: Molde as any, as: 'molde', attributes: ['codigo', 'nombre', 'numero_cavidades'] },
        { model: Maquina as any, as: 'maquina', attributes: ['codigo', 'nombre', 'capacidad_ton'] },
      ],
      order: [['codigo', 'ASC']]
    });

    res.json(recetas);
  } catch (error: any) {
    logger.error('Error al obtener recetas', { error: error.message });
    res.status(500).json({ error: 'Error al obtener recetas' });
  }
});

// Obtener receta por ID
router.get('/:id', async (req, res) => {
  try {
    const receta = await RecetaInyeccion.findByPk(req.params.id, {
      include: [
        { model: Producto as any, as: 'producto' },
        { model: Material as any, as: 'material' },
        { model: Molde as any, as: 'molde' },
        { model: Maquina as any, as: 'maquina' },
      ]
    });
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' });
    res.json(receta);
  } catch (error: any) {
    logger.error('Error al obtener receta', { error: error.message });
    res.status(500).json({ error: 'Error al obtener receta' });
  }
});

// Crear receta
router.post('/', async (req, res) => {
  try {
    const receta = await RecetaInyeccion.create(req.body);
    res.status(201).json(receta);
  } catch (error: any) {
    logger.error('Error al crear receta', { error: error.message });
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe una receta con ese código' });
    }
    res.status(500).json({ error: 'Error al crear receta' });
  }
});

// Actualizar receta
router.put('/:id', async (req, res) => {
  try {
    const receta = await RecetaInyeccion.findByPk(req.params.id);
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' });
    const { version, ...data } = req.body;
    // Incrementar versión automáticamente
    await receta.update({ ...data, version: (receta as any).version + 1 });
    res.json(receta);
  } catch (error: any) {
    logger.error('Error al actualizar receta', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar receta' });
  }
});

// Duplicar receta
router.post('/:id/duplicar', async (req, res) => {
  try {
    const original = await RecetaInyeccion.findByPk(req.params.id);
    if (!original) return res.status(404).json({ error: 'Receta no encontrada' });

    const data = (original as any).toJSON();
    delete data.id;
    data.codigo = `${data.codigo}-COPIA-${Date.now().toString().slice(-4)}`;
    data.nombre = `${data.nombre} (Copia)`;
    data.activa = false;
    data.version = 1;

    const nueva = await RecetaInyeccion.create(data);
    res.status(201).json(nueva);
  } catch (error: any) {
    logger.error('Error al duplicar receta', { error: error.message });
    res.status(500).json({ error: 'Error al duplicar receta' });
  }
});

// Activar/desactivar receta
router.put('/:id/activa', async (req, res) => {
  try {
    const receta = await RecetaInyeccion.findByPk(req.params.id);
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' });
    await receta.update({ activa: req.body.activa });
    res.json(receta);
  } catch (error: any) {
    logger.error('Error al cambiar estado receta', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar receta' });
  }
});

// Eliminar receta
router.delete('/:id', async (req, res) => {
  try {
    const receta = await RecetaInyeccion.findByPk(req.params.id);
    if (!receta) return res.status(404).json({ error: 'Receta no encontrada' });
    await receta.destroy();
    res.json({ message: 'Receta eliminada' });
  } catch (error: any) {
    logger.error('Error al eliminar receta', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar receta' });
  }
});

export default router;
