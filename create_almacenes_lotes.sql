USE plasticos_erp;

-- Tabla de Almacenes
CREATE TABLE IF NOT EXISTS almacenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  tipo ENUM('principal', 'secundario', 'cuarentena', 'merma', 'transito') NOT NULL DEFAULT 'principal',
  ubicacion VARCHAR(200) NOT NULL,
  responsable VARCHAR(100),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Lotes (control de inventario por lotes)
CREATE TABLE IF NOT EXISTS lotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_lote VARCHAR(30) NOT NULL UNIQUE,
  tipo ENUM('producto', 'material') NOT NULL,
  producto_id INT,
  material_id INT,
  almacen_id INT NOT NULL,
  cantidad_inicial DECIMAL(12,4) NOT NULL,
  cantidad_actual DECIMAL(12,4) NOT NULL,
  unidad_medida VARCHAR(10) NOT NULL,
  fecha_produccion DATE,
  fecha_caducidad DATE,
  fecha_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
  orden_produccion_id INT,
  proveedor_id INT,
  numero_factura_proveedor VARCHAR(50),
  estado ENUM('activo', 'cuarentena', 'bloqueado', 'agotado', 'caducado') DEFAULT 'activo',
  temperatura_almacenamiento VARCHAR(20),
  humedad_almacenamiento VARCHAR(20),
  observaciones TEXT,
  certificado_calidad VARCHAR(255),
  usuario_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (material_id) REFERENCES materiales(id),
  FOREIGN KEY (almacen_id) REFERENCES almacenes(id),
  FOREIGN KEY (orden_produccion_id) REFERENCES ordenes_produccion(id),
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar almacenes por defecto
INSERT INTO almacenes (codigo, nombre, tipo, ubicacion, responsable, activo) VALUES
('ALM-PRINC', 'Almacén Principal', 'principal', 'Edificio A - Nave 1', 'Jefe de Almacén', TRUE),
('ALM-SEC01', 'Almacén Secundario', 'secundario', 'Edificio B - Nave 2', 'Auxiliar de Almacén', TRUE),
('ALM-CUAREN', 'Zona de Cuarentena', 'cuarentena', 'Edificio C - Área de Inspección', 'Control de Calidad', TRUE),
('ALM-MERMA', 'Almacén de Mermas', 'merma', 'Edificio D - Nave 3', 'Producción', TRUE),
('ALM-TRANS', 'Zona de Tránsito', 'transito', 'Área de Carga y Descarga', 'Logística', TRUE)
ON DUPLICATE KEY UPDATE activo = TRUE;
