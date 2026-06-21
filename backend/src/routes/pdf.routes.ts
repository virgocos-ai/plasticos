import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { Cotizacion, CotizacionDetalle, Cliente, Producto, OrdenProduccion, OrdenProduccionDetalle, Material, Operador, Maquina } from '../models';
import logger from '../utils/logger';

const router = Router();

// ─── Paleta corporativa ────────────────────────────────────────────────────
const C = {
  navy:    '#1e3a5f',
  navyDk:  '#152c47',
  accent:  '#2563eb',
  accentLt:'#dbeafe',
  slate:   '#475569',
  muted:   '#94a3b8',
  border:  '#e2e8f0',
  rowAlt:  '#f8fafc',
  white:   '#ffffff',
  text:    '#1e293b',
  green:   '#16a34a',
  greenLt: '#dcfce7',
  yellow:  '#d97706',
  yellowLt:'#fef9c3',
  red:     '#dc2626',
  redLt:   '#fee2e2',
};

function formatMXN(n: number) {
  return `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Helpers de dibujo ─────────────────────────────────────────────────────

/** Rectángulo con borde redondeado */
function roundRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, r: number) {
  doc.roundedRect(x, y, w, h, r);
}

/** Encabezado página - devuelve Y donde continúa el contenido */
function drawHeader(doc: PDFKit.PDFDocument, docType: string, folio: string, estado?: string): number {
  const W = doc.page.width;

  // Franja principal
  doc.rect(0, 0, W, 80).fill(C.navy);
  // Franja de acento izquierda
  doc.rect(0, 0, 6, 80).fill(C.accent);

  // Logo / empresa
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(22)
    .text('PLÁSTICOS ERP', 26, 16);
  doc.fillColor('#93c5fd').font('Helvetica').fontSize(9)
    .text('Sistema de Gestión de Producción', 26, 42);

  // Folio badge (derecha)
  const folioW = 160;
  const folioX = W - folioW - 30;
  doc.roundedRect(folioX, 14, folioW, 30, 4).fill(C.accent);
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(13)
    .text(folio, folioX, 22, { width: folioW, align: 'center' });

  // Tipo de documento debajo del folio
  doc.fillColor('#93c5fd').font('Helvetica').fontSize(8)
    .text(docType, folioX, 50, { width: folioW, align: 'center' });

  // Estado badge si viene
  if (estado) {
    const estadoColors: Record<string, [string, string]> = {
      pendiente:     ['#fef3c7', '#92400e'],
      en_produccion: ['#dbeafe', '#1e40af'],
      completada:    ['#dcfce7', '#14532d'],
      cancelada:     ['#fee2e2', '#7f1d1d'],
    };
    const [bg, fg] = estadoColors[estado] || ['#f1f5f9', '#334155'];
    const label = estado.replace('_', ' ').toUpperCase();
    doc.roundedRect(26, 52, 90, 18, 3).fill(bg);
    doc.fillColor(fg).font('Helvetica-Bold').fontSize(7.5)
      .text(label, 26, 57, { width: 90, align: 'center' });
  }

  return 96; // Y inicial del contenido
}

/** Línea divisora sutil */
function divider(doc: PDFKit.PDFDocument, y: number, x1 = 30, color = C.border) {
  doc.moveTo(x1, y).lineTo(doc.page.width - 30, y)
    .strokeColor(color).lineWidth(0.5).stroke();
}

/** Encabezado de sección con barra lateral */
function sectionTitle(doc: PDFKit.PDFDocument, y: number, title: string): number {
  doc.rect(30, y, 4, 16).fill(C.accent);
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(9.5)
    .text(title, 42, y + 2);
  return y + 24;
}

/** Tarjeta de dato etiqueta + valor */
function infoCell(doc: PDFKit.PDFDocument, x: number, y: number, w: number, label: string, value: string, highlight = false) {
  doc.roundedRect(x, y, w, 36, 3).fill(highlight ? C.accentLt : C.rowAlt);
  doc.roundedRect(x, y, w, 36, 3).stroke(C.border).lineWidth(0.5);
  doc.fillColor(C.muted).font('Helvetica').fontSize(7).text(label, x + 8, y + 7);
  doc.fillColor(highlight ? C.accent : C.text).font('Helvetica-Bold').fontSize(9)
    .text(value || '—', x + 8, y + 18, { width: w - 16, ellipsis: true });
}

/** Pie de página */
function drawFooter(doc: PDFKit.PDFDocument, page = 1) {
  const W = doc.page.width;
  const H = doc.page.height;
  const y = H - 36;

  doc.rect(0, y, W, 36).fill('#f8fafc');
  doc.moveTo(30, y).lineTo(W - 30, y).strokeColor(C.border).lineWidth(0.5).stroke();

  doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
    .text('PLÁSTICOS ERP  •  Sistema de Gestión de Producción', 30, y + 10)
    .text(`Generado: ${new Date().toLocaleString('es-MX')}  •  Página ${page}`, W - 220, y + 10);
}

// ─── PDF de Cotización ──────────────────────────────────────────────────────
router.get('/cotizacion/:id', async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: CotizacionDetalle, as: 'detalles', include: [{ model: Producto, as: 'producto' }] }
      ]
    });

    if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });

    const cot = cotizacion as any;
    const cliente = cot.cliente;
    const W = 612; // LETTER

    const doc = new PDFDocument({ margin: 0, size: 'LETTER' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="cotizacion-${cot.folio}.pdf"`);
    doc.pipe(res);

    let y = drawHeader(doc, 'COTIZACIÓN', cot.folio);

    // ── Info en 3 columnas ──
    const cellW = (W - 75) / 3;
    infoCell(doc, 30,          y, cellW, 'CLIENTE',              cliente?.razon_social || '—');
    infoCell(doc, 35 + cellW,  y, cellW, 'RFC',                  cliente?.rfc || '—');
    infoCell(doc, 40 + cellW*2,y, cellW, 'FECHA',                fmtDate(cot.fecha_cotizacion), true);
    y += 46;

    infoCell(doc, 30,          y, cellW, 'CONTACTO',             cot.contacto || '—');
    infoCell(doc, 35 + cellW,  y, cellW, 'VALIDEZ',              cot.validez || '30 días');
    infoCell(doc, 40 + cellW*2,y, cellW, 'MONEDA',               cot.moneda || 'MXN');
    y += 52;

    // ── Tabla productos ──
    y = sectionTitle(doc, y, 'DETALLE DE PRODUCTOS');

    // Cabecera tabla
    doc.rect(30, y, W - 60, 20).fill(C.navy);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8);
    const cols = { desc: 38, cant: 300, precio: 366, desc2: 436, imp: 494 };
    doc.text('Producto / Descripción', cols.desc, y + 6, { width: 255 });
    doc.text('Cant.',    cols.cant,  y + 6, { width: 60,  align: 'right' });
    doc.text('P. Unit.', cols.precio,y + 6, { width: 64,  align: 'right' });
    doc.text('Desc.',    cols.desc2, y + 6, { width: 52,  align: 'right' });
    doc.text('Importe',  cols.imp,   y + 6, { width: 80,  align: 'right' });
    y += 20;

    const detalles: any[] = cot.detalles || [];
    detalles.forEach((det: any, i: number) => {
      const h = 22;
      doc.rect(30, y, W - 60, h).fill(i % 2 === 0 ? C.rowAlt : C.white);
      doc.moveTo(30, y + h).lineTo(W - 30, y + h).strokeColor(C.border).lineWidth(0.3).stroke();
      doc.fillColor(C.text).font('Helvetica').fontSize(8);
      doc.text(det.producto?.nombre || det.descripcion || '—', cols.desc, y + 7, { width: 255, ellipsis: true });
      doc.text(Number(det.cantidad).toLocaleString('es-MX'),    cols.cant,  y + 7, { width: 60,  align: 'right' });
      doc.text(formatMXN(det.precio_unitario),                  cols.precio,y + 7, { width: 64,  align: 'right' });
      doc.text(formatMXN(det.descuento || 0),                   cols.desc2, y + 7, { width: 52,  align: 'right' });
      doc.font('Helvetica-Bold')
        .text(formatMXN(det.importe),                           cols.imp,   y + 7, { width: 80,  align: 'right' });
      y += h;
    });

    if (detalles.length === 0) {
      doc.rect(30, y, W - 60, 30).fill(C.rowAlt);
      doc.fillColor(C.muted).font('Helvetica').fontSize(9)
        .text('Sin productos registrados', 30, y + 10, { width: W - 60, align: 'center' });
      y += 30;
    }

    // Borde tabla
    doc.rect(30, y - detalles.length * 22 - 20, W - 60, detalles.length * 22 + 20)
      .stroke(C.border).lineWidth(0.5);

    y += 14;
    divider(doc, y);
    y += 10;

    // ── Totales ──
    const totX = W - 220;
    const totW = 180;
    doc.roundedRect(totX, y, totW, 72, 4).fill(C.rowAlt).stroke(C.border).lineWidth(0.5);
    doc.fillColor(C.slate).font('Helvetica').fontSize(9)
      .text('Subtotal:',   totX + 12, y + 10)
      .text('IVA (16%):',  totX + 12, y + 28);
    doc.fillColor(C.text).font('Helvetica').fontSize(9)
      .text(formatMXN(cot.subtotal),            totX + 12, y + 10, { width: totW - 24, align: 'right' })
      .text(formatMXN(cot.impuesto_trasladado), totX + 12, y + 28, { width: totW - 24, align: 'right' });

    doc.moveTo(totX + 12, y + 44).lineTo(totX + totW - 12, y + 44).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(11)
      .text('TOTAL:',       totX + 12, y + 50)
      .text(formatMXN(cot.total), totX + 12, y + 50, { width: totW - 24, align: 'right' });
    y += 86;

    // ── Condiciones ──
    if (cot.condiciones_pago || cot.tiempo_entrega || cot.observaciones) {
      y = sectionTitle(doc, y, 'CONDICIONES Y OBSERVACIONES');
      doc.roundedRect(30, y, W - 60, 50, 4).fill(C.rowAlt).stroke(C.border).lineWidth(0.5);
      doc.fillColor(C.slate).font('Helvetica').fontSize(8.5);
      let ty = y + 8;
      if (cot.condiciones_pago) { doc.text(`Pago: ${cot.condiciones_pago}`, 42, ty); ty += 14; }
      if (cot.tiempo_entrega)   { doc.text(`Entrega: ${cot.tiempo_entrega}`, 42, ty); ty += 14; }
      if (cot.observaciones)    { doc.text(`Obs: ${cot.observaciones}`, 42, ty, { width: W - 84 }); }
      y += 60;
    }

    // ── Firmas ──
    y = Math.max(y + 20, doc.page.height - 120);
    const sigW = 150, sigY = y;
    doc.moveTo(50, sigY).lineTo(50 + sigW, sigY).strokeColor(C.muted).lineWidth(0.7).stroke();
    doc.moveTo(W - 50 - sigW, sigY).lineTo(W - 50, sigY).strokeColor(C.muted).lineWidth(0.7).stroke();
    doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
      .text('Elaboró / Asesor Comercial', 50, sigY + 6, { width: sigW, align: 'center' })
      .text('Autorización / Cliente',     W - 50 - sigW, sigY + 6, { width: sigW, align: 'center' });

    drawFooter(doc);
    doc.end();
  } catch (error: any) {
    logger.error('Error generando PDF cotización', { error: error.message });
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar PDF' });
  }
});

