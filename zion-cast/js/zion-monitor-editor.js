/**
 * ZION MONITOR EDITOR v1.1 (Resize Handles)
 * Convierte el Visor (Overlay) en un editor interactivo estilo Canva/OBS
 */

(function () {
    // Solo activar si estamos en un iframe (Modo Monitor)
    if (window.self === window.top) return;

    console.log("🔧 Zion Monitor Editor Iniciado");

    let selectedUnit = null;
    let isDragging = false;
    let isResizing = false;

    // Variables para Drag
    let startX, startY;
    let initialUnitX, initialUnitY;

    // Variables para Resize
    let startWidth, startScale;
    let initialMouseX, initialMouseY;

    // Configuración visual del editor
    const HIGHLIGHT_COLOR = '#00e5ff';

    // Inyectar estilos de edición
    const style = document.createElement('style');
    style.textContent = `
        .unit { cursor: grab; transition: none !important; }
        .unit.is-dragging { cursor: grabbing; }
        .unit.is-selected .glass-panel {
            box-shadow: 0 0 0 2px ${HIGHLIGHT_COLOR}, 0 0 20px rgba(0, 229, 255, 0.4) !important;
        }
        /* Borde de selección */
        .unit.is-selected::after {
            content: '';
            position: absolute;
            top: -4px; left: -4px; right: -4px; bottom: -4px;
            border: 1px dashed ${HIGHLIGHT_COLOR};
            pointer-events: none;
            border-radius: inherit;
            z-index: 1000;
        }
        /* MANIJA DE REDIMENSIONAMIENTO (Handle) */
        .resize-handle {
            position: absolute;
            width: 12px;
            height: 12px;
            background: ${HIGHLIGHT_COLOR};
            border: 2px solid white;
            border-radius: 50%;
            bottom: -6px;
            right: -6px;
            cursor: nwse-resize; 
            z-index: 1001;
            pointer-events: auto;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
            display: none; /* Oculto por defecto */
        }
        .unit.is-selected .resize-handle {
            display: block;
        }
    `;
    document.head.appendChild(style);

    // --- MANEJO DE MOUSEDOWN ---
    document.addEventListener('mousedown', (e) => {
        // 1. Detectar si clickeamos el HANDLE de resize
        if (e.target.classList.contains('resize-handle')) {
            e.preventDefault();
            e.stopPropagation(); // Evitar arrastrar la unidad
            startResize(e);
            return;
        }

        // 2. Detectar si clickeamos una UNIDAD
        const unit = e.target.closest('.unit');

        // Si clickeamos fuera, deseleccionar
        if (!unit) {
            if (selectedUnit) deselectUnit();
            return;
        }

        e.preventDefault(); // Evitar selección de texto

        // Seleccionar unidad si cambió
        if (selectedUnit !== unit) selectUnit(unit);

        // Iniciar arrastre
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        // Obtener posición actual desde CSS
        const id = unit.id.replace('unit-', '');
        const prefix = getPrefix(id);
        const cs = window.getComputedStyle(document.documentElement);

        initialUnitX = parseFloat(cs.getPropertyValue(`${prefix}x`)) || 0;
        initialUnitY = parseFloat(cs.getPropertyValue(`${prefix}y`)) || 0;

        unit.classList.add('is-dragging');
    });

    // --- LÓGICA DE DRAG & RESIZE ---
    document.addEventListener('mousemove', (e) => {
        if (isResizing && selectedUnit) {
            handleResize(e);
            return;
        }

        if (isDragging && selectedUnit) {
            handleDrag(e);
            return;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging && selectedUnit) {
            selectedUnit.classList.remove('is-dragging');
            isDragging = false;
        }
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = ''; // Restaurar cursor
        }
    });

    // --- ESCALADO CON RUEDA (WHEEL ZOOM) - Mantenido como extra ---
    document.addEventListener('wheel', (e) => {
        const unit = e.target.closest('.unit');
        if (!unit) return;

        e.preventDefault();
        if (!selectedUnit || selectedUnit !== unit) selectUnit(unit);

        const id = unit.id.replace('unit-', '');
        const prefix = getPrefix(id);
        const cs = window.getComputedStyle(document.documentElement);

        let currentScale = parseFloat(cs.getPropertyValue(`${prefix}scale`)) || 1;

        const delta = e.deltaY * -0.001;
        let newScale = Math.max(0.2, Math.min(3.0, currentScale + delta));

        updateScale(id, newScale);

    }, { passive: false });


    // --- FUNCIONES CORE ---

    function startResize(e) {
        if (!selectedUnit) return;
        isResizing = true;
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;

        const id = selectedUnit.id.replace('unit-', '');
        const prefix = getPrefix(id);
        const cs = window.getComputedStyle(document.documentElement);

        startScale = parseFloat(cs.getPropertyValue(`${prefix}scale`)) || 1;

        document.body.style.cursor = 'nwse-resize'; // Forzar cursor global
    }

    function handleResize(e) {
        // Calcular delta diagonal simplificado (movimiento en X domina)
        const deltaX = e.clientX - initialMouseX;

        // Sensibilidad del escalado (ajustable)
        const scaleSpeed = 0.003;

        let newScale = startScale + (deltaX * scaleSpeed);

        // Límites
        newScale = Math.max(0.2, Math.min(3.0, newScale));

        const id = selectedUnit.id.replace('unit-', '');
        updateScale(id, newScale);
    }

    function updateScale(id, newScale) {
        const prefix = getPrefix(id);
        document.documentElement.style.setProperty(`${prefix}scale`, newScale);

        sendToParent({
            target: id,
            style: { scale: parseFloat(newScale.toFixed(2)) }
        });
    }

    function handleDrag(e) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const id = selectedUnit.id.replace('unit-', '');
        let newX, newY;

        // Lógica de coordenadas según el origen alineado en CSS
        if (id === 'center' || id === 'title') {
            newX = initialUnitX + deltaX;
            newY = initialUnitY + deltaY;
        } else if (id === 'bl') {
            newX = initialUnitX + deltaX;
            newY = initialUnitY - deltaY;
        } else if (id === 'br') {
            newX = initialUnitX - deltaX;
            newY = initialUnitY - deltaY;
        } else if (id === 'cb') {
            newX = initialUnitX + deltaX;
            newY = initialUnitY - deltaY;
        }

        const prefix = getPrefix(id);
        document.documentElement.style.setProperty(`${prefix}x`, `${newX}px`);
        document.documentElement.style.setProperty(`${prefix}y`, `${newY}px`);

        // Throttled update to parent
        sendToParent({
            target: id,
            style: { x: Math.round(newX), y: Math.round(newY) }
        });
    }

    function selectUnit(unit) {
        if (selectedUnit) deselectUnit();
        selectedUnit = unit;
        selectedUnit.classList.add('is-selected');

        // Inyectar el HANDLE si no existe
        if (!unit.querySelector('.resize-handle')) {
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            // Agregar al contenedor .glass-panel para que siga la escala visualmente
            // O mejor, agregar directo al unit pero cuidando el scaling
            unit.appendChild(handle);
        }

        const id = unit.id.replace('unit-', '');
        window.parent.postMessage({ type: 'zion:select', target: id }, '*');
    }

    function deselectUnit() {
        if (selectedUnit) {
            selectedUnit.classList.remove('is-selected');
            // Opcional: remover handle para limpieza, pero CSS ya lo oculta con display:none
            selectedUnit = null;
        }
    }

    function getPrefix(id) {
        const map = {
            center: '--c-', title: '--t-', bl: '--bl-', br: '--br-', cb: '--cb-'
        };
        return map[id];
    }

    function sendToParent(data) {
        window.parent.postMessage({
            type: 'zion:monitor-update',
            payload: data
        }, '*');
    }

})();
