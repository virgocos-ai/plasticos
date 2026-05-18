import { Router } from 'express';
import { Op } from 'sequelize';
import { InventarioMovimiento, Producto, Material } from '../models';
import sequelize from '../config/database';

const router = Router();

// Obtener inventario actual de productos
router.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.findAll({
      where: { activo: true },
      attributes: [
        'id', 'codigo', 'nombre', 'unidad_medida',
        'stock_actual', 'stock_minimo', 'stock_maximo',
        'costo_material_unitario', 'precio_venta'
      ],
      order: [['nombre', 'ASC']]
    });
    
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener inventario de productos:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// Obtener inventario actual de materiales
router.get('/materiales', async (req, res) => {
  try {
    const materiales = await Material.findAll({
      where: { activo: true },
      attributes: [
        'id', 'codigo', 'nombre', 'tipo', 'marca', 'color',
        'stock_actual_kg', 'stock_minimo_kg', 'stock_maximo_kg',
        'costo_por_kg'
      ],
      order: [['nombre', 'ASC']]
    });
    
    res.json(materiales);
  } catch (error) {
    console.error('Error al obtener inventario de materiales:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// Movimientos de inventario
router.get('/movimientos', async (req, res) => {
  try {
    const { tipo, producto_id, material_id, fecha_inicio, fecha_fin } = req.query;
    const where: any = {};
    
    if (tipo) where.tipo = tipo;
    if (producto_id) where.producto_id = producto_id;
    if (material_id) where.material_id = material_id;
    if (fecha_inicio && fecha_fin) {
      where.created_at = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const movimientos = await InventarioMovimiento.findAll({
      where,
      include: [
        { model: Producto, as: 'producto', required: false, attributes: ['codigo', 'nombre'] },
        { model: Material, as: 'material', required: false, attributes: ['codigo', 'nombre'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 100
    });
    
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

// Crear movimiento de inventario
router.post('/movimientos', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { tipo, producto_id, material_id, cantidad, motivo, usuario_id } = req.body;
    
    // Crear movimiento
    const movimiento = await InventarioMovimiento.create({
      tipo,
      producto_id,
      material_id,
      cantidad: tipo === 'salida' || tipo === 'merma' ? -Math.abs(cantidad) : Math.abs(cantidad),
      motivo,
      usuario_id
    }, { transaction });
    
    // Actualizar stock
    if (producto_id) {
      const producto = await Producto.findByPk(producto_id, { transaction });
      if (producto) {
        const nuevoStock = parseFloat(producto.stock_actual.toString()) + 
          (tipo === 'salida' || tipo === 'merma' ? -Math.abs(parseFloat(cantidad)) : Math.abs(parseFloat(cantidad)));
        await producto.update({ stock_actual: nuevoStock }, { transaction });
      }
    }
    
    if (material_id) {
      const material = await Material.findByPk(material_id, { transaction });
      if (material) {
        const nuevoStock = parseFloat(material.stock_actual_kg.toString()) + 
          (tipo === 'salida' || tipo === 'merma' ? -Math.abs(parseFloat(cantidad)) : Math.abs(parseFloat(cantidad)));
        await material.update({ stock_actual_kg: nuevoStock }, { transaction });
      }
    }
    
    await transaction.commit();
    res.status(201).json(movimiento);
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ error: 'Error al crear movimiento de inventario' });
  }
});

// Productos con stock bajo
router.get('/alertas', async (req, res) => {
  try {
    const productosBajos = await Producto.findAll({
      where: sequelize.where(
        sequelize.col('stock_actual'),
        { [Op.lte]: sequelize.col('stock_minimo') }
      ) as any,
      attributes: ['id', 'codigo', 'nombre', 'stock_actual', 'stock_minimo']
    });
    
    const materialesBajos = await Material.findAll({
      where: sequelize.where(
        sequelize.col('stock_actual_kg'),
        { [Op.lte]: sequelize.col('stock_minimo_kg') }
      ) as any,
      attributes: ['id', 'codigo', 'nombre', 'tipo', 'stock_actual_kg', 'stock_minimo_kg']
    });
    
    res.json({
      productos_bajos: productosBajos,
      materiales_bajos: materialesBajos,
      total_alertas: productosBajos.length + materialesBajos.length
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ error: 'Error al obtener alertas de inventario' });
  }
});

export default router;
