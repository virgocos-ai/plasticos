# build-deploy.ps1
# Genera el paquete de despliegue para Plesk.
# Uso: .\build-deploy.ps1 [-SkipTests]

param([switch]$SkipTests)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

Write-Host "`n=== Plasticos ERP — Build para Deploy ===" -ForegroundColor Cyan

# 1. Tests backend
if (-not $SkipTests) {
    Write-Host "`n[1/5] Ejecutando tests backend..." -ForegroundColor Yellow
    Push-Location "$root\backend"
    npm test
    Pop-Location
    Write-Host "    Tests OK" -ForegroundColor Green
} else {
    Write-Host "`n[1/5] Tests omitidos (-SkipTests)" -ForegroundColor DarkGray
}

# 2. Build frontend
Write-Host "`n[2/5] Compilando frontend..." -ForegroundColor Yellow
Push-Location "$root\frontend"
npm run build
Pop-Location
Write-Host "    Frontend compilado en frontend/dist" -ForegroundColor Green

# 3. Copiar frontend al backend/public
Write-Host "`n[3/5] Copiando frontend a backend/public..." -ForegroundColor Yellow
$publicDir = "$root\backend\public"
if (Test-Path $publicDir) { Remove-Item -Recurse -Force $publicDir }
Copy-Item -Recurse "$root\frontend\dist" $publicDir
Write-Host "    Copiado a backend/public" -ForegroundColor Green

# 4. Build backend
Write-Host "`n[4/5] Compilando backend..." -ForegroundColor Yellow
Push-Location "$root\backend"
npm run build
Pop-Location
Write-Host "    Backend compilado en backend/dist" -ForegroundColor Green

# 5. Empaquetar para Plesk
Write-Host "`n[5/5] Empaquetando para Plesk..." -ForegroundColor Yellow
$deployDir = "$root\deploy"
$zipOut    = "$root\plasticos-erp-deploy.zip"

# Carpeta temporal de staging
$staging = "$root\_staging"
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
New-Item -ItemType Directory $staging | Out-Null

# Copiar artefactos necesarios
Copy-Item -Recurse "$root\backend\dist"    "$staging\dist"
Copy-Item -Recurse "$root\backend\public"  "$staging\public"
Copy-Item "$root\backend\package.json"     "$staging\package.json"
Copy-Item "$root\backend\package-lock.json" "$staging\package-lock.json"

# .env plantilla (sin secretos reales)
@"
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=plasticos_erp
DB_USER=plasticos_user
DB_PASSWORD=CAMBIAR_PASSWORD
JWT_SECRET=CAMBIAR_POR_CADENA_ALEATORIA_32_CHARS
CORS_ORIGIN=
"@ | Set-Content "$staging\.env"

# Seed SQL
if (Test-Path "$deployDir\seed_admin.sql") {
    Copy-Item "$deployDir\seed_admin.sql" "$staging\seed_admin.sql"
}

# Crear zip
if (Test-Path $zipOut) { Remove-Item $zipOut }
Compress-Archive -Path "$staging\*" -DestinationPath $zipOut
Remove-Item -Recurse -Force $staging

Write-Host "`n=== Build completado ===" -ForegroundColor Cyan
Write-Host "  Paquete: $zipOut" -ForegroundColor White
Write-Host "  IMPORTANTE: Edita .env en el servidor con las credenciales reales antes de iniciar la app.`n" -ForegroundColor Yellow
