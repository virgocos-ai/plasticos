import logger from '../utils/logger';
import { Router } from 'express';
import { Proveedor } from '../models';

const router = Router();

// Obtener todos los proveedores
router.get('/', async (req, res) => {
  try {
    const { activo = true } = req.query;
    const proveedores = await Proveedor.findAll({
      where: { activo: activo === 'true' },
      order: [['razon_social', 'ASC']]
    });
    res.json(proveedores);
  } catch (error) {
    logger.error('Error al obtener proveedores:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

// Obtener un proveedor por ID
router.get('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.json(proveedor);
  } catch (error) {
    logger.error('Error al obtener proveedor:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
});

// Crear proveedor
router.post('/', async (req, res) => {
  try {
    const proveedorData = req.body;
    
    // Validar RFC
    if (!proveedorData.rfc || proveedorData.rfc.length < 12) {
      return res.status(400).json({ error: 'RFC inválido' });
    }

    const existingProveedor = await Proveedor.findOne({ 
      where: { rfc: proveedorData.rfc } 
    });
    if (existingProveedor) {
      return res.status(400).json({ error: 'Ya existe un proveedor con ese RFC' });
    }

    const proveedor = await Proveedor.create(proveedorData);
    res.status(201).json(proveedor);
  } catch (error) {
    logger.error('Error al crear proveedor:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

// Actualizar proveedor
router.put('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    await proveedor.update(req.body);
    res.json(proveedor);
  } catch (error) {
    logger.error('Error al actualizar proveedor:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

// Eliminar proveedor (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    await proveedor.update({ activo: false });
    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar proveedor:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

export default router;
