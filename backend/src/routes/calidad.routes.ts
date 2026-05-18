import { Router } from 'express';
import { Op } from 'sequelize';
import { InspeccionCalidad, Producto, OrdenProduccion, Lote, Usuario } from '../models';

const router = Router();

// Listar inspecciones
router.get('/', async (req, res) => {
  try {
    const { tipo_inspeccion, resultado, producto_id, fecha_inicio, fecha_fin } = req.query;
    const where: any = {};
    
    if (tipo_inspeccion) where.tipo_inspeccion = tipo_inspeccion;
    if (resultado) where.resultado = resultado;
    if (producto_id) where.producto_id = producto_id;
    if (fecha_inicio && fecha_fin) {
      where.fecha_inspeccion = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const inspecciones = await InspeccionCalidad.findAll({
      where,
      include: [
        { model: Producto, as: 'producto', attributes: ['codigo', 'nombre'] },
        { model: OrdenProduccion, as: 'ordenProduccion', attributes: ['folio'] },
        { model: Lote, as: 'lote', attributes: ['codigo'] },
        { model: Usuario, as: 'inspector', attributes: ['nombre'] }
      ],
      order: [['fecha_inspeccion', 'DESC']]
    });
    
    res.json(inspecciones);
  } catch (error) {
    console.error('Error al obtener inspecciones:', error);
    res.status(500).json({ error: 'Error al obtener inspecciones' });
  }
});

// Obtener inspección por ID
router.get('/:id', async (req, res) => {
  try {
    const inspeccion = await InspeccionCalidad.findByPk(req.params.id, {
      include: [
        { model: Producto, as: 'producto' },
        { model: OrdenProduccion, as: 'ordenProduccion' },
        { model: Lote, as: 'lote' },
        { model: Usuario, as: 'inspector' }
      ]
    });
    
    if (!inspeccion) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }
    
    res.json(inspeccion);
  } catch (error) {
    console.error('Error al obtener inspección:', error);
    res.status(500).json({ error: 'Error al obtener inspección' });
  }
});

// Crear inspección
router.post('/', async (req, res) => {
  try {
    const { cantidad_inspeccionada, cantidad_defectuosa } = req.body;
    
    // Generar folio
    const fecha = new Date();
    const anio = fecha.getFullYear().toString().substr(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `INSP${anio}${mes}`;
    
    const ultimaInspeccion = await InspeccionCalidad.findOne({
      where: { folio: { [Op.like]: `${prefix}%` } },
      order: [['folio', 'DESC']]
    });
    
    const consecutivo = ultimaInspeccion 
      ? parseInt(ultimaInspeccion.folio.slice(-4)) + 1 
      : 1;
    const folio = `${prefix}${consecutivo.toString().padStart(4, '0')}`;
    
    // Calcular porcentaje de defectos
    const porcentaje_defectos = cantidad_inspeccionada > 0 
      ? (cantidad_defectuosa / cantidad_inspeccionada) * 100 
      : 0;
    
    const inspeccion = await InspeccionCalidad.create({
      ...req.body,
      folio,
      porcentaje_defectos
    });
    
    res.status(201).json(inspeccion);
  } catch (error) {
    console.error('Error al crear inspección:', error);
    res.status(500).json({ error: 'Error al crear inspección' });
  }
});

// Actualizar inspección
router.put('/:id', async (req, res) => {
  try {
    const inspeccion = await InspeccionCalidad.findByPk(req.params.id);
    
    if (!inspeccion) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }
    
    // Recalcular porcentaje si se actualizan cantidades
    if (req.body.cantidad_inspeccionada !== undefined || req.body.cantidad_defectuosa !== undefined) {
      const cantidad_inspeccionada = req.body.cantidad_inspeccionada ?? inspeccion.cantidad_inspeccionada;
      const cantidad_defectuosa = req.body.cantidad_defectuosa ?? inspeccion.cantidad_defectuosa;
      
      req.body.porcentaje_defectos = cantidad_inspeccionada > 0 
        ? (cantidad_defectuosa / cantidad_inspeccionada) * 100 
        : 0;
    }
    
    await inspeccion.update(req.body);
    res.json(inspeccion);
  } catch (error) {
    console.error('Error al actualizar inspección:', error);
    res.status(500).json({ error: 'Error al actualizar inspección' });
  }
});

// Cambiar resultado
router.put('/:id/resultado', async (req, res) => {
  try {
    const { resultado } = req.body;
    const inspeccion = await InspeccionCalidad.findByPk(req.params.id);
    
    if (!inspeccion) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }
    
    await inspeccion.update({ resultado });
    res.json(inspeccion);
  } catch (error) {
    console.error('Error al cambiar resultado:', error);
    res.status(500).json({ error: 'Error al cambiar resultado' });
  }
});

// Generar certificado de calidad
router.post('/:id/certificado', async (req, res) => {
  try {
    const inspeccion = await InspeccionCalidad.findByPk(req.params.id, {
      include: [
        { model: Producto, as: 'producto' },
        { model: Lote, as: 'lote' }
      ]
    });
    
    if (!inspeccion) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }
    
    if (inspeccion.resultado !== 'aprobado') {
      return res.status(400).json({ error: 'Solo se pueden generar certificados para inspecciones aprobadas' });
    }
    
    await inspeccion.update({ certificado_generado: true });
    
    res.json({
      message: 'Certificado generado correctamente',
      certificado: {
        folio: `CERT-${inspeccion.folio}`,
        fecha: new Date(),
        producto: inspeccion.producto?.nombre,
        lote: inspeccion.lote?.codigo,
        resultado: inspeccion.resultado
      }
    });
  } catch (error) {
    console.error('Error al generar certificado:', error);
    res.status(500).json({ error: 'Error al generar certificado' });
  }
});

// Estadísticas de calidad
router.get('/estadisticas/resumen', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    const where: any = {};
    if (fecha_inicio && fecha_fin) {
      where.fecha_inspeccion = { [Op.between]: [fecha_inicio, fecha_fin] };
    }
    
    const inspecciones = await InspeccionCalidad.findAll({ where });
    
    const total = inspecciones.length;
    const aprobadas = inspecciones.filter(i => i.resultado === 'aprobado').length;
    const rechazadas = inspecciones.filter(i => i.resultado === 'rechazado').length;
    const condicionales = inspecciones.filter(i => i.resultado === 'condicional').length;
    
    const totalInspeccionada = inspecciones.reduce((sum, i) => sum + parseFloat(i.cantidad_inspeccionada.toString()), 0);
    const totalDefectuosa = inspecciones.reduce((sum, i) => sum + parseFloat(i.cantidad_defectuosa.toString()), 0);
    
    res.json({
      total,
      aprobadas,
      rechazadas,
      condicionales,
      porcentaje_aprobacion: total > 0 ? ((aprobadas / total) * 100).toFixed(2) : 0,
      total_piezas_inspeccionadas: totalInspeccionada,
      total_piezas_defectuosas: totalDefectuosa,
      porcentaje_defectos_global: totalInspeccionada > 0 ? ((totalDefectuosa / totalInspeccionada) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Eliminar inspección
router.delete('/:id', async (req, res) => {
  try {
    const inspeccion = await InspeccionCalidad.findByPk(req.params.id);
    
    if (!inspeccion) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }
    
    await inspeccion.destroy();
    res.json({ message: 'Inspección eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar inspección:', error);
    res.status(500).json({ error: 'Error al eliminar inspección' });
  }
});

export default router;
