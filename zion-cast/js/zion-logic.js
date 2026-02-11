/**
 * ZION CAST - Overlay Logic v1.0
 * Arquitectura Limpia y Estabilidad.
 */

console.log("💎 Zion Cast Overlay Iniciado (Network Mode)");

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
        console.log('✅ Overlay conectado');
        // REFUERZO: En modo LOCAL (sin salas), todos son GLOBAL
        socket.emit('join_room', { roomCode: 'GLOBAL' });
    });

    socket.on('disconnect', (reason) => {
        console.warn('⚠️ Overlay desconectado:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Overlay reconectado tras ${attemptNumber} intentos`);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Overlay intento de reconexión #${attemptNumber}...`);
    });

    socket.on('reconnect_error', (error) => {
        console.error('❌ Overlay error de reconexión:', error.message);
    });

    socket.on('reconnect_failed', () => {
        console.error('❌ Overlay reconexión fallida después de todos los intentos');
    });
} else {
    console.warn("⚠️ Socket.io not found. Using local-only mode.");
    socket = { on: () => { } }; // Mock to prevent crashes
}
const bc = new BroadcastChannel('zion_channel');

// Estado Local
const state = {
    show: { center: false, title: true, bl: true, br: true, cb: false },
    text: { center: '', title: '', bl: '', br: '', cb: '' }
};

// Mapa de Elementos
const el = {
    center: document.getElementById('unit-center'),
    title: document.getElementById('unit-title'),
    bl: document.getElementById('unit-bl'),
    br: document.getElementById('unit-br'),
    cb: document.getElementById('unit-cb'),

    txtCenter: document.getElementById('content-center'),
    txtTitle: document.getElementById('content-title'),
    txtBl: document.getElementById('content-bl'),
    txtBr: document.getElementById('content-br'),
    txtCb: document.getElementById('content-cb')
};

// --- MONITOR MODE DETECTION ---
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('monitor') === 'true') {
    document.body.classList.add('is-monitor-mode');
    console.log("🖥️ Monitor Mode Active");
}

// --- RECEPTION ---
let isInitialized = false;

function handleAppPacket(data) {
    if (!data) return;

    // --- REVEAL UI IMMEDIATELY ON FIRST PACKET ---
    if (!isInitialized) {
        const app = document.getElementById('app-container');
        if (app) app.classList.add('ready');
        isInitialized = true;
    }

    const { type, payload } = data;
    if (type === 'zion:update') handleUpdate(payload);
    if (type === 'zion:style') handleStyle(payload);
    if (type === 'zion:verseStyle') handleVerseStyle(payload);
    if (type === 'theme') handleTheme(data.theme);
    if (type === 'zion:background') handleBackground(payload);
    if (type === 'zion:bgDarkness') handleBgDarkness(payload);
    if (type === 'zion:bgBlur') handleBgBlur(payload);

    if (type === 'app_jump' && payload && payload.url) {
        console.log('🚀 Redirigiendo a Zion Presenter (CANTOS)...');
        document.body.style.transition = 'opacity 1s ease';
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = payload.url;
        }, 1000);
    }
}

function handleTheme(themeName) {
    if (!themeName) return;
    const themes = ['theme-cosmic', 'theme-emerald', 'theme-sunset', 'theme-gold', 'theme-midnight', 'theme-azure', 'theme-flame', 'theme-electric', 'theme-neon', 'theme-lime'];
    themes.forEach(t => document.body.classList.remove(t));
    document.body.classList.add(themeName);
    console.log("👗 Overlay Theme Updated:", themeName);
}

socket.on('dispatch', handleAppPacket);
bc.onmessage = (e) => handleAppPacket(e.data);

// EMERGENCY LISTENER FOR LOCAL RETURN
bc.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'app_jump') {
        const target = event.data.targetUrl || (event.data.payload && event.data.payload.url);
        if (target) {
            console.warn('🚨 EMERGENCY RETURN JUMP TRIGGERED', target);
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = target;
            }, 500);
        }
    }
});

