import { Router } from 'express';
import { Op } from 'sequelize';
import { Operador, OrdenProduccion } from '../models';

const router = Router();

// Listar todos los operadores
router.get('/', async (req, res) => {
  try {
    const { estado, turno } = req.query;
    const where: any = {};
    
    if (estado) where.estado = estado;
    if (turno) where.turno = turno;

    const operadores = await Operador.findAll({
      where,
      order: [['nombre', 'ASC']]
    });
    
    res.json(operadores);
  } catch (error) {
    console.error('Error al obtener operadores:', error);
    res.status(500).json({ error: 'Error al obtener operadores' });
  }
});

// Obtener operador por ID
router.get('/:id', async (req, res) => {
  try {
    const operador = await Operador.findByPk(req.params.id, {
      include: [
        {
          model: OrdenProduccion,
          as: 'ordenesProduccion',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!operador) {
      return res.status(404).json({ error: 'Operador no encontrado' });
    }
    
    res.json(operador);
  } catch (error) {
    console.error('Error al obtener operador:', error);
    res.status(500).json({ error: 'Error al obtener operador' });
  }
});

// Crear operador
router.post('/', async (req, res) => {
  try {
    const operador = await Operador.create(req.body);
    res.status(201).json(operador);
  } catch (error) {
    console.error('Error al crear operador:', error);
    res.status(500).json({ error: 'Error al crear operador' });
  }
});

// Actualizar operador
router.put('/:id', async (req, res) => {
  try {
    const operador = await Operador.findByPk(req.params.id);
    
    if (!operador) {
      return res.status(404).json({ error: 'Operador no encontrado' });
    }
    
    await operador.update(req.body);
    res.json(operador);
  } catch (error) {
    console.error('Error al actualizar operador:', error);
    res.status(500).json({ error: 'Error al actualizar operador' });
  }
});

// Eliminar operador
router.delete('/:id', async (req, res) => {
  try {
    const operador = await Operador.findByPk(req.params.id);
    
    if (!operador) {
      return res.status(404).json({ error: 'Operador no encontrado' });
    }
    
    await operador.destroy();
    res.json({ message: 'Operador eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar operador:', error);
    res.status(500).json({ error: 'Error al eliminar operador' });
  }
});

// Cambiar estado de operador
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const operador = await Operador.findByPk(req.params.id);
    
    if (!operador) {
      return res.status(404).json({ error: 'Operador no encontrado' });
    }
    
    await operador.update({ estado });
    res.json(operador);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// Producción por operador
router.get('/:id/produccion', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    const whereOp: any = {
      operador_id: req.params.id,
      estado: 'completada'
    };
    if (fecha_inicio && fecha_fin) {
      whereOp.fecha_orden = { [Op.between]: [fecha_inicio, fecha_fin] };
    }
    const ordenes = await OrdenProduccion.findAll({
      where: whereOp,
      order: [['fecha_orden', 'DESC']]
    });
    
    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener producción:', error);
    res.status(500).json({ error: 'Error al obtener producción' });
  }
});

export default router;
