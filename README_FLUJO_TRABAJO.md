# 🚀 Flujo de Trabajo: Zion Presenter (Mantenimiento y Lanzamiento)

Este manual define los pasos obligatorios para realizar cambios en el programa y lanzar nuevas versiones (actualizaciones automáticas) de forma segura y profesional.

---

## 1. 🛠️ Desarrollo (Hacer cambios)
1. Modifica los archivos de código (`js/`, `css/`, `index.html`, etc.) como lo haces normalmente.
2. Para probar tus cambios localmente antes de empaquetar, usa:
   ```bash
   npm start
   ```

## 2. 🔢 Preparar la Nueva Versión
Antes de crear el instalador, debes subir el número de versión para que el sistema de actualización la detecte:
1. Abre el archivo `package.json`.
2. Busca la línea `"version": "3.1.1"` y cámbiala a la siguiente (ej: `3.1.2`).
3. **Guarda el archivo.**

## 3. 📦 Generar los Instaladores (Build)
Ejecuta el siguiente comando en la terminal para crear los archivos pesados:
```bash
CSC_IDENTITY_AUTO_DISCOVERY=false ./node_modules/.bin/electron-builder --mac --win
```
*Este comando generará la carpeta `dist/` con los instaladores para Windows (.exe) y Mac (.dmg, .zip).*

## 4. 🚀 Publicación Manual en GitHub (Segura)
Para proteger tu **Código Fuente**, NUNCA hagas `git push` de tus archivos JS/HTML. Sigue este proceso manual:

1. Ve a tu repositorio: [GitHub Releases](https://github.com/yaelin2025/zion-presenter-installer/releases)
2. Haz clic en **"Draft a new release"**.
3. En **"Tag version"**, escribe la misma versión que pusiste en el paso 2 (ej: `v3.1.2`).
4. **Arrastra únicamente estos archivos** desde tu carpeta `dist/`:
   - `Zion Presenter Setup X.X.X.exe` (Windows)
   - `Zion Presenter-X.X.X-universal.dmg` (Mac Instalador)
   - `Zion Presenter-X.X.X-universal-mac.zip` (Mac Actualización)
   - `latest.yml` (Cerebro Windows - **OBLIGATORIO**)
   - `latest-mac.yml` (Cerebro Mac - **OBLIGATORIO**)
5. Haz clic en **"Publish release"**.

---

## ⚠️ Reglas de Oro para la Seguridad
*   **NUNCA** subas carpetas de código (`js`, `css`, `img`) a GitHub. El repositorio debe permanecer vacío de código, solo con el archivo `README.md`.
*   **TOKEN:** Si el sistema te pide el token de acceso, es el que termina en `...VDC5`.
*   **YML:** Si olvidas subir los archivos `.yml`, el programa de tus usuarios nunca sabrá que hay una actualización disponible.

---
*Manual generado para Zion Presenter - Febrero 2026*
