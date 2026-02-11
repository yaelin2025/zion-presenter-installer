#!/bin/bash
cd "$(dirname "$0")"

clear
echo "================================================================"
echo "   _______  _____  _   _    _____           _____ _______ "
echo "  |___  / ||_   _|| \ | |  / ____|   /\    / ____|__   __|"
echo "     / /| |  | |  |  \| | | |       /  \  | (___    | |   "
echo "    / / | |  | |  | . ' | | |      / /\ \  \___ \   | |   "
echo "   / /__| | _| |_ | |\  | | |____ / ____ \ ____) |  | |   "
echo "  /_____|_||_____||_| \_|  \_____/_/    \_\_____/   |_|   "
echo "                                                          "
echo "================================================================"
echo "              Desarrollado por Yael Gutiérrez               "
echo "================================================================"
echo ""
echo "📝 INSTRUCCIONES:"
echo "1. No cierres esta ventana negra mientras uses Zion Cast."
echo "2. Si la cierras, el panel y la pantalla dejarán de funcionar."
echo "3. Para apagar el sistema, cierra esta ventana o presiona Ctrl+C."
echo ""
echo "🔧 ESTADO DEL SISTEMA:"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR FATAL: Node.js no está instalado."
    echo "📥 Descárgalo gratis aquí: https://nodejs.org"
    read -p "Presiona Enter para cerrar..."
    exit 1
fi

echo "✅ Motor Node.js detectado."
echo "🚀 Iniciando Servidor Zion Cast..."
echo "----------------------------------------------------------------"
echo ""

# Run Server
node server.js

# Prevent window from closing immediately if server stops
echo ""
echo "================================================================"
echo "⛔ El servidor se ha detenido."
echo "================================================================"
read -p "Presiona Enter para salir..."
