
// ============================================
// PROJECTION LOGIC (Comunicación con Visor)
// ============================================

// Canal Global (con Room Code para evitar interferencia entre salas)
// Se inicializa después de que el room code esté disponible
let bc = null;

// Función para inicializar el BroadcastChannel con Room Code
function initBroadcastChannel() {
    if (bc) {
        try { bc.close(); } catch (e) { }
    }
    // En modo local (Instalador), usamos un canal fijo
    const channelName = 'zion-presenter-local';
    bc = new BroadcastChannel(channelName);

    // ===================================
    // PUENTE UNIFICADO (LOCAL + RED)
    // ===================================
    const originalPostMessage = bc.postMessage.bind(bc);

    bc.postMessage = function (data) {
        // En modo LOCAL (sin salas), no inyectamos roomCode
        // pero mantenemos la compatibilidad con el sistema de mensajería
        if (typeof data === 'object') {
            data.roomCode = 'GLOBAL';
        }

        // 2. Cachear para sincronización (Handshake)
        if (['slide', 'text', 'presentation'].includes(data.type) || (data.type === 'nav' && data.action === 'blackout')) {
            window.lastZionContent = data;
        }
        if (data.type === 'bg') {
            window.lastZionBg = data;
        }

        // 3. Envío LOCAL (BroadcastChannel)
        originalPostMessage(data);

        // 4. Envío por RED (Socket.IO)
        if (typeof networkSocket !== 'undefined' && networkSocket && networkSocket.connected) {
            networkSocket.emit('remote_action', data);
            console.log(`📡 [RED] Enviado: ${data.type}`);
        } else {
            console.warn("⚠️ [RED] No disponible para enviar:", data.type);
        }
    };

    bc.onmessage = (event) => {
        const data = event.data;
        if (data && data.type === 'viewer_status' && data.action === 'joined') {
            syncPanelState();
        }
    };

    console.log(`✅ Puente Unificado listo: ${channelName}`);
}

window.initBroadcastChannel = initBroadcastChannel;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBroadcastChannel);
} else {
    initBroadcastChannel();
}

window.sendToVisor = (data) => {
    if (!bc) return false;
    bc.postMessage(data);
    return true;
};

