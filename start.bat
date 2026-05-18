@echo off
echo =========================================
echo  Plasticos ERP - Iniciar Sistema
echo =========================================
echo.
echo Este script iniciara:
echo   - Backend Node.js (puerto 5000)
echo   - Frontend React (puerto 5173)
echo.

REM Verificar si las dependencias estan instaladas
if not exist backend\node_modules (
    echo [ERROR] Backend: Dependencias no instaladas
    echo Ejecuta primero: install.bat
    pause
    exit /b 1
)

if not exist frontend\node_modules (
    echo [ERROR] Frontend: Dependencias no instaladas
    echo Ejecuta primero: install.bat
    pause
    exit /b 1
)

echo [1/2] Iniciando Backend...
echo.
start "Plasticos ERP - Backend" cmd /k "cd backend && npm run dev"

echo [2/2] Iniciando Frontend...
timeout /t 3 /nobreak >nul
echo.
start "Plasticos ERP - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =========================================
echo  Sistema iniciado!
echo =========================================
echo.
echo Accede al sistema en:
echo   http://localhost:5173
echo.
echo Credenciales demo:
echo   Email: admin@plasticos.com
echo   Password: admin123
echo.
echo Las ventanas del servidor se mantienen abiertas.
echo Cierralas para detener el sistema.
echo.
pause
