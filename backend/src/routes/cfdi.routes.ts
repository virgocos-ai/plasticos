import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Generar XML de CFDI 4.0 (pre-timbrado)
router.post('/generar-xml', async (req, res) => {
  try {
    const {
      serie,
      folio,
      fecha,
      forma_pago,
      metodo_pago,
      condiciones_pago,
      subtotal,
      descuento,
      moneda,
      tipo_cambio,
      total,
      tipo_comprobante,
      lugar_expedicion,
      emisor,
      receptor,
      conceptos
    } = req.body;

    const uuid = uuidv4();
    const certificado = '0000000000000000000000000000000000'; // Certificado de prueba
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante 
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd"
  Version="4.0"
  Serie="${serie}"
  Folio="${folio}"
  Fecha="${fecha}"
  FormaPago="${forma_pago}"
  MetodoPago="${metodo_pago}"
  CondicionesDePago="${condiciones_pago || ''}"
  SubTotal="${subtotal.toFixed(2)}"
  ${descuento ? `Descuento="${descuento.toFixed(2)}"` : ''}
  Moneda="${moneda}"
  ${moneda !== 'MXN' ? `TipoCambio="${tipo_cambio}"` : ''}
  Total="${total.toFixed(2)}"
  TipoDeComprobante="${tipo_comprobante}"
  Exportacion="01"
  LugarExpedicion="${lugar_expedicion}"
  NoCertificado="${certificado}">
  
  <cfdi:Emisor 
    Rfc="${emisor.rfc}"
    Nombre="${emisor.nombre}"
    RegimenFiscal="${emisor.regimen_fiscal}"/>
  
  <cfdi:Receptor 
    Rfc="${receptor.rfc}"
    Nombre="${receptor.nombre}"
    DomicilioFiscalReceptor="${receptor.codigo_postal}"
    RegimenFiscalReceptor="${receptor.regimen_fiscal}"
    UsoCFDI="${receptor.uso_cfdi}"/>
  
  <cfdi:Conceptos>`;

    conceptos.forEach((concepto: any) => {
      xml += `
    <cfdi:Concepto
      ClaveProdServ="${concepto.clave_sat}"
      NoIdentificacion="${concepto.no_identificacion}"
      Cantidad="${concepto.cantidad}"
      ClaveUnidad="${concepto.clave_unidad}"
      Unidad="${concepto.unidad}"
      Descripcion="${concepto.descripcion}"
      ValorUnitario="${concepto.valor_unitario.toFixed(2)}"
      Importe="${concepto.importe.toFixed(2)}"
      ${concepto.descuento ? `Descuento="${concepto.descuento.toFixed(2)}"` : ''}
      ObjetoImp="${concepto.objeto_impuesto || '02'}">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado
            Base="${concepto.base_impuesto.toFixed(2)}"
            Impuesto="002"
            TipoFactor="${concepto.tipo_factor || 'Tasa'}"
            TasaOCuota="${(concepto.tasa_cuota || 0.16).toFixed(6)}"
            Importe="${concepto.impuesto_trasladado.toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>`;
    });

    xml += `
  </cfdi:Conceptos>
  
  <cfdi:Impuestos TotalImpuestosTrasladados="${req.body.impuesto_trasladado.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado
        Base="${subtotal.toFixed(2)}"
        Impuesto="002"
        TipoFactor="Tasa"
        TasaOCuota="0.160000"
        Importe="${req.body.impuesto_trasladado.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
</cfdi:Comprobante>`;

    res.json({
      xml,
      uuid_preliminar: uuid,
      mensaje: 'XML generado. Debe ser enviado a un PAC para timbrado.'
    });
  } catch (error) {
    console.error('Error al generar XML:', error);
    res.status(500).json({ error: 'Error al generar XML del CFDI' });
  }
});

// Validar RFC
router.get('/validar-rfc/:rfc', async (req, res) => {
  try {
    const { rfc } = req.params;
    
    // Validación básica de RFC
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-V1-9][A-Z1-9][0-9A-Z]$/;
    const isValid = rfcRegex.test(rfc.toUpperCase());
    
    res.json({
      rfc: rfc.toUpperCase(),
      valido: isValid,
      tipo: rfc.length === 13 ? 'persona_moral' : 'persona_fisica'
    });
  } catch (error) {
    console.error('Error al validar RFC:', error);
    res.status(500).json({ error: 'Error al validar RFC' });
  }
});

export default router;
