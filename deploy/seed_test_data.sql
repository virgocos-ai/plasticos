-- ============================================================
--  Plasticos ERP — Datos de prueba para demo / QA
--  Ejecutar DESPUÉS de seed_admin.sql
--  Requiere: productos (1-5), clientes (1-5), ordenes_produccion (1-5)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- MÁQUINAS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO maquinas (codigo, nombre, modelo, marca, capacidad_ton, anio_fabricacion, numero_serie, ubicacion, estado, ultimo_mantenimiento, proximo_mantenimiento, created_at, updated_at) VALUES
('MAQ-001', 'Inyectora Hidráulica 200T', 'HI-200', 'HAITIAN', 200.00, 2018, 'HT2018001', 'Nave A – Bahía 1', 'activa',    '2025-04-10', '2025-10-10', NOW(), NOW()),
('MAQ-002', 'Inyectora Eléctrica 100T',  'EI-100', 'FANUC',  100.00, 2021, 'FC2021042', 'Nave A – Bahía 2', 'activa',    '2025-05-20', '2025-11-20', NOW(), NOW()),
('MAQ-003', 'Inyectora Hidráulica 350T', 'HI-350', 'HAITIAN', 350.00, 2015, 'HT2015007', 'Nave B – Bahía 1', 'mantenimiento', '2025-06-01', '2025-09-01', NOW(), NOW());

-- ─────────────────────────────────────────────────────────────
-- MOLDES
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO moldes (codigo, nombre, producto_id, numero_cavidades, material_molde, numero_serie, vida_util_disparos, disparos_actuales, maquina_id, estado, ubicacion, created_at, updated_at) VALUES
('MOL-001', 'Molde Tapa 500ml 4cav',  1, 4, 'Acero P20', 'M001-2022', 500000, 128500, 1, 'en_maquina',  'Nave A – Bahía 1', NOW(), NOW()),
('MOL-002', 'Molde Tapa 1L 2cav',     2, 2, 'Acero P20', 'M002-2021', 500000,  87200, 2, 'en_maquina',  'Nave A – Bahía 2', NOW(), NOW()),
('MOL-003', 'Molde Asa Cubeta 8cav',  3, 8, 'Acero H13', 'M003-2020', 800000, 312000, 1, 'disponible',  'Almacén Moldes',    NOW(), NOW()),
('MOL-004', 'Molde Caja Org. 1cav',   5, 1, 'Acero P20', 'M004-2019', 300000, 278000, 3, 'mantenimiento','Taller',           NOW(), NOW());

-- ─────────────────────────────────────────────────────────────
-- OPERADORES
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO operadores (codigo, nombre, apellido_paterno, apellido_materno, telefono, fecha_ingreso, turno, especialidad, estado, created_at, updated_at) VALUES
('OP-001', 'Carlos',  'Ramírez',  'López',   '6441001001', '2019-03-01', 'matutino',   'Inyección plástica',    'activo', NOW(), NOW()),
('OP-002', 'María',   'González', 'Pérez',   '6441001002', '2020-07-15', 'vespertino', 'Control de calidad',    'activo', NOW(), NOW()),
('OP-003', 'Jorge',   'Hernández','Ruiz',    '6441001003', '2021-01-10', 'matutino',   'Mantenimiento general', 'activo', NOW(), NOW()),
('OP-004', 'Ana',     'Martínez', 'Soto',    '6441001004', '2022-04-01', 'nocturno',   'Inyección plástica',    'activo', NOW(), NOW());

