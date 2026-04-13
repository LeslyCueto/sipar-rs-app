@echo off
REM Script para iniciar Backend y Frontend SIRPAR en paralelo
REM ========================================================
color 0A
title SIRPAR - Backend y Frontend

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          🚀 INICIANDO SIRPAR (Backend + Frontend)          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Obtener el directorio actual
cd /d "%~dp0"

REM Verificar que existen los directorios
if not exist "backend" (
    echo ❌ Error: No se encuentra el directorio 'backend'
    pause
    exit /b 1
)

echo ⏳ Iniciando Backend en http://localhost:5000 ...
start "SIRPAR Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak

echo ⏳ Iniciando Frontend en http://localhost:5173 ...
start "SIRPAR Frontend" cmd /k "npm run dev"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    ✅ SERVIDORES INICIADOS                 ║
echo ║                                                            ║
echo ║  📍 Frontend:  http://localhost:5173                       ║
echo ║  📍 Backend:   http://localhost:5000                       ║
echo ║  📍 API:       http://localhost:5000/api/...               ║
echo ║                                                            ║
echo ║  ℹ️  Cierra las ventanas del comando para detener          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
pause
