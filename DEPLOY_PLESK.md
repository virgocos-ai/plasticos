# 🚀 Guía de Despliegue — Plasticos ERP en Plesk

URL destino: **https://intelligent-shannon.74-208-181-22.plesk.page/**

---

## Archivos generados

| Archivo | Descripción |
|---------|-------------|
| `plasticos-erp-deploy.zip` | Paquete completo listo para subir a Plesk |
| `deploy/seed_admin.sql`    | SQL para crear el usuario admin inicial |

---

## Paso 1 — Crear la base de datos MySQL en Plesk

1. Entra al panel Plesk → **Bases de datos** → **Agregar base de datos**
2. Rellena:
   - **Nombre BD:** `plasticos_erp`
   - **Usuario BD:** (el que quieras, p. ej. `plasticos_user`)
   - **Password:** (guárdala, la necesitarás en el paso 3)
3. Haz clic en **Aceptar**

---

## Paso 2 — Subir los archivos a Plesk

1. Ve al panel Plesk → **Administrador de archivos** del dominio  
   `intelligent-shannon.74-208-181-22.plesk.page`
2. Navega al directorio raíz del dominio (normalmente `httpdocs/` o un directorio vacío)
3. Sube **`plasticos-erp-deploy.zip`** haciendo clic en **Subir archivos**
4. Una vez subido, haz clic derecho sobre el zip → **Extraer** (o usa el botón Extract)
5. Confirma que la estructura queda así en el servidor:
   ```
   /
   ├── dist/          ← código Node.js compilado
   ├── public/        ← frontend React (index.html + assets)
   ├── package.json
   └── .env           ← ¡EDITAR antes de continuar!
   ```

---

## Paso 3 — Editar el archivo `.env`

Desde el **Administrador de archivos** de Plesk, abre `.env` y sustituye los valores:

```env
NODE_ENV=production
PORT=3000

# Base de datos MySQL (usa los datos del Paso 1)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=plasticos_erp
DB_USER=plasticos_user
DB_PASSWORD=TU_PASSWORD_MYSQL

# JWT — pon cualquier cadena larga y aleatoria (mínimo 32 caracteres)
JWT_SECRET=gD8xKpMvQ2nLwRtYbAeZuJhCsFo3i9X7

# CORS — déjalo vacío (el frontend y backend comparten el mismo dominio)
CORS_ORIGIN=
```

Guarda el archivo.

---

## Paso 4 — Configurar la aplicación Node.js en Plesk

1. Ve a **Plesk → Inicio → [tu dominio] → Node.js**
2. Haz clic en **Activar Node.js** (si no está activado)
3. Configura:
   | Campo | Valor |
   |-------|-------|
   | Versión de Node.js | **18.x** o superior (LTS) |
   | Modo de la app | **production** |
   | Archivo de inicio | `dist/server.js` |
   | Directorio de la app | *(la carpeta donde subiste los archivos)* |
4. Haz clic en **Instalar paquetes NPM** (equivale a `npm install --production`)
   - Espera a que termine (puede tardar 1-2 minutos)
5. Haz clic en **Reiniciar** la aplicación

---

## Paso 5 — Crear el usuario admin inicial

1. En Plesk → **Bases de datos** → haz clic en **phpMyAdmin** junto a `plasticos_erp`
2. Selecciona la base de datos `plasticos_erp` en el panel izquierdo
3. Ve a la pestaña **SQL**
4. Copia y pega el contenido de `deploy/seed_admin.sql` y haz clic en **Ejecutar**

Las tablas se habrán creado automáticamente al iniciar la aplicación Node.js (Paso 4).  
Si las tablas aún no existen, inicia la app primero y luego ejecuta el SQL.

---

## Paso 6 — Verificar el despliegue

1. Abre https://intelligent-shannon.74-208-181-22.plesk.page/ en el navegador
2. Deberías ver la pantalla de **Login**
3. Ingresa con:
   - **Email:** `admin@empresa.com`
   - **Password:** `Admin123!`
4. ¡Cambia la contraseña inmediatamente desde Administración → Usuarios!

---

## Solución de problemas

| Síntoma | Solución |
|---------|----------|
| Página en blanco o 502 Bad Gateway | Revisa los logs de Node.js en Plesk → Node.js → Logs |
| Error de conexión a BD | Verifica los valores en `.env` (DB_HOST, DB_USER, DB_PASSWORD) |
| "JWT_SECRET no configurado" | Revisa que `.env` tiene la variable JWT_SECRET |
| Las tablas no se crearon | Asegúrate de que NODE_ENV=production en `.env` y reinicia la app |
| Error 404 en rutas de React | Verifica que `dist/server.js` existe y que el Directorio de la app es correcto |

### Ver logs en Plesk
Plesk → Node.js → **Ver logs de error** — aquí aparecen todos los errores de arranque.

---

## Re-despliegue (actualizaciones futuras)

Cada vez que hagas cambios:

```powershell
# En tu máquina local:
cd C:\Users\Windows\Documents\GitHub\Plasticos

# 1. Rebuild frontend
cd frontend && npm run build && cd ..

# 2. Copiar dist del frontend al backend/public
Remove-Item -Recurse -Force backend/public
Copy-Item -Recurse frontend/dist backend/public

# 3. Rebuild backend
cd backend && npm run build && cd ..

# 4. Recrear el zip
Remove-Item plasticos-erp-deploy.zip -ErrorAction SilentlyContinue
Compress-Archive -Path deploy/* -DestinationPath plasticos-erp-deploy.zip
```

Luego sube el zip a Plesk y extrae (sobreescribiendo los archivos anteriores).  
Haz clic en **Reiniciar** la aplicación Node.js.

---

*Generado automáticamente — Plasticos ERP v1.0*
