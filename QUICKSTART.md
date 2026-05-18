# Guía Rápida de Inicio - Plasticos ERP

## Requisitos Previos

1. **Node.js 18+** - Descargar de [nodejs.org](https://nodejs.org)
2. **MySQL 8.0+** - Instalar XAMPP, WAMP o MySQL Community
3. **Editor de código** - VS Code recomendado

## Instalación en 5 Pasos

### Paso 1: Crear la Base de Datos

Abre MySQL (phpMyAdmin o línea de comandos) y ejecuta:

```sql
CREATE DATABASE plasticos_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

O usa el script completo:
```bash
mysql -u root -p < database.sql
```

### Paso 2: Configurar Variables de Entorno

**Backend** (`backend/.env`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=plasticos_erp
DB_USER=root
DB_PASSWORD=tu_password
PORT=5000
JWT_SECRET=tu_secreto_muy_seguro_aqui
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### Paso 3: Instalar Dependencias

En Windows, doble clic en `install.bat` o ejecuta:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Paso 4: Cargar Datos de Ejemplo (Opcional)

```bash
mysql -u root -p plasticos_erp < seed-data.sql
```

Esto carga:
- 7 materiales (resinas, masterbatch)
- 5 productos (piezas moldeadas)
- 4 proveedores
- 4 clientes
- 5 órdenes de producción
- 4 facturas de ejemplo

### Paso 5: Iniciar el Sistema

En Windows, doble clic en `start.bat` o ejecuta:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Acceder al Sistema

Abre tu navegador en: **http://localhost:5173**

**Credenciales de demo:**
- Email: `admin@plasticos.com`
- Password: `admin123`

## Estructura de URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |

## Solución de Problemas

### Error: "Cannot connect to MySQL"
- Verifica que MySQL esté corriendo
- Revisa las credenciales en `backend/.env`

### Error: "Module not found"
- Ejecuta `npm install` en las carpetas backend y frontend

### Error: "Port already in use"
- Cambia el puerto en `backend/.env` (PORT=5001)
- Actualiza `frontend/vite.config.ts` proxy target

### Frontend no se conecta al backend
- Verifica que el backend esté corriendo en puerto 5000
- Revisa que el proxy esté configurado en `vite.config.ts`

## Primeros Pasos en el Sistema

1. **Configurar tu empresa**: Ve a Configuración y ajusta datos fiscales (RFC, Nombre, Regimen)
2. **Dar de alta clientes**: Captura sus datos fiscales completos para CFDI
3. **Dar de alta proveedores**: Registra proveedores de materia prima
4. **Capturar materiales**: Inventario de resinas, masterbatch
5. **Crear productos**: Piezas que fabricas con especificaciones técnicas
6. **Generar órdenes de producción**: Control de máquinas y turnos
7. **Facturar**: Genera CFDI 4.0 válidos para el SAT

## Comandos Útiles

```bash
# Reiniciar base de datos
mysql -u root -p -e "DROP DATABASE plasticos_erp; CREATE DATABASE plasticos_erp;"
mysql -u root -p plasticos_erp < database.sql

# Sincronizar modelos (desarrollo)
cd backend && npm run dev

# Build para producción
cd backend && npm run build
cd frontend && npm run build
```

## Soporte

¿Problemas? Revisa:
1. Logs en las terminales del backend/frontend
2. Consola del navegador (F12)
3. Archivo `README.md` para documentación completa

---

**Listo para usar!** 🚀