// COMUNICACIÓN POR RED
if (window.location.protocol.startsWith('http')) {
    const script = document.createElement('script');
    script.src = "/socket.io/socket.io.js";
    script.onload = () => {
        console.log("Socket.IO cargado");

        networkSocket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            timeout: 20000
        });

        networkSocket.on('connect', () => {
            console.log("Conectado a Socket.IO");
            updateNetworkUI(true);

            // En modo LOCAL Fijo para instalador
            const room = 'GLOBAL';
            networkSocket.emit('join_room', { roomCode: room });
            setTimeout(() => {
                networkSocket.emit('remote_action', {
                    type: 'panel_status',
                    action: 'ready',
                    room: room
                });
            }, 500);

            // HEARTBEAT: Mantener visores informados de que el panel está vivo
            if (window.heartbeatInterval) clearInterval(window.heartbeatInterval);
            window.heartbeatInterval = setInterval(() => {
                const currentRoom = window.zionRoomCode || localStorage.getItem('zion_panel_room');
                if (currentRoom && networkSocket && networkSocket.connected) {
                    networkSocket.emit('remote_action', {
                        type: 'heartbeat',
                        action: 'ping',
                        room: currentRoom
                    });
                    console.log(`💓 Heartbeat enviado a sala: ${currentRoom}`);
                }
            }, 2000);
        });

        networkSocket.on('disconnect', () => updateNetworkUI(false));

        networkSocket.on('network_update', (data) => {
            const currentRoom = window.zionRoomCode || localStorage.getItem('zion_panel_room');

            // FILTRO DE SEGURIDAD: Solo procesar si es de nuestra sala
            if (data.room && currentRoom && data.room !== currentRoom) {
                console.log(`[NET] Ignorando comando de otra sala: ${data.room}`);
                return;
            }

            if (data.type === 'remote_cmd') {
                if (data.action === 'next' && typeof nextSlide === 'function') nextSlide();
                if (data.action === 'prev' && typeof prevSlide === 'function') prevSlide();
                if (data.action === 'blackout' && typeof blackout === 'function') blackout();
                else if (data.action === 'blackout' && typeof toggleBlackout === 'function') toggleBlackout();

                if (data.action === 'toggle_mode' && typeof toggleMode === 'function') toggleMode();
                if (data.action === 'bible_search' && typeof handleQuickSearch === 'function') handleQuickSearch(data.payload.query);

                // --- CONFIG UPDATES FROM REMOTE ---
                if (data.action === 'update_config') {
                    if (data.payload.bgDim !== undefined) {
                        const dimInput = document.getElementById('bgDim');
                        const dimVal = document.getElementById('bgDimVal');
                        if (dimInput) {
                            dimInput.value = data.payload.bgDim;
                            if (dimVal) dimVal.innerText = data.payload.bgDim + '%';
                            if (typeof updateConfig === 'function') updateConfig();
                        }
                    }
                }

                // --- BIBLE DATA HANDLERS ---
                if (typeof bibleState !== 'undefined' && bibleState.data.length > 0) {
                    if (data.action === 'bible_get_chapters') {
                        const bookIdx = bibleState.data.findIndex(b => b.name === data.payload.book);
                        if (bookIdx >= 0) {
                            networkSocket.emit('remote_action', {
                                type: 'bible_data_response',
                                action: 'chapters',
                                count: bibleState.data[bookIdx].chapters.length,
                                room: currentRoom
                            });
                        }
                    } else if (data.action === 'bible_get_verses') {
                        const bookIdx = bibleState.data.findIndex(b => b.name === data.payload.book);
                        if (bookIdx >= 0) {
                            const chapIdx = data.payload.chapter - 1;
                            if (bibleState.data[bookIdx].chapters[chapIdx]) {
                                networkSocket.emit('remote_action', {
                                    type: 'bible_data_response',
                                    action: 'verses',
                                    count: bibleState.data[bookIdx].chapters[chapIdx].verses.length,
                                    room: currentRoom
                                });
                            }
                        }
                    } else if (data.action === 'bible_show_verse') {
                        const query = `${data.payload.book} ${data.payload.chapter}:${data.payload.verse}`;
                        if (typeof setMode === 'function') setMode('bible');
                        if (typeof handleQuickSearch === 'function') handleQuickSearch(query);
                    }
                }
            } else if (data.type === 'viewer_status' && data.action === 'joined') {
                console.log(`[NET] Visor unido a sala ${data.room}. Sincronizando...`);
                syncPanelState();
            }
        });
    };
    document.head.appendChild(script);
}


function syncPanelState() {
    const room = window.zionRoomCode || localStorage.getItem('zion_panel_room');
    if (!room) return;

    window.sendToVisor({ type: 'panel_status', action: 'ready' });

    const savedConfig = localStorage.getItem('bosquejos_config');
    if (savedConfig) {
        window.sendToVisor({ type: 'config', action: 'update', payload: JSON.parse(savedConfig) });
    }

    // Sincronizar fondo primero
    if (window.lastZionBg) {
        window.sendToVisor(window.lastZionBg);
    }

    // Sincronizar contenido (texto/diapositivas) después
    if (window.lastZionContent) {
        window.sendToVisor(window.lastZionContent);
    }
}

let overlayWindow = null;

