import { Router } from 'express';
import { Cliente } from '../models';

const router = Router();

// Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const { activo = true } = req.query;
    const clientes = await Cliente.findAll({
      where: { activo: activo === 'true' },
      order: [['razon_social', 'ASC']]
    });
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Obtener un cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

// Crear cliente
router.post('/', async (req, res) => {
  try {
    const clienteData = req.body;
    
    // Validar RFC
    if (!clienteData.rfc || clienteData.rfc.length < 12) {
      return res.status(400).json({ error: 'RFC inválido' });
    }

    const existingCliente = await Cliente.findOne({ where: { rfc: clienteData.rfc } });
    if (existingCliente) {
      return res.status(400).json({ error: 'Ya existe un cliente con ese RFC' });
    }

    const cliente = await Cliente.create(clienteData);
    res.status(201).json(cliente);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await cliente.update(req.body);
    res.json(cliente);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// Eliminar cliente (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await cliente.update({ activo: false });
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

export default router;
