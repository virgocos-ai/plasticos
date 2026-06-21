import { Router } from 'express';
import { Op } from 'sequelize';
import { MantenimientoRegistro, Maquina, Molde } from '../models';
import sequelize from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Listar registros de mantenimiento
router.get('/', async (req, res) => {
  try {
    const { entidad_tipo, entidad_id, estado, tipo } = req.query;
    const where: any = {};
    if (entidad_tipo) where.entidad_tipo = entidad_tipo;
    if (entidad_id) where.entidad_id = entidad_id;
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const registros = await MantenimientoRegistro.findAll({
      where,
      order: [['fecha', 'DESC']]
    });

    res.json(registros);
  } catch (error: any) {
    logger.error('Error al obtener mantenimientos', { error: error.message });
    res.status(500).json({ error: 'Error al obtener registros de mantenimiento' });
  }
});

// Crear registro de mantenimiento
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const usuario_id = (req as any).user?.id;

    // Generar folio
    const fecha = new Date();
    const prefix = `MNT${fecha.getFullYear().toString().slice(-2)}${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const ultimo = await MantenimientoRegistro.findOne({
      where: { folio: { [Op.like]: `${prefix}%` } },
      order: [['folio', 'DESC']]
    });
    const consecutivo = ultimo ? parseInt((ultimo as any).folio.slice(-4)) + 1 : 1;
    const folio = `${prefix}${String(consecutivo).padStart(4, '0')}`;

    const registro = await MantenimientoRegistro.create(
      { ...req.body, folio, usuario_id },
      { transaction }
    );

    // Actualizar último_mantenimiento en la entidad
    if (req.body.entidad_tipo === 'maquina') {
      await Maquina.update(
        {
          ultimo_mantenimiento: req.body.fecha,
          proximo_mantenimiento: req.body.proximo_mantenimiento
        },
        { where: { id: req.body.entidad_id }, transaction }
      );
    } else if (req.body.entidad_tipo === 'molde') {
      const molde = await Molde.findByPk(req.body.entidad_id, { transaction });
      if (molde) {
        await molde.update({
          disparos_ultimo_mantenimiento: (molde as any).disparos_actuales,
        }, { transaction });
      }
    }

    await transaction.commit();
    res.status(201).json(registro);
  } catch (error: any) {
    await transaction.rollback();
    logger.error('Error al crear registro de mantenimiento', { error: error.message });
    res.status(500).json({ error: 'Error al crear registro' });
  }
});

// Actualizar registro
router.put('/:id', async (req, res) => {
  try {
    const registro = await MantenimientoRegistro.findByPk(req.params.id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado' });
    await registro.update(req.body);
    res.json(registro);
  } catch (error: any) {
    logger.error('Error al actualizar mantenimiento', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar registro' });
  }
});

// Eliminar registro
router.delete('/:id', async (req, res) => {
  try {
    const registro = await MantenimientoRegistro.findByPk(req.params.id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado' });
    await registro.destroy();
    res.json({ message: 'Registro eliminado' });
  } catch (error: any) {
    logger.error('Error al eliminar mantenimiento', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar registro' });
  }
});

// KPIs de mantenimiento
router.get('/kpis/resumen', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const where: any = {};
    if (fecha_inicio && fecha_fin) {
      where.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const [total, porTipo, maquinasEnMtto, moldesEnMtto] = await Promise.all([
      MantenimientoRegistro.count({ where }),
      MantenimientoRegistro.findAll({
        where,
        attributes: ['tipo', [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('tiempo_paro_min')), 'minutos_paro'],
          [sequelize.fn('SUM', sequelize.col('costo')), 'costo_total']],
        group: ['tipo']
      }),
      Maquina.count({ where: { estado: 'mantenimiento' } }),
      Molde.count({ where: { estado: 'mantenimiento' } })
    ]);

    res.json({ total, por_tipo: porTipo, maquinas_en_mantenimiento: maquinasEnMtto, moldes_en_mantenimiento: moldesEnMtto });
  } catch (error: any) {
    logger.error('Error al obtener KPIs mantenimiento', { error: error.message });
    res.status(500).json({ error: 'Error al obtener KPIs' });
  }
});

export default router;