-- ─────────────────────────────────────────────────────────────
-- TRANSPORTISTAS
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO transportistas (codigo, nombre, tipo, tipo_vehiculo, placa, marca_vehiculo, modelo_vehiculo, anio_vehiculo, capacidad_kg, licencia_numero, licencia_tipo, licencia_vencimiento, telefono, activo, created_at, updated_at) VALUES
('TRP-001', 'Pedro Sánchez Logistics',  'propio',  'Camioneta 3.5T', 'SIN-123-A', 'FORD',   'F-350',    2020, 3500.00, 'L001234', 'C', '2026-12-31', '6441002001', 1, NOW(), NOW()),
('TRP-002', 'Fletes del Noroeste S.A.', 'tercero', 'Camión 10T',     'SIN-456-B', 'KENWORTH','T370',    2019, 10000.00,'L005678', 'E', '2026-06-30', '6441002002', 1, NOW(), NOW()),
('TRP-003', 'Express Plasticos',        'propio',  'Camioneta 1.5T', 'SIN-789-C', 'NISSAN', 'NP300',   2022, 1500.00, 'L009999', 'C', '2027-03-15', '6441002003', 1, NOW(), NOW());

-- ─────────────────────────────────────────────────────────────
-- LOTES (requiere almacen_id=1 — creado por el sistema)
-- ─────────────────────────────────────────────────────────────
INSERT INTO almacenes (codigo, nombre, tipo, ubicacion, activo, created_at, updated_at)
SELECT 'ALM-PT', 'Almacén Producto Terminado', 'principal', 'Nave C', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM almacenes LIMIT 1);

SET @alm = (SELECT id FROM almacenes ORDER BY id ASC LIMIT 1);

INSERT IGNORE INTO lotes (numero_lote, tipo, producto_id, almacen_id, cantidad_inicial, cantidad_actual, unidad_medida, fecha_produccion, fecha_entrada, orden_produccion_id, estado, usuario_id, created_at, updated_at) VALUES
('LOTE-2501-0001', 'producto', 1, @alm, 5000.0000, 3200.0000, 'PZA', '2025-01-10 08:00:00', '2025-01-10 16:00:00', 1, 'activo',    1, NOW(), NOW()),
('LOTE-2501-0002', 'producto', 2, @alm, 2000.0000, 1500.0000, 'PZA', '2025-01-18 08:00:00', '2025-01-18 16:00:00', 2, 'activo',    1, NOW(), NOW()),
('LOTE-2502-0001', 'producto', 3, @alm,  800.0000,  450.0000, 'PZA', '2025-02-05 08:00:00', '2025-02-05 16:00:00', 3, 'activo',    1, NOW(), NOW()),
('LOTE-2503-0001', 'producto', 4, @alm,  600.0000,  600.0000, 'PZA', '2025-03-12 08:00:00', '2025-03-12 16:00:00', 4, 'activo',    1, NOW(), NOW()),
('LOTE-2504-0001', 'producto', 5, @alm,  300.0000,   50.0000, 'PZA', '2025-04-20 08:00:00', '2025-04-20 16:00:00', 5, 'cuarentena',1, NOW(), NOW());

SET @lote1 = (SELECT id FROM lotes WHERE numero_lote = 'LOTE-2501-0001');
SET @lote2 = (SELECT id FROM lotes WHERE numero_lote = 'LOTE-2501-0002');
SET @lote3 = (SELECT id FROM lotes WHERE numero_lote = 'LOTE-2502-0001');
SET @lote4 = (SELECT id FROM lotes WHERE numero_lote = 'LOTE-2503-0001');
SET @lote5 = (SELECT id FROM lotes WHERE numero_lote = 'LOTE-2504-0001');