// Handle verse balloon style updates
function handleVerseStyle(payload) {
    if (!payload) return;

    const root = document.documentElement;
    if (payload.verseW) root.style.setProperty('--verse-w', payload.verseW);
    if (payload.verseH) root.style.setProperty('--verse-h', payload.verseH);
    if (payload.verseX) root.style.setProperty('--verse-x', payload.verseX);
    if (payload.verseY) root.style.setProperty('--verse-y', payload.verseY);
    if (payload.versePad) root.style.setProperty('--verse-padding', payload.versePad);
    if (payload.verseOp) root.style.setProperty('--verse-opacity', payload.verseOp);
    if (payload.verseSizeCita) root.style.setProperty('--verse-citation-size', payload.verseSizeCita);
    if (payload.verseShadow !== undefined) root.style.setProperty('--global-shadow', payload.verseShadow);

    // Re-fit text after style changes (with enough delay for transition/render)
    if (document.body.classList.contains('mode-verse')) {
        requestAnimationFrame(() => {
            setTimeout(() => fitVerseText(), 300);
        });
    }
}

// Handle background darkness overlay
function handleBgDarkness(opacity) {
    if (opacity === undefined || opacity === null) return;
    document.documentElement.style.setProperty('--bg-darkness', opacity);
    localStorage.setItem('zion_bgDarkness', opacity);
}

// Handle background blur
function handleBgBlur(blurPx) {
    if (blurPx === undefined || blurPx === null) return;
    const bgLayers = document.querySelectorAll('.bg-layer');
    bgLayers.forEach(layer => {
        layer.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
    });
    localStorage.setItem('zion_bgBlur', blurPx);
}

// Load saved verse styles on init
const savedVerseStyle = localStorage.getItem('zion_verseStyle');
if (savedVerseStyle) {
    try {
        handleVerseStyle(JSON.parse(savedVerseStyle));
    } catch (e) {
        console.warn('Failed to load verse style:', e);
    }
}

// Load saved background darkness
const savedBgDarkness = localStorage.getItem('zion_bgDarkness');
if (savedBgDarkness) {
    handleBgDarkness(parseFloat(savedBgDarkness));
}

// Load saved background blur
const savedBgBlur = localStorage.getItem('zion_bgBlur');
if (savedBgBlur) {
    handleBgBlur(parseInt(savedBgBlur));
}

// --- AUTO-HIDRATACIÓN DE ESTILOS DE GLOBOS (Persistencia Local) ---
const savedGlobalStyles = localStorage.getItem('zion_styles');
if (savedGlobalStyles) {
    try {
        console.log("💾 Overlay: Cargando estilos visuales guardados...");
        const s = JSON.parse(savedGlobalStyles);
        Object.keys(s).forEach(target => {
            handleStyle({ target, style: s[target] });
        });
    } catch (e) {
        console.warn('Failed to load global styles:', e);
    }
}

// BG Logic removed

