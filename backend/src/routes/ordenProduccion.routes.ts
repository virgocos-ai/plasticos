import { Router } from 'express';
import { Op } from 'sequelize';
import { OrdenProduccion, OrdenProduccionDetalle, Cliente, Producto, Material, Usuario, Maquina, Operador, InventarioMovimiento } from '../models';
import sequelize from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Listar órdenes de producción (con paginación y búsqueda)
router.get('/', async (req, res) => {
  try {
    const { estado, fecha_inicio, fecha_fin, search, page, limit } = req.query;
    const where: any = {};

    if (estado) where.estado = estado;
    if (fecha_inicio && fecha_fin) {
      where.fecha_orden = { [Op.between]: [fecha_inicio, fecha_fin] };
    }
    if (search) {
      where.folio = { [Op.like]: `%${search}%` };
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 50));

    const { count, rows: ordenes } = await OrdenProduccion.findAndCountAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', required: false,
          ...(search ? { where: { razon_social: { [Op.like]: `%${search}%` } }, required: false } : {})
        },
        { model: Usuario, as: 'usuario', required: false, attributes: ['id', 'nombre'] },
        { model: Maquina, as: 'maquina', required: false, attributes: ['id', 'nombre', 'modelo'] },
        { model: Operador, as: 'operador', required: false, attributes: ['id', 'nombre'] },
      ],
      order: [['fecha_orden', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      distinct: true
    });

    res.json({ data: ordenes, total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) });
  } catch (error: any) {
    logger.error('Error al obtener órdenes', { error: error.message });
    res.status(500).json({ error: 'Error al obtener órdenes de producción' });
  }
});

// Obtener orden por ID
router.get('/:id', async (req, res) => {
  try {
    const orden = await OrdenProduccion.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
        { model: Maquina, as: 'maquina' },
        { model: Operador, as: 'operador' },
        {
          model: OrdenProduccionDetalle,
          as: 'detalles',
          include: [
            { model: Producto, as: 'producto' },
            { model: Material, as: 'material' }
          ]
        }
      ]
    });

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(orden);
  } catch (error: any) {
    logger.error('Error al obtener orden', { error: error.message });
    res.status(500).json({ error: 'Error al obtener orden de producción' });
  }
});

// Crear orden de producción (con folio atómico)
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { detalles, ...ordenData } = req.body;

    if (!detalles || detalles.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Debe incluir al menos un producto en los detalles' });
    }

    const fecha = new Date();
    const anio = fecha.getFullYear().toString().slice(-2);
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const prefix = `OP${anio}${mes}`;

    const ultimaOrden = await OrdenProduccion.findOne({
      where: { folio: { [Op.like]: `${prefix}%` } },
      order: [['folio', 'DESC']],
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    const consecutivo = ultimaOrden ? parseInt(ultimaOrden.folio.slice(-4)) + 1 : 1;
    const folio = `${prefix}${String(consecutivo).padStart(4, '0')}`;

    const orden = await OrdenProduccion.create({
      ...ordenData,
      folio,
      estado: 'pendiente',
      fecha_orden: ordenData.fecha_orden || new Date(),
      usuario_id: (req as any).user?.id || ordenData.usuario_id
    }, { transaction });

    await OrdenProduccionDetalle.bulkCreate(
      detalles.map((det: any) => ({ ...det, orden_id: orden.id })),
      { transaction }
    );

    await transaction.commit();
    res.status(201).json(orden);
  } catch (error: any) {
    await transaction.rollback();
    logger.error('Error al crear orden', { error: error.message });
    res.status(500).json({ error: 'Error al crear orden de producción' });
  }
});

// Actualizar estado de orden
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const orden = await OrdenProduccion.findByPk(req.params.id);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    await orden.update({ estado });
    res.json(orden);
  } catch (error: any) {
    logger.error('Error al actualizar estado orden', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
});