-- ─────────────────────────────────────────────────────────────
-- INSPECCIONES DE CALIDAD
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO inspecciones_calidad (folio, fecha_inspeccion, orden_produccion_id, lote_id, producto_id, tipo_inspeccion, resultado, cantidad_inspeccionada, cantidad_defectuosa, porcentaje_defectos, defectos_encontrados, inspector_id, created_at, updated_at) VALUES
('CAL2501-0001', '2025-01-11', 1, @lote1, 1, 'final',   'aprobado',    500.00,  3.00, 0.60, NULL,                              1, NOW(), NOW()),
('CAL2501-0002', '2025-01-19', 2, @lote2, 2, 'salida',  'aprobado',    200.00,  1.00, 0.50, NULL,                              1, NOW(), NOW()),
('CAL2502-0001', '2025-02-06', 3, @lote3, 3, 'proceso', 'condicional',  80.00,  6.00, 7.50, 'Rebabas en el borde lateral',     1, NOW(), NOW()),
('CAL2502-0002', '2025-02-20', 1, @lote1, 1, 'entrada', 'aprobado',    300.00,  0.00, 0.00, NULL,                              1, NOW(), NOW()),
('CAL2503-0001', '2025-03-05', 4, @lote4, 4, 'final',   'rechazado',   100.00, 18.00,18.00, 'Deformación por temperatura alta',1, NOW(), NOW()),
('CAL2503-0002', '2025-03-13', 4, @lote4, 4, 'proceso', 'aprobado',    150.00,  2.00, 1.33, NULL,                              1, NOW(), NOW()),
('CAL2504-0001', '2025-04-21', 5, @lote5, 5, 'salida',  'condicional',  50.00,  8.00,16.00, 'Color inconsistente en lote',     1, NOW(), NOW()),
('CAL2505-0001', '2025-05-10', 2, @lote2, 2, 'final',   'aprobado',    400.00,  2.00, 0.50, NULL,                              1, NOW(), NOW()),
('CAL2506-0001', '2025-06-02', 1, @lote1, 1, 'proceso', 'aprobado',    250.00,  1.00, 0.40, NULL,                              1, NOW(), NOW()),
('CAL2506-0002', '2025-06-15', 3, @lote3, 3, 'final',   'rechazado',   120.00, 22.00,18.33, 'Porosidad en la pieza',           1, NOW(), NOW());

-- ─────────────────────────────────────────────────────────────
-- REGISTROS DE MANTENIMIENTO
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO mantenimiento_registros (folio, fecha, entidad_tipo, entidad_id, tipo, descripcion, trabajo_realizado, tecnico, tiempo_paro_min, costo, proximo_mantenimiento, estado, usuario_id, created_at, updated_at) VALUES
('MNT2501-0001', '2025-01-15', 'maquina', 1, 'preventivo',  'Mantenimiento semestral MAQ-001', 'Cambio de aceite hidráulico, revisión de sellos y válvulas',       'Jorge Hernández', 240,  3500.00, '2025-07-15', 'completado', 1, NOW(), NOW()),
('MNT2502-0001', '2025-02-10', 'molde',   1, 'preventivo',  'Pulido y revisión de cavidades MOL-001', 'Pulido espejo, limpieza de canales de enfriamiento',         'Técnico Externo',  480,  8200.00, '2025-08-10', 'completado', 1, NOW(), NOW()),
('MNT2503-0001', '2025-03-01', 'maquina', 2, 'correctivo',  'Falla en servo motor MAQ-002',   'Reemplazo de servo amplificador Fanuc A06B-6096',                  'FANUC Servicio',   720, 18500.00, '2026-03-01', 'completado', 1, NOW(), NOW()),
('MNT2503-0002', '2025-03-20', 'molde',   4, 'correctivo',  'Fractura en placa soporte MOL-004','Soldadura y maquinado de placa soporte, ajuste de guías',        'Jorge Hernández',  960, 12000.00, '2026-03-20', 'completado', 1, NOW(), NOW()),
('MNT2504-0001', '2025-04-10', 'maquina', 1, 'preventivo',  'Revisión cuatrimestral MAQ-001', 'Cambio de filtros, calibración de presión, revisión eléctrica',    'Jorge Hernández',  180,  2800.00, '2025-08-10', 'completado', 1, NOW(), NOW()),
('MNT2505-0001', '2025-05-20', 'molde',   2, 'predictivo',  'Medición de cavidades MOL-002',  'Medición dimensional con micrómetro, se detecta desgaste mínimo',  'Carlos Ramírez',    60,   450.00, '2025-11-20', 'completado', 1, NOW(), NOW()),
('MNT2506-0001', '2025-06-01', 'maquina', 3, 'correctivo',  'Fuga de aceite MAQ-003',         'Reemplazo de sellos hidráulicos y mangueras, prueba de presión',   'Técnico Externo',  600,  9800.00, '2026-06-01', 'completado', 1, NOW(), NOW()),
('MNT2506-0002', '2025-06-10', 'molde',   3, 'preventivo',  'Mantenimiento MOL-003',          'Limpieza, lubricación de guías y expulsores',                      'Jorge Hernández',  120,  1200.00, '2025-12-10', 'completado', 1, NOW(), NOW());