// --- STYLE HANDLER ---
function handleStyle(data) {
    const { target, style } = data;
    const r = document.documentElement;

    // Map internal names to CSS Variables prefix
    // center -> --c-, title -> --t-, bl -> --bl-, br -> --br-, cb -> --cb-
    const prefixMap = {
        center: '--c-',
        title: '--t-',
        bl: '--bl-',
        br: '--br-',
        cb: '--cb-'
    };

    const p = prefixMap[target];
    if (!p) return;

    // Apply CSS Variables
    if (style.w !== undefined) {
        // En modo Auto, usamos 'fit-content' para que abrace el texto
        const finalW = style.autoW ? 'fit-content' : style.w + 'px';
        r.style.setProperty(p + 'w', finalW);

        // TRUCO MAESTRO: Liberar el 'candado' max-width en modo auto
        // Si es auto, el max-width real es 90vw (90% del visor).
        const maxW = style.autoW ? '90vw' : style.w + 'px';
        r.style.setProperty(p + 'max-w', maxW);
    }
    if (style.x !== undefined) r.style.setProperty(p + 'x', style.x + 'px');
    if (style.y !== undefined) r.style.setProperty(p + 'y', style.y + 'px');
    if (style.h !== undefined) r.style.setProperty(p + 'h', style.h + 'px');

    // Padding X/Y
    if (style.padX !== undefined) r.style.setProperty(p + 'pad-x', style.padX + 'px');
    if (style.padY !== undefined) r.style.setProperty(p + 'pad-y', style.padY + 'px');

    // Radius (Redondez) DIRECTA (Fail-safe)
    if (style.radius !== undefined) {
        r.style.setProperty(p + 'radius', style.radius + 'px');
        // Fuerza bruta: Aplicar directo al panel para evitar problemas de variables
        const u = document.getElementById('unit-' + target);
        if (u) {
            const gp = u.querySelector('.glass-panel');
            if (gp) gp.style.borderRadius = style.radius + 'px';
        }
    }

    // Scale (Zoom)
    if (style.scale !== undefined) {
        r.style.setProperty(p + 'scale', style.scale);
    }

    if (style.op !== undefined) r.style.setProperty(p + 'op', style.op);

    // BADGE CONFIG (Solo aplica a CENTER)
    if (target === 'center') {
        if (style.badgeX !== undefined) r.style.setProperty('--badge-x', style.badgeX + 'px');
        if (style.badgeY !== undefined) r.style.setProperty('--badge-y', style.badgeY + 'px');
        if (style.badgeScale !== undefined) r.style.setProperty('--badge-scale', style.badgeScale);
        if (style.badgeRadius !== undefined) r.style.setProperty('--badge-radius', style.badgeRadius + 'px');
        if (style.badgeOp !== undefined) r.style.setProperty('--badge-opacity', style.badgeOp); // Usamos variable dedicada
    }

    // Custom Font Size Storage
    if (style.fs !== undefined) {
        if (!state.customFS) state.customFS = {};
        state.customFS[target] = style.fs;
    }

    // AUTO-RESIZE TRIGGER (Universal)
    // Siempre ejecutar resize cuando cambian dimensiones o padding
    if (style.w !== undefined || style.h !== undefined || style.padX !== undefined || style.padY !== undefined || style.fs !== undefined) {
        setTimeout(() => resizeText(target), 50); // 50ms para asegurar que DOM se actualiza
    }

    // --- COLOR ENGINE (NUEVO - TOTALMENTE GLOBAL) ---
    const rootEl = document.documentElement;
    if (style.c1) rootEl.style.setProperty('--accent-cyan', style.c1);
    if (style.c2) rootEl.style.setProperty('--accent-blue-mid', style.c2);
    if (style.c3) rootEl.style.setProperty('--accent-blue-deep', style.c3);

    // Limpiar estilos específicos para que manden los globales
    const unitEl = document.getElementById('unit-' + target);
    if (unitEl) {
        const panel = unitEl.querySelector('.glass-panel');
        if (panel) {
            panel.style.removeProperty('--accent-cyan');
            panel.style.removeProperty('--accent-blue-mid');
            panel.style.removeProperty('--accent-blue-deep');
        }
    }

    // --- GLASS VISIBILITY (Minimal Mode/Solo Texto) ---
    if (style.glassHidden !== undefined) {
        const unit = document.getElementById('unit-' + target);
        if (unit) {
            const panel = unit.querySelector('.glass-panel');
            if (panel) {
                if (style.glassHidden) {
                    panel.style.background = 'transparent';
                    panel.style.border = 'none';
                    panel.style.boxShadow = 'none';
                    panel.style.backdropFilter = 'none';
                    panel.style.webkitBackdropFilter = 'none';
                    const glow = panel.querySelector('.border-glow');
                    if (glow) glow.style.display = 'none';
                } else {
                    panel.style.background = ''; // Revierte a CSS default
                    panel.style.border = '';
                    panel.style.boxShadow = '';
                    panel.style.backdropFilter = '';
                    panel.style.webkitBackdropFilter = '';
                    const glow = panel.querySelector('.border-glow');
                    if (glow) glow.style.display = '';
                }
            }
        }
    }
}


