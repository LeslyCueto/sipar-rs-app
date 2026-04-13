@echo off
cd /d "%~dp0"
echo ======================================
echo Iniciando SIRPAR - Backend + Frontend
echo ======================================
echo.

REM Verificar si MongoDB está disponible
echo Verificando conexión a MongoDB...
timeout /t 2 /nobreak > nul

REM Iniciar Backend en puerto 5000
echo.
echo [1/2] Iniciando Backend en puerto 5000...
start "SIRPAR Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

REM Iniciar Frontend en puerto 5173
echo.
echo [2/2] Iniciando Frontend en puerto 5173...
start "SIRPAR Frontend" cmd /k "npm run dev"
echo.
echo ======================================
echo Sistema iniciado:
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:5000
echo - API: http://localhost:5000/api
echo ======================================
echo.
pause
