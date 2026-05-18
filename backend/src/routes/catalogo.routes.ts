import { Router } from 'express';

const router = Router();

// Catálogos del SAT para CFDI
const catalogosSAT = {
  // Productos/Servicios SAT - Ejemplos comunes para plásticos
  productosServicios: [
    { clave: '30311507', descripcion: 'Piezas de plástico moldeadas por inyección' },
    { clave: '30311508', descripcion: 'Componentes de plástico para automoción' },
    { clave: '30311509', descripcion: 'Envases y recipientes de plástico' },
    { clave: '30311510', descripcion: 'Tuberías y accesorios de plástico' },
    { clave: '30311511', descripcion: 'Piezas técnicas de plástico de ingeniería' },
    { clave: '50161800', descripcion: 'Servicios de moldeo por inyección de plástico' },
    { clave: '50161801', descripcion: 'Servicios de diseño de moldes de inyección' },
  ],
  
  // Unidades de medida SAT
  unidadesMedida: [
    { clave: 'H87', descripcion: 'Pieza', abreviatura: 'pz' },
    { clave: 'XBX', descripcion: 'Caja', abreviatura: 'caja' },
    { clave: 'KGM', descripcion: 'Kilogramo', abreviatura: 'kg' },
    { clave: 'GRM', descripcion: 'Gramo', abreviatura: 'g' },
    { clave: 'LTR', descripcion: 'Litro', abreviatura: 'lt' },
    { clave: 'XPK', descripcion: 'Paquete', abreviatura: 'pkg' },
    { clave: 'XKI', descripcion: 'Kit', abreviatura: 'kit' },
    { clave: 'MTS', descripcion: 'Metro', abreviatura: 'm' },
  ],
  
  // Formas de pago
  formasPago: [
    { clave: '01', descripcion: 'Efectivo' },
    { clave: '02', descripcion: 'Cheque nominativo' },
    { clave: '03', descripcion: 'Transferencia electrónica de fondos' },
    { clave: '04', descripcion: 'Tarjeta de crédito' },
    { clave: '05', descripcion: 'Monedero electrónico' },
    { clave: '06', descripcion: 'Dinero electrónico' },
    { clave: '08', descripcion: 'Vales de despensa' },
    { clave: '12', descripcion: 'Dación en pago' },
    { clave: '13', descripcion: 'Pago por subrogación' },
    { clave: '14', descripcion: 'Pago por consignación' },
    { clave: '15', descripcion: 'Condonación' },
    { clave: '17', descripcion: 'Compensación' },
    { clave: '23', descripcion: 'Novación' },
    { clave: '24', descripcion: 'Confusión' },
    { clave: '25', descripcion: 'Remisión de deuda' },
    { clave: '26', descripcion: 'Prescripción o caducidad' },
    { clave: '27', descripcion: 'A satisfacción del acreedor' },
    { clave: '28', descripcion: 'Tarjeta de débito' },
    { clave: '29', descripcion: 'Tarjeta de servicios' },
    { clave: '30', descripcion: 'Aplicación de anticipos' },
    { clave: '31', descripcion: 'Intermediario pagos' },
    { clave: '99', descripcion: 'Por definir' },
  ],
  
  // Métodos de pago
  metodosPago: [
    { clave: 'PUE', descripcion: 'Pago en una sola exhibición' },
    { clave: 'PPD', descripcion: 'Pago en parcialidades o diferido' },
  ],
  
  // Usos CFDI
  usosCFDI: [
    { clave: 'G01', descripcion: 'Adquisición de mercancías' },
    { clave: 'G02', descripcion: 'Devoluciones, descuentos o bonificaciones' },
    { clave: 'G03', descripcion: 'Gastos en general' },
    { clave: 'I01', descripcion: 'Construcciones' },
    { clave: 'I02', descripcion: 'Mobiliario y equipo de oficina por adquisiciones' },
    { clave: 'I03', descripcion: 'Equipo de transporte' },
    { clave: 'I04', descripcion: 'Equipo de computo y accesorios' },
    { clave: 'I05', descripcion: 'Dados, troqueles, moldes, matrices y herramental' },
    { clave: 'I06', descripcion: 'Comunicaciones telefónicas' },
    { clave: 'I07', descripcion: 'Comunicaciones satelitales' },
    { clave: 'I08', descripcion: 'Otra maquinaria y equipo' },
    { clave: 'D01', descripcion: 'Honorarios médicos, dentales y gastos hospitalarios' },
    { clave: 'D02', descripcion: 'Gastos médicos por incapacidad o discapacidad' },
    { clave: 'D03', descripcion: 'Gastos funerales' },
    { clave: 'D04', descripcion: 'Donativos' },
    { clave: 'D05', descripcion: 'Intereses reales efectivamente pagados por créditos hipotecarios' },
    { clave: 'D06', descripcion: 'Aportaciones voluntarias al SAR' },
    { clave: 'D07', descripcion: 'Primas por seguros de gastos médicos' },
    { clave: 'D08', descripcion: 'Gastos de transportación escolar obligatoria' },
    { clave: 'D09', descripcion: 'Depósitos en cuentas para el ahorro' },
    { clave: 'D10', descripcion: 'Pagos por servicios educativos' },
    { clave: 'P01', descripcion: 'Por definir' },
  ],
  
  // Regímenes fiscales
  regimenesFiscales: [
    { clave: '601', descripcion: 'General de Ley Personas Morales' },
    { clave: '603', descripcion: 'Personas Morales con Fines no Lucrativos' },
    { clave: '605', descripcion: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
    { clave: '606', descripcion: 'Arrendamiento' },
    { clave: '607', descripcion: 'Régimen de Enajenación o Adquisición de Bienes' },
    { clave: '608', descripcion: 'Demás ingresos' },
    { clave: '610', descripcion: 'Residentes en el Extranjero sin Establecimiento Permanente en México' },
    { clave: '611', descripcion: 'Ingresos por Dividendos (socios y accionistas)' },
    { clave: '612', descripcion: 'Personas Físicas con Actividades Empresariales y Profesionales' },
    { clave: '614', descripcion: 'Ingresos por intereses' },
    { clave: '615', descripcion: 'Régimen de los ingresos por obtención de premios' },
    { clave: '616', descripcion: 'Sin obligaciones fiscales' },
    { clave: '620', descripcion: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
    { clave: '621', descripcion: 'Incorporación Fiscal' },
    { clave: '622', descripcion: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
    { clave: '623', descripcion: 'Opcional para Grupos de Sociedades' },
    { clave: '624', descripcion: 'Coordinados' },
    { clave: '625', descripcion: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
    { clave: '626', descripcion: 'Régimen Simplificado de Confianza' },
  ],
  
  // Objetos de impuesto
  objetosImpuesto: [
    { clave: '01', descripcion: 'No objeto de impuesto' },
    { clave: '02', descripcion: 'Sí objeto de impuesto' },
    { clave: '03', descripcion: 'Sí objeto del impuesto y no causa impuesto' },
  ],
  
  // Impuestos
  impuestos: [
    { clave: '001', descripcion: 'ISR' },
    { clave: '002', descripcion: 'IVA' },
    { clave: '003', descripcion: 'IEPS' },
  ],
  
  // Tipos de factor
  tiposFactor: [
    { clave: 'Tasa', descripcion: 'Tasa' },
    { clave: 'Cuota', descripcion: 'Cuota' },
    { clave: 'Exento', descripcion: 'Exento' },
  ]
};

// Endpoint para obtener todos los catálogos
router.get('/', (req, res) => {
  res.json(catalogosSAT);
});

// Endpoint para catálogo específico
router.get('/:nombre', (req, res) => {
  const { nombre } = req.params;
  const catalogo = catalogosSAT[nombre as keyof typeof catalogosSAT];
  
  if (!catalogo) {
    return res.status(404).json({ 
      error: 'Catálogo no encontrado',
      disponibles: Object.keys(catalogosSAT)
    });
  }
  
  res.json(catalogo);
});

export default router;