// --- CORE: Manejar Actualización ---
function handleUpdate(payload) {
    if (!payload) return;

    // 1. Actualizar Textos
    if (payload.text) {
        Object.keys(payload.text).forEach(key => {
            const elTxt = el[`txt${capitalize(key)}`];
            const elUnit = el[key];

            if (elTxt) {
                // SKIP if field is not in payload (undefined means "don't touch it")
                if (payload.text[key] === undefined) {
                    console.log(`OVERLAY: Skipping ${key} (not in payload)`);
                    return;
                }

                console.log(`OVERLAY: Updating ${key}:`, payload.text[key]);

                let rawT = payload.text[key] || '';
                // PROCESAR RESALTADO: *texto* -> <span class="highlight">texto</span>
                let styledT = rawT.replace(/\*(.*?)\*/g, '<span class="highlight">$1</span>');

                // Si es el CENTRO y ya está visible
                if (key === 'center' && elUnit && elUnit.classList.contains('is-shown') && elTxt.innerHTML !== styledT) {

                    // SMART CHECK ROBUSTO:
                    // Limpiamos TODO lo que no sea letra o número. Si el esqueleto es igual, NO animamos.
                    // Esto ignora espacios, saltos de línea, <br>, y tags HTML.

                    const clean = (str) => str.replace(/<[^>]*>/g, '').replace(/[^a-zA-Z0-9]/g, '');

                    const curSkel = clean(elTxt.innerHTML);
                    const newSkel = clean(rawT.replace(/\*/g, '')); // Quitamos asteriscos del input raw

                    if (curSkel === newSkel) {
                        // 1. SOLO FORMATO (Highlight) -> CAMBIO INSTANTÁNEO
                        elTxt.innerHTML = styledT;
                        // CRÍTICO: Recalcular tamaño incluso si solo cambió formato/espacios
                        if (key === 'center') {
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    setTimeout(() => resizeText(key), 50);
                                });
                            });
                        }
                    } else {
                        // 2. CAMBIO DE TEXTO -> ANIMACIÓN DE CINE (Blur)

                        // 1. Exit Animation
                        elTxt.classList.remove('text-enter');
                        elTxt.classList.add('text-exit');

                        // 2. Wait & Swap
                        setTimeout(() => {
                            // OCULTAR antes de cambiar (solo center)
                            if (key === 'center') elTxt.style.visibility = 'hidden';
                            elTxt.innerHTML = styledT;
                            // DOBLE RAF + setTimeout para asegurar render
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    setTimeout(() => resizeText(key), 50);
                                });
                            });

                            // 3. Enter Animation
                            elTxt.classList.remove('text-exit');
                            elTxt.classList.add('text-enter');
                        }, 200); // 200ms match CSS kfBlurOut
                    }
                } else {
                    // Actualización Directa (Inicial o Invisible)
                    if (elTxt.innerHTML !== styledT) {
                        // OCULTAR antes de cambiar para evitar parpadeo (solo center)
                        if (key === 'center') elTxt.style.visibility = 'hidden';
                        elTxt.innerHTML = styledT;
                        // DOBLE RAF + setTimeout para asegurar render completo
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                setTimeout(() => resizeText(key), 50);
                            });
                        });
                        // Asegurar que entre animado si acaba de aparecer
                        if (key === 'center') elTxt.classList.add('text-enter');
                    }
                }
            }
        });
    }

    // --- VERSE MODE LOGIC (Full Screen Reading) ---
    if (payload.isVerse !== undefined) {
        const isMode = payload.isVerse;
        console.log('VERSE MODE:', isMode, 'verseData:', payload.verseData);

        if (isMode) {
            console.log("VERSE MODE ACTIVE");
        } else {
            console.log("CAST MODE ACTIVE");
        }

        if (isMode) {
            // ENTER OR UPDATE VERSE MODE
            document.body.classList.add('mode-verse');

            if (payload.verseData) {
                const verseTextEl = document.getElementById('verse-text');
                const verseCiteEl = document.getElementById('verse-citation');

                if (verseTextEl && payload.verseData.text) {
                    const cleanNew = payload.verseData.text.trim();
                    const cleanOld = verseTextEl.innerHTML.trim();

                    if (cleanNew !== cleanOld) {
                        const hasExistingContent = cleanOld !== '';
                        if (hasExistingContent) {
                            verseTextEl.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in';
                            verseTextEl.style.transform = 'scale(0.8)';
                            verseTextEl.style.opacity = '0';
                            setTimeout(() => {
                                verseTextEl.innerHTML = payload.verseData.text;
                                verseTextEl.style.opacity = '0';
                                verseTextEl.style.transform = 'scale(1.2)';
                                fitVerseText();
                                setTimeout(() => fitVerseText(), 400);
                                setTimeout(() => {
                                    verseTextEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out';
                                    verseTextEl.style.transform = 'scale(1)';
                                    verseTextEl.style.opacity = '1';
                                }, 50);
                            }, 300);
                        } else {
                            verseTextEl.innerHTML = payload.verseData.text;
                            verseTextEl.style.opacity = '0';
                            verseTextEl.style.transform = 'scale(1)';
                            fitVerseText();
                            setTimeout(() => fitVerseText(), 400);
                            setTimeout(() => {
                                verseTextEl.style.transition = 'opacity 0.4s ease-out';
                                verseTextEl.style.opacity = '1';
                            }, 50);
                        }
                    }

                    if (verseCiteEl && payload.verseData.citation) {
                        verseCiteEl.innerText = payload.verseData.citation;
                    }
                }
            }
        } else {
            // EXIT VERSE MODE
            document.body.classList.remove('mode-verse');

            // Clear verse layer content AFTER animation completes
            setTimeout(() => {
                const verseTextEl = document.getElementById('verse-text');
                const verseCiteEl = document.getElementById('verse-citation');
                if (verseTextEl) verseTextEl.innerHTML = '';
                if (verseCiteEl) verseCiteEl.innerText = '';
            }, 900);
        }
    }

    // 2. Actualizar Visibilidad (Show/Hide)
    if (payload.show) {
        Object.keys(payload.show).forEach(key => {
            let shouldShow = payload.show[key];
            const unit = el[key];
            const textContent = payload.text ? payload.text[key] : null;

            if (!unit) return;

            // AUTO-HIDE: Si el texto está vacío, forzar ocultar (salvo que sea el Centro y queramos el globo vacío)
            if (key !== 'center' && (!textContent || textContent.trim() === '')) {
                shouldShow = false;
            }

            const isCurrentlyShown = unit.classList.contains('is-shown');

            if (shouldShow) {
                if (isCurrentlyShown) {
                    const triggers = Array.isArray(payload.triggerAnim) ? payload.triggerAnim : [payload.triggerAnim];
                    if (triggers.includes(key)) {
                        // SOLO animamos el CENTRO al actualizar
                        // El resto (Título, Predicador, Cita) se quedan quietos si ya están visibles
                        // if (key === 'center') playAnim(unit, 'fx-in'); // REMOVED: Evita parpadeo al cambiar texto (seamless)
                    }
                } else {
                    unit.classList.remove('is-hidden');
                    unit.classList.add('is-shown');
                    playAnim(unit, 'fx-in');
                }
            } else {
                if (isCurrentlyShown) {
                    unit.classList.remove('is-shown');
                    unit.classList.add('is-hidden');
                    playAnim(unit, 'fx-out');
                }
            }
        });
    }

    // 3. SOLO TEXTO GLOBAL
    if (payload.globalGlassHidden !== undefined) {
        document.body.classList.toggle('global-text-only', !!payload.globalGlassHidden);

        // Recalcular ajustes de texto si estamos en modo biblia
        if (state.isVerse) {
            setTimeout(fitVerseText, 50);
        }
    }
}

