import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { Cotizacion, CotizacionDetalle, Cliente, Producto, OrdenProduccion, OrdenProduccionDetalle, Material, Operador, Maquina } from '../models';
import logger from '../utils/logger';

const router = Router();

// ─── helpers ───────────────────────────────────────────────────────────────
function formatMXN(n: number) {
  return `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function addHeader(doc: PDFKit.PDFDocument, title: string, folio: string) {
  // Franja de color
  doc.rect(0, 0, doc.page.width, 70).fill('#1e3a5f');
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
    .text('PLÁSTICOS ERP', 40, 20);
  doc.fontSize(10).font('Helvetica')
    .text(title, 40, 45);
  // Folio a la derecha
  doc.fontSize(14).font('Helvetica-Bold')
    .text(folio, 0, 28, { align: 'right', width: doc.page.width - 40 });
  doc.fillColor('#000000').moveDown(2);
}

function addDivider(doc: PDFKit.PDFDocument) {
  const y = doc.y;
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.moveDown(0.5);
}

function addSectionTitle(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.5);
  doc.rect(40, doc.y, doc.page.width - 80, 20).fill('#f1f5f9');
  doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold')
    .text(text, 50, doc.y - 16);
  doc.fillColor('#000000').moveDown(0.8);
}

// ─── PDF de Cotización ─────────────────────────────────────────────────────
router.get('/cotizacion/:id', async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        {
          model: CotizacionDetalle, as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const cot = cotizacion as any;
    const cliente = cot.cliente;

    const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="cotizacion-${cot.folio}.pdf"`);
    doc.pipe(res);

    // Encabezado
    addHeader(doc, 'COTIZACIÓN', cot.folio);

    // Datos generales en dos columnas
    const col1 = 40, col2 = 320;
    const y0 = doc.y;

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text('CLIENTE', col1, y0);
    doc.font('Helvetica').fillColor('#1e293b').fontSize(10)
      .text(cliente?.razon_social || 'Sin cliente', col1, y0 + 14)
      .text(`RFC: ${cliente?.rfc || '-'}`, col1, y0 + 27)
      .text(cliente?.email || '', col1, y0 + 40);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text('DATOS', col2, y0);
    doc.font('Helvetica').fillColor('#1e293b').fontSize(10)
      .text(`Fecha: ${new Date(cot.fecha_cotizacion + 'T00:00:00').toLocaleDateString('es-MX')}`, col2, y0 + 14)
      .text(`Validez: ${cot.validez || '30 días'}`, col2, y0 + 27)
      .text(`Moneda: ${cot.moneda || 'MXN'}`, col2, y0 + 40);

    if (cot.contacto) {
      doc.text(`Contacto: ${cot.contacto}`, col1, y0 + 54);
    }

    doc.y = y0 + 75;
    addDivider(doc);

    // Tabla de productos
    addSectionTitle(doc, 'DETALLE DE PRODUCTOS');

    const cols = { desc: 40, cant: 300, precio: 360, desc2: 430, importe: 490 };
    const rowH = 20;

    // Encabezados tabla
    doc.rect(40, doc.y, doc.page.width - 80, rowH).fill('#334155');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
      .text('Producto / Descripción', cols.desc + 4, doc.y - rowH + 6, { width: 255 })
      .text('Cant.', cols.cant, doc.y - rowH + 6, { width: 55, align: 'right' })
      .text('Precio Unit.', cols.precio, doc.y - rowH + 6, { width: 65, align: 'right' })
      .text('Desc.', cols.desc2, doc.y - rowH + 6, { width: 55, align: 'right' })
      .text('Importe', cols.importe, doc.y - rowH + 6, { width: 60, align: 'right' });

    doc.fillColor('#000000').moveDown(0.2);

    const detalles: any[] = cot.detalles || [];
    detalles.forEach((det: any, i: number) => {
      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(40, doc.y, doc.page.width - 80, rowH).fill(bg);
      doc.fillColor('#1e293b').fontSize(8).font('Helvetica')
        .text(det.producto?.nombre || det.descripcion || '-', cols.desc + 4, doc.y - rowH + 6, { width: 255 })
        .text(Number(det.cantidad).toLocaleString('es-MX'), cols.cant, doc.y - rowH + 6, { width: 55, align: 'right' })
        .text(formatMXN(det.precio_unitario), cols.precio, doc.y - rowH + 6, { width: 65, align: 'right' })
        .text(formatMXN(det.descuento || 0), cols.desc2, doc.y - rowH + 6, { width: 55, align: 'right' })
        .text(formatMXN(det.importe), cols.importe, doc.y - rowH + 6, { width: 60, align: 'right' });
    });

    doc.moveDown(1);
    addDivider(doc);

    // Totales
    const totY = doc.y;
    doc.fontSize(9).font('Helvetica').fillColor('#64748b')
      .text('Subtotal:', 390, totY)
      .text('IVA (16%):', 390, totY + 16)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a5f')
      .text('TOTAL:', 390, totY + 34);
    doc.fontSize(9).font('Helvetica').fillColor('#1e293b')
      .text(formatMXN(cot.subtotal), 450, totY, { width: 105, align: 'right' })
      .text(formatMXN(cot.impuesto_trasladado), 450, totY + 16, { width: 105, align: 'right' });
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a5f')
      .text(formatMXN(cot.total), 450, totY + 34, { width: 105, align: 'right' });

    // Condiciones
    if (cot.condiciones_pago || cot.tiempo_entrega || cot.observaciones) {
      doc.y = totY + 70;
      addSectionTitle(doc, 'CONDICIONES');
      if (cot.condiciones_pago) doc.fontSize(9).font('Helvetica').text(`Condiciones de pago: ${cot.condiciones_pago}`, 40);
      if (cot.tiempo_entrega) doc.text(`Tiempo de entrega: ${cot.tiempo_entrega}`, 40);
      if (cot.observaciones) doc.text(`Observaciones: ${cot.observaciones}`, 40);
    }

    // Pie de página
    doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
      .text(`Cotización generada el ${new Date().toLocaleString('es-MX')} — Válida por ${cot.validez || '30 días'}`,
        40, doc.page.height - 50, { align: 'center', width: doc.page.width - 80 });

    doc.end();
  } catch (error: any) {
    logger.error('Error generando PDF cotización', { error: error.message });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar PDF' });
    }
  }
});