function openOverlay() {
    // Para el instalador local, no usamos room en la URL del visor emergente
    const overlayUrl = 'cantos_overlay.html?silent=true';
    overlayWindow = window.open(overlayUrl, 'Overlay', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
}

// Cerrar visor automáticamente si el panel se cierra o refresca
window.addEventListener('beforeunload', () => {
    if (overlayWindow && !overlayWindow.closed) {
        overlayWindow.close();
    }
});

// --- ZION MONITOR ENGINE (WYSIWYG Optimized) ---

let monitorBgBlobUrl = null;

function getMonitorBackground() {
    const bgType = localStorage.getItem('bosquejos_bg_type');
    const bgSource = localStorage.getItem('bosquejos_bg'); // Ruta directa o ID

    // 1. Si es video, devolver gradiente (panel optimize para no saturar GPU)
    if (bgType === 'video') {
        return { type: 'css', value: 'linear-gradient(135deg, #16161a 0%, #23232b 100%)' };
    }

    // 2. Si el origen es la Base de Datos (Modo Web o IndexedDB)
    if (bgSource === 'current_bg') {
        if (monitorBgBlobUrl) {
            return { type: 'image', value: `url('${monitorBgBlobUrl}')` };
        } else {
            // Intentar recuperar el blob asíncronamente
            if (window.MediaDB) {
                window.MediaDB.getFile('current_bg').then(file => {
                    if (file) {
                        if (monitorBgBlobUrl) URL.revokeObjectURL(monitorBgBlobUrl);
                        monitorBgBlobUrl = URL.createObjectURL(file);
                        // Forzar refresco global una vez cargado el blob
                        if (window.refreshAllMonitors) window.refreshAllMonitors();
                    }
                }).catch(err => console.error("Error recuperando fondo DB:", err));
            }
            return { type: 'css', value: '#111' }; // Fallback mientras carga
        }
    }

    // 3. Ruta directa o URL (Unsplash, local file)
    if (bgSource) {
        // Intentar usar la ruta directa (funciona mejor en app de escritorio con acceso a archivos)
        // O si es una URL blob/http
        return { type: 'image', value: `url('${bgSource.replace(/\\/g, '/')}')` };
    }

    // Fallback: Imagen por defecto solicitada por el usuario (ZION Theme)
    const defaultImg = "https://images.unsplash.com/photo-1611513940806-80d6ed9fd7cc?auto=format&fit=crop&q=80&w=1080";
    return { type: 'image', value: `url('${defaultImg}')` };
}

// Limpiar blob si se cambia el fondo manualmente
window.addEventListener('storage', (e) => {
    if (e.key === 'bosquejos_bg' && e.newValue !== 'current_bg') {
        if (monitorBgBlobUrl) {
            URL.revokeObjectURL(monitorBgBlobUrl);
            monitorBgBlobUrl = null;
        }
    }
});

function updateMonitorContent(elementId, content, isHTML) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // 1. Leer Configuración
    let config = {};
    try {
        config = JSON.parse(localStorage.getItem('bosquejos_config')) || {};
    } catch (e) { }

    const fontFamily = config.fontFamily || 'Inter';
    const textTransform = config.uppercase ? 'uppercase' : 'none';
    const fontColor = config.textColor || '#ffffff';

    // 3. Obtener Fondo (Lo necesitamos para calcular contraste de sombra)
    const bg = getMonitorBackground();

    // Lógica WYSIWYG EXACTA para la sombra 
    // Replicamos la fórmula CSS de cantos_overlay.html pero escalada
    let textShadow = 'none';

    // El valor guardado 'textShadow' suele ser la intensidad (ej. "10" o "20")
    let shadowIntensity = 0;
    if (config.textShadow === true || config.textShadow === 'true') shadowIntensity = 10;
    else shadowIntensity = parseInt(config.textShadow) || 0;

    const shadowColor = config.shadowColor || 'rgba(0,0,0,0.8)';

    if (shadowIntensity > 0) {
        // Escalado para monitor (aprox 20% del tamaño real)
        const s = shadowIntensity * 0.2;

        // Fórmula idéntica al visor:
        // 4 capas de sombra para efecto "glow/depth" profesional
        textShadow = `
            0 0 ${s * 0.1}px ${shadowColor},
            0 0 ${s * 0.5}px ${shadowColor},
            0 0 ${s * 1.0}px ${shadowColor},
            0 ${s * 0.2}px ${s * 1.8}px ${shadowColor}
        `;
    }

    // Fallback de legibilidad mínima mejorado
    if (shadowIntensity === 0 && fontColor === '#ffffff') {
        const isLightBg = bg.type === 'css' && (bg.value.includes('white') || bg.value.includes('#fff'));
        textShadow = isLightBg ? '0 1px 3px rgba(0,0,0,0.8)' : '0 1px 4px rgba(0,0,0,0.6)';
    }

    // Margen escalado (15% del valor real para pantalla pequeña)
    const marginY = (parseInt(config.marginSize) || 40) * 0.15;
    const marginX = (parseInt(config.marginSizeX) || 80) * 0.15;

    // 2. Preparar Contenedor (Reset)
    el.style.position = 'relative';
    el.style.overflow = 'hidden';

    // Aplicar Fondo al DOM
    // Limpiar capa de fondo previa
    let bgLayer = el.querySelector('.zion-monitor-bg');
    if (!bgLayer) {
        bgLayer = document.createElement('div');
        bgLayer.className = 'zion-monitor-bg';
        bgLayer.style.position = 'absolute';
        bgLayer.style.top = '0';
        bgLayer.style.left = '0';
        bgLayer.style.width = '100%';
        bgLayer.style.height = '100%';
        bgLayer.style.zIndex = '0';
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        el.insertBefore(bgLayer, el.firstChild);
    }

    if (bg.type === 'image') {
        bgLayer.style.backgroundImage = bg.value;
        bgLayer.style.background = bg.value + " center/cover no-repeat"; // Force shorthand
    } else {
        bgLayer.style.background = bg.value;
    }

    // Filtros de fondo (Dim/Blur)
    // OPTIMIZACIÓN OBS: Solo aplicar oscurecimiento si hay una IMAGEN de fondo.
    // Si es color sólido (ej. verde chroma o negro), no oscurecer.
    let filters = [];
    // bg.type viene de getMonitorBackground(). Si es 'image' o 'video' (este último se renderiza como css gradient pero debemos tratarlo igual si queremos)
    // En getMonitorBackground, video retorna {type: 'css', value: gradient}. 
    // CORRECCIÓN: Deberíamos detectar si el value es un gradiente complejo vs color simple.
    // O mejor: Si el usuario borró el fondo, bg.value es '#000'.

    const isSolidColor = bg.type === 'css' && !bg.value.includes('gradient');

    if (config.bgDim > 0 && !isSolidColor) {
        filters.push(`brightness(${1 - (config.bgDim / 100)})`);
    }
    if (config.bgBlur > 0) filters.push(`blur(${config.bgBlur / 10}px)`);
    bgLayer.style.filter = filters.join(' ');

    // --- LIMPIEZA DE PLACEHOLDERS (LOGO) ---
    // Eliminar cualquier elemento que NO sea nuestras capas controladas (bg o content)
    Array.from(el.children).forEach(child => {
        if (!child.classList.contains('zion-monitor-bg') &&
            !child.classList.contains('zion-monitor-content') &&
            !child.classList.contains('monitor-ear')) {
            child.remove();
        }
    });

    // 4. Preparar Contenido de Texto
    let contentWrapper = el.querySelector('.zion-monitor-content');
    if (!contentWrapper) {
        contentWrapper = document.createElement('div');
        contentWrapper.className = 'zion-monitor-content';
        contentWrapper.style.position = 'relative';
        contentWrapper.style.zIndex = '1';
        contentWrapper.style.width = '100%';
        contentWrapper.style.height = '100%';
        contentWrapper.style.display = 'flex';
        contentWrapper.style.flexDirection = 'column';
        contentWrapper.style.justifyContent = 'center';
        contentWrapper.style.alignItems = 'center';
        contentWrapper.style.transition = 'opacity 0.2s'; // Animación suave
        el.appendChild(contentWrapper);
    }

    // Aplicar estilos de texto al wrapper
    contentWrapper.style.fontFamily = fontFamily;
    contentWrapper.style.textTransform = textTransform;
    contentWrapper.style.color = fontColor;
    contentWrapper.style.textShadow = textShadow;
    contentWrapper.style.fontWeight = config.boldText !== false ? 'bold' : 'normal';
    contentWrapper.style.padding = `${Math.max(5, marginY)}px ${Math.max(5, marginX)}px`;

    // Efecto de "Flash" o entrada (Animación simple)
    contentWrapper.style.opacity = '0';
    requestAnimationFrame(() => {
        if (isHTML) {
            contentWrapper.innerHTML = content;
        } else {
            contentWrapper.innerText = content;
        }

        // Ajustar tamaño del texto
        fitTextToBox(contentWrapper);

        // Trigger entrada
        contentWrapper.style.opacity = '1';
    });
}

