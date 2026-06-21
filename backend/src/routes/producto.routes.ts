import logger from '../utils/logger';
import { Router } from 'express';
import { Producto, Material } from '../models';

const router = Router();

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { tipo, activo = 'true' } = req.query;
    const where: any = { activo: activo !== 'false' };
    if (tipo) where.tipo = tipo;

    const productos = await Producto.findAll({
      where,
      include: [
        { model: Material, as: 'materialPrincipal', required: false }
      ],
      order: [['nombre', 'ASC']]
    });
    res.json(productos);
  } catch (error) {
    logger.error('Error al obtener productos:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [
        { model: Material, as: 'materialPrincipal', required: false }
      ]
    });
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    logger.error('Error al obtener producto:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// Crear producto
router.post('/', async (req, res) => {
  try {
    const productoData = req.body;
    
    // Validar código único
    const existingProducto = await Producto.findOne({ 
      where: { codigo: productoData.codigo } 
    });
    if (existingProducto) {
      return res.status(400).json({ error: 'Ya existe un producto con ese código' });
    }

    const producto = await Producto.create(productoData);
    res.status(201).json(producto);
  } catch (error) {
    logger.error('Error al crear producto:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.update(req.body);
    res.json(producto);
  } catch (error) {
    logger.error('Error al actualizar producto:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Eliminar producto (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.update({ activo: false });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar producto:', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