// ─── PDF de Orden de Producción ─────────────────────────────────────────────
router.get('/orden-produccion/:id', async (req, res) => {
  try {
    const orden = await OrdenProduccion.findByPk(req.params.id, {
      include: [
        { model: Cliente   as any, as: 'cliente' },
        { model: Operador  as any, as: 'operador' },
        { model: Maquina   as any, as: 'maquina' },
        {
          model: OrdenProduccionDetalle as any, as: 'detalles',
          include: [
            { model: Producto as any, as: 'producto' },
            { model: Material as any, as: 'material' },
          ]
        }
      ]
    });

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    const op    = orden as any;
    const W     = 612;
    const detalles: any[] = op.detalles || [];

    const doc = new PDFDocument({ margin: 0, size: 'LETTER' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="op-${op.folio}.pdf"`);
    doc.pipe(res);

    let y = drawHeader(doc, 'ORDEN DE PRODUCCIÓN', op.folio, op.estado);

    // ── Fila 1: Cliente | Fecha Orden | Fecha Entrega ──
    const cW = (W - 75) / 3;
    infoCell(doc, 30,         y, cW,     'CLIENTE',        op.cliente?.razon_social || '—');
    infoCell(doc, 35 + cW,    y, cW,     'FECHA DE ORDEN', fmtDate(op.fecha_orden), false);
    infoCell(doc, 40 + cW*2,  y, cW,     'FECHA ENTREGA',  fmtDate(op.fecha_entrega), true);
    y += 46;

    // ── Fila 2: Máquina | Operador | Turno ──
    infoCell(doc, 30,         y, cW,     'MÁQUINA ASIGNADA', op.maquina?.nombre || op.maquina_asignada || '—');
    infoCell(doc, 35 + cW,    y, cW,     'OPERADOR',          op.operador?.nombre || '—');
    infoCell(doc, 40 + cW*2,  y, cW,     'TURNO',             op.turno ? op.turno.charAt(0).toUpperCase() + op.turno.slice(1) : '—');
    y += 46;

    // ── Fila 3: Prioridad | T. Estimado | Creado por ──
    const prioColors: Record<string, string> = { baja: '🔵 Baja', media: '🟡 Media', alta: '🟠 Alta', urgente: '🔴 Urgente' };
    infoCell(doc, 30,         y, cW,     'PRIORIDAD',      op.prioridad ? (op.prioridad.toUpperCase()) : '—');
    infoCell(doc, 35 + cW,    y, cW,     'TIEMPO ESTIMADO',op.tiempo_estimado_min ? `${op.tiempo_estimado_min} min` : '—');
    infoCell(doc, 40 + cW*2,  y, cW,     'CREADA POR',     op.usuario?.nombre || '—');
    y += 52;

    // ── Observaciones ──
    if (op.observaciones) {
      doc.roundedRect(30, y, W - 60, 32, 3).fill('#fffbeb').stroke('#fde68a').lineWidth(0.5);
      doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(7).text('OBSERVACIONES', 42, y + 6);
      doc.fillColor('#78350f').font('Helvetica').fontSize(8.5)
        .text(op.observaciones, 42, y + 16, { width: W - 84 });
      y += 42;
    }

    // ── Tabla de productos ──
    y = sectionTitle(doc, y, 'LÍNEAS DE PRODUCCIÓN');

    // Cabecera tabla
    const ROW_H   = 26;
    const COL = { prod: 38, mat: 220, sol: 340, prod2: 402, def: 462, ef: 512 };

    doc.rect(30, y, W - 60, ROW_H).fill(C.navy);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5);
    doc.text('PRODUCTO',        COL.prod,  y + 9, { width: 175 });
    doc.text('MATERIAL',        COL.mat,   y + 9, { width: 112 });
    doc.text('SOLICITADA',      COL.sol,   y + 9, { width: 56,  align: 'right' });
    doc.text('PRODUCIDA',       COL.prod2, y + 9, { width: 56,  align: 'right' });
    doc.text('DEFECT.',         COL.def,   y + 9, { width: 44,  align: 'right' });
    doc.text('EF.',             COL.ef,    y + 9, { width: 50,  align: 'right' });
    y += ROW_H;

    detalles.forEach((det: any, i: number) => {
      const bg = i % 2 === 0 ? C.rowAlt : C.white;
      doc.rect(30, y, W - 60, ROW_H).fill(bg);
      doc.moveTo(30, y + ROW_H).lineTo(W - 30, y + ROW_H).strokeColor(C.border).lineWidth(0.3).stroke();

      const solicitada  = Number(det.cantidad_solicitada || 0);
      const producida   = Number(det.cantidad_producida  || 0);
      const defectuosa  = Number(det.cantidad_defectuosa || 0);
      const ef          = solicitada > 0 ? ((producida / solicitada) * 100).toFixed(0) + '%' : '—';
      const efColor     = solicitada > 0 && producida / solicitada >= 0.9 ? C.green
                        : solicitada > 0 && producida / solicitada >= 0.7 ? C.yellow : C.red;

      doc.fillColor(C.text).font('Helvetica-Bold').fontSize(8.5)
        .text(det.producto?.nombre || '—', COL.prod, y + 5, { width: 175, ellipsis: true });
      doc.fillColor(C.slate).font('Helvetica').fontSize(7.5)
        .text(det.producto?.codigo || '', COL.prod, y + 16, { width: 175 });

      doc.fillColor(C.slate).font('Helvetica').fontSize(8)
        .text(det.material?.nombre || '—', COL.mat, y + 9, { width: 112, ellipsis: true });

      doc.fillColor(C.text).font('Helvetica-Bold').fontSize(9)
        .text(solicitada.toLocaleString('es-MX'), COL.sol,   y + 9, { width: 56, align: 'right' });

      doc.fillColor(producida > 0 ? C.green : C.muted).font('Helvetica-Bold').fontSize(9)
        .text(producida.toLocaleString('es-MX'),  COL.prod2, y + 9, { width: 56, align: 'right' });

      doc.fillColor(defectuosa > 0 ? C.red : C.muted).font('Helvetica-Bold').fontSize(9)
        .text(defectuosa > 0 ? defectuosa.toLocaleString('es-MX') : '—', COL.def, y + 9, { width: 44, align: 'right' });

      if (solicitada > 0) {
        doc.fillColor(efColor).font('Helvetica-Bold').fontSize(9)
          .text(ef, COL.ef, y + 9, { width: 50, align: 'right' });
      }

      y += ROW_H;
    });

    if (detalles.length === 0) {
      doc.rect(30, y, W - 60, 34).fill(C.rowAlt);
      doc.fillColor(C.muted).font('Helvetica').fontSize(9)
        .text('Sin líneas de producción registradas', 30, y + 12, { width: W - 60, align: 'center' });
      y += 34;
    }

    // Borde tabla completa
    const tableTop = y - (detalles.length || 1) * ROW_H - (detalles.length === 0 ? 34 : 0) - ROW_H;
    doc.rect(30, tableTop, W - 60, y - tableTop).stroke(C.border).lineWidth(0.5);
    y += 18;

    // ── Totales de producción ──
    const totalSol  = detalles.reduce((s: number, d: any) => s + Number(d.cantidad_solicitada || 0), 0);
    const totalProd = detalles.reduce((s: number, d: any) => s + Number(d.cantidad_producida  || 0), 0);
    const totalDef  = detalles.reduce((s: number, d: any) => s + Number(d.cantidad_defectuosa || 0), 0);
    const efGlobal  = totalSol > 0 ? ((totalProd / totalSol) * 100).toFixed(1) : '0';

    const kpiW = (W - 75) / 4;
    const kpiDefs = [
      { label: 'Total Solicitadas', value: totalSol.toLocaleString('es-MX'),  color: C.navy,  bg: C.accentLt },
      { label: 'Total Producidas',  value: totalProd.toLocaleString('es-MX'), color: C.green, bg: C.greenLt  },
      { label: 'Total Defectuosas', value: totalDef.toLocaleString('es-MX'),  color: totalDef > 0 ? C.red : C.muted, bg: totalDef > 0 ? C.redLt : C.rowAlt },
      { label: 'Eficiencia Global', value: `${efGlobal}%`, color: Number(efGlobal) >= 90 ? C.green : Number(efGlobal) >= 70 ? C.yellow : C.red, bg: C.rowAlt },
    ];

    kpiDefs.forEach(({ label, value, color, bg }, i) => {
      const kx = 30 + i * (kpiW + 5);
      doc.roundedRect(kx, y, kpiW, 44, 4).fill(bg).stroke(C.border).lineWidth(0.5);
      doc.fillColor(C.slate).font('Helvetica').fontSize(7).text(label, kx + 8, y + 8, { width: kpiW - 16 });
      doc.fillColor(color).font('Helvetica-Bold').fontSize(14).text(value, kx + 8, y + 19, { width: kpiW - 16, align: 'right' });
    });
    y += 58;

    // ── Parámetros de proceso (si hay datos) ──
    const hasParams = detalles.some((d: any) => d.temperatura_inyeccion_real || d.presion_inyeccion_real || d.tiempo_ciclo_real_seg);
    if (hasParams) {
      y = sectionTitle(doc, y, 'PARÁMETROS DE PROCESO REGISTRADOS');
      doc.rect(30, y, W - 60, 20).fill(C.navy);
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5);
      doc.text('PRODUCTO', 38, y + 6, { width: 200 });
      doc.text('TEMP. REAL (°C)', 240, y + 6, { width: 90,  align: 'right' });
      doc.text('PRESIÓN (bar)',   332, y + 6, { width: 90,  align: 'right' });
      doc.text('CICLO (seg)',     424, y + 6, { width: 80,  align: 'right' });
      doc.text('CICLOS',         506, y + 6, { width: 68,  align: 'right' });
      y += 20;

      detalles.forEach((det: any, i: number) => {
        const h = 20;
        doc.rect(30, y, W - 60, h).fill(i % 2 === 0 ? C.rowAlt : C.white);
        doc.fillColor(C.text).font('Helvetica').fontSize(8.5)
          .text(det.producto?.nombre || '—', 38, y + 6, { width: 200, ellipsis: true });
        doc.fillColor(C.slate).font('Helvetica').fontSize(8.5)
          .text(det.temperatura_inyeccion_real  ? String(det.temperatura_inyeccion_real)  : '—', 240, y + 6, { width: 90,  align: 'right' })
          .text(det.presion_inyeccion_real       ? String(det.presion_inyeccion_real)       : '—', 332, y + 6, { width: 90,  align: 'right' })
          .text(det.tiempo_ciclo_real_seg        ? String(det.tiempo_ciclo_real_seg)        : '—', 424, y + 6, { width: 80,  align: 'right' })
          .text(det.ciclos_completados            ? String(det.ciclos_completados)           : '—', 506, y + 6, { width: 68,  align: 'right' });
        doc.moveTo(30, y + h).lineTo(W - 30, y + h).strokeColor(C.border).lineWidth(0.3).stroke();
        y += h;
      });
      doc.rect(30, y - detalles.length * 20 - 20, W - 60, detalles.length * 20 + 20)
        .stroke(C.border).lineWidth(0.5);
      y += 16;
    }

    // ── Sección de control de calidad (checklist) ──
    if (y < doc.page.height - 160) {
      y = sectionTitle(doc, y, 'CONTROL DE CALIDAD');
      const checks = ['Inspección dimensional', 'Inspección visual', 'Prueba de funcionalidad', 'Liberación de lote'];
      const chkW = (W - 75) / 4;
      checks.forEach((ch, i) => {
        const cx = 30 + i * (chkW + 5);
        doc.roundedRect(cx, y, chkW, 36, 3).fill(C.rowAlt).stroke(C.border).lineWidth(0.5);
        doc.roundedRect(cx + 8, y + 10, 12, 12, 2).fill(C.white).stroke(C.border).lineWidth(0.7);
        doc.fillColor(C.slate).font('Helvetica').fontSize(7.5)
          .text(ch, cx + 26, y + 14, { width: chkW - 34 });
      });
      y += 46;
    }

    // ── Firmas ──
    const firmaY = Math.max(y + 10, doc.page.height - 100);
    const sigW   = 160;

    [
      { label: 'Responsable de Producción', x: 50 },
      { label: 'Supervisor / Calidad',       x: W / 2 - sigW / 2 },
      { label: 'Gerente de Operaciones',     x: W - 50 - sigW },
    ].forEach(({ label, x }) => {
      doc.moveTo(x, firmaY).lineTo(x + sigW, firmaY).strokeColor(C.slate).lineWidth(0.7).stroke();
      doc.roundedRect(x, firmaY - 30, sigW, 28, 3).fill(C.rowAlt).stroke(C.border).lineWidth(0.4);
      doc.fillColor(C.muted).font('Helvetica').fontSize(7)
        .text(label, x, firmaY + 5, { width: sigW, align: 'center' });
    });

    drawFooter(doc);
    doc.end();
  } catch (error: any) {
    logger.error('Error generando PDF orden de producción', { error: error.message });
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar PDF' });
  }
});

export default router;
