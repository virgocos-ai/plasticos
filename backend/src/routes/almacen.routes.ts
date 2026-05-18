import { Router } from 'express';
import Almacen from '../models/Almacen';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/almacenes - Listar todos los almacenes
router.get('/', async (req, res) => {
  try {
    const almacenes = await Almacen.findAll({
      where: { activo: true },
      order: [['codigo', 'ASC']],
    });
    res.json(almacenes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener almacenes' });
  }
});

// GET /api/almacenes/all - Listar todos incluyendo inactivos
router.get('/all', async (req, res) => {
  try {
    const almacenes = await Almacen.findAll({
      order: [['codigo', 'ASC']],
    });
    res.json(almacenes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener almacenes' });
  }
});

// GET /api/almacenes/:id - Obtener un almacén
router.get('/:id', async (req, res) => {
  try {
    const almacen = await Almacen.findByPk(req.params.id);
    if (!almacen) {
      return res.status(404).json({ error: 'Almacén no encontrado' });
    }
    res.json(almacen);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener almacén' });
  }
});

// POST /api/almacenes - Crear almacén
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, tipo, ubicacion, responsable, telefono } = req.body;

    // Validaciones
    if (!codigo || !nombre || !tipo || !ubicacion) {
      return res.status(400).json({ error: 'Código, nombre, tipo y ubicación son requeridos' });
    }

    // Verificar código único
    const existing = await Almacen.findOne({ where: { codigo } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un almacén con ese código' });
    }

    const almacen = await Almacen.create({
      codigo,
      nombre,
      tipo,
      ubicacion,
      responsable,
      telefono,
      activo: true,
    });

    res.status(201).json(almacen);
  } catch (error) {
    console.error('Error al crear almacén:', error);
    res.status(500).json({ error: 'Error al crear almacén' });
  }
});

// PUT /api/almacenes/:id - Actualizar almacén
router.put('/:id', async (req, res) => {
  try {
    const almacen = await Almacen.findByPk(req.params.id);
    if (!almacen) {
      return res.status(404).json({ error: 'Almacén no encontrado' });
    }

    const { codigo, nombre, tipo, ubicacion, responsable, telefono, activo } = req.body;

    // Verificar código único si se cambia
    if (codigo && codigo !== almacen.codigo) {
      const existing = await Almacen.findOne({ where: { codigo } });
      if (existing) {
        return res.status(400).json({ error: 'Ya existe otro almacén con ese código' });
      }
    }

    await almacen.update({
      codigo: codigo || almacen.codigo,
      nombre: nombre || almacen.nombre,
      tipo: tipo || almacen.tipo,
      ubicacion: ubicacion || almacen.ubicacion,
      responsable: responsable !== undefined ? responsable : almacen.responsable,
      telefono: telefono !== undefined ? telefono : almacen.telefono,
      activo: activo !== undefined ? activo : almacen.activo,
    });

    res.json(almacen);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar almacén' });
  }
});

// DELETE /api/almacenes/:id - Eliminar almacén (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const almacen = await Almacen.findByPk(req.params.id);
    if (!almacen) {
      return res.status(404).json({ error: 'Almacén no encontrado' });
    }

    await almacen.update({ activo: false });
    res.json({ message: 'Almacén eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar almacén' });
  }
});

// POST /api/almacenes/seed - Crear almacenes por defecto
router.post('/seed', async (req, res) => {
  try {
    const almacenesDefault: { codigo: string; nombre: string; tipo: 'principal' | 'secundario' | 'cuarentena' | 'merma' | 'transito'; ubicacion: string; responsable: string }[] = [
      { codigo: 'ALM-PRINC', nombre: 'Almacén Principal', tipo: 'principal', ubicacion: 'Edificio A - Nave 1', responsable: 'Jefe de Almacén' },
      { codigo: 'ALM-SEC01', nombre: 'Almacén Secundario', tipo: 'secundario', ubicacion: 'Edificio B - Nave 2', responsable: 'Auxiliar de Almacén' },
      { codigo: 'ALM-CUAREN', nombre: 'Zona de Cuarentena', tipo: 'cuarentena', ubicacion: 'Edificio C - Área de Inspección', responsable: 'Control de Calidad' },
      { codigo: 'ALM-MERMA', nombre: 'Almacén de Mermas', tipo: 'merma', ubicacion: 'Edificio D - Nave 3', responsable: 'Producción' },
      { codigo: 'ALM-TRANS', nombre: 'Zona de Tránsito', tipo: 'transito', ubicacion: 'Área de Carga y Descarga', responsable: 'Logística' },
    ];

    const creados = [];
    for (const alm of almacenesDefault) {
      const [almacen, created] = await Almacen.findOrCreate({
        where: { codigo: alm.codigo },
        defaults: { 
          codigo: alm.codigo,
          nombre: alm.nombre,
          tipo: alm.tipo,
          ubicacion: alm.ubicacion,
          responsable: alm.responsable,
          activo: true 
        },
      });
      if (created) creados.push(almacen);
    }

    res.json({
      message: 'Almacenes creados correctamente',
      creados: creados.length,
      total: almacenesDefault.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear almacenes por defecto' });
  }
});

export default router;
