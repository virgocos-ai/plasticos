-- ============================================================
--  Plasticos ERP — Seed inicial: usuario administrador
--  Ejecutar en phpMyAdmin / MySQL después del primer inicio
--  de la aplicación (que creará todas las tablas automáticamente)
-- ============================================================

-- Insertar admin solo si no existe
INSERT INTO usuarios (nombre, email, password, rol, activo, created_at, updated_at)
SELECT 'Administrador', 'admin@empresa.com',
       '$2a$12$hRhljELqq.N4dmka/OFqr.nNnzysA/XgjqEHhyKsH59UaJx3NKbZG',
       'admin', 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'admin@empresa.com'
);

-- Credenciales iniciales:
--   Email:    admin@empresa.com
--   Password: Admin123!
-- ¡Cámbia la contraseña inmediatamente desde la app!
