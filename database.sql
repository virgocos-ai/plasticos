-- Script de inicialización de base de datos para Plasticos ERP
-- Sistema de Gestión para Inyección de Plástico - Normativa Mexicana

CREATE DATABASE IF NOT EXISTS plasticos_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE plasticos_erp;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'operador', 'contador', 'almacen') NOT NULL DEFAULT 'operador',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de clientes con datos fiscales SAT
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfc VARCHAR(13) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    codigo_postal VARCHAR(5) NOT NULL,
    calle VARCHAR(100),
    numero_exterior VARCHAR(20),
    numero_interior VARCHAR(20),
    colonia VARCHAR(100),
    municipio VARCHAR(100),
    estado VARCHAR(50),
    pais VARCHAR(50) NOT NULL DEFAULT 'MEX',
    regimen_fiscal VARCHAR(3) NOT NULL COMMENT 'Clave del régimen fiscal del SAT',
    uso_cfdi VARCHAR(3) NOT NULL DEFAULT 'G03' COMMENT 'Uso CFDI por defecto',
    email VARCHAR(100),
    telefono VARCHAR(20),
    contacto VARCHAR(100),
    limite_credito DECIMAL(12,2) NOT NULL DEFAULT 0,
    dias_credito INT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de proveedores con datos fiscales SAT
CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfc VARCHAR(13) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    codigo_postal VARCHAR(5) NOT NULL,
    calle VARCHAR(100),
    numero_exterior VARCHAR(20),
    numero_interior VARCHAR(20),
    colonia VARCHAR(100),
    municipio VARCHAR(100),
    estado VARCHAR(50),
    pais VARCHAR(50) NOT NULL DEFAULT 'MEX',
    regimen_fiscal VARCHAR(3) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    contacto VARCHAR(100),
    dias_entrega INT NOT NULL DEFAULT 7,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de materiales (resinas, masterbatch, aditivos)
CREATE TABLE materiales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    tipo ENUM('resina', 'masterbatch', 'aditivo', 'empaque', 'otro') NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    color VARCHAR(30),
    unidad_medida VARCHAR(10) NOT NULL DEFAULT 'KG',
    peso_kg_bolsa DECIMAL(8,2),
    proveedor_preferido_id INT,
    costo_por_kg DECIMAL(12,4) NOT NULL DEFAULT 0,
    stock_minimo_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_maximo_kg DECIMAL(10,2) NOT NULL DEFAULT 1000,
    stock_actual_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    temperatura_inyeccion_c DECIMAL(5,1),
    temperatura_molde_c DECIMAL(5,1),
    presion_inyeccion_bar DECIMAL(6,1),
    tiempo_ciclo_seg DECIMAL(6,1),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_preferido_id) REFERENCES proveedores(id)
);

-- Tabla de productos (piezas moldeadas)
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo ENUM('producto_terminado', 'subensamble', 'pieza') NOT NULL DEFAULT 'producto_terminado',
    unidad_medida VARCHAR(10) NOT NULL DEFAULT 'PZ',
    peso_gr DECIMAL(10,2),
    material_principal_id INT,
    ciclo_inyeccion_seg DECIMAL(6,2),
    cavidades_molde INT,
    tiempo_cambio_molde_min INT,
    costo_material_unitario DECIMAL(12,4) NOT NULL DEFAULT 0,
    costo_mano_obra_unitario DECIMAL(12,4) NOT NULL DEFAULT 0,
    costo_energia_unitario DECIMAL(12,4) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_maximo DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_actual DECIMAL(12,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (material_principal_id) REFERENCES materiales(id)
);

-- Tabla de órdenes de producción
CREATE TABLE ordenes_produccion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(20) NOT NULL UNIQUE,
    fecha_orden DATE NOT NULL,
    fecha_entrega DATE,
    cliente_id INT,
    prioridad ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
    estado ENUM('pendiente', 'en_produccion', 'completada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    maquina_asignada VARCHAR(20),
    turno ENUM('matutino', 'vespertino', 'nocturno') NOT NULL DEFAULT 'matutino',
    operador_id INT,
    observaciones TEXT,
    tiempo_estimado_min INT,
    tiempo_real_min INT,
    usuario_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de detalle de órdenes de producción
CREATE TABLE ordenes_produccion_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    producto_id INT NOT NULL,
    material_id INT,
    cantidad_solicitada DECIMAL(10,2) NOT NULL DEFAULT 0,
    cantidad_producida DECIMAL(10,2) NOT NULL DEFAULT 0,
    cantidad_defectuosa DECIMAL(10,2) NOT NULL DEFAULT 0,
    peso_pieza_gr DECIMAL(8,2),
    peso_total_material_kg DECIMAL(10,3),
    ciclos_completados INT,
    temperatura_inyeccion_real DECIMAL(5,1),
    presion_inyeccion_real DECIMAL(6,1),
    tiempo_ciclo_real_seg DECIMAL(6,1),
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes_produccion(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (material_id) REFERENCES materiales(id)
);

-- Tabla de facturas CFDI
CREATE TABLE facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serie VARCHAR(5) NOT NULL DEFAULT 'A',
    folio INT NOT NULL,
    uuid VARCHAR(36) UNIQUE,
    fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_timbrado DATETIME,
    cliente_id INT NOT NULL,
    forma_pago VARCHAR(2) NOT NULL DEFAULT '03',
    metodo_pago VARCHAR(3) NOT NULL DEFAULT 'PUE',
    condiciones_pago VARCHAR(100),
    moneda VARCHAR(3) NOT NULL DEFAULT 'MXN',
    tipo_cambio DECIMAL(10,4) NOT NULL DEFAULT 1,
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
    descuento DECIMAL(14,2) NOT NULL DEFAULT 0,
    impuesto_trasladado DECIMAL(14,2) NOT NULL DEFAULT 0,
    impuesto_retenido DECIMAL(14,2) NOT NULL DEFAULT 0,
    total DECIMAL(14,2) NOT NULL DEFAULT 0,
    estado ENUM('borrador', 'timbrada', 'cancelada') NOT NULL DEFAULT 'borrador',
    estado_sat ENUM('Vigente', 'Cancelado'),
    sello_digital_cfdi TEXT,
    sello_digital_sat TEXT,
    cadena_original TEXT,
    xml_timbrado LONGTEXT,
    observaciones TEXT,
    motivo_cancelacion VARCHAR(100),
    fecha_cancelacion DATETIME,
    usuario_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    UNIQUE KEY serie_folio (serie, folio)
);