function updatePreviewText(elementId, text) {
    updateMonitorContent(elementId, text, false);
}

function updatePreviewHTML(elementId, html) {
    updateMonitorContent(elementId, html, true);
}

const ZION_PLACEHOLDER = `<div style="display:flex; align-items:center; justify-content:center; gap:20px; width:100%; height:100%;">
    <img src="img/solologo.png" alt="" style="width: 100px; height: 100px; object-fit: contain; display: block;">
    <div style="text-align:left; display:flex; flex-direction:column; justify-content:center;">
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 4px; color: white; line-height: 0.8; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">ZION</div>
        <div style="font-size: 14px; font-weight: 300; letter-spacing: 8px; color: white; opacity: 0.9; line-height: 1; margin-top:6px;">PRESENTER</div>
    </div>
</div>`;

let lastNetStatus = { connected: false, connecting: false };

function updateNetworkUI(connected, connecting = false) {
    // Si se pasan argumentos, actualizar el estado global
    if (connected !== undefined) {
        lastNetStatus = { connected, connecting };
    } else {
        // Si no hay argumentos, usamos los últimos conocidos
        connected = lastNetStatus.connected;
        connecting = lastNetStatus.connecting;
    }

    // Colores NEÓN VIBRANTES para estado de red (Alta Visibilidad)
    const color = connected ? '#00FF00' : (connecting ? '#FF6600' : '#FF0000');
    const glow = connected ? '0 0 15px rgba(0, 255, 0, 0.8)' : (connecting ? '0 0 15px rgba(255, 102, 0, 0.8)' : '0 0 15px rgba(255, 0, 0, 0.8)');

    // Lista de todos los posibles indicadores en los diferentes módulos
    const indicators = ['netStatus_songs', 'netStatus_bible', 'netStatus_announcements', 'netStatus_pres'];

    indicators.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.background = color;
            el.style.boxShadow = `inset 0 1px 2px rgba(255,255,255,0.3), ${glow}`;
        }
    });
}