-- ─────────────────────────────────────────────────────────────
-- ENVÍOS
-- ─────────────────────────────────────────────────────────────
SET @trp1 = (SELECT id FROM transportistas WHERE codigo='TRP-001');
SET @trp2 = (SELECT id FROM transportistas WHERE codigo='TRP-002');
SET @trp3 = (SELECT id FROM transportistas WHERE codigo='TRP-003');

INSERT IGNORE INTO envios (folio, fecha_programada, fecha_real, cliente_id, transportista_id, estado, direccion_calle, direccion_ciudad, direccion_estado_mx, direccion_cp, peso_total_kg, bultos, numero_remision, nombre_receptor, costo_envio, usuario_id, created_at, updated_at) VALUES
('ENV2501-0001', '2025-01-20', '2025-01-20', 2, @trp1, 'entregado',   'Blvd. Industrial 100',     'Culiacán',    'Sinaloa',    '80014', 320.00, 4, 'REM-0001', 'Gerente Almacén',     850.00, 1, NOW(), NOW()),
('ENV2501-0002', '2025-01-28', '2025-01-29', 3, @trp2, 'entregado',   'Av. Tecnológica 250',      'Monterrey',   'Nuevo León', '64000',1850.00,12, 'REM-0002', 'Jefe de Compras',    3200.00, 1, NOW(), NOW()),
('ENV2502-0001', '2025-02-12', '2025-02-12', 4, @trp3, 'entregado',   'Calle Comercio 45',        'Mazatlán',    'Sinaloa',    '82000',  95.00, 2, 'REM-0003', 'Encargado Bodega',    420.00, 1, NOW(), NOW()),
('ENV2503-0001', '2025-03-05', '2025-03-07', 5, @trp1, 'entregado',   'Parque Industrial Norte 8','Guadalajara', 'Jalisco',    '45010', 580.00, 6, 'REM-0004', 'Director Compras',   1100.00, 1, NOW(), NOW()),
('ENV2504-0001', '2025-04-15', '2025-04-16', 2, @trp2, 'entregado',   'Blvd. Industrial 100',     'Culiacán',    'Sinaloa',    '80014',2100.00,15, 'REM-0005', 'Gerente Almacén',    3800.00, 1, NOW(), NOW()),
('ENV2505-0001', '2025-05-08', '2025-05-09', 3, @trp1, 'entregado',   'Av. Tecnológica 250',      'Monterrey',   'Nuevo León', '64000', 740.00, 8, 'REM-0006', 'Jefe de Compras',    1600.00, 1, NOW(), NOW()),
('ENV2506-0001', '2025-06-20', NULL,          4, @trp3, 'en_ruta',     'Calle Comercio 45',        'Mazatlán',    'Sinaloa',    '82000', 210.00, 3, 'REM-0007', 'Encargado Bodega',    650.00, 1, NOW(), NOW()),
('ENV2506-0002', '2025-06-25', NULL,          5, @trp2, 'preparando',  'Parque Industrial Norte 8','Guadalajara', 'Jalisco',    '45010',1200.00,10, 'REM-0008', 'Director Compras',   2400.00, 1, NOW(), NOW()),
('ENV2507-0001', '2025-07-05', NULL,          2, @trp1, 'pendiente',   'Blvd. Industrial 100',     'Culiacán',    'Sinaloa',    '80014', 450.00, 5, 'REM-0009', 'Gerente Almacén',     980.00, 1, NOW(), NOW());

SELECT 'Datos de prueba insertados correctamente' AS resultado;
