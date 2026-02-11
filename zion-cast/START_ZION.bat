@echo off
TITLE ZION CAST SERVER LAUNCHER
CLS

ECHO ==========================================
ECHO 💎 ZION CAST SERVER LAUNCHER (WINDOWS)
ECHO ==========================================
ECHO.

:: Check for Node.js
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ Error: Node.js no encontrado.
    ECHO Por favor instala Node.js desde https://nodejs.org
    ECHO.
    PAUSE
    EXIT
)

ECHO 🚀 Iniciando servidor...
ECHO Mantén esta ventana abierta mientras uses el programa.
ECHO.

node server.js

ECHO.
ECHO El servidor se detuvo.
PAUSE
