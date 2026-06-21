import logger from '../utils/logger';
import { Router } from 'express';
import { Maquina, OrdenProduccion } from '../models';

const router = Router();

// Listar todas las máquinas
router.get('/', async (req, res) => {
  try {
    const { estado } = req.query;
    const where: any = {};
    
    if (estado) where.estado = estado;

    const maquinas = await Maquina.findAll({
      where,
      order: [['codigo', 'ASC']]
    });
    
    res.json(maquinas);
  } catch (error) {
    logger.error('Error al obtener máquinas:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener máquinas' });
  }
});

// Obtener máquina por ID
router.get('/:id', async (req, res) => {
  try {
    const maquina = await Maquina.findByPk(req.params.id, {
      include: [
        {
          model: OrdenProduccion,
          as: 'ordenesProduccion',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!maquina) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }
    
    res.json(maquina);
  } catch (error) {
    logger.error('Error al obtener máquina:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener máquina' });
  }
});

// Crear máquina
router.post('/', async (req, res) => {
  try {
    const maquina = await Maquina.create(req.body);
    res.status(201).json(maquina);
  } catch (error) {
    logger.error('Error al crear máquina:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al crear máquina' });
  }
});

// Actualizar máquina
router.put('/:id', async (req, res) => {
  try {
    const maquina = await Maquina.findByPk(req.params.id);
    
    if (!maquina) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }
    
    await maquina.update(req.body);
    res.json(maquina);
  } catch (error) {
    logger.error('Error al actualizar máquina:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al actualizar máquina' });
  }
});

// Eliminar máquina
router.delete('/:id', async (req, res) => {
  try {
    const maquina = await Maquina.findByPk(req.params.id);
    
    if (!maquina) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }
    
    await maquina.destroy();
    res.json({ message: 'Máquina eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar máquina:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al eliminar máquina' });
  }
});

// Cambiar estado de máquina
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const maquina = await Maquina.findByPk(req.params.id);
    
    if (!maquina) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }
    
    await maquina.update({ estado });
    res.json(maquina);
  } catch (error) {
    logger.error('Error al cambiar estado:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// Registrar mantenimiento
router.post('/:id/mantenimiento', async (req, res) => {
  try {
    const { fecha } = req.body;
    const maquina = await Maquina.findByPk(req.params.id);
    
    if (!maquina) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }
    
    const proximoMantenimiento = new Date(fecha);
    proximoMantenimiento.setMonth(proximoMantenimiento.getMonth() + 3);
    
    await maquina.update({
      ultimo_mantenimiento: fecha,
      proximo_mantenimiento: proximoMantenimiento,
      estado: 'activa'
    });
    
    res.json(maquina);
  } catch (error) {
    logger.error('Error al registrar mantenimiento:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al registrar mantenimiento' });
  }
});

export default router;
