import logger from '../utils/logger';
import { Router } from 'express';
import { Op } from 'sequelize';
import { Cliente } from '../models';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Obtener todos los clientes (con paginación y búsqueda)
router.get('/', async (req, res) => {
  try {
    const { activo, search, page, limit } = req.query;
    const where: any = {};

    if (activo !== undefined) where.activo = activo === 'true';
    if (search) {
      where[Op.or] = [
        { razon_social: { [Op.like]: `%${search}%` } },
        { rfc: { [Op.like]: `%${search}%` } },
        { nombre_comercial: { [Op.like]: `%${search}%` } },
      ];
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 0; // 0 = sin límite

    const options: any = { where, order: [['razon_social', 'ASC']] };
    if (limitNum > 0) {
      options.limit = limitNum;
      options.offset = (pageNum - 1) * limitNum;
    }

    const { count, rows } = await Cliente.findAndCountAll(options);
    res.json({ data: rows, total: count, page: pageNum, limit: limitNum });
  } catch (error) {
    logger.error('Error al obtener clientes:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Obtener un cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    logger.error('Error al obtener cliente:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

const clienteSchema = {
  rfc:          { required: true, minLength: 12, maxLength: 13, label: 'RFC' },
  razon_social: { required: true, minLength: 3, maxLength: 200, label: 'Razón Social' },
  email:        { type: 'email' as const, label: 'Email' },
  codigo_postal:{ minLength: 5, maxLength: 5, label: 'Código Postal' },
};

// Crear cliente
router.post('/', validate(clienteSchema), async (req, res) => {
  try {
    const clienteData = req.body;

    const existingCliente = await Cliente.findOne({ where: { rfc: clienteData.rfc } });
    if (existingCliente) {
      return res.status(400).json({ error: 'Ya existe un cliente con ese RFC' });
    }

    const cliente = await Cliente.create(clienteData);
    res.status(201).json(cliente);
  } catch (error) {
    logger.error('Error al crear cliente:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await cliente.update(req.body);
    res.json(cliente);
  } catch (error) {
    logger.error('Error al actualizar cliente:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// Eliminar cliente (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await cliente.update({ activo: false });
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar cliente:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

export default router;