// --- TEXT FIT ENGINE (SOLUCIÓN DEFINITIVA CON ELEMENTO TEMPORAL) ---
function resizeText(key) {
    // SOLO el Mensaje Central debe auto-ajustar su tamaño
    if (key !== 'center') {
        console.log('🔧 resizeText: Ignorado para', key, '(solo funciona en center)');
        return;
    }

    console.log('🔧 resizeText llamado para:', key);
    const unit = el[key];
    if (!unit) {
        console.warn('⚠️ Unit no encontrada:', key);
        return;
    }

    const panel = unit.querySelector('.glass-panel');
    const textEl = el[`txt${capitalize(key)}`];

    if (!textEl || !panel) {
        console.warn('⚠️ textEl o panel no encontrado');
        return;
    }

    // 1. Tamaños base (Aumentados para que "Poco texto = Grande")
    const baseSizes = { center: 150, title: 80, bl: 45, br: 45, cb: 45 };
    const maxFontSize = (state.customFS && state.customFS[key]) ? state.customFS[key] : (baseSizes[key] || 150);

    // 2. Espacio disponible (con padding)
    const cs = window.getComputedStyle(panel);
    const padTop = parseFloat(cs.paddingTop) || 0;
    const padBottom = parseFloat(cs.paddingBottom) || 0;
    const padLeft = parseFloat(cs.paddingLeft) || 0;
    const padRight = parseFloat(cs.paddingRight) || 0;

    // DETERMINAR SI ESTÁ EN MODO AUTO midiendo la variable CSS directamente
    const rawW = window.getComputedStyle(document.documentElement).getPropertyValue(`--${key === 'center' ? 'c' : key}-w`).trim();
    const isAutoW = rawW === 'fit-content' || rawW === '';

    let availableWidth;
    if (isAutoW) {
        // En modo auto, el límite es el 90% de la pantalla
        availableWidth = (window.innerWidth * 0.9) - padLeft - padRight;
    } else {
        // En modo fijo, usamos el ancho del panel
        availableWidth = panel.clientWidth - padLeft - padRight;
    }

    const availableHeight = panel.clientHeight - padTop - padBottom;

    console.log('📐 Espacio disponible para resize:', { availableWidth, availableHeight, isAutoW });

    if (availableHeight <= 10 || availableWidth <= 10) {
        console.warn('⚠️ Espacio muy pequeño');
        return;
    }

    // 3. Crear elemento temporal para medir (SIN flexbox interferencia)
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.width = availableWidth + 'px';
    measurer.style.maxWidth = availableWidth + 'px';
    measurer.style.maxHeight = availableHeight + 'px';
    measurer.style.fontFamily = window.getComputedStyle(textEl).fontFamily;
    measurer.style.fontWeight = window.getComputedStyle(textEl).fontWeight;
    measurer.style.letterSpacing = window.getComputedStyle(textEl).letterSpacing;
    measurer.style.textTransform = window.getComputedStyle(textEl).textTransform; // CRÍTICO: uppercase/lowercase afecta el tamaño
    measurer.style.textAlign = 'center';
    measurer.style.wordWrap = 'break-word';
    measurer.style.whiteSpace = 'normal'; // Permitir wrap
    measurer.style.overflowWrap = 'break-word'; // Asegurar wrap correcto
    measurer.style.display = 'block';
    measurer.style.boxSizing = 'border-box';
    measurer.style.overflow = 'hidden'; // Cambio: hidden para medir mejor
    measurer.style.padding = '0'; // Sin padding para medición exacta
    measurer.innerHTML = textEl.innerHTML;
    document.body.appendChild(measurer);

    // 4. NUEVA LÓGICA MEJORADA: Empezar con tamaño base, solo reducir si no cabe
    let currentSize = maxFontSize;
    measurer.style.fontSize = currentSize + 'px';
    measurer.style.lineHeight = '1.1';

    // Forzar reflow para asegurar medición correcta
    void measurer.offsetHeight;

    // Margen de tolerancia más generoso para word-wrap
    const widthTolerance = 5;
    const heightTolerance = 5;

    // Si cabe con el tamaño base, úsalo
    if (measurer.scrollWidth <= (availableWidth + widthTolerance) &&
        measurer.scrollHeight <= (availableHeight + heightTolerance)) {
        console.log('✅ Cabe con tamaño base:', currentSize + 'px');
        document.body.removeChild(measurer);
        textEl.style.fontSize = currentSize + 'px';
        textEl.style.lineHeight = '1.1';
        // MOSTRAR si es center (estaba oculto desde handleUpdate)
        if (key === 'center') textEl.style.visibility = 'visible';
        return;
    }

    // Si NO cabe, buscar el tamaño más pequeño que funcione con búsqueda binaria mejorada
    let min = 10;
    let max = maxFontSize;
    let optimal = min;

    while (min <= max) {
        const mid = Math.floor((min + max) / 2);
        measurer.style.fontSize = mid + 'px';
        measurer.style.lineHeight = '1.1';

        // Forzar reflow en cada iteración
        void measurer.offsetHeight;

        const fits = (measurer.scrollWidth <= (availableWidth + widthTolerance) &&
            measurer.scrollHeight <= (availableHeight + heightTolerance));

        if (fits) {
            optimal = mid;
            min = mid + 1;
        } else {
            max = mid - 1;
        }
    }

    // 5. Limpiar elemento temporal
    document.body.removeChild(measurer);

    // 6. Aplicar tamaño final con margen de seguridad MAYOR (especialmente para word-wrap)
    const safetyMargin = 6; // Aumentado de 4 a 6 para mayor seguridad
    const finalSize = Math.max(optimal - safetyMargin, 10);
    textEl.style.fontSize = finalSize + 'px';
    textEl.style.lineHeight = '1.1';

    console.log('⚠️ Texto reducido a:', finalSize + 'px', 'porque no cabía en', maxFontSize + 'px');

    // 7. VERIFICACIÓN FINAL: Crear otro measurer para confirmar que el tamaño final funciona
    const verifier = document.createElement('div');
    verifier.style.position = 'absolute';
    verifier.style.visibility = 'hidden';
    verifier.style.width = availableWidth + 'px';
    verifier.style.maxWidth = availableWidth + 'px';
    verifier.style.fontFamily = window.getComputedStyle(textEl).fontFamily;
    verifier.style.fontWeight = window.getComputedStyle(textEl).fontWeight;
    verifier.style.letterSpacing = window.getComputedStyle(textEl).letterSpacing;
    verifier.style.textTransform = window.getComputedStyle(textEl).textTransform; // Consistencia con measurer
    verifier.style.textAlign = 'center';
    verifier.style.wordWrap = 'break-word';
    verifier.style.whiteSpace = 'normal';
    verifier.style.overflowWrap = 'break-word';
    verifier.style.fontSize = finalSize + 'px';
    verifier.style.lineHeight = '1.1';
    verifier.innerHTML = textEl.innerHTML;
    document.body.appendChild(verifier);

    void verifier.offsetHeight;

    // Si aún se desborda, reducir más
    if (verifier.scrollHeight > (availableHeight + heightTolerance)) {
        const emergencySize = Math.max(finalSize - 4, 10);
        textEl.style.fontSize = emergencySize + 'px';
        console.log('🚨 Ajuste de emergencia a:', emergencySize + 'px');
    }

    document.body.removeChild(verifier);

    // MOSTRAR si es center (estaba oculto desde handleUpdate)
    if (key === 'center') textEl.style.visibility = 'visible';
}

