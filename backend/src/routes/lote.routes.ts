import { Router } from 'express';
import { Op } from 'sequelize';
import Lote from '../models/Lote';
import Producto from '../models/Producto';
import Material from '../models/Material';
import Almacen from '../models/Almacen';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/lotes - Listar todos los lotes
router.get('/', async (req, res) => {
  try {
    const lotes = await Lote.findAll({
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre'] },
        { model: Material, as: 'material', attributes: ['id', 'codigo', 'nombre'] },
        { model: Almacen, as: 'almacen', attributes: ['id', 'codigo', 'nombre'] },
      ],
      order: [['fecha_entrada', 'DESC']],
    });
    res.json(lotes);
  } catch (error) {
    console.error('Error al obtener lotes:', error);
    res.status(500).json({ error: 'Error al obtener lotes' });
  }
});

// GET /api/lotes/activos - Listar lotes activos
router.get('/activos', async (req, res) => {
  try {
    const lotes = await Lote.findAll({
      where: { estado: 'activo' },
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre'] },
        { model: Material, as: 'material', attributes: ['id', 'codigo', 'nombre'] },
        { model: Almacen, as: 'almacen', attributes: ['id', 'codigo', 'nombre'] },
      ],
      order: [['fecha_entrada', 'DESC']],
    });
    res.json(lotes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lotes' });
  }
});

// GET /api/lotes/:id - Obtener un lote
router.get('/:id', async (req, res) => {
  try {
    const lote = await Lote.findByPk(req.params.id, {
      include: [
        { model: Producto, as: 'producto' },
        { model: Material, as: 'material' },
        { model: Almacen, as: 'almacen' },
      ],
    });

    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    res.json(lote);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lote' });
  }
});

// POST /api/lotes - Crear lote
router.post('/', async (req, res) => {
  try {
    const {
      numero_lote,
      tipo,
      producto_id,
      material_id,
      almacen_id,
      cantidad_inicial,
      unidad_medida,
      fecha_produccion,
      fecha_caducidad,
      orden_produccion_id,
      proveedor_id,
      numero_factura_proveedor,
      temperatura_almacenamiento,
      humedad_almacenamiento,
      observaciones,
      certificado_calidad,
      usuario_id,
    } = req.body;

    // Validaciones
    if (!numero_lote || !tipo || !almacen_id || !cantidad_inicial || !unidad_medida) {
      return res.status(400).json({ error: 'Número de lote, tipo, almacén, cantidad y unidad son requeridos' });
    }

    if (tipo === 'producto' && !producto_id) {
      return res.status(400).json({ error: 'Producto es requerido para lotes de producto' });
    }

    if (tipo === 'material' && !material_id) {
      return res.status(400).json({ error: 'Material es requerido para lotes de material' });
    }

    // Verificar número de lote único
    const existing = await Lote.findOne({ where: { numero_lote } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un lote con ese número' });
    }

    const lote = await Lote.create({
      numero_lote,
      tipo,
      producto_id: tipo === 'producto' ? producto_id : null,
      material_id: tipo === 'material' ? material_id : null,
      almacen_id,
      cantidad_inicial,
      cantidad_actual: cantidad_inicial,
      unidad_medida,
      fecha_produccion: fecha_produccion || null,
      fecha_caducidad: fecha_caducidad || null,
      fecha_entrada: new Date(),
      orden_produccion_id: orden_produccion_id || null,
      proveedor_id: proveedor_id || null,
      numero_factura_proveedor: numero_factura_proveedor || null,
      estado: 'activo',
      temperatura_almacenamiento: temperatura_almacenamiento || null,
      humedad_almacenamiento: humedad_almacenamiento || null,
      observaciones: observaciones || null,
      certificado_calidad: certificado_calidad || null,
      usuario_id: usuario_id || 1,
    } as any);

    res.status(201).json(lote);
  } catch (error) {
    console.error('Error al crear lote:', error);
    res.status(500).json({ error: 'Error al crear lote' });
  }
});

// PUT /api/lotes/:id - Actualizar lote
router.put('/:id', async (req, res) => {
  try {
    const lote = await Lote.findByPk(req.params.id);
    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    const {
      almacen_id,
      cantidad_actual,
      fecha_caducidad,
      temperatura_almacenamiento,
      humedad_almacenamiento,
      observaciones,
      certificado_calidad,
    } = req.body;

    await lote.update({
      almacen_id: almacen_id || lote.almacen_id,
      cantidad_actual: cantidad_actual !== undefined ? cantidad_actual : lote.cantidad_actual,
      fecha_caducidad: fecha_caducidad !== undefined ? fecha_caducidad : lote.fecha_caducidad,
      temperatura_almacenamiento: temperatura_almacenamiento !== undefined ? temperatura_almacenamiento : lote.temperatura_almacenamiento,
      humedad_almacenamiento: humedad_almacenamiento !== undefined ? humedad_almacenamiento : lote.humedad_almacenamiento,
      observaciones: observaciones !== undefined ? observaciones : lote.observaciones,
      certificado_calidad: certificado_calidad !== undefined ? certificado_calidad : lote.certificado_calidad,
    });

    res.json(lote);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar lote' });
  }
});

// PUT /api/lotes/:id/estado - Cambiar estado del lote
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['activo', 'cuarentena', 'bloqueado', 'agotado', 'caducado'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const lote = await Lote.findByPk(req.params.id);
    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    await lote.update({ estado });
    res.json({ message: `Lote marcado como ${estado}`, lote });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar estado del lote' });
  }
});

