-- ============================================================
--  Plasticos ERP — Seed inicial: usuario administrador
--  Ejecutar en phpMyAdmin / MySQL después del primer inicio
--  de la aplicación (que creará todas las tablas automáticamente)
-- ============================================================

-- Insertar admin solo si no existe
-- Hash bcrypt 12 rounds de 'admin123'
INSERT INTO usuarios (nombre, email, password, rol, activo, created_at, updated_at)
SELECT 'Administrador', 'admin@plasticos.com',
       '$2a$10$dUcNVH83WofSBltJXYtqsOQ5oQ8kFuM6ZUUddlQqsNqkRRqmCo7fG',
       'admin', 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'admin@plasticos.com'
);

-- Credenciales iniciales:
--   Email:    admin@plasticos.com
--   Password: admin123
-- ¡Cámbia la contraseña inmediatamente desde la app!