// --- ANIMATION ENGINE ---
function playAnim(element, animName) {
    // Resetear animación clonando o quitando clase
    element.classList.remove('fx-in', 'fx-out', 'fx-pulse', 'fx-pulse-heavy');
    void element.offsetWidth; // Trigger Reflow (Magic)
    element.classList.add(animName);
}

// Sync Logic removed

// --- UTILS ---
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function applyStyles(styles) {
    // Ejemplo: styles.cHeight -> --c-height
    const root = document.documentElement;
    if (styles.cWidth) root.style.setProperty('--c-width', styles.cWidth);
    if (styles.cHeight) root.style.setProperty('--c-height', styles.cHeight);
    if (styles.offY) {
        // Ajustar margen top del centro para moverlo
        // Esto requiere lógica más compleja si usamos transform, 
        // pero por ahora modificaremos el marginTop
        // Pendiente para v1.1
    }
}
// --- INIT STRUCTURE ---
function initBorderGlow() {
    document.querySelectorAll('.glass-panel').forEach(panel => {
        if (!panel.querySelector('.border-glow')) {
            const glow = document.createElement('div');
            glow.className = 'border-glow';
            panel.appendChild(glow);
        }
    });
}
initBorderGlow();

// --- AUTO-FIT VERSE TEXT ---
function fitVerseText() {
    const verseTextEl = document.getElementById('verse-text');
    if (!verseTextEl || !verseTextEl.innerHTML) return;

    const panel = document.querySelector('.verse-glass-panel');
    if (!panel) return;

    // Get real computed padding
    const computedStyle = window.getComputedStyle(verseTextEl);
    const padX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    const padY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

    // Available space inside the panel
    const availableWidth = (panel.clientWidth || window.innerWidth * 0.9) - padX;
    const availableHeight = (panel.clientHeight || window.innerHeight * 0.8) - padY - 60; // Extra room for citation

    if (availableWidth <= 0 || availableHeight <= 0) return;

    let minSize = 20;
    let maxSize = 500;
    let optimalSize = minSize;

    // Measurement tool
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.width = availableWidth + 'px';
    temp.style.fontFamily = 'Bebas Neue, sans-serif';
    temp.style.lineHeight = '1.15';
    temp.style.textTransform = 'uppercase';
    temp.style.wordWrap = 'break-word';
    temp.style.whiteSpace = 'normal';
    temp.style.textAlign = 'center';
    temp.innerHTML = verseTextEl.innerHTML;
    document.body.appendChild(temp);

    // Binary search for size
    while (minSize <= maxSize) {
        const midSize = Math.floor((minSize + maxSize) / 2);
        temp.style.fontSize = midSize + 'px';

        if (temp.scrollHeight <= availableHeight) {
            optimalSize = midSize;
            minSize = midSize + 1;
        } else {
            maxSize = midSize - 1;
        }
    }

    document.body.removeChild(temp);
    verseTextEl.style.fontSize = optimalSize + 'px';
}

