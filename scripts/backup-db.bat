@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Script de respaldo de base de datos MySQL para Plasticos ERP
REM Requiere: mysqldump en PATH, variables de entorno en .env

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "BACKUP_DIR=%PROJECT_DIR%\backups"

REM Crear directorio de backups si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Fecha y hora para nombre de archivo
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a-%%b)
set "TIMESTAMP=%mydate%_%mytime%"
set "TIMESTAMP=%TIMESTAMP: =%"
set "BACKUP_FILE=%BACKUP_DIR%\plasticos_erp_backup_%TIMESTAMP%.sql"

REM Leer variables del .env
set "DB_NAME=plasticos_erp"
set "DB_USER=root"
set "DB_PASS="
set "DB_HOST=localhost"

for /f "usebackq tokens=1,2 delims==" %%a in ("%PROJECT_DIR%\.env") do (
    if "%%a"=="DB_NAME" set "DB_NAME=%%b"
    if "%%a"=="DB_USER" set "DB_USER=%%b"
    if "%%a"=="DB_PASSWORD" set "DB_PASS=%%b"
    if "%%a"=="DB_HOST" set "DB_HOST=%%b"
)

echo ==========================================
echo  BACKUP Plasticos ERP
echo ==========================================
echo.
echo Host:    %DB_HOST%
echo Base:    %DB_NAME%
echo Usuario: %DB_USER%
echo.
echo Generando backup en:
echo %BACKUP_FILE%
echo.

if defined DB_PASS (
    mysqldump -h %DB_HOST% -u %DB_USER% -p%DB_PASS% --single-transaction --routines --triggers "%DB_NAME%" > "%BACKUP_FILE%"
) else (
    mysqldump -h %DB_HOST% -u %DB_USER% --single-transaction --routines --triggers "%DB_NAME%" > "%BACKUP_FILE%"
)

if %ERRORLEVEL% equ 0 (
    echo.
    echo [OK] Backup completado exitosamente.
    echo Archivo: %BACKUP_FILE%
    for %%F in ("%BACKUP_FILE%") do echo Tamaño: %%~zF bytes
) else (
    echo.
    echo [ERROR] El backup fallo. Verifique credenciales y conexion a MySQL.
    if exist "%BACKUP_FILE%" del "%BACKUP_FILE%"
)

REM Eliminar backups antiguos (mantener ultimos 7 dias)
forfiles /P "%BACKUP_DIR%" /S /M *.sql /D -7 /C "cmd /c del @path" 2>nul

echo.
pause
