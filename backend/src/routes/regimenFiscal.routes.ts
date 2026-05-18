import { Router } from 'express';
import RegimenFiscal from '../models/RegimenFiscal';

const router = Router();

// GET /api/regimenes-fiscales - Obtener todos los regímenes fiscales
router.get('/', async (req, res) => {
  try {
    const regimenes = await RegimenFiscal.findAll({
      where: { activo: true },
      order: [['clave', 'ASC']],
    });
    res.json(regimenes);
  } catch (error) {
    console.error('Error al obtener regímenes fiscales:', error);
    res.status(500).json({ error: 'Error al obtener regímenes fiscales' });
  }
});

// GET /api/regimenes-fiscales/all - Obtener todos (incluyendo inactivos)
router.get('/all', async (req, res) => {
  try {
    const regimenes = await RegimenFiscal.findAll({
      order: [['clave', 'ASC']],
    });
    res.json(regimenes);
  } catch (error) {
    console.error('Error al obtener regímenes fiscales:', error);
    res.status(500).json({ error: 'Error al obtener regímenes fiscales' });
  }
});

// GET /api/regimenes-fiscales/:id - Obtener un régimen fiscal por ID
router.get('/:id', async (req, res) => {
  try {
    const regimen = await RegimenFiscal.findByPk(req.params.id);
    if (!regimen) {
      return res.status(404).json({ error: 'Régimen fiscal no encontrado' });
    }
    res.json(regimen);
  } catch (error) {
    console.error('Error al obtener régimen fiscal:', error);
    res.status(500).json({ error: 'Error al obtener régimen fiscal' });
  }
});

// POST /api/regimenes-fiscales - Crear nuevo régimen fiscal
router.post('/', async (req, res) => {
  try {
    const { clave, descripcion } = req.body;

    // Validaciones
    if (!clave || !descripcion) {
      return res.status(400).json({ error: 'Clave y descripción son requeridos' });
    }

    if (!/^\d{3}$/.test(clave)) {
      return res.status(400).json({ error: 'La clave debe ser numérica de 3 dígitos' });
    }

    // Verificar si ya existe
    const existing = await RegimenFiscal.findOne({ where: { clave } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un régimen fiscal con esa clave' });
    }

    const regimen = await RegimenFiscal.create({
      clave,
      descripcion,
      activo: true,
    });

    res.status(201).json(regimen);
  } catch (error) {
    console.error('Error al crear régimen fiscal:', error);
    res.status(500).json({ error: 'Error al crear régimen fiscal' });
  }
});

// PUT /api/regimenes-fiscales/:id - Actualizar régimen fiscal
router.put('/:id', async (req, res) => {
  try {
    const { clave, descripcion, activo } = req.body;
    const regimen = await RegimenFiscal.findByPk(req.params.id);

    if (!regimen) {
      return res.status(404).json({ error: 'Régimen fiscal no encontrado' });
    }

    // Si se actualiza la clave, verificar que no exista otra
    if (clave && clave !== regimen.clave) {
      const existing = await RegimenFiscal.findOne({ where: { clave } });
      if (existing) {
        return res.status(400).json({ error: 'Ya existe otro régimen fiscal con esa clave' });
      }
    }

    await regimen.update({
      clave: clave || regimen.clave,
      descripcion: descripcion || regimen.descripcion,
      activo: activo !== undefined ? activo : regimen.activo,
    });

    res.json(regimen);
  } catch (error) {
    console.error('Error al actualizar régimen fiscal:', error);
    res.status(500).json({ error: 'Error al actualizar régimen fiscal' });
  }
});

// DELETE /api/regimenes-fiscales/:id - Eliminar régimen fiscal (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const regimen = await RegimenFiscal.findByPk(req.params.id);

    if (!regimen) {
      return res.status(404).json({ error: 'Régimen fiscal no encontrado' });
    }

    await regimen.update({ activo: false });
    res.json({ message: 'Régimen fiscal eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar régimen fiscal:', error);
    res.status(500).json({ error: 'Error al eliminar régimen fiscal' });
  }
});

// POST /api/regimenes-fiscales/seed - Cargar catálogo inicial del SAT
router.post('/seed', async (req, res) => {
  try {
    const catalogoSAT = [
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
    ];

    let creados = 0;
    let existentes = 0;

    for (const item of catalogoSAT) {
      const [regimen, created] = await RegimenFiscal.findOrCreate({
        where: { clave: item.clave },
        defaults: { ...item, activo: true },
      });
      if (created) {
        creados++;
      } else {
        existentes++;
      }
    }

    res.json({
      message: 'Catálogo del SAT cargado correctamente',
      creados,
      existentes,
      total: catalogoSAT.length,
    });
  } catch (error) {
    console.error('Error al cargar catálogo:', error);
    res.status(500).json({ error: 'Error al cargar catálogo del SAT' });
  }
});

export default router;