// Re-fit text when window resizes or verse style changes
window.addEventListener('resize', () => {
    if (document.body.classList.contains('mode-verse')) {
        fitVerseText();
    }
});

// Handle Background from Unsplash
// --- SISTEMA DE DOBLE CAPA PARA FONDOS (Smooth Cross-fade) ---
let currentBgLayer = 'a';

function handleBackground(payload) {
    if (!payload) return;

    const { url, photographer, link } = payload;
    const layerA = document.getElementById('bg-layer-a');
    const layerB = document.getElementById('bg-layer-b');

    if (!layerA || !layerB) return;

    // Si url es null, quitar el fondo con suavidad
    if (!url) {
        layerA.style.opacity = '0';
        layerB.style.opacity = '0';
        localStorage.removeItem('zion_background');
        const existingCredit = document.getElementById('photo-credit');
        if (existingCredit) existingCredit.innerHTML = '';
        console.log('🖼️ Background removed (faded out)');
        return;
    }

    // Determinar qué capa será la nueva
    const nextLayerId = currentBgLayer === 'a' ? 'b' : 'a';
    const nextLayer = document.getElementById(`bg-layer-${nextLayerId}`);
    const currentLayer = document.getElementById(`bg-layer-${currentBgLayer}`);

    // Precargar la imagen antes de aplicar (Solo si NO es la carga inicial)
    const isFirstBg = !layerA.style.backgroundImage && !layerB.style.backgroundImage;

    const applyBg = () => {
        // 1. Poner la imagen en la capa oculta
        nextLayer.style.backgroundImage = `url('${url}')`;

        // 2. Hacer el cross-fade (Fundido cruzado)
        nextLayer.style.opacity = '1';
        currentLayer.style.opacity = '0';

        // 3. Actualizar estado
        currentBgLayer = nextLayerId;

        // Guardar para persistencia
        localStorage.setItem('zion_background', JSON.stringify(payload));
        console.log(`🖼️ Background applied: Photo by ${photographer} (${isFirstBg ? 'Instant' : 'Fade'})`);
    };

    if (isFirstBg) {
        applyBg();
    } else {
        const img = new Image();
        img.onload = applyBg;
        img.src = url;
    }
}

// Show Photo Credit (opcional, se puede comentar si no se desea)
function showPhotoCredit(photographer, link) {
    const credit = document.getElementById('photo-credit');
    if (!credit) return;

    // Actualizar contenido
    if (link) {
        credit.innerHTML = `Foto por <a href="${link}" target="_blank" style="color: #fff; text-decoration: underline;">${photographer}</a> en Unsplash`;
    } else {
        credit.innerHTML = `Fondo: ${photographer}`;
    }

    // Estilo base (por si acaso no está en CSS)
    credit.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 15px;
        border-radius: 8px;
        font-size: 0.75rem;
        z-index: 1000;
        transition: opacity 1s;
        opacity: 0.8;
    `;

    // Auto-ocultar después de 10 segundos
    if (window.creditTimer) clearTimeout(window.creditTimer);
    window.creditTimer = setTimeout(() => {
        credit.style.opacity = '0';
    }, 10000);
}

// Cargar fondo guardado al iniciar
(function loadSavedBackground() {
    const saved = localStorage.getItem('zion_background');
    if (saved) {
        try {
            const payload = JSON.parse(saved);
            handleBackground(payload);
        } catch (e) {
            console.error('Error loading saved background:', e);
        }
    }
})();
