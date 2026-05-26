import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models';
import logger from '../utils/logger';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve token JWT
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const usuario = await Usuario.findOne({ 
      where: { email, activo: true } 
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, usuario.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar último acceso
    await usuario.update({ ultimo_acceso: new Date() });

    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol,
        nombre: usuario.nombre 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    logger.error('Error en login', { error: (error as Error).message });
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Crear nuevo usuario (solo admin)
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [admin, operador, contador, almacen]
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos o email duplicado
 */
router.post('/register', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, email, password, rol = 'operador' } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' });
    }

    const existingUser = await Usuario.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await Usuario.create({
      nombre,
      email,
      password: hashedPassword,
      rol,
      activo: true
    });

    res.status(201).json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    });
  } catch (error) {
    logger.error('Error al crear usuario', { error: (error as Error).message });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret', { ignoreExpiration: true }) as any;

    const usuario = await Usuario.findOne({ where: { id: decoded.id, activo: true } });
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });

    const newToken = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      token: newToken,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (error) {
    logger.error('Error en refresh token', { error: (error as Error).message });
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
