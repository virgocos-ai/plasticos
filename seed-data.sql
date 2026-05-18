-- Datos de ejemplo para Plasticos ERP
-- Ejecutar despues de crear la base de datos

USE plasticos_erp;

-- Insertar materiales (resinas comunes)
INSERT INTO materiales (codigo, nombre, tipo, marca, color, unidad_medida, peso_kg_bolsa, costo_por_kg, stock_actual_kg, stock_minimo_kg, temperatura_inyeccion_c, temperatura_molde_c, presion_inyeccion_bar) VALUES
('RES-PP-001', 'Polipropileno Homopolimero', 'resina', 'Braskem', 'Natural', 'KG', 25.00, 28.50, 500.00, 100.00, 200.0, 40.0, 800.0),
('RES-PP-002', 'Polipropileno Copolimero Impacto', 'resina', 'Braskem', 'Natural', 'KG', 25.00, 32.00, 300.00, 50.00, 210.0, 45.0, 850.0),
('RES-PE-001', 'Polietileno de Alta Densidad', 'resina', 'Pemex', 'Natural', 'KG', 25.00, 26.00, 400.00, 75.00, 180.0, 35.0, 700.0),
('RES-ABS-001', 'ABS General Purpose', 'resina', 'INEOS', 'Natural', 'KG', 25.00, 45.00, 150.00, 25.00, 230.0, 60.0, 900.0),
('MB-BLA-001', 'Masterbatch Blanco 70%', 'masterbatch', 'PolyOne', 'Blanco', 'KG', 20.00, 65.00, 80.00, 15.00, 200.0, 40.0, 800.0),
('MB-NEG-001', 'Masterbatch Negro Carbon', 'masterbatch', 'Cabot', 'Negro', 'KG', 20.00, 75.00, 60.00, 10.00, 200.0, 40.0, 800.0),
('AD-UV-001', 'Aditivo UV estabilizador', 'aditivo', 'BASF', 'Transparente', 'KG', 5.00, 120.00, 20.00, 5.00, 200.0, 40.0, 800.0);

-- Insertar productos de ejemplo (piezas moldeadas)
INSERT INTO productos (codigo, nombre, descripcion, tipo, unidad_medida, peso_gr, ciclo_inyeccion_seg, cavidades_molde, costo_material_unitario, costo_mano_obra_unitario, costo_energia_unitario, precio_venta, stock_actual, stock_minimo) VALUES
('PT-001', 'Tapa de envase 500ml', 'Tapa rosca standard para envase 500ml', 'producto_terminado', 'PZ', 12.50, 15.0, 4, 0.36, 0.25, 0.08, 1.20, 5000, 1000),
('PT-002', 'Tapa de envase 1L', 'Tapa rosca grande para envase 1 litro', 'producto_terminado', 'PZ', 18.00, 18.0, 4, 0.52, 0.30, 0.10, 1.50, 3000, 800),
('PT-003', 'Asa para cubeta', 'Asa ergonomica para cubeta 20L', 'producto_terminado', 'PZ', 45.00, 25.0, 2, 1.30, 0.50, 0.15, 3.00, 1500, 500),
('PT-004', 'Base para silla', 'Base plastica para silla de oficina', 'producto_terminado', 'PZ', 320.00, 45.0, 1, 9.20, 1.50, 0.50, 18.00, 200, 50),
('PT-005', 'Caja organizadora', 'Caja organizadora multiuso', 'producto_terminado', 'PZ', 85.00, 30.0, 2, 2.45, 0.80, 0.25, 6.50, 800, 200);

-- Insertar proveedores
INSERT INTO proveedores (rfc, razon_social, nombre_comercial, codigo_postal, colonia, municipio, estado, regimen_fiscal, email, telefono, dias_entrega) VALUES
('BRA010101ABC', 'BRASKEM IDESA S.A.P.I. DE C.V.', 'Braskem', '51350', 'Industrial', 'MEXICALI', 'BC', '601', 'ventas@braskem.com', '5523456789', 14),
('PEM010101XYZ', 'PETROLEOS MEXICANOS', 'PEMEX', '06600', 'Centro', 'CUAUHTEMOC', 'CDMX', '601', 'ventas@pemex.com', '5550001234', 10),
('INE010101DEF', 'INEOS STYROLUTION MEXICO', 'INEOS', '76220', 'Industrial', 'EL MARQUES', 'QUE', '601', 'mexico@styrolution.com', '4421234567', 21),
('POL010101GHI', 'POLYONE DISTRIBUCION MEXICO', 'PolyOne', '76000', 'Industrial', 'QUERETARO', 'QUE', '601', 'ventas@polyone.com', '4429876543', 7),
('CAB010101JKL', 'CABOT CORPORATION MEXICO', 'Cabot', '45600', 'Industrial', 'TLAJOMULCO', 'JAL', '601', 'ventas@cabotcorp.com', '3334567890', 14);

