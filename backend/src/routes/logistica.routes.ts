import { Router } from 'express';
import { Op } from 'sequelize';
import { Envio, EnvioDetalle, Cliente, Transportista, Producto, Lote, Factura } from '../models';
import sequelize from '../config/database';
import logger from '../utils/logger';

const router = Router();

// ─── TRANSPORTISTAS ───────────────────────────────────────────────────────────

router.get('/transportistas', async (req, res) => {
  try {
    const transportistas = await Transportista.findAll({ order: [['nombre', 'ASC']] });
    res.json(transportistas);
  } catch (error: any) {
    logger.error('Error al obtener transportistas', { error: error.message });
    res.status(500).json({ error: 'Error al obtener transportistas' });
  }
});

router.post('/transportistas', async (req, res) => {
  try {
    const t = await Transportista.create(req.body);
    res.status(201).json(t);
  } catch (error: any) {
    logger.error('Error al crear transportista', { error: error.message });
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un transportista con ese código' });
    }
    res.status(500).json({ error: 'Error al crear transportista' });
  }
});

router.put('/transportistas/:id', async (req, res) => {
  try {
    const t = await Transportista.findByPk(req.params.id);
    if (!t) return res.status(404).json({ error: 'Transportista no encontrado' });
    await t.update(req.body);
    res.json(t);
  } catch (error: any) {
    logger.error('Error al actualizar transportista', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar transportista' });
  }
});

router.delete('/transportistas/:id', async (req, res) => {
  try {
    const t = await Transportista.findByPk(req.params.id);
    if (!t) return res.status(404).json({ error: 'Transportista no encontrado' });
    await t.destroy();
    res.json({ message: 'Transportista eliminado' });
  } catch (error: any) {
    logger.error('Error al eliminar transportista', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar transportista' });
  }
});

// ─── ENVÍOS ──────────────────────────────────────────────────────────────────

router.get('/envios', async (req, res) => {
  try {
    const { estado, cliente_id, fecha_inicio, fecha_fin } = req.query;
    const where: any = {};
    if (estado) where.estado = estado;
    if (cliente_id) where.cliente_id = cliente_id;
    if (fecha_inicio && fecha_fin) {
      where.fecha_programada = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const envios = await Envio.findAll({
      where,
      include: [
        { model: Cliente as any, as: 'cliente', attributes: ['razon_social', 'rfc'] },
        { model: Transportista as any, as: 'transportista', attributes: ['nombre', 'placa', 'tipo'] },
      ],
      order: [['fecha_programada', 'DESC']]
    });

    res.json(envios);
  } catch (error: any) {
    logger.error('Error al obtener envíos', { error: error.message });
    res.status(500).json({ error: 'Error al obtener envíos' });
  }
});

router.get('/envios/:id', async (req, res) => {
  try {
    const envio = await Envio.findByPk(req.params.id, {
      include: [
        { model: Cliente as any, as: 'cliente' },
        { model: Transportista as any, as: 'transportista' },
        { model: Factura as any, as: 'factura', attributes: ['folio', 'total'] },
        {
          model: EnvioDetalle as any, as: 'detalles',
          include: [
            { model: Producto as any, as: 'producto', attributes: ['codigo', 'nombre'] },
            { model: Lote as any, as: 'lote', attributes: ['codigo'] },
          ]
        }
      ]
    });
    if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });
    res.json(envio);
  } catch (error: any) {
    logger.error('Error al obtener envío', { error: error.message });
    res.status(500).json({ error: 'Error al obtener envío' });
  }
});

router.post('/envios', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { detalles, ...envioData } = req.body;
    const usuario_id = (req as any).user?.id;

    // Generar folio
    const fecha = new Date();
    const prefix = `ENV${fecha.getFullYear().toString().slice(-2)}${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const ultimo = await Envio.findOne({
      where: { folio: { [Op.like]: `${prefix}%` } },
      order: [['folio', 'DESC']]
    });
    const consecutivo = ultimo ? parseInt((ultimo as any).folio.slice(-4)) + 1 : 1;
    const folio = `${prefix}${String(consecutivo).padStart(4, '0')}`;

    const envio = await Envio.create({ ...envioData, folio, usuario_id }, { transaction });

    if (detalles && detalles.length > 0) {
      await EnvioDetalle.bulkCreate(
        detalles.map((d: any) => ({ ...d, envio_id: (envio as any).id })),
        { transaction }
      );
    }

    await transaction.commit();
    res.status(201).json(envio);
  } catch (error: any) {
    await transaction.rollback();
    logger.error('Error al crear envío', { error: error.message });
    res.status(500).json({ error: 'Error al crear envío' });
  }
});

router.put('/envios/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { detalles, ...envioData } = req.body;
    const envio = await Envio.findByPk(req.params.id);
    if (!envio) { await transaction.rollback(); return res.status(404).json({ error: 'Envío no encontrado' }); }

    await envio.update(envioData, { transaction });

    if (detalles !== undefined) {
      await EnvioDetalle.destroy({ where: { envio_id: (envio as any).id }, transaction });
      if (detalles.length > 0) {
        await EnvioDetalle.bulkCreate(
          detalles.map((d: any) => ({ ...d, envio_id: (envio as any).id })),
          { transaction }
        );
      }
    }

    await transaction.commit();
    res.json(envio);
  } catch (error: any) {
    await transaction.rollback();
    logger.error('Error al actualizar envío', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar envío' });
  }
});

// Cambiar estado del envío
router.put('/envios/:id/estado', async (req, res) => {
  try {
    const { estado, fecha_real, nombre_receptor, observaciones_entrega } = req.body;
    const envio = await Envio.findByPk(req.params.id);
    if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });

    const update: any = { estado };
    if (estado === 'entregado') {
      update.fecha_real = fecha_real || new Date().toISOString().split('T')[0];
      if (nombre_receptor) update.nombre_receptor = nombre_receptor;
      if (observaciones_entrega) update.observaciones_entrega = observaciones_entrega;
    }

    await envio.update(update);
    res.json(envio);
  } catch (error: any) {
    logger.error('Error al cambiar estado envío', { error: error.message });
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

router.delete('/envios/:id', async (req, res) => {
  try {
    const envio = await Envio.findByPk(req.params.id);
    if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });
    if (['en_ruta', 'entregado'].includes((envio as any).estado)) {
      return res.status(400).json({ error: 'No se puede eliminar un envío en ruta o entregado' });
    }
    await envio.destroy();
    res.json({ message: 'Envío eliminado' });
  } catch (error: any) {
    logger.error('Error al eliminar envío', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar envío' });
  }
});

// KPIs logística
router.get('/kpis', async (req, res) => {
  try {
    const [porEstado, pendientes] = await Promise.all([
      Envio.findAll({
        attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
        group: ['estado']
      }),
      Envio.count({ where: { estado: { [Op.in]: ['pendiente', 'preparando', 'en_ruta'] } } })
    ]);
    res.json({ por_estado: porEstado, pendientes_activos: pendientes });
  } catch (error: any) {
    logger.error('Error al obtener KPIs logística', { error: error.message });
    res.status(500).json({ error: 'Error al obtener KPIs' });
  }
});

export default router;
