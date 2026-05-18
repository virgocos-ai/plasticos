import { Router } from 'express';
import { Op } from 'sequelize';
import { Factura, FacturaDetalle, Cliente } from '../models';

const router = Router();

// Listar facturas
router.get('/', async (req, res) => {
  try {
    const { estado, cliente_id, fecha_inicio, fecha_fin } = req.query;
    const where: any = {};
    
    if (estado) where.estado = estado;
    if (cliente_id) where.cliente_id = cliente_id;
    if (fecha_inicio && fecha_fin) {
      where.fecha_emision = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const facturas = await Factura.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['razon_social', 'rfc'] }
      ],
      order: [['fecha_emision', 'DESC']]
    });
    
    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
});

// Obtener factura por ID
router.get('/:id', async (req, res) => {
  try {
    const factura = await Factura.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { 
          model: FacturaDetalle, 
          as: 'detalles',
          include: ['producto']
        }
      ]
    });
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    res.json(factura);
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ error: 'Error al obtener factura' });
  }
});

// Crear factura (borrador)
router.post('/', async (req, res) => {
  try {
    const { detalles, ...facturaData } = req.body;
    
    // Calcular totales
    let subtotal = 0;
    let impuesto_trasladado = 0;
    
    detalles.forEach((det: any) => {
      const importe = det.cantidad * det.precio_unitario - (det.descuento || 0);
      subtotal += importe;
      impuesto_trasladado += importe * (det.tasa_cuota || 0.16);
    });
    
    const total = subtotal + impuesto_trasladado;
    
    // Obtener siguiente folio
    const ultimaFactura = await Factura.findOne({
      where: { serie: facturaData.serie || 'A' },
      order: [['folio', 'DESC']]
    });
    const siguienteFolio = (ultimaFactura?.folio || 0) + 1;
    
    const factura = await Factura.create({
      ...facturaData,
      folio: siguienteFolio,
      subtotal,
      impuesto_trasladado,
      total,
      estado: 'borrador'
    });
    
    // Crear detalles
    await FacturaDetalle.bulkCreate(
      detalles.map((det: any) => ({
        ...det,
        factura_id: factura.id
      }))
    );
    
    res.status(201).json(factura);
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: 'Error al crear factura' });
  }
});

// Timbrar factura (simulado - integrar con PAC real)
router.post('/:id/timbrar', async (req, res) => {
  try {
    const factura = await Factura.findByPk(req.params.id, {
      include: [{ model: Cliente, as: 'cliente' }]
    });
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    if (factura.estado !== 'borrador') {
      return res.status(400).json({ error: 'Solo se pueden timbrar facturas en borrador' });
    }
    
    // Aquí iría la integración con el PAC para timbrado real
    // Por ahora simulamos el timbrado
    const uuid = `uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await factura.update({
      estado: 'timbrada',
      uuid,
      fecha_timbrado: new Date(),
      sello_digital_cfdi: 'sello-simulado-cfdi',
      sello_digital_sat: 'sello-simulado-sat',
      cadena_original: 'cadena-original-simulada',
      xml_timbrado: '<?xml version="1.0" encoding="UTF-8"?><Comprobante>...</Comprobante>',
      estado_sat: 'Vigente'
    });
    
    res.json({ 
      message: 'Factura timbrada correctamente',
      factura: {
        id: factura.id,
        uuid,
        estado: 'timbrada'
      }
    });
  } catch (error) {
    console.error('Error al timbrar factura:', error);
    res.status(500).json({ error: 'Error al timbrar factura' });
  }
});

// Cancelar factura
router.post('/:id/cancelar', async (req, res) => {
  try {
    const { motivo } = req.body;
    const factura = await Factura.findByPk(req.params.id);
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    if (factura.estado !== 'timbrada') {
      return res.status(400).json({ error: 'Solo se pueden cancelar facturas timbradas' });
    }
    
    await factura.update({
      estado: 'cancelada',
      estado_sat: 'Cancelado',
      motivo_cancelacion: motivo,
      fecha_cancelacion: new Date()
    });
    
    res.json({ message: 'Factura cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar factura:', error);
    res.status(500).json({ error: 'Error al cancelar factura' });
  }
});

export default router;