// GET /api/lotes/:id/trazabilidad - Obtener trazabilidad completa
router.get('/:id/trazabilidad', async (req, res) => {
  try {
    const lote = await Lote.findByPk(req.params.id, {
      include: [
        { model: Producto, as: 'producto' },
        { model: Material, as: 'material' },
        { model: Almacen, as: 'almacen' },
      ],
    });

    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    const loteData = lote.toJSON();

    res.json({
      trazabilidad: {
        lote: {
          id: loteData.id,
          numero_lote: loteData.numero_lote,
          tipo: loteData.tipo,
          fecha_entrada: loteData.fecha_entrada,
          fecha_produccion: loteData.fecha_produccion,
          fecha_caducidad: loteData.fecha_caducidad,
          estado: loteData.estado,
        },
        origen: loteData.orden_produccion_id
          ? { tipo: 'produccion', orden_produccion_id: loteData.orden_produccion_id }
          : loteData.proveedor_id
          ? { tipo: 'compra', proveedor_id: loteData.proveedor_id, factura: loteData.numero_factura_proveedor }
          : { tipo: 'desconocido' },
        almacen: loteData.almacen,
        producto_material: loteData.producto || loteData.material,
        condiciones_almacenamiento: {
          temperatura: loteData.temperatura_almacenamiento,
          humedad: loteData.humedad_almacenamiento,
        },
        certificado_calidad: loteData.certificado_calidad,
        responsable_id: loteData.usuario_id,
      },
    });
  } catch (error) {
    console.error('Error al obtener trazabilidad:', error);
    res.status(500).json({ error: 'Error al obtener trazabilidad' });
  }
});

// GET /api/lotes/alertas/caducidad - Obtener lotes próximos a caducar
router.get('/alertas/caducidad', async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + parseInt(dias as string));

    const lotes = await Lote.findAll({
      where: {
        fecha_caducidad: {
          [Op.lte]: fechaLimite,
        },
        estado: 'activo',
      },
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'codigo', 'nombre'] },
        { model: Material, as: 'material', attributes: ['id', 'codigo', 'nombre'] },
        { model: Almacen, as: 'almacen', attributes: ['id', 'codigo', 'nombre'] },
      ],
      order: [['fecha_caducidad', 'ASC']],
    });

    res.json({
      alertas: lotes,
      total: lotes.length,
      dias_consulta: dias,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener alertas de caducidad' });
  }
});

export default router;