// Exportar para que otros módulos puedan usarlo o re-inicializar
window.updateNetworkUI = updateNetworkUI;

/**
 * Función Maestra de Blackout (Borrado de pantalla)
 */
window.blackout = function () {
    if (bc) {
        // 1. Notificar al visor para limpiar pantalla (Blackout total)
        const roomCode = window.zionRoomCode || localStorage.getItem('zion_panel_room');
        bc.postMessage({ type: 'nav', action: 'blackout', roomCode: roomCode });

        // 2. Notificar específicamente a presentaciones para limpiar imagen si hay una activa
        bc.postMessage({
            type: 'presentation',
            action: 'update',
            roomCode: roomCode,
            payload: { image: '', fitMode: 'contain' }
        });

        console.log('🌑 Blackout enviado a visor y red');

        // 3. IDs de todas las previsualizaciones en los diferentes módulos del panel
        const previewIds = [
            'livePreview',             // Cantos
            'biblePreview',            // Biblia
            'announcementLivePreview', // Anuncios
            'mainSlidePreview'         // Presentaciones (Slides)
        ];

        const ZION_LOGO_HTML = `<div style="display:flex; align-items:center; justify-content:center; gap:20px; width:100%; height:100%;">
    <img src="img/solologo.png" alt="" style="width: 100px; height: 100px; object-fit: contain; display: block;">
    <div style="text-align:left; display:flex; flex-direction:column; justify-content:center;">
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 4px; color: white; line-height: 0.8; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">ZION</div>
        <div style="font-size: 14px; font-weight: 300; letter-spacing: 8px; color: white; opacity: 0.9; line-height: 1; margin-top:6px;">PRESENTER</div>
    </div>
</div>`;

        // Limpiar todas las previsualizaciones locales preservando el fondo (WYSIWYG)
        previewIds.forEach(id => {
            // Usamos el motor unificado para poner el Logo sobre el fondo real
            updateMonitorContent(id, ZION_LOGO_HTML, true);
        });

        // 4. Notificar a anuncios si es necesario para detener carruseles automáticos
        if (typeof stopPresentationMode === 'function') stopPresentationMode();

        // 5. Resetear estado de presentación si existe
        if (typeof presState !== 'undefined') presState.currentIndex = -1;
    }

    // 6. Notificar red (Fuera del if(bc) por seguridad, aunque la sala viene de arriba)
    // Recuperar roomCode nuevamente o usar la scope superior si está disponible
    const roomCode = window.zionRoomCode || localStorage.getItem('zion_panel_room');
    if (window.networkSocket && roomCode) {
        window.networkSocket.emit('blackout', { room: roomCode, state: true });
    }
};