// ─── Registrar avance de producción ───────────────────────────────────────────
// Actualiza cantidades reales en cada detalle Y descuenta material del inventario
router.post('/:id/registrar-avance', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { detalles } = req.body; // [{ detalle_id, cantidad_producida, cantidad_defectuosa, temperatura_inyeccion_real, presion_inyeccion_real, tiempo_ciclo_real_seg, ciclos_completados, observaciones }]
    const usuario_id = (req as any).user?.id;

    if (!detalles || detalles.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Detalles requeridos' });
    }

    const orden = await OrdenProduccion.findByPk(req.params.id, { transaction });
    if (!orden) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if ((orden as any).estado === 'cancelada' || (orden as any).estado === 'completada') {
      await transaction.rollback();
      return res.status(400).json({ error: 'No se puede registrar avance en una orden cancelada o ya completada' });
    }

    const movimientos: any[] = [];

    for (const upd of detalles) {
      const det = await OrdenProduccionDetalle.findByPk(upd.detalle_id, { transaction });
      if (!det) continue;

      const produccionAnterior = parseFloat((det as any).cantidad_producida?.toString() || '0');
      const nuevaProduccion = parseFloat(upd.cantidad_producida?.toString() || '0');
      const delta = Math.max(0, nuevaProduccion - produccionAnterior);

      // Descontar material si hay producción adicional
      if (delta > 0 && (det as any).material_id && (det as any).peso_pieza_gr) {
        const kgConsumidos = (delta * parseFloat((det as any).peso_pieza_gr.toString())) / 1000;
        const material = await Material.findByPk((det as any).material_id, { transaction });
        if (material) {
          const stockActual = parseFloat((material as any).stock_actual_kg?.toString() || '0');
          await material.update(
            { stock_actual_kg: Math.max(0, stockActual - kgConsumidos) },
            { transaction }
          );
          movimientos.push({
            material_id: (det as any).material_id,
            tipo_movimiento: 'salida',
            cantidad: kgConsumidos,
            motivo: `Consumo producción OP ${(orden as any).folio}`,
            referencia_id: (orden as any).id,
            referencia_tipo: 'orden_produccion',
            usuario_id,
            fecha_movimiento: new Date()
          });
        }
      }

      // Calcular peso total de material consumido
      let pesoTotalMaterial = parseFloat((det as any).peso_total_material_kg?.toString() || '0');
      if (delta > 0 && (det as any).peso_pieza_gr) {
        pesoTotalMaterial += (delta * parseFloat((det as any).peso_pieza_gr.toString())) / 1000;
      }

      await det.update({
        cantidad_producida: nuevaProduccion,
        cantidad_defectuosa: upd.cantidad_defectuosa ?? (det as any).cantidad_defectuosa,
        temperatura_inyeccion_real: upd.temperatura_inyeccion_real ?? (det as any).temperatura_inyeccion_real,
        presion_inyeccion_real: upd.presion_inyeccion_real ?? (det as any).presion_inyeccion_real,
        tiempo_ciclo_real_seg: upd.tiempo_ciclo_real_seg ?? (det as any).tiempo_ciclo_real_seg,
        ciclos_completados: upd.ciclos_completados ?? (det as any).ciclos_completados,
        peso_total_material_kg: pesoTotalMaterial,
        observaciones: upd.observaciones ?? (det as any).observaciones,
      }, { transaction });
    }

    if (movimientos.length > 0) {
      await InventarioMovimiento.bulkCreate(movimientos, { transaction });
    }

    await transaction.commit();
    logger.info(`Avance OP ${(orden as any).folio} registrado. Material descontado para ${movimientos.length} material(es).`);
    res.json({
      message: 'Avance registrado correctamente',
      materiales_descontados: movimientos.length
    });
  } catch (error: any) {
    await transaction.rollback();
    logger.error('Error al registrar avance de producción', { error: error.message });
    res.status(500).json({ error: 'Error al registrar avance' });
  }
});

export default router;
