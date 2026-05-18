@echo off
echo =========================================
echo  Plasticos ERP - Instalador
echo =========================================
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado. Por favor instala Node.js 18+
    pause
    exit /b 1
)

echo [1/4] Instalando dependencias del proyecto raiz...
call npm install
echo.

echo [2/4] Instalando dependencias del backend...
cd backend
call npm install
cd ..
echo.

echo [3/4] Instalando dependencias del frontend...
cd frontend
call npm install
cd ..
echo.

echo [4/4] Verificando instalacion...
echo.

if exist backend\node_modules (
    echo [OK] Backend: dependencias instaladas
) else (
    echo [ERROR] Backend: fallo la instalacion
)

if exist frontend\node_modules (
    echo [OK] Frontend: dependencias instaladas
) else (
    echo [ERROR] Frontend: fallo la instalacion
)

echo.
echo =========================================
echo  Instalacion completada!
echo =========================================
echo.
echo Para iniciar el sistema:
echo   npm run dev
echo.
echo O manualmente:
echo   cd backend ^&^& npm run dev   (Terminal 1)
echo   cd frontend ^&^& npm run dev  (Terminal 2)
echo.
pause