/**
 * Función para refrescar todos los monitores (útil al cambiar pestañas o config)
 * Re-lee la configuración y el fondo y los aplica al contenido actual.
 */
window.refreshAllMonitors = function () {
    // Optimización: Solo actualizar el monitor que el usuario está viendo actualmente
    let activeId = 'livePreview'; // Default (Canciones)
    if (window.currentMode === 'bible') activeId = 'biblePreview';
    if (window.currentMode === 'announcements') activeId = 'announcementLivePreview';
    if (window.currentMode === 'presentations') activeId = 'mainSlidePreview';

    const el = document.getElementById(activeId);
    if (!el) return;

    // Intentar recuperar el contenido actual para no perderlo
    const contentEl = el.querySelector('.zion-monitor-content');
    if (contentEl) {
        updateMonitorContent(activeId, contentEl.innerHTML, true);
    } else {
        const text = el.innerText.trim().replace(/\s+/g, ' ');
        if (text.includes('ZION') && text.includes('PRESENTER') && text.length < 30) {
            updateMonitorContent(activeId, ZION_PLACEHOLDER, true);
        } else if (text) {
            updateMonitorContent(activeId, el.innerText, false);
        }
    }
};

/**
 * Alias para compatibilidad con otros módulos
 */
window.toggleBlackout = window.blackout;

// --- INICIALIZACIÓN ---
// Al cargar el script, esperar un momento y establecer el estado inicial de los monitores
setTimeout(() => {
    // Aplicar logo inicial a todos los monitores localmente
    const previewIds = ['livePreview', 'biblePreview', 'announcementLivePreview', 'mainSlidePreview'];
    previewIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && typeof updateMonitorContent === 'function') {
            // Solo si está vacío para no sobreescribir contenido si se restauró sesión
            if (!el.innerText.trim() && !el.querySelector('img')) {
                updateMonitorContent(id, ZION_PLACEHOLDER, true);
            }
        }
    });
}, 800);