// ─── PDF de Orden de Producción ────────────────────────────────────────────
router.get('/orden-produccion/:id', async (req, res) => {
  try {
    const orden = await OrdenProduccion.findByPk(req.params.id, {
      include: [
        { model: Cliente as any, as: 'cliente' },
        { model: Operador as any, as: 'operador' },
        { model: Maquina as any, as: 'maquina' },
        {
          model: OrdenProduccionDetalle as any, as: 'detalles',
          include: [
            { model: Producto as any, as: 'producto' },
            { model: Material as any, as: 'material' }
          ]
        }
      ]
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const op = orden as any;

    const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="op-${op.folio}.pdf"`);
    doc.pipe(res);

    addHeader(doc, 'ORDEN DE PRODUCCIÓN', op.folio);

    const col1 = 40, col2 = 220, col3 = 400;
    const y0 = doc.y;

    // Datos en 3 columnas
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
    doc.text('CLIENTE', col1, y0).text('PRODUCCIÓN', col2, y0).text('ASIGNACIÓN', col3, y0);

    doc.font('Helvetica').fillColor('#1e293b').fontSize(9)
      .text(op.cliente?.razon_social || 'Sin cliente', col1, y0 + 14, { width: 170 })
      .text(`Fecha orden: ${new Date(op.fecha_orden + 'T00:00:00').toLocaleDateString('es-MX')}`, col2, y0 + 14, { width: 175 })
      .text(`Máquina: ${op.maquina_asignada || '-'}`, col3, y0 + 14, { width: 170 })
      .text(`Estado: ${op.estado?.replace('_', ' ').toUpperCase()}`, col1, y0 + 28)
      .text(`Entrega: ${op.fecha_entrega ? new Date(op.fecha_entrega + 'T00:00:00').toLocaleDateString('es-MX') : 'Sin fecha'}`, col2, y0 + 28)
      .text(`Operador: ${op.operador?.nombre || '-'}`, col3, y0 + 28)
      .text(`Prioridad: ${op.prioridad?.toUpperCase()}`, col1, y0 + 42)
      .text(`Turno: ${op.turno?.charAt(0).toUpperCase() + op.turno?.slice(1)}`, col2, y0 + 42)
      .text(`T. estimado: ${op.tiempo_estimado_min ? op.tiempo_estimado_min + ' min' : '-'}`, col3, y0 + 42);

    doc.y = y0 + 65;
    addDivider(doc);
    addSectionTitle(doc, 'PRODUCTOS A PRODUCIR');

    const rowH = 22;
    doc.rect(40, doc.y, doc.page.width - 80, rowH).fill('#334155');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
      .text('Producto', 44, doc.y - rowH + 7, { width: 200 })
      .text('Material', 250, doc.y - rowH + 7, { width: 140 })
      .text('Solicitada', 395, doc.y - rowH + 7, { width: 70, align: 'right' })
      .text('Producida', 465, doc.y - rowH + 7, { width: 70, align: 'right' });

    doc.fillColor('#000000').moveDown(0.2);

    const detalles: any[] = op.detalles || [];
    detalles.forEach((det: any, i: number) => {
      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(40, doc.y, doc.page.width - 80, rowH).fill(bg);
      doc.fillColor('#1e293b').fontSize(8).font('Helvetica')
        .text(det.producto?.nombre || '-', 44, doc.y - rowH + 7, { width: 200 })
        .text(det.material?.nombre || '-', 250, doc.y - rowH + 7, { width: 140 })
        .text(Number(det.cantidad_solicitada).toLocaleString('es-MX'), 395, doc.y - rowH + 7, { width: 70, align: 'right' })
        .text(Number(det.cantidad_producida || 0).toLocaleString('es-MX'), 465, doc.y - rowH + 7, { width: 70, align: 'right' });
    });

    if (op.observaciones) {
      doc.moveDown(1);
      addSectionTitle(doc, 'OBSERVACIONES');
      doc.fontSize(9).font('Helvetica').fillColor('#1e293b').text(op.observaciones, 44);
    }

    // Firma
    doc.moveDown(3);
    const yFirma = doc.y;
    doc.moveTo(80, yFirma).lineTo(230, yFirma).strokeColor('#94a3b8').stroke();
    doc.moveTo(360, yFirma).lineTo(510, yFirma).strokeColor('#94a3b8').stroke();
    doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
      .text('Responsable de producción', 80, yFirma + 5)
      .text('Supervisor / Calidad', 360, yFirma + 5);

    doc.fontSize(8).fillColor('#94a3b8')
      .text(`Generado: ${new Date().toLocaleString('es-MX')}`,
        40, doc.page.height - 50, { align: 'center', width: doc.page.width - 80 });

    doc.end();
  } catch (error: any) {
    logger.error('Error generando PDF orden de producción', { error: error.message });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar PDF' });
    }
  }
});

export default router;
