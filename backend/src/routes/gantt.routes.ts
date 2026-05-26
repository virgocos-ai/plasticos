import { Router } from 'express';
import { Op } from 'sequelize';
import { OrdenProduccion, Cliente, Operador, Maquina } from '../models';

const router = Router();

/**
 * GET /api/gantt
 * Devuelve las órdenes de producción en el rango de fechas dado,
 * estructuradas para renderizar un Gantt por máquina/turno.
 *
 * Query params:
 *   fecha_inicio  YYYY-MM-DD  (default: lunes de esta semana)
 *   fecha_fin     YYYY-MM-DD  (default: domingo de esta semana + 2 semanas)
 */
router.get('/', async (req, res) => {
  try {
    // Calcular rango por defecto: semana actual + 2 semanas
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1; // 0=lunes
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaSemana);
    const finDefault = new Date(lunes);
    finDefault.setDate(lunes.getDate() + 20);

    const fechaInicio = (req.query.fecha_inicio as string) || lunes.toISOString().split('T')[0];
    const fechaFin = (req.query.fecha_fin as string) || finDefault.toISOString().split('T')[0];

    const ordenes = await OrdenProduccion.findAll({
      where: {
        [Op.or]: [
          // OP cuya fecha de orden cae en el rango
          { fecha_orden: { [Op.between]: [fechaInicio, fechaFin] } },
          // OP en producción o pendiente que pueden estar en curso
          { estado: { [Op.in]: ['pendiente', 'en_produccion'] } }
        ]
      },
      include: [
        { model: Cliente, as: 'cliente', required: false, attributes: ['id', 'razon_social'] },
        { model: Operador, as: 'operador', required: false, attributes: ['id', 'nombre'] },
        { model: Maquina, as: 'maquina', required: false, attributes: ['id', 'nombre', 'modelo'] },
      ],
      order: [['fecha_entrega', 'ASC'], ['prioridad', 'DESC']]
    });

    // Agrupar por máquina para facilitar renderizado del Gantt
    const porMaquina: Record<string, any[]> = {};

    for (const op of ordenes) {
      const key = (op as any).maquina_asignada || 'Sin máquina';
      if (!porMaquina[key]) porMaquina[key] = [];

      porMaquina[key].push({
        id: op.id,
        folio: op.folio,
        estado: op.estado,
        prioridad: op.prioridad,
        turno: op.turno,
        fecha_orden: op.fecha_orden,
        fecha_entrega: (op as any).fecha_entrega,
        tiempo_estimado_min: (op as any).tiempo_estimado_min,
        tiempo_real_min: (op as any).tiempo_real_min,
        cliente: (op as any).cliente?.razon_social || null,
        operador: (op as any).operador?.nombre || null,
        maquina_id: (op as any).maquina_id,
        maquina_nombre: (op as any).maquina?.nombre || (op as any).maquina_asignada || null,
      });
    }

    res.json({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      maquinas: Object.entries(porMaquina).map(([maquina, ordenes]) => ({
        maquina,
        total_ordenes: ordenes.length,
        ordenes
      }))
    });
  } catch (error) {
    console.error('Error al obtener datos Gantt:', error);
    res.status(500).json({ error: 'Error al obtener planificación de producción' });
  }
});

export default router;
