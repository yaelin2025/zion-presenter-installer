# Zion Cast - Predicación Glass 3.0 (Edición "Antigravity")
> **Documento de Contexto Técnico para Agentes AI**

Este documento describe la arquitectura, lógica y los avances críticos logrados en la sesión de Enero 2026.

## 1. Descripción General
**Zion Cast** es un sistema profesional de proyección para iglesias basado en la web. Permite la gestión en tiempo real de versículos bíblicos, anuncios y diseños visuales mediante una arquitectura Cliente-Servidor robusta.

## 2. Archivos Críticos y su Función
*   `server.js`: El corazón del sistema. Gestiona la comunicación por WebSockets (Socket.io) y sincroniza el estado entre el Panel y el Overlay. Inicia en el puerto 4000.
*   `zion-db.json`: Base de datos de persistencia en disco. Almacena contenidos de texto, configuraciones de diseño (X, Y, escala, opacidad) y ahora también los **Slots de Memoria**.
*   `js/zion-panel.js`: Gestiona toda la lógica del administrador. Incluye la sincronización de red, buscador inteligente, gestión de slots y temas.
*   `js/zion-bible-navigator.js`: Controla la navegación bíblica mediante teclado y asegura la compatibilidad entre diferentes formatos de datos bíblicos.
*   `js/bible-versions.js`: Maneja la selección de versiones de la Biblia y asegura la carga de la RV1960 por defecto.
*   `zion_panel.html`: Interfaz administrativa con diseño Glassmorphism.
*   `zion_overlay.html`: Interfaz visual optimizada para OBS que renderiza los gráficos finales.

## 3. Avances Logrados (Enero 2026)

### 📖 Biblia Avanzada y Navegación
*   **Buscador Inteligente Híbrido:** Implementación de búsqueda dual. Detecta si el usuario ingresó una cita (ej: *Juan 3:16*) o palabras clave (ej: *de tal manera amó*). Realiza búsquedas instantáneas en toda la biblia RV1960.
*   **Navegación Intuitiva:** Se cambió la navegación de versículos a las teclas **Flecha Arriba/Abajo**. Se limitó la navegación para no saltar de capítulo accidentalmente al llegar al final de los versículos visibles.
*   **Compatibilidad Total:** El sistema ahora detecta automáticamente si la biblia cargada viene en formato de array simple o con objeto interno `.verses`, evitando errores de visualización.

### 💾 Sistema de Memorias (Slots) Centralizado
*   **Slots Sincronizados (1-10):** Las memorias de texto ya no son locales del navegador; ahora se guardan en el servidor (`zion-db.json`). Esto permite que un texto guardado en una PC aparezca en todas las demás conectadas al servidor.
*   **Gestión de Slots Mejorada:**
    *   **Click normal:** Carga o guarda el texto.
    *   **Pulsación Larga (700ms):** Borra el slot instantáneamente con una animación visual de confirmación.
*   **Protección de Datos:** Se implementó una lógica de "Hidratación Protegida" que impide que un panel borre la base de datos al refrescar la página si aún no ha recuperado la información del servidor.

### 🎨 Configuración y Estabilidad
*   **Predeterminados Forzados:** La aplicación ahora inicia SIEMPRE con la **Reina Valera 1960** y el tema **Azure (Azul)**, garantizando una base visual profesional desde el arranque independientemente de los ajustes previos.
*   **Reparación Automática de DB:** El servidor ahora verifica e inyecta claves faltantes (como `slots`) en el archivo JSON automáticamente al iniciar.

## 4. Arquitectura de Datos (zion-db.json)
```json
{
  "state": {
    "visibleBlocks": { "center": true, "title": true, ... },
    "textContent": { "title": "...", "center": "...", ... },
    "slots": { "1": "Texto guardado", "2": "..." },
    "isHighlight": false
  },
  "styles": { ... },
  "verseStyles": { ... }
}
```

## 5. Flujo de Trabajo Profesional (Source vs Production)

A partir de ahora, Zion Cast sigue el mismo estándar que Zion Presenter para garantizar la mantenibilidad y protección del código:

### Estructura de Carpetas:
*   **`Zion Cast/` (Esta Carpeta):** Contiene el **CÓDIGO FUENTE LEGIBLE**. Aquí es donde SIEMPRE debes trabajar, editar y programar.
*   **`Zion_Cast_Web/`:** Contiene el **CÓDIGO DE PRODUCCIÓN**. Esta es la carpeta que se sincroniza, se ofusca y se sube a GitHub.

### Pasos Críticos para Publicar Cambios:
1.  **Desarrollar:** Realiza todas tus mejoras en los archivos de la carpeta raíz (`Zion Cast`).
2.  **Sincronizar:** Ejecuta `./sync_to_web.sh` desde esta carpeta. Esto proyectará tus cambios hacia `Zion_Cast_Web`.
3.  **Ofuscar (SOLO EN WEB):** Entra en la carpeta de producción (`cd Zion_Cast_Web`) y ejecuta `./ofuscar.sh`. 
4.  **Desplegar:** Desde `Zion_Cast_Web`, realiza el commit y push a GitHub.

> **🚨 REGLA DE ORO:** 
> 1. **JAMÁS** ejecutes herramientas de ofuscación en esta carpeta (`Zion Cast`). Si lo haces, perderás la capacidad de leer y editar tu propio código.
> 2. **JAMÁS** edites directamente en `Zion_Cast_Web`, ya que tus cambios se sobrescribirán en la próxima sincronización.
> 
> **El flujo es siempre: Legible -> Sincronizar -> Ofuscar en Web -> Git.**

***
*Actualizado por Antigravity el 4 de Enero de 2026 para la versión 3.1 PRO.*