-- Insertar clientes
INSERT INTO clientes (rfc, razon_social, nombre_comercial, codigo_postal, colonia, municipio, estado, regimen_fiscal, uso_cfdi, email, telefono, limite_credito, dias_credito) VALUES
('ABC010101000', 'ENVASES PLASTICOS DEL NORTE S.A. DE C.V.', 'Envaplastic', '64000', 'Centro', 'MONTERREY', 'NL', '601', 'G03', 'compras@envaplastic.com', '8112345678', 500000.00, 30),
('DEF020202000', 'MUEBLES ERGONOMICOS MEXICANOS S.A. DE C.V.', 'Memex', '45050', 'Industrial', 'ZAPOPAN', 'JAL', '601', 'G03', 'compras@memex.com', '3334567890', 250000.00, 15),
('GHI030303000', 'ORGANIZADORES DEL HOGAR S. DE R.L. DE C.V.', 'Orgahogar', '01000', 'Roma Norte', 'CUAUHTEMOC', 'CDMX', '601', 'G03', 'pedidos@orgahogar.com', '5523456789', 150000.00, 30),
('JKL040404000', 'PLASTICOS INDUSTRIALES GARCIA S.A. DE C.V.', 'PIGSA', '66350', 'Santa Catarina', 'SANTA CATARINA', 'NL', '601', 'G03', 'ventas@pigsa.com', '8187654321', 300000.00, 45);

-- Insertar ordenes de produccion de ejemplo
INSERT INTO ordenes_produccion (folio, fecha_orden, fecha_entrega, cliente_id, prioridad, estado, maquina_asignada, turno, usuario_id) VALUES
('OP2501-0001', '2025-01-15', '2025-01-20', 1, 'alta', 'completada', 'INY-01', 'matutino', 1),
('OP2501-0002', '2025-01-16', '2025-01-22', 2, 'media', 'en_produccion', 'INY-02', 'vespertino', 1),
('OP2501-0003', '2025-01-17', '2025-01-25', 3, 'media', 'pendiente', 'INY-01', 'nocturno', 1),
('OP2501-0004', '2025-01-18', '2025-01-23', 4, 'urgente', 'pendiente', 'INY-03', 'matutino', 1),
('OP2501-0005', '2025-01-19', '2025-01-24', 1, 'baja', 'pendiente', 'INY-02', 'matutino', 1);

-- Insertar detalles de ordenes
INSERT INTO ordenes_produccion_detalle (orden_id, producto_id, material_id, cantidad_solicitada, cantidad_producida, cantidad_defectuosa, peso_pieza_gr, temperatura_inyeccion_real, presion_inyeccion_real) VALUES
(1, 1, 1, 5000, 4850, 50, 12.5, 205.0, 820.0),
(1, 2, 1, 3000, 2950, 30, 18.0, 210.0, 850.0),
(2, 3, 2, 2000, 1200, 25, 45.0, 215.0, 860.0),
(3, 4, 4, 500, 0, 0, 320.0, NULL, NULL),
(4, 5, 1, 1500, 0, 0, 85.0, NULL, NULL);

-- Insertar facturas de ejemplo
INSERT INTO facturas (serie, folio, fecha_emision, cliente_id, forma_pago, metodo_pago, subtotal, impuesto_trasladado, total, estado, usuario_id) VALUES
('A', 1, '2025-01-10 10:30:00', 1, '03', 'PUE', 10000.00, 1600.00, 11600.00, 'timbrada', 1),
('A', 2, '2025-01-12 14:15:00', 2, '03', 'PUE', 7500.00, 1200.00, 8700.00, 'timbrada', 1),
('A', 3, '2025-01-15 09:00:00', 3, '28', 'PPD', 5000.00, 800.00, 5800.00, 'borrador', 1),
('A', 4, '2025-01-16 16:45:00', 4, '03', 'PUE', 12500.00, 2000.00, 14500.00, 'borrador', 1);

-- Insertar detalles de facturas
INSERT INTO factura_detalles (factura_id, producto_id, clave_sat, descripcion, cantidad, precio_unitario, importe, base_impuesto, impuesto_trasladado) VALUES
(1, 1, '30311509', 'Tapa de envase 500ml', 5000, 1.20, 6000.00, 6000.00, 960.00),
(1, 2, '30311509', 'Tapa de envase 1L', 2000, 1.50, 3000.00, 3000.00, 480.00),
(1, 3, '30311507', 'Asa para cubeta', 500, 3.00, 1500.00, 1500.00, 240.00),
(2, 4, '30311507', 'Base para silla', 200, 18.00, 3600.00, 3600.00, 576.00),
(2, 5, '30311508', 'Caja organizadora', 600, 6.50, 3900.00, 3900.00, 624.00);

-- Insertar movimientos de inventario
INSERT INTO inventario_movimientos (tipo, material_id, cantidad, costo_unitario, costo_total, motivo, usuario_id) VALUES
('compra', 1, 500.00, 28.50, 14250.00, 'Compra Braskem - OC-001', 1),
('compra', 2, 300.00, 32.00, 9600.00, 'Compra Braskem - OC-002', 1),
('compra', 4, 150.00, 45.00, 6750.00, 'Compra INEOS - OC-003', 1),
('produccion', 1, -150.00, 28.50, -4275.00, 'Consumo OP2501-0001', 1);
