USE plasticos_erp;

CREATE TABLE IF NOT EXISTS regimenes_fiscales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(3) NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar catálogo oficial del SAT si está vacío
INSERT INTO regimenes_fiscales (clave, descripcion, activo) VALUES
('601', 'General de Ley Personas Morales', TRUE),
('603', 'Personas Morales con Fines no Lucrativos', TRUE),
('605', 'Sueldos y Salarios e Ingresos Asimilados a Salarios', TRUE),
('606', 'Arrendamiento', TRUE),
('607', 'Régimen de Enajenación o Adquisición de Bienes', TRUE),
('608', 'Demás ingresos', TRUE),
('610', 'Residentes en el Extranjero sin Establecimiento Permanente en México', TRUE),
('611', 'Ingresos por Dividendos (socios y accionistas)', TRUE),
('612', 'Personas Físicas con Actividades Empresariales y Profesionales', TRUE),
('614', 'Ingresos por intereses', TRUE),
('615', 'Régimen de los ingresos por obtención de premios', TRUE),
('616', 'Sin obligaciones fiscales', TRUE),
('620', 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos', TRUE),
('621', 'Incorporación Fiscal', TRUE),
('622', 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', TRUE),
('623', 'Opcional para Grupos de Sociedades', TRUE),
('624', 'Coordinados', TRUE),
('625', 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', TRUE),
('626', 'Régimen Simplificado de Confianza', TRUE)
ON DUPLICATE KEY UPDATE activo = TRUE, descripcion = VALUES(descripcion);
