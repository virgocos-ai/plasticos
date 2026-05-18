# Plasticos ERP - Sistema de Gestión para Inyección de Plástico

Sistema ERP completo para empresas de inyección de plástico en México, con soporte completo para la normativa mexicana incluyendo CFDI 4.0, contabilidad electrónica y catálogos del SAT.

## Características Principales

### Normativa Mexicana (SAT/CFDI)
- **CFDI 4.0**: Generación y timbrado de facturas electrónicas
- **Catálogos SAT**: Clientes y proveedores con validación de RFC
- **Régimen Fiscal**: Soporte para múltiples regímenes fiscales
- **Uso CFDI**: Catálogo completo de usos de CFDI
- **Productos/Servicios**: Catálogo SAT de productos para plásticos

### Módulos del Sistema

#### 1. Clientes
- Registro completo con datos fiscales (RFC, régimen, CP)
- Validación de RFC según normas del SAT
- Límites de crédito y días de crédito
- Historial de compras y facturas

#### 2. Proveedores
- Gestión de proveedores de materia prima
- Datos fiscales completos
- Control de días de entrega

#### 3. Productos
- Catálogo de piezas moldeadas
- Especificaciones técnicas (peso, ciclo, cavidades)
- Costos: material, mano de obra, energía
- Control de inventario con stocks mínimos/máximos

#### 4. Materiales
- Resinas plásticas (PP, PE, ABS, etc.)
- Masterbatch y aditivos
- Control por kilogramos
- Parámetros de inyección (temperatura, presión)

#### 5. Órdenes de Producción
- Folios automáticos (OP-YYMM-NNNN)
- Asignación de máquinas y turnos
- Control de producción (cantidad, defectos)
- Seguimiento de temperaturas y presiones reales

#### 6. Facturación (CFDI 4.0)
- Facturas en borrador
- Generación de XML CFDI 4.0
- Timbrado simulado (listo para integrar PAC)
- Cancelación de facturas con motivo SAT

#### 7. Inventario
- Control de productos terminados
- Control de materia prima
- Movimientos de entrada/salida
- Alertas de stock bajo

#### 8. Reportes
- Dashboard con KPIs
- Ventas por período
- Producción por máquina
- Top productos vendidos

## Tecnología

### Backend
- **Node.js** + **Express** + **TypeScript**
- **MySQL** con **Sequelize ORM**
- **JWT** para autenticación
- **Helmet** y **Rate Limiting** para seguridad

### Frontend
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** para estilos
- **Zustand** para estado global
- **Lucide React** para iconos
- **Recharts** para gráficos

## Requisitos

- Node.js 18+
- MySQL 8.0+
- npm o yarn

## Instalación

### 1. Clonar o descargar el proyecto

### 2. Configurar la base de datos
Crear una base de datos MySQL llamada `plasticos_erp`:

```sql
CREATE DATABASE plasticos_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar variables de entorno
Copiar el archivo `.env.example` a `.env` y configurar:

```bash
# Backend
DB_HOST=localhost
DB_PORT=3306
DB_NAME=plasticos_erp
DB_USER=root
DB_PASSWORD=tu_password

JWT_SECRET=tu_secreto_jwt_muy_seguro

# CFDI - Configuración de tu empresa
RFC_EMPRESA=TU_RFC_AQUI
NOMBRE_EMPRESA=TU_EMPRESA_SA_DE_CV
REGIMEN_FISCAL=601
CODIGO_POSTAL=64000
```

### 4. Instalar dependencias

```bash
# Instalar dependencias de root, backend y frontend
npm run install-all
```

O manualmente:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 5. Iniciar el sistema

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:5000`
- Frontend en `http://localhost:3000`

## Acceso

- **URL**: http://localhost:3000
- **Usuario demo**: `admin@plasticos.com`
- **Contraseña**: `admin123`

## Estructura del Proyecto

```
Plasticos/
├── backend/                 # API REST Node.js
│   ├── src/
│   │   ├── config/        # Configuración DB
│   │   ├── models/        # Modelos Sequelize
│   │   ├── routes/        # Rutas API
│   │   └── server.ts      # Punto de entrada
│   └── package.json
├── frontend/              # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes UI
│   │   ├── pages/         # Páginas
│   │   ├── store/         # Estado global
│   │   └── lib/           # Utilidades
│   └── package.json
├── .env                   # Variables de entorno
└── package.json           # Scripts del proyecto
```

## Catálogos SAT Incluidos

### Productos y Servicios (Ejemplos)
- 30311507 - Piezas de plástico moldeadas por inyección
- 30311508 - Componentes de plástico para automoción
- 30311509 - Envases y recipientes de plástico
- 50161800 - Servicios de moldeo por inyección de plástico

### Unidades de Medida
- H87 - Pieza
- KGM - Kilogramo
- XBX - Caja
- XPK - Paquete

### Formas de Pago
- 01 - Efectivo
- 03 - Transferencia electrónica
- 04 - Tarjeta de crédito
- 28 - Tarjeta de débito

### Regímenes Fiscales
- 601 - General de Ley Personas Morales
- 612 - Personas Físicas con Actividades Empresariales
- 626 - Régimen Simplificado de Confianza (RESICO)

## Timbrado CFDI

Para timbrar facturas reales, integra un PAC (Proveedor Autorizado de Certificación):

1. Edita `backend/src/routes/factura.routes.ts`
2. Reemplaza el método `timbrar` con la API de tu PAC
3. Configura tus certificados FIEL en `.env`

## Despliegue en Producción

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
```
Los archivos estáticos se generan en `dist/` para servir con nginx.

## Seguridad

- Autenticación JWT con expiración de 24 horas
- Rate limiting en endpoints sensibles
- Validación de RFC según algoritmo del SAT
- Soft delete en registros (no se eliminan, solo se desactivan)

## Soporte

Para reportar problemas o solicitar características adicionales, contacta al desarrollador.

## Licencia

Este sistema es propiedad de tu empresa. Uso exclusivo para la gestión de operaciones de inyección de plástico con cumplimiento de normativa mexicana.

---

**Plasticos ERP** - Sistema diseñado específicamente para empresas de inyección de plástico en México con cumplimiento SAT/CFDI.
