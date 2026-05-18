import { Router } from 'express';
import { Material } from '../models';
import logger from '../utils/logger';

const router = Router();

// GET /api/materiales - Listar todos los materiales
router.get('/', async (req, res) => {
  try {
    const materiales = await Material.findAll({
      where: { activo: true },
      order: [['codigo', 'ASC']],
    });
    res.json(materiales);
  } catch (error) {
    logger.error('Error al obtener materiales', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
});

// GET /api/materiales/all - Listar todos incluyendo inactivos
router.get('/all', async (req, res) => {
  try {
    const materiales = await Material.findAll({
      order: [['codigo', 'ASC']],
    });
    res.json(materiales);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
});

// GET /api/materiales/:id - Obtener un material
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener material' });
  }
});

// POST /api/materiales - Crear material
router.post('/', async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      tipo,
      unidad_medida,
      peso_kg_bolsa,
      costo_por_kg,
      stock_actual_kg,
      stock_minimo_kg,
      stock_maximo_kg,
      proveedor_preferido_id,
      temperatura_inyeccion_c,
      temperatura_molde_c,
      presion_inyeccion_bar,
      tiempo_ciclo_seg,
    } = req.body;

    // Validaciones
    if (!codigo || !nombre || !tipo || !unidad_medida) {
      return res.status(400).json({ error: 'Código, nombre, tipo y unidad de medida son requeridos' });
    }

    // Verificar código único
    const existing = await Material.findOne({ where: { codigo } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un material con ese código' });
    }

    const material = await Material.create({
      codigo,
      nombre,
      tipo,
      unidad_medida,
      peso_kg_bolsa: peso_kg_bolsa || 0,
      costo_por_kg: costo_por_kg || 0,
      stock_actual_kg: stock_actual_kg || 0,
      stock_minimo_kg: stock_minimo_kg || 0,
      stock_maximo_kg: stock_maximo_kg || 0,
      proveedor_preferido_id,
      temperatura_inyeccion_c,
      temperatura_molde_c,
      presion_inyeccion_bar,
      tiempo_ciclo_seg,
      activo: true,
    });

    res.status(201).json(material);
  } catch (error) {
    logger.error('Error al crear material', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al crear material' });
  }
});

// PUT /api/materiales/:id - Actualizar material
router.put('/:id', async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    const {
      codigo,
      nombre,
      tipo,
      unidad_medida,
      peso_kg_bolsa,
      costo_por_kg,
      stock_actual_kg,
      stock_minimo_kg,
      stock_maximo_kg,
      proveedor_preferido_id,
      temperatura_inyeccion_c,
      temperatura_molde_c,
      presion_inyeccion_bar,
      tiempo_ciclo_seg,
      activo,
    } = req.body;

    // Verificar código único si se cambia
    if (codigo && codigo !== material.codigo) {
      const existing = await Material.findOne({ where: { codigo } });
      if (existing) {
        return res.status(400).json({ error: 'Ya existe otro material con ese código' });
      }
    }

    await material.update({
      codigo: codigo || material.codigo,
      nombre: nombre || material.nombre,
      tipo: tipo || material.tipo,
      unidad_medida: unidad_medida || material.unidad_medida,
      peso_kg_bolsa: peso_kg_bolsa !== undefined ? peso_kg_bolsa : material.peso_kg_bolsa,
      costo_por_kg: costo_por_kg !== undefined ? costo_por_kg : material.costo_por_kg,
      stock_minimo_kg: stock_minimo_kg !== undefined ? stock_minimo_kg : material.stock_minimo_kg,
      stock_maximo_kg: stock_maximo_kg !== undefined ? stock_maximo_kg : material.stock_maximo_kg,
      proveedor_preferido_id: proveedor_preferido_id !== undefined ? proveedor_preferido_id : material.proveedor_preferido_id,
      temperatura_inyeccion_c: temperatura_inyeccion_c !== undefined ? temperatura_inyeccion_c : material.temperatura_inyeccion_c,
      temperatura_molde_c: temperatura_molde_c !== undefined ? temperatura_molde_c : material.temperatura_molde_c,
      presion_inyeccion_bar: presion_inyeccion_bar !== undefined ? presion_inyeccion_bar : material.presion_inyeccion_bar,
      tiempo_ciclo_seg: tiempo_ciclo_seg !== undefined ? tiempo_ciclo_seg : material.tiempo_ciclo_seg,
      activo: activo !== undefined ? activo : material.activo,
    });

    res.json(material);
  } catch (error) {
    logger.error('Error al actualizar material', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al actualizar material' });
  }
});

// DELETE /api/materiales/:id - Eliminar material (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    await material.update({ activo: false });
    res.json({ message: 'Material eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar material' });
  }
});

// GET /api/materiales/:id/stock - Obtener stock y lotes del material
router.get('/:id/stock', async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id, {
      include: [
        {
          association: 'lotesMaterial',
          where: { activo: true },
          required: false,
        },
      ],
    });

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    res.json({
      material: {
        id: material.id,
        codigo: material.codigo,
        nombre: material.nombre,
        stock_actual_kg: material.stock_actual_kg,
        stock_minimo_kg: material.stock_minimo_kg,
        stock_maximo_kg: material.stock_maximo_kg,
      },
      lotes: material.lotesMaterial,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener stock del material' });
  }
});

export default router;