-- Tabla de detalle de facturas
CREATE TABLE factura_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    factura_id INT NOT NULL,
    producto_id INT NOT NULL,
    clave_sat VARCHAR(20),
    clave_unidad_sat VARCHAR(5) DEFAULT 'H87',
    descripcion VARCHAR(1000) NOT NULL,
    cantidad DECIMAL(14,4) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'Pieza',
    precio_unitario DECIMAL(14,4) NOT NULL,
    importe DECIMAL(14,2) NOT NULL,
    descuento DECIMAL(14,2) NOT NULL DEFAULT 0,
    impuesto_trasladado DECIMAL(14,2) NOT NULL DEFAULT 0,
    impuesto_retenido DECIMAL(14,2) NOT NULL DEFAULT 0,
    base_impuesto DECIMAL(14,2) NOT NULL DEFAULT 0,
    tasa_cuota DECIMAL(5,4) NOT NULL DEFAULT 0.16,
    tipo_factor VARCHAR(10) NOT NULL DEFAULT 'Tasa',
    objeto_impuesto VARCHAR(2) NOT NULL DEFAULT '02',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de movimientos de inventario
CREATE TABLE inventario_movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('entrada', 'salida', 'ajuste', 'produccion', 'venta', 'compra', 'merma', 'traslado') NOT NULL,
    producto_id INT,
    material_id INT,
    cantidad DECIMAL(12,4) NOT NULL,
    costo_unitario DECIMAL(12,4),
    costo_total DECIMAL(14,2),
    referencia_id INT,
    referencia_tipo VARCHAR(50),
    almacen_origen VARCHAR(20),
    almacen_destino VARCHAR(20),
    motivo VARCHAR(200),
    lote VARCHAR(30),
    fecha_caducidad DATE,
    usuario_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (material_id) REFERENCES materiales(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de cuentas contables (Catálogo de cuentas SAT)
CREATE TABLE cuentas_contables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    tipo ENUM('activo', 'pasivo', 'capital', 'ingreso', 'egreso') NOT NULL,
    naturaleza ENUM('deudora', 'acreedora') NOT NULL,
    nivel INT NOT NULL DEFAULT 1,
    padre_id INT,
    afectable BOOLEAN NOT NULL DEFAULT FALSE,
    agrupador_sat VARCHAR(20) COMMENT 'Código del catálogo de cuentas SAT',
    descripcion_sat VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (padre_id) REFERENCES cuentas_contables(id)
);

-- Tabla de pólizas contables
CREATE TABLE polizas_contables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('ingreso', 'egreso', 'diario') NOT NULL,
    numero INT NOT NULL,
    fecha DATE NOT NULL,
    concepto VARCHAR(500) NOT NULL,
    cuenta_id INT NOT NULL,
    debe DECIMAL(14,2) NOT NULL DEFAULT 0,
    haber DECIMAL(14,2) NOT NULL DEFAULT 0,
    referencia VARCHAR(50),
    referencia_id INT,
    referencia_tipo VARCHAR(50),
    usuario_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_contables(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_tipo_numero (tipo, numero),
    INDEX idx_fecha (fecha)
);

-- Insertar usuario admin por defecto (password: admin123)
INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES 
('Administrador', 'admin@plasticos.com', '$2a$10$N9qo8uLOF0vNjYLlK5.0YuKBD8nJpX.L0xX5vL.0vX5vL.0vX5vL0', 'admin', TRUE);

-- Insertar catálogo básico de cuentas contables
INSERT INTO cuentas_contables (codigo, nombre, tipo, naturaleza, nivel, afectable) VALUES
('1000', 'ACTIVO', 'activo', 'deudora', 1, FALSE),
('2000', 'PASIVO', 'pasivo', 'acreedora', 1, FALSE),
('3000', 'CAPITAL', 'capital', 'acreedora', 1, FALSE),
('4000', 'INGRESOS', 'ingreso', 'acreedora', 1, FALSE),
('5000', 'EGRESOS', 'egreso', 'deudora', 1, FALSE),
('1010', 'Caja', 'activo', 'deudora', 2, TRUE),
('1020', 'Bancos', 'activo', 'deudora', 2, TRUE),
('1030', 'Clientes', 'activo', 'deudora', 2, TRUE),
('1040', 'Inventarios', 'activo', 'deudora', 2, TRUE),
('2010', 'Proveedores', 'pasivo', 'acreedora', 2, TRUE),
('4010', 'Ventas', 'ingreso', 'acreedora', 2, TRUE),
('5010', 'Costo de Ventas', 'egreso', 'deudora', 2, TRUE);

-- Insertar algunos productos SAT de ejemplo
INSERT INTO clientes (rfc, razon_social, codigo_postal, regimen_fiscal, uso_cfdi, activo) VALUES
('XAXX010101000', 'CLIENTE MOSTRADOR', '64000', '616', 'S01', TRUE);
