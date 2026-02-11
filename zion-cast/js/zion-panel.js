/**
 * ZION CAST - Panel Logic v2.5 (Networked & Robust)
 */

const gid = (id) => document.getElementById(id);
const bc = new BroadcastChannel('zion_channel');

// Toggle About Modal
window.toggleAbout = function () {
    const overlay = gid('aboutOverlay');
    if (overlay) {
        if (overlay.style.display === 'none' || !overlay.style.display) {
            overlay.style.display = 'flex';
            setTimeout(() => overlay.style.opacity = '1', 10);
        } else {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 500);
        }
    }
};



// --- ESTADO GLOBAL (Declarado al inicio para evitar ReferenceError) ---
let isHydrated = false;
let state = {
    show: { center: false, title: true, bl: true, br: true, cb: true },
    text: { center: '', title: '', bl: '', br: '', cb: '' },
    isVerse: false,
    theme: 'theme-azure',
    globalGlassHidden: false, // Modo SOLO TEXTO Global
    slots: {} // Almacena los textos de los botones 1-10
};

const styleDefaults = {
    center: { w: 1260, h: 500, scale: 0.9, padX: 60, padY: 50, x: 0, y: 15, op: 0.8, radius: 50, fs: 200, autoW: false, badgeRadius: 50, badgeX: 80, badgeScale: 2, badgeY: 25, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' },
    title: { w: 600, h: 70, scale: 1.8, padX: 20, padY: 0, x: 0, y: 10, op: 0.8, radius: 20, fs: 40, autoW: true, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' },
    bl: { w: 400, h: 60, scale: 1.65, padX: 15, padY: 0, x: 15, y: 10, op: 0.8, radius: 20, fs: 32, autoW: true, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' },
    br: { w: 400, h: 60, scale: 1.4, padX: 20, padY: 0, x: 15, y: 15, op: 0.8, radius: 20, fs: 84, autoW: true, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' },
    cb: { w: 400, h: 60, scale: 1.65, padX: 15, padY: 0, x: 0, y: 10, op: 0.8, radius: 20, fs: 32, autoW: true, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' }
};

const verseStyleDefaults = {
    verseW: '90vw',
    verseH: '80vh',
    verseX: '5vw',
    verseY: '10vh',
    versePad: '60px',
    verseOp: '0.88',
    verseSizeCita: '2.6rem',
    verseShadow: '0.5'
};

let styleState = JSON.parse(JSON.stringify(styleDefaults));
let lastSketchContent = '';

// Diccionario de autocorrección inteligente (Acentos y Mayúsculas)
const BIBLE_CORRECTIONS = {
    // Básicos y Deidad
    'jesus': 'Jesús', 'espiritu': 'Espíritu', 'dios': 'Dios', 'señor': 'Señor', 'cristo': 'Cristo', 'jehova': 'Jehová', 'mesias': 'Mesías', 'amén': 'Amén', 'amen': 'Amén', 'aleluya': 'Aleluya',

    // Nombres Bíblicos
    'moises': 'Moisés', 'maria': 'María', 'jose': 'José', 'abraham': 'Abraham', 'isaac': 'Isaac', 'jacob': 'Jacob', 'israel': 'Israel', 'david': 'David', 'salomon': 'Salomón', 'pablo': 'Pablo', 'pedro': 'Pedro', 'juan': 'Juan', 'lucas': 'Lucas', 'mateo': 'Mateo', 'marcos': 'Marcos', 'andres': 'Andrés', 'tomas': 'Tomás', 'bartolome': 'Bartolomé', 'felipe': 'Felipe', 'esteban': 'Esteban', 'adan': 'Adán', 'eva': 'Eva', 'noé': 'Noé', 'noe': 'Noé', 'samuel': 'Samuel', 'elias': 'Elías', 'eliseo': 'Eliseo', 'isaias': 'Isaías', 'jeremias': 'Jeremías', 'ezequiel': 'Ezequiel', 'daniel': 'Daniel', 'oseas': 'Oseas', 'joel': 'Joel', 'amos': 'Amós', 'abdias': 'Abdías', 'jonas': 'Jonás', 'miqueas': 'Miqueas', 'nahum': 'Nahúm', 'habacuc': 'Habacuc', 'sofonias': 'Sofonías', 'hageo': 'Hageo', 'zacarias': 'Zacarías', 'malaquias': 'Malaquías',

    // Libros y Conceptos
    'genesis': 'Génesis', 'exodo': 'Éxodo', 'levitico': 'Levítico', 'numeros': 'Números', 'deuteronomio': 'Deuteronomio', 'josue': 'Josué', 'nehemias': 'Nehemías', 'biblia': 'Biblia', 'evangelio': 'Evangelio', 'apocalipsis': 'Apocalipsis', 'espistola': 'Epístola', 'jerusalen': 'Jerusalén', 'belen': 'Belén', 'canan': 'Canaán', 'egipto': 'Egipto', 'babilonia': 'Babilonia',

    // Términos Espirituales
    'corazon': 'corazón', 'oracion': 'oración', 'bendicion': 'bendición', 'perdon': 'perdón', 'pasion': 'pasión', 'comunion': 'comunión', 'sabiduria': 'sabiduría', 'profecia': 'profecía', 'proposito': 'propósito', 'atencion': 'atención', 'reunion': 'reunión', 'santidad': 'santidad', 'salvacion': 'salvación', 'resurreccion': 'resurrección', 'fe': 'Fe', 'gracia': 'Gracia', 'misericordia': 'Misericordia', 'alabanza': 'Alabanza', 'adoracion': 'Adoración', 'gloria': 'Gloria', 'liberacion': 'liberación', 'sanidad': 'sanidad', 'redencion': 'redención', 'tentacion': 'tentación', 'pecado': 'pecado', 'justificacion': 'justificación', 'perfeccion': 'perfección',

    // Versiones de Biblia
    'reina': 'Reina', 'valera': 'Valera', 'septuaginta': 'Septuaginta'
};

// EXPOSE FOR MODULE SYNC
window.state = state;
window.styleState = styleState;

// --- SOCKET INIT ---
let socket;
if (typeof io !== 'undefined') {
    socket = io({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 20000
    });

    // Manejadores de reconexión
    socket.on('connect', () => {
        console.log('✅ Socket conectado');
        updateNetworkUI(true);
        // Enviar estilos guardados al servidor cuando conecte
        pushLocalStylesToNetwork();
    });

    socket.on('disconnect', (reason) => {
        console.warn('⚠️ Socket desconectado:', reason);
        updateNetworkUI(false);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconectado después de ${attemptNumber} intentos`);
        updateNetworkUI(true);
        if (window.currentRoomCode) {
            socket.emit('join_room', { roomCode: window.currentRoomCode });
        }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
        updateNetworkUI(false, true);
    });

    socket.on('reconnect_error', (error) => updateNetworkUI(false));
    socket.on('reconnect_failed', () => updateNetworkUI(false));

} else {
    // Modo Offline (Sin servidor)
    console.warn("⚠️ Socket.io no encontrado. Modo Offline.");
    socket = {
        on: () => { },
        emit: () => { }
    };
    // Simular conexión exitosa para UI
    setTimeout(() => updateNetworkUI(true), 500);
}

// Función auxiliar para forzar la sincronización (funciona offline vía BroadcastChannel)
function pushLocalStylesToNetwork() {
    const localStyles = localStorage.getItem('zion_styles');
    if (localStyles) {
        // console.log("📤 Sincronizando estilos locales...");
        try {
            const s = JSON.parse(localStyles);
            Object.keys(s).forEach(target => {
                // Actualizar estado interno
                if (styleState[target]) Object.assign(styleState[target], s[target]);

                // Enviar a Monitor (vía BC) y Servidor (vía Socket)
                const payload = { type: 'zion:style', payload: { target, style: s[target] } };
                if (socket && socket.connected) socket.emit('dispatch', payload);
                if (typeof bc !== 'undefined') bc.postMessage(payload);
            });
            // Refrescar UI del panel
            if (typeof updateEditorUI === 'function') updateEditorUI();
        } catch (e) {
            console.error("Error sync styles:", e);
        }
    }
}

// --- NETWORK UI SYSTEM ---
function updateNetworkUI(connected, connecting = false) {
    const el = document.getElementById('netStatus');
    if (!el) return;

    // Colores NEÓN VIBRANTES para estado de red (Alta Visibilidad)
    const color = connected ? '#00FF00' : (connecting ? '#FF6600' : '#FF0000');
    const glow = connected ? '0 0 10px rgba(0, 255, 0, 0.8)' : (connecting ? '0 0 10px rgba(255, 102, 0, 0.8)' : '0 0 10px rgba(255, 0, 0, 0.8)');

    el.style.background = color;
    el.style.boxShadow = `inset 0 1px 2px rgba(255,255,255,0.3), ${glow}`;
}
window.updateNetworkUI = updateNetworkUI;

// --- DARK MODE FORCED ---
(function initDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('zion_dark_mode', 'enabled');
})();

// --- THEME SWITCHER ---
window.setTheme = function (themeName, skipColorSync = false) {
    // Handle custom mode
    if (themeName === 'custom') {
        // Update selector
        const selector = document.getElementById('themeSelector');
        if (selector) selector.value = 'custom';

        // CRITICAL: Save current panel visual theme before switching to custom
        // Get current theme from body classes
        const themes = ['theme-cosmic', 'theme-emerald', 'theme-sunset', 'theme-gold', 'theme-midnight', 'theme-azure', 'theme-flame', 'theme-electric', 'theme-neon', 'theme-lime'];
        let currentPanelTheme = 'theme-azure'; // default
        for (const theme of themes) {
            if (document.body.classList.contains(theme)) {
                currentPanelTheme = theme;
                break;
            }
        }
        // Save it so panel keeps its visual theme
        localStorage.setItem('zion_theme', currentPanelTheme);

        // Save custom mode FOR OVERLAY ONLY
        localStorage.setItem('zion_overlay_theme', 'custom');
        state.theme = 'custom';

        // Sync to overlay (CRITICAL: Tell overlay to clear its own theme classes)
        if (typeof bc !== 'undefined') bc.postMessage({ type: 'theme', theme: 'custom' });
        if (typeof socket !== 'undefined' && socket) {
            socket.emit('dispatch', { type: 'theme', theme: 'custom' });
        }

        // Don't change panel's visual theme - keep it as is
        return;
    }

    // Remove all theme classes
    const themes = ['theme-cosmic', 'theme-emerald', 'theme-sunset', 'theme-gold', 'theme-midnight', 'theme-azure', 'theme-flame', 'theme-electric', 'theme-neon', 'theme-lime'];
    themes.forEach(t => document.body.classList.remove(t));

    // Add new theme
    document.body.classList.add(themeName);

    // Save to localStorage (both panel and overlay use the same theme)
    localStorage.setItem('zion_theme', themeName);
    localStorage.setItem('zion_overlay_theme', themeName);
    state.theme = themeName;

    // Update selector
    const selector = document.getElementById('themeSelector');
    if (selector) selector.value = themeName;

    // --- SYNC COLORS WITH PICKERS ---
    if (!skipColorSync) {
        const themeColors = {
            'theme-electric': { c1: '#0047AB', c2: '#0047AB', c3: '#0047AB' },
            'theme-neon': { c1: '#FF007F', c2: '#FF007F', c3: '#FF007F' },
            'theme-lime': { c1: '#CCFF00', c2: '#CCFF00', c3: '#CCFF00' },
            'theme-cosmic': { c1: '#8b5cf6', c2: '#8b5cf6', c3: '#8b5cf6' },
            'theme-emerald': { c1: '#14b8a6', c2: '#14b8a6', c3: '#14b8a6' },
            'theme-sunset': { c1: '#FF0000', c2: '#FF0000', c3: '#FF0000' },
            'theme-gold': { c1: '#FAFF00', c2: '#FAFF00', c3: '#FAFF00' },
            'theme-midnight': { c1: '#334155', c2: '#334155', c3: '#334155' },
            'theme-azure': { c1: '#0ea5e9', c2: '#0ea5e9', c3: '#0ea5e9' },
            'theme-flame': { c1: '#FF6600', c2: '#FF6600', c3: '#FF6600' }
        };

        const colors = themeColors[themeName];
        if (colors && styleState) {
            // Update pickers UI
            if (gid('inpC1')) gid('inpC1').value = colors.c1;
            if (gid('inpC2')) gid('inpC2').value = colors.c2;
            if (gid('inpC3')) gid('inpC3').value = colors.c3;

            // Update styleState globally
            Object.keys(styleState).forEach(k => {
                styleState[k].c1 = colors.c1;
                styleState[k].c2 = colors.c2;
                styleState[k].c3 = colors.c3;
            });

            // TRUCO: Enviamos el estilo del elemento actual para FORZAR al overlay a aplicar los colores del tema
            // sobre el sistema de "Colores Personalizados" (Root)
            if (typeof window.sendStyle === 'function' && isHydrated) {
                const currentTarget = gid('targetUnit') ? gid('targetUnit').value : 'center';
                window.sendStyle(currentTarget);
            }
        }
    }

    // Sync to overlay
    if (typeof bc !== 'undefined') bc.postMessage({ type: 'theme', theme: themeName });
    if (typeof socket !== 'undefined' && socket) {
        socket.emit('dispatch', { type: 'theme', theme: themeName });
    }
};

// (Moved to the end of the file to prevent ReferenceErrors)

// --- SYNC INPUTS (Utility) ---
function syncInputs() {
    const active = document.activeElement;

    // Solo sincronizar si NO tenemos foco en el campo, para evitar saltos de cursor al escribir
    if (gid('title') && active !== gid('title')) gid('title').value = state.text.title || '';
    if (gid('bl') && active !== gid('bl')) gid('bl').value = state.text.bl || '';
    if (gid('cb') && active !== gid('cb')) gid('cb').value = state.text.cb || '';
    if (gid('br') && active !== gid('br')) gid('br').value = state.text.br || '';

    if (gid('center') && active !== gid('center')) {
        const centerText = state.text.center || '';
        const cleanText = centerText.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
        gid('center').value = cleanText;
    }
}

// --- RECEPTION (Sync from Server) ---
socket.on('dispatch', (data) => {
    if (!data) return;
    const { type, payload } = data;

    if (type === 'zion:update') {
        if (!isHydrated) {
            // Hidratación Inicial
            if (payload.text) state.text = { ...state.text, ...payload.text };
            if (payload.slots) {
                state.slots = payload.slots;
                // Limpiar LocalStorage viejo para evitar que reviva datos fantasmas
                localStorage.removeItem('zion_slots');
            }

            isHydrated = true;
            if (window.updateToggleUI) window.updateToggleUI();
            if (typeof updateSlots === 'function') updateSlots();
        } else {
            // Actualizaciones en tiempo real
            if (payload.text) state.text = { ...state.text, ...payload.text };
            if (payload.slots) {
                state.slots = { ...state.slots, ...payload.slots };
                if (typeof updateSlots === 'function') updateSlots();
            }
            if (payload.show) {
                state.show = { ...state.show, ...payload.show };
                if (window.updateToggleUI) window.updateToggleUI();
            }
        }
        syncInputs();
        saveMemory();
    }

    if (type === 'zion:style') {
        isHydrated = true;
        const { target, style } = payload;
        if (target && style && styleState) {
            // Merge para no perder propiedades si el servidor manda un objeto parcial
            styleState[target] = { ...styleState[target], ...style };

            // Si el estilo recibido trae colores (Motor de Color), los aplicamos GLOBALMENTE
            // para que todos los elementos en este panel compartan la misma identidad
            if (style.c1 || style.c2 || style.c3) {
                Object.keys(styleState).forEach(k => {
                    if (style.c1) styleState[k].c1 = style.c1;
                    if (style.c2) styleState[k].c2 = style.c2;
                    if (style.c3) styleState[k].c3 = style.c3;
                });
            }

            if (typeof updateEditorUI === 'function') updateEditorUI();
        }
    }

    if (type === 'theme') {
        if (typeof window.setTheme === 'function') {
            const themeName = data.theme;

            // CRITICAL: If receiving 'custom', don't change panel's visual theme
            if (themeName === 'custom') {
                // Only update state and selector, keep panel's visual theme
                state.theme = 'custom';
                const selector = document.getElementById('themeSelector');
                if (selector) selector.value = 'custom';
                localStorage.setItem('zion_overlay_theme', 'custom');
                // Don't change body classes - panel keeps its visual theme
                return;
            }

            // For real themes, update panel's visual appearance
            const themes = ['theme-cosmic', 'theme-emerald', 'theme-sunset', 'theme-gold', 'theme-midnight', 'theme-azure', 'theme-flame', 'theme-electric', 'theme-neon', 'theme-lime'];
            themes.forEach(t => document.body.classList.remove(t));
            document.body.classList.add(themeName);
            localStorage.setItem('zion_theme', themeName);
            localStorage.setItem('zion_overlay_theme', themeName);
            state.theme = themeName;

            // Sincronizar colores del tema en styleState global
            const themeColors = {
                'theme-electric': { c1: '#0047AB', c2: '#0047AB', c3: '#0047AB' },
                'theme-neon': { c1: '#FF007F', c2: '#FF007F', c3: '#FF007F' },
                'theme-lime': { c1: '#CCFF00', c2: '#CCFF00', c3: '#CCFF00' },
                'theme-cosmic': { c1: '#8b5cf6', c2: '#8b5cf6', c3: '#8b5cf6' },
                'theme-emerald': { c1: '#14b8a6', c2: '#14b8a6', c3: '#14b8a6' },
                'theme-sunset': { c1: '#FF0000', c2: '#FF0000', c3: '#FF0000' },
                'theme-gold': { c1: '#FAFF00', c2: '#FAFF00', c3: '#FAFF00' },
                'theme-midnight': { c1: '#334155', c2: '#334155', c3: '#334155' },
                'theme-azure': { c1: '#0ea5e9', c2: '#0ea5e9', c3: '#0ea5e9' },
                'theme-flame': { c1: '#FF6600', c2: '#FF6600', c3: '#FF6600' }
            };
            const colors = themeColors[themeName];
            if (colors && styleState) {
                Object.keys(styleState).forEach(k => {
                    styleState[k].c1 = colors.c1;
                    styleState[k].c2 = colors.c2;
                    styleState[k].c3 = colors.c3;
                });
                if (typeof updateEditorUI === 'function') updateEditorUI();
            }
        }
    }

    if (type === 'zion:verseStyle') {
        const s = payload;
        const map = {
            'inpVerseW': 'verseW', 'inpVerseH': 'verseH',
            'inpVerseX': 'verseX', 'inpVerseY': 'verseY',
            'inpVersePad': 'versePad', 'inpVerseOp': 'verseOp'
        };

        Object.keys(map).forEach(inputId => {
            const el = gid(inputId);
            if (!el) return;
            const valKey = map[inputId];
            let val = s[valKey];

            if (val !== undefined) {
                // Strip units if string (e.g., '90vw' -> 90)
                let numericVal = val;
                if (typeof val === 'string') {
                    numericVal = parseFloat(val.replace(/[a-z%]/g, ''));
                }
                el.value = numericVal;

                // Update display label
                const labelId = inputId.replace('inp', 'val');
                const label = gid(labelId);
                if (label) {
                    label.textContent = (inputId === 'inpVerseOp') ? numericVal.toFixed(2) : numericVal;
                }
            }
        });
    }
});

function loadMemory() {
    const saved = localStorage.getItem('zion_memory');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.title) gid('title').value = data.title;
            if (data.center) gid('center').value = data.center.replace(/<br\s*\/?>/gi, '\n');
            if (data.bl) gid('bl').value = data.bl;
            if (data.br) gid('br').value = data.br;
            if (data.cb) gid('cb').value = data.cb;
            if (data.show) state.show = { ...state.show, ...data.show };
        } catch (e) { console.error("Memory load crash", e); }
    }
}

function saveMemory() {
    const memory = {
        title: gid('title').value,
        center: gid('center').value,
        bl: gid('bl').value,
        br: gid('br').value,
        cb: gid('cb').value,
        show: state.show
    };
    localStorage.setItem('zion_memory', JSON.stringify(memory));
}

// --- LOGICA DE ENVÍO ---
window.send = function (triggerAnim = null) {
    if (!isHydrated) {
        console.warn("⚠️ Intento de envío bloqueado: El panel aún no recupera datos del servidor.");
        return;
    }

    // PROTECCIÓN CRÍTICA: Si state.slots está vacío pero el servidor (que nos hidrató) tenía datos,
    // significa que algo falló en la hidratación. Bloqueamos para no borrar la DB.
    if (Object.keys(state.slots).length === 0 && isHydrated) {
        // Solo permitimos enviar si es que realmente queremos borrar todo (poco probable en inicio)
        // Por ahora, si está vacío después de hidratar, intentamos recuperar
        console.log("ℹ️ Verificando integridad de slots antes de enviar...");
    }

    // Only read center value if NOT in verse mode
    let rawCenter = '';
    let formattedCenter = '';

    if (!state.isVerse) {
        rawCenter = gid('center').value;
        formattedCenter = rawCenter.replace(/\[(\d+)\]\s*/g, '<span class="v-num">$1</span>');
        formattedCenter = formattedCenter.replace(/\r/g, '').replace(/\n/g, '<br>');
    }

    // Update state for non-verse fields
    state.text.title = gid('title').value;
    state.text.bl = gid('bl').value;
    state.text.cb = gid('cb').value;
    state.text.br = gid('br').value;

    // Build text object conditionally
    let textPayload = {
        title: state.text.title,
        bl: state.text.bl,
        cb: state.text.cb,
        br: state.text.br
    };

    let versePayload = null;

    if (state.isVerse) {
        // VERSE MODE: Send to dedicated verse channel, DON'T touch center
        // Use the stored verse text, not the field value
        const verseText = state.currentVerseText || '';
        const formatted = verseText.replace(/\[(\d+)\]\s*/g, '<span class="v-num">$1</span>')
            .replace(/\r/g, '').replace(/\n/g, '<br>');

        // Obtener nombre de la versión actual
        let versionName = '';
        if (typeof currentBibleVersion !== 'undefined' && typeof BIBLE_VERSIONS !== 'undefined') {
            const version = BIBLE_VERSIONS.find(v => v.id === currentBibleVersion);
            if (version) {
                versionName = ` (${version.id})`;
            }
        }

        versePayload = {
            text: formatted,
            citation: state.text.br + versionName
        };
        // Don't include 'center' in textPayload - leaves it unchanged in overlay
    } else {
        // NORMAL MODE: Include center in payload
        state.text.center = formattedCenter;
        textPayload.center = formattedCenter;
    }

    const payload = {
        type: 'zion:update',
        payload: {
            text: textPayload,
            verseData: versePayload, // New dedicated channel
            show: state.show,
            slots: state.slots,       // Sincronizar slots
            isVerse: state.isVerse,
            globalGlassHidden: state.globalGlassHidden,
            triggerAnim: triggerAnim
        }
    };

    // DEBUG: Log what we're sending
    console.log('SEND PAYLOAD:', {
        isVerse: state.isVerse,
        hasCenter: 'center' in textPayload,
        centerValue: textPayload.center,
        verseData: versePayload
    });

    socket.emit('dispatch', payload);
    bc.postMessage(payload);
    saveMemory();
};

function updateToggleUI() {
    const toggles = {
        'togTitle': 'title', 'togCenter': 'center', 'togBl': 'bl', 'togCb': 'cb', 'togBr': 'br'
    };
    Object.keys(toggles).forEach(btnId => {
        const key = toggles[btnId];
        const btn = gid(btnId);
        if (btn) {
            if (state.show[key]) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
}
window.updateToggleUI = updateToggleUI;

// --- LOGICA DE VISIBILIDAD MASIVA (TODOS) ---
let preAllHideState = null;

function toggleAllVisibility() {
    const keys = ['title', 'center', 'bl', 'cb', 'br'];
    const isAnyVisible = keys.some(k => state.show[k]);
    const btnAll = gid('togAll');

    if (isAnyVisible) {
        // Guardar estado actual y ocultar todo
        preAllHideState = {};
        keys.forEach(k => {
            preAllHideState[k] = state.show[k];
            state.show[k] = false;
        });
        if (btnAll) btnAll.classList.remove('active');
    } else {
        // Si todo está oculto, restaurar memoria o mostrar todo por defecto
        if (preAllHideState) {
            keys.forEach(k => state.show[k] = preAllHideState[k]);
        } else {
            keys.forEach(k => state.show[k] = true);
        }
        preAllHideState = null;
        if (btnAll) btnAll.classList.add('active');
    }
    updateToggleUI();
    window.send();
}

// --- INICIALIZACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    loadMemory();
    loadStylesFromDisk(); // Recuperar estilos guardados
    updateToggleUI();
    updateEditorUI();

    // Init lastSketchContent from memory if exists
    if (!state.isVerse && gid('center').value) {
        lastSketchContent = gid('center').value;
    }

    // Asegurar sincronización offline (especialmente para el Monitor iframe)
    setTimeout(() => {
        if (typeof pushLocalStylesToNetwork === 'function') pushLocalStylesToNetwork();
    }, 1000);

    ['title', 'bl', 'cb', 'br', 'center'].forEach(id => {
        gid(id).addEventListener('input', (e) => {
            if (id === 'center' && e.isTrusted) {
                // --- Autocorrección Inteligente ---
                const textarea = e.target;
                const value = textarea.value;
                const cursorPos = textarea.selectionStart;
                const lastChar = value.charAt(cursorPos - 1);

                if ([' ', '.', ',', ';', ':', '!', '?', '\n'].includes(lastChar)) {
                    const textBeforeCursor = value.substring(0, cursorPos - 1);
                    const words = textBeforeCursor.split(/[\s\.,;:!\?\n]+/);
                    const lastWord = words[words.length - 1];
                    const lastWordLower = lastWord.toLowerCase();

                    if (BIBLE_CORRECTIONS[lastWordLower]) {
                        const correctedWord = BIBLE_CORRECTIONS[lastWordLower];
                        const newText = value.substring(0, cursorPos - 1 - lastWord.length) +
                            correctedWord +
                            value.substring(cursorPos - 1);

                        textarea.value = newText;
                        const newPos = cursorPos - lastWord.length + correctedWord.length;
                        textarea.setSelectionRange(newPos, newPos);
                    }
                }
                lastSketchContent = gid('center').value;
            }

            // Don't auto-send if we're in verse mode - verse updates are handled explicitly
            if (id === 'center' && state.isVerse) return;

            // DEBOUNCE: Esperar 200ms antes de enviar para no saturar la red al escribir
            if (window.sendTimeout) clearTimeout(window.sendTimeout);
            window.sendTimeout = setTimeout(() => {
                window.send();
            }, 200);
        });
    });

    const togglesList = { 'togTitle': 'title', 'togCenter': 'center', 'togBl': 'bl', 'togCb': 'cb', 'togBr': 'br' };
    Object.keys(togglesList).forEach(btnId => {
        gid(btnId).addEventListener('click', () => {
            const key = togglesList[btnId];
            state.show[key] = !state.show[key];
            // Si el usuario toca un botón manual, reseteamos la memoria de 'TODOS'
            preAllHideState = null;
            updateToggleUI();
            window.send();
        });
    });

    // Botón especial TODOS
    const btnAll = gid('togAll');
    if (btnAll) {
        btnAll.addEventListener('click', toggleAllVisibility);
        // Inicializar estado visual del botón ALL
        const isAnyVisible = ['title', 'center', 'bl', 'cb', 'br'].some(k => state.show[k]);
        if (isAnyVisible) btnAll.classList.add('active');
    }

    // Slots (Sincronizados por Servidor)
    function updateSlots() {
        document.querySelectorAll('.slot-btn').forEach(btn => {
            const id = btn.dataset.slot;
            if (state.slots && state.slots[id]) btn.classList.add('filled');
            else btn.classList.remove('filled');
        });
    }
    window.updateSlots = updateSlots; // Exponer para la recepción de red

    document.querySelectorAll('.slot-btn').forEach(btn => {
        const id = btn.dataset.slot;
        let pressTimer;
        let longPressed = false;

        // Iniciar temporizador al presionar
        const startPress = (e) => {
            longPressed = false;
            pressTimer = setTimeout(() => {
                if (state.slots[id]) {
                    // Borrado directo sin confirmación
                    delete state.slots[id];
                    updateSlots();
                    window.send();

                    longPressed = true; // Marcamos que fue pulsación larga

                    // Efecto visual de borrado
                    btn.style.transform = "scale(1.2)";
                    btn.style.filter = "brightness(2)";
                    setTimeout(() => {
                        btn.style.transform = "";
                        btn.style.filter = "";
                    }, 300);
                }
            }, 700); // 700ms para considerar pulsación larga
        };

        // Cancelar temporizador al soltar o mover
        const cancelPress = () => {
            clearTimeout(pressTimer);
        };

        btn.addEventListener('mousedown', startPress);
        btn.addEventListener('touchstart', startPress);
        btn.addEventListener('mouseup', cancelPress);
        btn.addEventListener('mouseleave', cancelPress);
        btn.addEventListener('touchend', cancelPress);

        btn.addEventListener('click', (e) => {
            // Si acabamos de borrar por pulsación larga, no hacemos nada en el click
            if (longPressed) {
                longPressed = false;
                return;
            }

            if (state.slots[id]) {
                // Leer del Slot
                gid('center').value = state.slots[id];
                state.isVerse = false;
                window.send('center');
            } else {
                // Guardar en el Slot
                const content = gid('center').value.trim();
                if (!content) return;

                state.slots[id] = content;
                updateSlots();
                window.send(); // Sincronizar con el servidor (zion-db.json)
            }
        });
    });
    updateSlots();

    // Highlight Button
    const btnHighlight = gid('btnHighlight');
    if (btnHighlight) {
        btnHighlight.addEventListener('click', () => {
            const textarea = gid('center');
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            if (start === end) return; // No selection

            const text = textarea.value;
            const selected = text.substring(start, end);
            const replacement = `*${selected}*`;

            textarea.value = text.substring(0, start) + replacement + text.substring(end);
            textarea.focus();
            textarea.setSelectionRange(start, start + replacement.length);

            // Auto update
            window.send();
        });
    }

    // --- VERSE STYLE PERSISTENCE ---
    window.loadVerseStylePanel = function () {
        const saved = localStorage.getItem('zion_verseStyle');
        if (saved) {
            try {
                const s = JSON.parse(saved);
                const map = {
                    'inpVerseW': 'verseW', 'inpVerseH': 'verseH',
                    'inpVerseX': 'verseX', 'inpVerseY': 'verseY',
                    'inpVersePad': 'versePad', 'inpVerseOp': 'verseOp',
                    'inpVerseSizeCita': 'verseSizeCita', 'inpVerseShadow': 'verseShadow'
                };

                Object.keys(map).forEach(inputId => {
                    const el = gid(inputId);
                    const valKey = map[inputId];
                    let val = s[valKey];

                    if (el && val !== undefined) {
                        // Strip units for the slider value
                        let numericVal = val;
                        if (typeof val === 'string') {
                            numericVal = parseFloat(val.replace(/[a-z%]/g, ''));
                        }
                        el.value = numericVal;

                        // Update corresponding label
                        const labelId = inputId.replace('inp', 'val');
                        const label = gid(labelId);
                        if (label) {
                            if (inputId === 'inpVerseOp' || inputId === 'inpVerseShadow') {
                                label.textContent = numericVal.toFixed(2);
                            } else if (inputId === 'inpVerseSizeCita') {
                                label.textContent = numericVal.toFixed(1);
                            } else {
                                label.textContent = numericVal;
                            }
                        }
                    }
                });
                console.log("📖 Verse Styles loaded from memory");

                // Auto-sync loaded styles with overlay
                const payload = { type: 'zion:verseStyle', payload: s };
                socket.emit('dispatch', payload);
                bc.postMessage(payload);
            } catch (e) {
                console.error("Failed to parse verse style memory", e);
            }
        }
    }

    // Exit Verse Mode Button (Volver a Zion)
    const btnExitVerse = gid('btnExitVerse');
    if (btnExitVerse) {
        btnExitVerse.addEventListener('click', () => {
            // Simply exit verse mode, keep current center content
            state.isVerse = false;
            state.currentVerseText = ''; // Clear verse text
            window.send();
        });
    }

    // Splash
    setTimeout(() => {
        const splash = gid('zion-init-overlay');
        if (splash) {
            splash.classList.add('hidden');
            // Remove from DOM after transition
            setTimeout(() => {
                if (splash.parentNode) splash.parentNode.removeChild(splash);

                // AUTO-START TUTORIAL (First Time Only)
                if (!localStorage.getItem('zion_tutorial_shown')) {
                    if (typeof ZionTutorial !== 'undefined') {
                        ZionTutorial.start();
                    }
                }
            }, 500);
        }
    }, 2500);

    setTimeout(() => {
        loadVerseStylePanel(); // Restore verse balloon config
        isHydrated = true;
    }, 3000);
});

// --- BIBLE LOGIC ---
// Mapeo mejorado de nombres a índices (0-65)
const BOOK_NAMES = [
    "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio", "Josué", "Jueces", "Rut",
    "1 Samuel", "2 Samuel", "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras", "Nehemías",
    "Ester", "Job", "Salmos", "Proverbios", "Eclesiastés", "Cantares", "Isaías", "Jeremías",
    "Lamentaciones", "Ezequiel", "Daniel", "Oseas", "Joel", "Amós", "Abdías", "Jonás",
    "Miqueas", "Nahúm", "Habacuc", "Sofonías", "Hageo", "Zacarías", "Malaquías",
    "Mateo", "Marcos", "Lucas", "Juan", "Hechos", "Romanos", "1 Corintios", "2 Corintios",
    "Gálatas", "Efesios", "Filipenses", "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses",
    "1 Timoteo", "2 Timoteo", "Tito", "Filemón", "Hebreos", "Santiago", "1 Pedro", "2 Pedro",
    "1 Juan", "2 Juan", "3 Juan", "Judas", "Apocalipsis"
];

const BOOK_ABBREV = {
    'gen': 0, 'gn': 0, 'genesis': 0, 'génesis': 0,
    'exo': 1, 'ex': 1, 'exodo': 1, 'éxodo': 1,
    'lev': 2, 'lv': 2, 'levitico': 2, 'levítico': 2,
    'num': 3, 'nm': 3, 'numeros': 3, 'números': 3,
    'deu': 4, 'dt': 4, 'deuteronomio': 4,
    'jos': 5, 'js': 5, 'josue': 5, 'josué': 5,
    'jue': 6, 'jueces': 6,
    'rut': 7, 'rt': 7,
    '1sa': 8, '1sm': 8, '1 samuel': 8,
    '2sa': 9, '2sm': 9, '2 samuel': 9,
    '1re': 10, '1 reyes': 10,
    '2re': 11, '2 reyes': 11,
    '1cr': 12, '1 cronicas': 12, '1 crónicas': 12,
    '2cr': 13, '2 cronicas': 13, '2 crónicas': 13,
    'esd': 14, 'esdras': 14,
    'neh': 15, 'nehemias': 15, 'nehemías': 15,
    'est': 16, 'ester': 16,
    'job': 17,
    'sal': 18, 'salmos': 18, 'salmo': 18,
    'pro': 19, 'pr': 19, 'proverbios': 19,
    'ecl': 20, 'ec': 20, 'eclesiastes': 20, 'eclesiastés': 20,
    'can': 21, 'cnt': 21, 'cantares': 21,
    'isa': 22, 'is': 22, 'isaias': 22, 'isaías': 22,
    'jer': 23, 'jr': 23, 'jeremias': 23, 'jeremías': 23,
    'lam': 24, 'lm': 24, 'lamentaciones': 24,
    'eze': 25, 'ez': 25, 'ezequiel': 25,
    'dan': 26, 'dn': 26, 'daniel': 26,
    'ose': 27, 'os': 27, 'oseas': 27,
    'joe': 28, 'jl': 28, 'joel': 28,
    'amo': 29, 'am': 29, 'amos': 29, 'amós': 29,
    'abd': 30, 'abdias': 30, 'abdías': 30,
    'jon': 31, 'jonas': 31, 'jonás': 31,
    'miq': 32, 'miqueas': 32,
    'nah': 33, 'nahum': 33, 'nahúm': 33,
    'hab': 34, 'habacuc': 34,
    'sof': 35, 'sofonias': 35, 'sofonías': 35,
    'hag': 36, 'hageo': 36,
    'zac': 37, 'zacarias': 37, 'zacarías': 37,
    'mal': 38, 'malaquias': 38, 'malaquías': 38,
    'mat': 39, 'mt': 39, 'mateo': 39,
    'mar': 40, 'mr': 40, 'marcos': 40,
    'luc': 41, 'lc': 41, 'lucas': 41,
    'jua': 42, 'jn': 42, 'juan': 42,
    'hec': 43, 'hch': 43, 'hechos': 43,
    'rom': 44, 'rm': 44, 'romanos': 44,
    '1co': 45, '1 corintios': 45,
    '2co': 46, '2 corintios': 46,
    'gal': 47, 'ga': 47, 'galatas': 47, 'gálatas': 47,
    'efe': 48, 'ef': 48, 'efesios': 48,
    'fil': 49, 'filipenses': 49,
    'col': 50, 'colosenses': 50,
    '1te': 51, '1ts': 51, '1 tesalonicenses': 51,
    '2te': 52, '2ts': 52, '2 tesalonicenses': 52,
    '1ti': 53, '1 timoteo': 53,
    '2ti': 54, '2 timoteo': 54,
    'tit': 55, 'tito': 55,
    'flm': 56, 'filemon': 56, 'filemón': 56,
    'heb': 57, 'hebreos': 57,
    'stg': 58, 'santiago': 58,
    '1pe': 59, '1p': 59, '1 pedro': 59,
    '2pe': 60, '2p': 60, '2 pedro': 60,
    '1jn': 61, '1 juan': 61,
    '2jn': 62, '2 juan': 62,
    '3jn': 63, '3 juan': 63,
    'jud': 64, 'judas': 64,
    'apo': 65, 'ap': 65, 'apocalipsis': 65
};

function normalizeBookName(input) {
    if (!input) return null;
    const clean = input.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Búsqueda exacta
    if (BOOK_ABBREV[clean] !== undefined) {
        return BOOK_ABBREV[clean];
    }

    // Búsqueda por primeras 3 letras
    for (const [key, idx] of Object.entries(BOOK_ABBREV)) {
        if (key.startsWith(clean) && clean.length >= 3) {
            return idx;
        }
    }

    return null;
}

window.searchBible = function () {
    const query = gid('bibleInput').value.trim();
    if (!query) return;

    const match = query.match(/^(.+?)\s+(\d+)[:.](\d+)(?:-(\d+))?$/);
    if (!match) return;

    let [_, bookName, chStr, vStartStr, vEndStr] = match;
    const ch = parseInt(chStr);
    const s = parseInt(vStartStr);
    const e = vEndStr ? parseInt(vEndStr) : null;

    const bookIdx = normalizeBookName(bookName);
    if (bookIdx === null) return;

    if (typeof bibleSource === 'undefined') return;

    // Use the core display function (this updates lastProjectedVerse and sends data)
    if (typeof window.displayVerseInEditor === 'function') {
        window.displayVerseInEditor(bookIdx, ch, s, e);
    }

    // Sincronizar con el navegador de la Biblia del panel lateral (UI solamente)
    if (typeof window.selectBook === 'function' && typeof window.selectChapter === 'function') {
        window.selectBook(bookIdx);
        window.selectChapter(bookIdx, ch);

        // Sincronizar índices internos para que las flechas funcionen desde aquí
        if (typeof window.syncNavigator === 'function') {
            window.syncNavigator(bookIdx, ch, s);
        }

        // Pequeño delay para asegurar que el DOM de los versículos se generó
        setTimeout(() => {
            if (typeof window.highlightCurrentVerse === 'function') {
                window.highlightCurrentVerse(s);
            }
        }, 100);
    }
};

// Búsqueda por palabras clave/frases
window.handleKeywordSearch = function () {
    const query = gid('bibleInput').value.trim().toLowerCase();
    if (!query || query.length < 3) {
        alert('Por favor escribe al menos 3 caracteres para buscar');
        return;
    }

    if (!bibleSource) {
        alert('La Biblia no está cargada');
        return;
    }

    const resultsArea = document.getElementById('searchResults');
    if (!resultsArea) return;

    resultsArea.innerHTML = '<div style="padding:10px; color:var(--text-secondary);">Buscando...</div>';

    const results = [];
    const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Buscar en toda la Biblia
    bibleSource.forEach((book, bookIdx) => {
        book.chapters.forEach((chapterData, chapIdx) => {
            const verses = chapterData.verses || chapterData;
            verses.forEach((verseText, verseIdx) => {
                if (!verseText) return;
                const normalizedVerse = verseText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (normalizedVerse.includes(normalizedQuery)) {
                    results.push({
                        book: BOOK_NAMES[bookIdx],
                        bookIdx,
                        chapter: chapIdx + 1,
                        verse: verseIdx + 1,
                        text: verseText
                    });
                }
            });
        });
    });

    // Mostrar resultados
    if (results.length === 0) {
        resultsArea.innerHTML = '<div style="padding:10px; color:var(--text-secondary);">No se encontraron resultados</div>';
        return;
    }

    // Limitar a 50 resultados
    const displayResults = results.slice(0, 50);
    resultsArea.innerHTML = `<div style="padding:5px; color:var(--accent); font-weight:bold;">${results.length} resultado(s) encontrado(s)${results.length > 50 ? ' (mostrando primeros 50)' : ''}</div>`;

    displayResults.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = `
            padding: 8px;
            margin: 4px 0;
            background: rgba(255,255,255,0.05);
            border-left: 3px solid var(--accent);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        `;

        resultDiv.innerHTML = `
            <div style="font-weight:bold; color:var(--accent); font-size:0.75rem; margin-bottom:4px;">
                ${result.book} ${result.chapter}:${result.verse}
            </div>
            <div style="font-size:0.7rem; color:var(--text-secondary); line-height:1.4;">
                ${result.text}
            </div>
        `;

        resultDiv.onmouseover = () => {
            resultDiv.style.background = 'rgba(255,255,255,0.1)';
        };
        resultDiv.onmouseout = () => {
            resultDiv.style.background = 'rgba(255,255,255,0.05)';
        };

        resultDiv.onclick = () => {
            // Limpiar resultados
            resultsArea.innerHTML = '';

            // Actualizar el campo de búsqueda con la cita
            gid('bibleInput').value = `${result.book} ${result.chapter}:${result.verse}`;

            // Sincronizar el navegador lateral (Libro y Capítulo)
            if (typeof window.selectBook === 'function') {
                window.selectBook(result.bookIdx);
            }
            if (typeof window.selectChapter === 'function') {
                window.selectChapter(result.bookIdx, result.chapter);
            }

            // Proyectar el versículo seleccionado
            if (typeof window.displayVerseInEditor === 'function') {
                window.displayVerseInEditor(result.bookIdx, result.chapter, result.verse);
            }

            // Resaltar el versículo en la lista (con un pequeño delay para que se cargue el DOM)
            setTimeout(() => {
                if (typeof window.highlightCurrentVerse === 'function') {
                    window.highlightCurrentVerse(result.verse);
                }
            }, 100);
        };

        resultsArea.appendChild(resultDiv);
    });
};

// Bible Input Search
const bibleInputEl = gid('bibleInput');
if (bibleInputEl) {
    bibleInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = bibleInputEl.value.trim();
            if (!query) return;

            // Si parece una cita (ej: Juan 3:16), buscarla directamente
            if (query.match(/^(.+?)\s+(\d+)[:.](\d+)/)) {
                window.searchBible();
            } else if (typeof handleKeywordSearch === 'function') {
                // Si no, intentar búsqueda por palabras clave
                handleKeywordSearch();
            }

            bibleInputEl.blur(); // Quitar foco para usar flechas del teclado
        }
    });
} else {
    console.error('Elemento bibleInput no encontrado');
}

// Clear Bible Search Input only
gid('btnClearBible').addEventListener('click', () => {
    gid('bibleInput').value = '';
    gid('bibleInput').focus();
    if (window.resetNavigator) window.resetNavigator();
});

// Shortcut 'B' to focus Bible search
document.addEventListener('keydown', (e) => {
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (e.key.toLowerCase() === 'b' && !isTyping) {
        e.preventDefault();
        const input = gid('bibleInput');
        if (input) {
            input.value = '';
            input.focus();
            if (window.resetNavigator) window.resetNavigator();
        }
    }
});

// --- STYLE & SLIDERS ---
window.updateEditorUI = function () {
    const t = gid('targetUnit').value;
    const s = styleState[t];
    if (!s) return;

    gid('inpWidth').value = s.w;
    gid('inpHeight').value = s.h;
    gid('inpFontSize').value = s.fs || 56;
    gid('inpPadX').value = s.padX || 30;
    gid('inpPadY').value = s.padY || 10;
    gid('inpX').value = s.x;
    gid('inpY').value = s.y;
    gid('inpScale').value = s.scale;
    gid('inpOp').value = s.op || 0.9;
    gid('inpRadius').value = s.radius || 0;

    gid('valWidth').innerText = s.w;
    gid('valHeight').innerText = s.h;
    gid('valFontSize').innerText = (s.fs === 0 || !s.fs) ? "Auto" : s.fs;
    gid('valPadX').innerText = s.padX || 30;
    gid('valPadY').innerText = s.padY || 10;
    gid('valX').innerText = s.x;
    gid('valY').innerText = s.y;
    gid('valScale').innerText = s.scale;
    gid('valOp').innerText = s.op;
    gid('valRadius').innerText = s.radius || 0;

    // Checkbox AutoW
    gid('chkAutoW').checked = !!s.autoW;

    // Actualizar estado visual del botón Solo Texto en Monitor (GLOBAL)
    const btnTextOnly = gid('btnTextOnly');
    const glassLine = gid('glassLine');
    if (btnTextOnly) {
        if (state.globalGlassHidden) {
            btnTextOnly.classList.add('active');
            if (glassLine) glassLine.style.display = 'block';
        } else {
            btnTextOnly.classList.remove('active');
            if (glassLine) glassLine.style.display = 'none';
        }
    }
};

// --- PERSISTENCIA DE ESTILOS (LocalStorage) ---
function saveStylesToDisk() {
    try {
        localStorage.setItem('zion_styles', JSON.stringify(styleState));
        // console.log("💾 Estilos guardados localmente");
    } catch (e) {
        console.error("Error guardando estilos:", e);
    }
}

function loadStylesFromDisk() {
    try {
        const saved = localStorage.getItem('zion_styles');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge profundo para no borrar claves nuevas en futuras versiones
            Object.keys(parsed).forEach(key => {
                if (styleState[key]) {
                    Object.assign(styleState[key], parsed[key]);
                } else {
                    styleState[key] = parsed[key];
                }
            });
            console.log("💾 Estilos recuperados de disco local");
        }
    } catch (e) {
        console.error("Error cargando estilos:", e);
    }
}

window.sendStyle = function (target) {
    const s = styleState[target];
    if (!s) return;

    // Guardar antes de enviar
    saveStylesToDisk();

    const payload = { type: 'zion:style', payload: { target, style: s } };
    socket.emit('dispatch', payload);
    bc.postMessage(payload);
};

gid('targetUnit').addEventListener('change', window.updateEditorUI);

['inpWidth', 'inpHeight', 'inpFontSize', 'inpPadX', 'inpPadY', 'inpX', 'inpY', 'inpScale', 'inpOp', 'inpRadius', 'inpC1', 'inpC2', 'inpC3'].forEach(id => {
    gid(id).addEventListener('input', (e) => {
        const t = gid('targetUnit').value;
        const v = e.target.value;
        const numVal = parseFloat(v);

        if (id === 'inpWidth') styleState[t].w = numVal;
        if (id === 'inpHeight') styleState[t].h = numVal;
        if (id === 'inpFontSize') styleState[t].fs = numVal;
        if (id === 'inpPadX') styleState[t].padX = numVal;
        if (id === 'inpPadY') styleState[t].padY = numVal;
        if (id === 'inpX') styleState[t].x = numVal;
        if (id === 'inpY') styleState[t].y = numVal;
        if (id === 'inpScale') styleState[t].scale = numVal;
        if (id === 'inpOp') styleState[t].op = numVal;
        if (id === 'inpRadius') styleState[t].radius = numVal;

        // Global Colors (Synchronized across all units)
        if (id === 'inpC1' || id === 'inpC2' || id === 'inpC3') {
            // Auto-switch to custom mode when user manually changes colors
            const currentTheme = state.theme;
            if (currentTheme !== 'custom') {
                window.setTheme('custom', true);
            }

            Object.keys(styleState).forEach(unitKey => {
                if (id === 'inpC1') styleState[unitKey].c1 = v;
                if (id === 'inpC2') styleState[unitKey].c2 = v;
                if (id === 'inpC3') styleState[unitKey].c3 = v;
            });

            // Debounce the sync to avoid saturating the server with hundreds of messages per second
            clearTimeout(window.colorSyncTimeout);
            window.colorSyncTimeout = setTimeout(() => {
                Object.keys(styleState).forEach(unitKey => {
                    window.sendStyle(unitKey);
                });
                console.log("📤 Colores sincronizados con el servidor");
            }, 150); // 150ms delay is smooth enough but safe
        }

        window.updateEditorUI();
        if (id !== 'inpC1' && id !== 'inpC2' && id !== 'inpC3') {
            window.sendStyle(t);
        }
    });
});

gid('chkAutoW').addEventListener('change', (e) => {
    const t = gid('targetUnit').value;
    styleState[t].autoW = e.target.checked;
    window.sendStyle(t);
    window.updateEditorUI();
});

// Verse Balloon Sliders
['inpVerseW', 'inpVerseH', 'inpVerseX', 'inpVerseY', 'inpVersePad', 'inpVerseOp', 'inpVerseSizeCita', 'inpVerseShadow'].forEach(id => {
    const el = gid(id);
    if (!el) return;

    el.addEventListener('input', () => {
        const v = parseFloat(el.value);

        // Update display value
        if (id === 'inpVerseW') gid('valVerseW').textContent = v;
        if (id === 'inpVerseH') gid('valVerseH').textContent = v;
        if (id === 'inpVerseX') gid('valVerseX').textContent = v;
        if (id === 'inpVerseY') gid('valVerseY').textContent = v;
        if (id === 'inpVersePad') gid('valVersePad').textContent = v;
        if (id === 'inpVerseOp') gid('valVerseOp').textContent = v.toFixed(2);
        if (id === 'inpVerseSizeCita') gid('valVerseSizeCita').textContent = v.toFixed(1);
        if (id === 'inpVerseShadow') gid('valVerseShadow').textContent = v.toFixed(2);

        // Apply to overlay via CSS variables
        const payload = {
            type: 'zion:verseStyle',
            payload: {
                verseW: gid('inpVerseW').value + 'vw',
                verseH: gid('inpVerseH').value + 'vh',
                verseX: gid('inpVerseX').value + 'vw',
                verseY: gid('inpVerseY').value + 'vh',
                versePad: gid('inpVersePad').value + 'px',
                verseOp: gid('inpVerseOp').value,
                verseSizeCita: gid('inpVerseSizeCita').value + 'rem',
                verseShadow: gid('inpVerseShadow').value
            }
        };

        socket.emit('dispatch', payload);
        bc.postMessage(payload);

        // Save to localStorage
        localStorage.setItem('zion_verseStyle', JSON.stringify(payload.payload));
    });
});

// Config Unlock
window.toggleConfigEdit = (unlock) => {
    const controls = gid('configDrawerLocal');
    const placeholder = gid('configPlaceholder');
    if (unlock) {
        controls.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        controls.style.display = 'none';
        placeholder.style.display = 'flex';
    }
};

// --- THEME INIT (Global entry point) ---
(function initTheme() {
    console.log("🎨 Initializing Zion Theme...");

    // Panel always loads a real theme (never 'custom')
    const panelTheme = localStorage.getItem('zion_theme') || 'theme-azure';
    const overlayTheme = localStorage.getItem('zion_overlay_theme') || panelTheme;

    if (typeof window.setTheme === 'function') {
        // If overlay is in custom mode, apply panel theme visually but set state to custom
        if (overlayTheme === 'custom') {
            // Apply panel's visual theme
            document.body.classList.add(panelTheme);
            // But set state and selector to custom
            state.theme = 'custom';
            const selector = document.getElementById('themeSelector');
            if (selector) selector.value = 'custom';
            // Notify overlay
            if (typeof bc !== 'undefined') bc.postMessage({ type: 'theme', theme: 'custom' });
            if (typeof socket !== 'undefined' && socket) {
                socket.emit('dispatch', { type: 'theme', theme: 'custom' });
            }
        } else {
            // Normal theme
            window.setTheme(overlayTheme);
        }
    }
})();


// --- LISTENER DEL MONITOR (ZION MONITOR EDITOR) ---
window.addEventListener('message', (e) => {
    if (!e.data || !e.data.type) return;

    // 1. RECEPCIÓN DE ACTUALIZACIONES (Drag/Resize desde el Monitor)
    if (e.data.type === 'zion:monitor-update') {
        const { target, style } = e.data.payload;
        if (!target || !style) return;

        // Actualizar estado local
        if (styleState && styleState[target]) {
            Object.assign(styleState[target], style);
        }

        // Actualizar Sliders visualmente (sin disparar eventos)
        if (typeof updateEditorUI === 'function') updateEditorUI(true);

        // Guardar cambios silenciosamente (Debounced para no saturar DB)
        if (window.monitorSaveTimeout) clearTimeout(window.monitorSaveTimeout);
        window.monitorSaveTimeout = setTimeout(() => {
            // Guardar localmente
            if (typeof saveStylesToDisk === 'function') saveStylesToDisk();

            // ENVIAR AL SERVIDOR Y A LA SALA REAL
            const payload = {
                type: 'zion:style',
                payload: { target, style }
            };
            if (typeof socket !== 'undefined' && socket) socket.emit('dispatch', payload);
            if (typeof bc !== 'undefined') bc.postMessage(payload);
        }, 300); // 300ms de calma antes de guardar
    }

    // 2. SELECCIÓN DESDE EL MONITOR
    if (e.data.type === 'zion:select') {
        const target = e.data.target;
        const select = document.getElementById('targetUnit');
        if (select) {
            select.value = target;
            // Disparar evento change para actualizar el Drawer
            select.dispatchEvent(new Event('change'));

            // Abrir Drawer si está cerrado (DESHABILITADO)
            // const drawer = document.getElementById('configDrawer');
            // if (drawer) {
            //    drawer.style.transform = 'translateY(0)';
            // }
        }
    }
});

// --- MONITOR QUICK ACTIONS LOGIC (EXPOSED TO WINDOW) ---
window.resetBalloonPositions = function () {
    if (confirm('¿Restaurar posición y tamaño de todos los globos a su configuración inicial?')) {
        // 1. Restaurar Globos (styleDefaults)
        styleState = JSON.parse(JSON.stringify(styleDefaults));

        // 2. Restaurar Versículos (verseStyleDefaults)
        localStorage.setItem('zion_verseStyle', JSON.stringify(verseStyleDefaults));
        if (window.loadVerseStylePanel) window.loadVerseStylePanel();

        // 3. Restaurar Oscuridad y Desenfoque
        localStorage.setItem('zion_bgDarkness', '0.5');
        localStorage.setItem('zion_bgBlur', '0');

        const inpDark = gid('inpBgDarkness');
        if (inpDark) inpDark.value = 0.5;
        const valDark = gid('valBgDarkness');
        if (valDark) valDark.textContent = '0.50';

        const inpBlur = gid('inpBgBlur');
        if (inpBlur) inpBlur.value = 0;
        const valBlur = gid('valBgBlur');
        if (valBlur) valBlur.textContent = '0px';

        // Enviar cambios al visor
        socket.emit('dispatch', { type: 'zion:bgDarkness', payload: 0.5 });
        socket.emit('dispatch', { type: 'zion:bgBlur', payload: 0 });
        bc.postMessage({ type: 'zion:bgDarkness', payload: 0.5 });
        bc.postMessage({ type: 'zion:bgBlur', payload: 0 });

        const versePayload = { type: 'zion:verseStyle', payload: verseStyleDefaults };
        socket.emit('dispatch', versePayload);
        bc.postMessage(versePayload);

        // Actualizar UI del editor
        window.updateEditorUI();

        // Enviar estilos de globos al visor
        Object.keys(styleState).forEach(target => {
            window.sendStyle(target);
        });

        // Guardar en localStorage
        saveStylesToDisk();

        console.log('✅ Posiciones y estilos restaurados a configuración inicial');
    }
};

window.toggleGlassOnly = function () {
    // Toggle global
    state.globalGlassHidden = !state.globalGlassHidden;

    // Actualizar UI del panel
    window.updateEditorUI();

    // Enviar al visor (via payload normal de state)
    window.send();
};

window.switchToBible = function () {
    state.isVerse = true;
    if (window.updateToggleUI) window.updateToggleUI();
    // Animación de pulso visual para feedback
    const btn = document.querySelector('button[onclick="switchToBible()"]');
    if (btn) {
        btn.style.boxShadow = '0 0 20px var(--accent)';
        setTimeout(() => btn.style.boxShadow = '', 500);
    }
    window.send();
};

window.switchToCast = function () {
    state.isVerse = false;
    if (window.updateToggleUI) window.updateToggleUI();
    // Animación de pulso visual para feedback
    const btn = document.querySelector('button[onclick="switchToCast()"]');
    if (btn) {
        btn.style.boxShadow = '0 0 20px var(--accent)';
        setTimeout(() => btn.style.boxShadow = '', 500);
    }
    window.send();
};

// --- BACKGROUND DARKNESS SLIDER ---
const bgDarknessSlider = gid('inpBgDarkness');
const bgDarknessValue = gid('valBgDarkness');

if (bgDarknessSlider) {
    // Load saved value
    const savedDarkness = localStorage.getItem('zion_bgDarkness') || '0.5';
    bgDarknessSlider.value = savedDarkness;
    bgDarknessValue.textContent = parseFloat(savedDarkness).toFixed(2);

    // Apply initial value
    socket.emit('dispatch', { type: 'zion:bgDarkness', payload: parseFloat(savedDarkness) });
    bc.postMessage({ type: 'zion:bgDarkness', payload: parseFloat(savedDarkness) });

    bgDarknessSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        bgDarknessValue.textContent = value.toFixed(2);

        // Send to overlay
        socket.emit('dispatch', { type: 'zion:bgDarkness', payload: value });
        bc.postMessage({ type: 'zion:bgDarkness', payload: value });

        // Save to localStorage
        localStorage.setItem('zion_bgDarkness', value);
    });
}

// Toggle background darkness slider visibility
window.toggleBgDarknessSlider = function () {
    const container = gid('bgDarknessSliderContainer');
    const btn = gid('btnBgDarkness');

    if (!container) return;

    const isOpen = container.style.maxHeight !== '0px' && container.style.maxHeight !== '';

    if (isOpen) {
        // Close
        container.style.maxHeight = '0';
        container.style.opacity = '0';
        if (btn) btn.classList.remove('active');
    } else {
        // Open
        container.style.maxHeight = '80px';
        container.style.opacity = '1';
        if (btn) btn.classList.add('active');
    }
};

// --- BACKGROUND BLUR SLIDER ---
const bgBlurSlider = gid('inpBgBlur');
const bgBlurValue = gid('valBgBlur');

if (bgBlurSlider) {
    // Load saved value
    const savedBlur = localStorage.getItem('zion_bgBlur') || '0';
    bgBlurSlider.value = savedBlur;
    bgBlurValue.textContent = savedBlur + 'px';

    // Apply initial value
    socket.emit('dispatch', { type: 'zion:bgBlur', payload: parseInt(savedBlur) });
    bc.postMessage({ type: 'zion:bgBlur', payload: parseInt(savedBlur) });

    bgBlurSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        bgBlurValue.textContent = value + 'px';

        // Send to overlay
        socket.emit('dispatch', { type: 'zion:bgBlur', payload: value });
        bc.postMessage({ type: 'zion:bgBlur', payload: value });

        // Save to localStorage
        localStorage.setItem('zion_bgBlur', value);
    });
}

// Toggle background blur slider visibility
window.toggleBgBlurSlider = function () {
    const container = gid('bgBlurSliderContainer');
    const btn = gid('btnBgBlur');

    if (!container) return;

    const isOpen = container.style.maxHeight !== '0px' && container.style.maxHeight !== '';

    if (isOpen) {
        // Close
        container.style.maxHeight = '0';
        container.style.opacity = '0';
        if (btn) btn.classList.remove('active');
    } else {
        // Open
        container.style.maxHeight = '80px';
        container.style.opacity = '1';
        if (btn) btn.classList.add('active');
    }
};
