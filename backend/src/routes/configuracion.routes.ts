import { Router } from 'express';
import Configuracion from '../models/Configuracion';
import logger from '../utils/logger';

const router = Router();

// GET /api/configuracion - Obtener todas las configuraciones
router.get('/', async (req, res) => {
  try {
    const { grupo } = req.query;
    const where: any = {};
    if (grupo) where.grupo = grupo;

    const configs = await Configuracion.findAll({
      where,
      order: [['grupo', 'ASC'], ['clave', 'ASC']],
    });
    res.json(configs);
  } catch (error) {
    logger.error('Error al obtener configuraciones', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
});

// GET /api/configuracion/:clave - Obtener una configuracion por clave
router.get('/:clave', async (req, res) => {
  try {
    const config = await Configuracion.findOne({ where: { clave: req.params.clave } });
    if (!config) {
      return res.status(404).json({ error: 'Configuracion no encontrada' });
    }
    res.json(config);
  } catch (error) {
    logger.error('Error al obtener configuracion', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al obtener configuracion' });
  }
});

// PUT /api/configuracion/batch - Actualizar multiples configuraciones
router.put('/batch', async (req, res) => {
  try {
    const configs: Record<string, string> = req.body;
    const resultados = [];

    for (const [clave, valor] of Object.entries(configs)) {
      const config = await Configuracion.findOne({ where: { clave } });
      if (config && config.editable) {
        await config.update({ valor });
        resultados.push(config);
      }
    }

    res.json(resultados);
  } catch (error) {
    logger.error('Error al actualizar configuraciones batch', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al actualizar configuraciones' });
  }
});

// PUT /api/configuracion/:clave - Actualizar una configuracion
router.put('/:clave', async (req, res) => {
  try {
    const { valor } = req.body;
    const config = await Configuracion.findOne({ where: { clave: req.params.clave } });

    if (!config) {
      return res.status(404).json({ error: 'Configuracion no encontrada' });
    }

    if (!config.editable) {
      return res.status(403).json({ error: 'Esta configuracion no es editable' });
    }

    await config.update({ valor });
    res.json(config);
  } catch (error) {
    logger.error('Error al actualizar configuracion', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al actualizar configuracion' });
  }
});

// POST /api/configuracion/seed - Crear configuraciones por defecto (admin)
router.post('/seed', async (req, res) => {
  try {
    const defaults = [
      // Empresa
      { clave: 'EMPRESA_RAZON_SOCIAL', valor: 'PLASTICOS INDUSTRIALES S.A. DE C.V.', descripcion: 'Razon social de la empresa para CFDI', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_RFC', valor: 'XAXX010101000', descripcion: 'RFC de la empresa emisora', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_REGIMEN_FISCAL', valor: '601', descripcion: 'Regimen fiscal del SAT', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_CP', valor: '64000', descripcion: 'Codigo postal de la empresa', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_CALLE', valor: 'Av. Industrial', descripcion: 'Calle de la direccion fiscal', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_NUM_EXT', valor: '100', descripcion: 'Numero exterior', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_COLONIA', valor: 'Zona Industrial', descripcion: 'Colonia', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_MUNICIPIO', valor: 'Monterrey', descripcion: 'Municipio o alcaldia', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_ESTADO', valor: 'Nuevo Leon', descripcion: 'Estado', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_TELEFONO', valor: '8180000000', descripcion: 'Telefono de contacto', grupo: 'empresa', editable: true },
      { clave: 'EMPRESA_EMAIL', valor: 'contacto@plasticos.com', descripcion: 'Email de contacto', grupo: 'empresa', editable: true },
      // Facturacion
      { clave: 'FACTURA_SERIE', valor: 'A', descripcion: 'Serie de facturacion por defecto', grupo: 'facturacion', editable: true },
      { clave: 'FACTURA_FOLIO_INICIAL', valor: '1', descripcion: 'Folio inicial para facturas', grupo: 'facturacion', editable: true },
      { clave: 'FACTURA_TASA_IVA', valor: '0.16', descripcion: 'Tasa de IVA (16%)', grupo: 'facturacion', editable: true },
      { clave: 'FACTURA_METODO_PAGO', valor: 'PUE', descripcion: 'Metodo de pago por defecto (PUE/PPD)', grupo: 'facturacion', editable: true },
      { clave: 'FACTURA_FORMA_PAGO', valor: '03', descripcion: 'Forma de pago por defecto (01=Efectivo, 03=Transferencia)', grupo: 'facturacion', editable: true },
      { clave: 'FACTURA_USO_CFDI', valor: 'G03', descripcion: 'Uso CFDI por defecto para clientes', grupo: 'facturacion', editable: true },
      { clave: 'CFDI_LUGAR_EXPEDICION', valor: '64000', descripcion: 'Codigo postal de lugar de expedicion', grupo: 'facturacion', editable: true },
      // Inventario
      { clave: 'INV_ALERTA_STOCK_BAJO', valor: 'true', descripcion: 'Activar alertas de stock bajo', grupo: 'inventario', editable: true },
      { clave: 'INV_UNIDAD_PESO', valor: 'KG', descripcion: 'Unidad de peso por defecto', grupo: 'inventario', editable: true },
      // Produccion
      { clave: 'PROD_TURNO_POR_DEFECTO', valor: 'matutino', descripcion: 'Turno por defecto (matutino/vespertino/nocturno)', grupo: 'produccion', editable: true },
      { clave: 'PROD_MARGEN_DEFECTO', valor: '5', descripcion: 'Margen de piezas defectuosas aceptable (%)', grupo: 'produccion', editable: true },
      // Sistema
      { clave: 'SISTEMA_MONEDA', valor: 'MXN', descripcion: 'Moneda por defecto', grupo: 'sistema', editable: true },
      { clave: 'SISTEMA_DECIMALES', valor: '2', descripcion: 'Decimales para moneda', grupo: 'sistema', editable: true },
      { clave: 'SISTEMA_ZONA_HORARIA', valor: 'America/Mexico_City', descripcion: 'Zona horaria', grupo: 'sistema', editable: false },
    ];

    for (const item of defaults) {
      await Configuracion.findOrCreate({
        where: { clave: item.clave },
        defaults: item,
      });
    }

    res.json({ message: 'Configuraciones por defecto creadas' });
  } catch (error) {
    logger.error('Error al crear configuraciones por defecto', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al crear configuraciones' });
  }
});

export default router;
