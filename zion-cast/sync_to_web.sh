#!/bin/bash
# Script para sincronizar Zion Cast (fuente) a Zion_Cast_Web (producción)
# Uso: ./sync_to_web.sh

echo "🔄 Sincronizando ZION CAST (Fuente) -> Zion_Cast_Web (Producción)..."

# Crear carpetas si no existen
mkdir -p Zion_Cast_Web/js Zion_Cast_Web/js_backup Zion_Cast_Web/css Zion_Cast_Web/img Zion_Cast_Web/js/bibles

# Copiar archivos HTML principales
cp zion_panel.html Zion_Cast_Web/zion_panel.html
cp zion_overlay.html Zion_Cast_Web/zion_overlay.html
cp admin.html Zion_Cast_Web/admin.html

# Copiar archivos JS legibles a Zion_Cast_Web
echo "📦 Copiando JS a Zion_Cast_Web/js/..."
cp -r js/* Zion_Cast_Web/js/
cp -r js/* Zion_Cast_Web/js_backup/

# Copiar CSS
echo "🎨 Copiando CSS..."
cp -r css/* Zion_Cast_Web/css/

# Copiar imágenes
echo "🖼️ Copiando imagenes..."
cp -r img/* Zion_Cast_Web/img/ 2>/dev/null || true

# Copiar servidor
echo "🖥️ Copiando servidor..."
cp server.js Zion_Cast_Web/server.js

# Copiar otros archivos necesarios
cp package.json Zion_Cast_Web/package.json 2>/dev/null || true
cp zion-db.json Zion_Cast_Web/zion-db.json 2>/dev/null || true
cp check_bibles.js Zion_Cast_Web/check_bibles.js 2>/dev/null || true
cp convert_bibles.js Zion_Cast_Web/convert_bibles.js 2>/dev/null || true
cp LEEME_ZION_CAST.md Zion_Cast_Web/LEEME_ZION_CAST.md 2>/dev/null || true
cp START_ZION.bat Zion_Cast_Web/START_ZION.bat 2>/dev/null || true
cp START_ZION.command Zion_Cast_Web/START_ZION.command 2>/dev/null || true
cp .gitignore Zion_Cast_Web/.gitignore 2>/dev/null || true

# Copiar biblias procesadas (si existen)
if [ -d "js/bibles" ]; then
    echo "📖 Copiando biblias..."
    cp -r js/bibles/* Zion_Cast_Web/js/bibles/ 2>/dev/null || true
fi

echo "✅ Sincronización completa!"
echo ""
echo "Próximos pasos:"
echo "   1. cd Zion_Cast_Web"
echo "   2. ./ofuscar.sh"
echo "   3. git add -A && git commit -m 'mensaje' && git push"
