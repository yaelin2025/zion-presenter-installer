window.currentMode = "songs"; // Build: 20260203-0112v2

function init() {
    const splash = () => {
        const e = document.getElementById("splashScreen");
        if (e) {
            e.style.opacity = "0";
            e.style.pointerEvents = "none";
            // Aplicar señal de carga global al body
            document.body.classList.add("app-loaded");
            setTimeout(() => {
                e.style.display = "none";
            }, 800);
        }
    };

    try {
        const songsData = localStorage.getItem("bosquejos_songs");
        let localSongs = songsData ? JSON.parse(songsData) : [];

        // CARGA DE CORTESÍA: Solo 2 cantos de muestra si la biblioteca está vacía
        if (localSongs.length === 0) {
            localSongs = [
                {
                    id: "courtesy-1",
                    title: "Tu Fidelidad",
                    lyrics: "Tu fidelidad es grande\nTu fidelidad incomparable es\nNadie como Tú, bendito Dios\nGrande es Tu fidelidad",
                    source: "courtesy"
                },
                {
                    id: "courtesy-2",
                    title: "Cuerdas de Amor",
                    lyrics: "Aunque pase el tiempo\nSé que tu promesa es fiel\nMi corazón está seguro en Ti\nMe guían Tus cuerdas de amor",
                    source: "courtesy"
                }
            ];
            songs = localSongs;
            if (typeof saveData === 'function') saveData();
        } else {
            songs = localSongs;
        }

        const setlistData = localStorage.getItem("bosquejos_setlist");
        if (setlistData) setlist = JSON.parse(setlistData);

        window.addEventListener("keydown", e => {
            const tag = e.target.tagName;
            if (e.target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            const songModal = document.getElementById("songModal");
            const creditsModal = document.getElementById("creditsModal");

            if ((songModal && songModal.style.display === "flex") || (creditsModal && creditsModal.style.display === "flex")) {
                if (e.key === "Escape") {
                    if (typeof closeModal === 'function') closeModal();
                    if (creditsModal) creditsModal.style.display = "none";
                }
                return;
            }

            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "PageUp", "PageDown"].includes(e.key)) {
                e.preventDefault();
                if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) {
                    if (currentMode === "bible") nextVerse();
                    else if (currentMode === "presentations") window.presNextSlide();
                    else nextSongSlide();
                } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
                    if (currentMode === "bible") prevVerse();
                    else if (currentMode === "presentations") window.presPrevSlide();
                    else prevSongSlide();
                }
            } else if (["F5", "b", "B", "Escape"].includes(e.key)) {
                e.preventDefault();
                blackout();
            }
        });

        console.log("Iniciando Zion Presenter...");
        updateDate();
        initSongsSystem();
        setMode("songs");

        setTimeout(() => { initBibleSystem() }, 150);
        setTimeout(() => { initAnnouncementsSystem(); initTimerSystem() }, 350);
        setTimeout(() => { initPresentationsSystem() }, 550);
        setTimeout(() => {
            loadConfig();
            const lastBg = localStorage.getItem("bosquejos_bg");
            const lastBgType = localStorage.getItem("bosquejos_bg_type") || "image";
            if (lastBg) {
                if (typeof bc !== 'undefined') {
                    bc.postMessage({ type: "bg", action: "update", payload: { image: lastBg, mediaType: lastBgType } });
                }
                updateBgPreview(lastBg, lastBgType);
            }
            updateConfig();
        }, 800);

        setTimeout(() => {
            splash();
            if (!localStorage.getItem("zion_welcome_shown")) {
                setTimeout(() => {
                    showCredits();
                    localStorage.setItem("zion_welcome_shown", "true");
                }, 500);
            }
        }, 4000);

    } catch (err) {
        console.error("Error crítico en init():", err);
        splash();
    }
}

let isTransitioning = false;

function setMode(mode) {
    const views = {
        songs: document.getElementById("songsView"),
        bible: document.getElementById("bibleView"),
        announcements: document.getElementById("announcementsView"),
        presentations: document.getElementById("presentationsView"),
        cast: document.getElementById("castView")
    };

    // 1. GESTIÓN DE AUTO-DIM (Sliders)
    const dimInput = document.getElementById('bgDim');

    // AL ENTRAR A PRESENTACIONES: Guardar valor actual
    if (mode === "presentations" && window.currentMode !== "presentations") {
        if (dimInput && window.originalBgDim === undefined) {
            window.originalBgDim = dimInput.value;
            console.log("📥 Guardando dim original:", window.originalBgDim);
        }
    }

    // AL SALIR DE PRESENTACIONES: Restaurar valor guardado
    if (window.currentMode === "presentations" && mode !== "presentations") {
        if (dimInput && window.originalBgDim !== undefined) {
            console.log("📤 Restaurando fondo dim a:", window.originalBgDim);
            dimInput.value = window.originalBgDim;
            window.originalBgDim = undefined;
            if (typeof updateConfig === 'function') updateConfig();
        }
    }

    // Prevenir clicks rápidos durante la transición
    if (isTransitioning || window.currentMode === mode || !views[mode]) return;
    isTransitioning = true;

    const modes = ["songs", "bible", "announcements", "presentations", "cast"];
    const currentIndex = modes.indexOf(window.currentMode);
    const newIndex = modes.indexOf(mode);
    const goingForward = newIndex > currentIndex;

    const oldView = views[window.currentMode];
    const newView = views[mode];

    if (mode !== "announcements" && typeof stopPresentationMode === "function") stopPresentationMode();

    // Limpiar clases de animación previas
    Object.values(views).forEach(v => {
        if (v) {
            v.className = 'view-container';
            v.style.pointerEvents = 'none'; // Deshabilitar interacción durante transición
        }
    });

    // Animar salida de la vista anterior
    const optionsCard = document.getElementById('optionsCard');
    if (oldView) {
        oldView.classList.add('view-rotate-out');
        if (optionsCard) optionsCard.classList.add('view-rotate-out');
    }

    // Después de un delay mínimo para permitir que la animación de salida respire
    setTimeout(() => {
        // Ocultar todas las vistas (Excepto Cast si es el destino)
        Object.keys(views).forEach(k => {
            if (views[k] && k !== "cast") views[k].style.display = "none";
            else if (views[k] && mode !== "cast") views[k].style.display = "none";
        });

        // Mostrar y animar entrada de la nueva vista
        if (mode === "cast") {
            newView.style.display = "block";
            // La animación de Cast se gestiona internamente para evitar parpadeos
        } else {
            newView.style.display = "contents";
            newView.classList.add('view-rotate-in');
            if (optionsCard) {
                optionsCard.classList.remove('view-rotate-out');
                optionsCard.classList.add('view-rotate-in');
            }
        }

        // Limpiar clases después de la animación (Excepto en Cast)
        setTimeout(() => {
            if (mode !== "cast") {
                newView.className = 'view-container';
            }
            if (optionsCard) optionsCard.classList.remove('view-rotate-in', 'view-rotate-out');
            newView.style.pointerEvents = 'auto';
            isTransitioning = false;
        }, 300);

    }, 50); // Reducido de 200ms a 50ms para una respuesta instantánea

    window.currentMode = mode;

    if (mode === "cast") {
        initCastSystem();
    }

    // Forzar actualización del monitor al cambiar de modo para evitar pantalla negra
    if (window.refreshAllMonitors) {
        setTimeout(() => window.refreshAllMonitors(), 250);
    }

    if (mode === "bible" && typeof renderBooks === "function") {
        setTimeout(() => renderBooks(), 250);
    }
}

function toggleMode() {
    const modes = ["songs", "bible", "announcements", "presentations", "cast"];
    let nextIdx = (modes.indexOf(window.currentMode) + 1) % modes.length;
    setMode(modes[nextIdx]);
}

function prevSlide() {
    console.log(`[NAV] Remote Prev trigger. Mode: ${window.currentMode}`);
    if (window.currentMode === "songs") {
        if (typeof window.prevSongSlide === 'function') window.prevSongSlide();
    }
    else if (window.currentMode === "bible") {
        if (typeof window.prevVerse === 'function') window.prevVerse();
    }
    else if (window.currentMode === "presentations") {
        if (typeof window.presPrevSlide === 'function') window.presPrevSlide();
    }
}

function nextSlide() {
    console.log(`[NAV] Remote Next trigger. Mode: ${window.currentMode}`);
    if (window.currentMode === "songs") {
        if (typeof window.nextSongSlide === 'function') window.nextSongSlide();
    }
    else if (window.currentMode === "bible") {
        if (typeof window.nextVerse === 'function') window.nextVerse();
    }
    else if (window.currentMode === "presentations") {
        if (typeof window.presNextSlide === 'function') window.presNextSlide();
    }
}

function showCredits() {
    const modal = document.getElementById("aboutModal");
    if (modal) {
        modal.style.display = "flex";
        // Pequeño delay para que el navegador renderice el estado inicial antes de animar
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                modal.classList.add("active");
            });
        });
    }
}



// QR MODAL PARA WEB
window.showRemoteQR = async function () {
    const modal = document.getElementById("connectivityModal");
    if (modal) {
        modal.style.display = "flex";

        const visorLinkModal = document.getElementById('visorLinkModal');
        const remoteLinkModal = document.getElementById('remoteLinkModal');
        const qrContainer = document.getElementById("remoteQRCode");

        // Limpiar/Cargando mientras se obtiene la IP
        if (visorLinkModal) visorLinkModal.value = "Cargando...";
        if (remoteLinkModal) remoteLinkModal.value = "Cargando...";
        if (qrContainer) qrContainer.innerHTML = "<div style='color:#000; font-size:10px; padding:20px;'>Generando QR...</div>";

        // 1. Intentar obtener la IP real del servidor para el mando móvil
        let baseURL = window.location.origin;
        try {
            const resp = await fetch('/api/network-info');
            const net = await resp.json();
            if (net.success && net.primaryIp) {
                baseURL = `http://${net.primaryIp}:${net.port}`;
            }
        } catch (e) {
            console.warn("No se pudo obtener la IP local, usando origin por defecto:", e);
        }

        console.log("📡 [CONECTIVIDAD] Usando Base URL:", baseURL);

        const visorURL = `${baseURL}/v/GLOBAL`;
        const remoteURL = `${baseURL}/mobile/`;

        visorLinkModal.value = visorURL;
        remoteLinkModal.value = remoteURL;

        // Generar QR
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = ""; // Limpiar previo
            new QRCode(qrContainer, {
                text: remoteURL,
                width: 140,
                height: 140,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        // Animación de entrada
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                modal.classList.add("active");
                modal.style.opacity = "1";
            });
        });
    }
};

window.copyRemoteLink = function () {
    const input = document.getElementById('remoteLinkModal');
    if (!input) return;
    input.select();
    document.execCommand('copy');
    const statusSub = document.getElementById('roomStatusSub');
    if (statusSub) {
        const originalText = statusSub.textContent;
        statusSub.textContent = '¡LINK REMOTO COPIADO!';
        setTimeout(() => { statusSub.textContent = originalText; }, 2000);
    }
};

// ============================================
// CARGA MANUAL DE RECURSOS (CONSENTIMIENTO LEGAL)
// ============================================
function loadLibraryWithConsent() {
    if (typeof jscanciones === 'undefined' || !Array.isArray(jscanciones)) {
        if (typeof showToast === 'function') showToast("No se encontró el archivo Canciones.js para cargar.", "error");
        else alert("No se encontró el archivo Canciones.js para cargar.");
        return;
    }

    try {
        const importedSongs = jscanciones.map(s => ({
            id: s.id || generateUUID(),
            title: s.ti,
            lyrics: s.le,
            singer: s.cantante || "",
            source: "manual_load"
        }));

        // Combinar con lo que ya tenga el usuario o reemplazar? 
        // El usuario pidió "cargar esa lista", usualmente se espera que aparezca.
        // Usaremos un Map para evitar duplicados si ya existen algunos
        const existingSongs = songs || [];
        const songsMap = new Map();
        existingSongs.forEach(s => songsMap.set(s.id, s));
        importedSongs.forEach(s => songsMap.set(s.id, s));

        songs = Array.from(songsMap.values());
        localStorage.setItem('zion_library_loaded', 'true');

        if (typeof saveData === 'function') saveData();
        if (typeof renderLibrary === 'function') renderLibrary();

        if (typeof showToast === 'function') showToast(`Se cargaron ${importedSongs.length} cantos exitosamente.`, "success");

        // Actualizar UI del modal si existe la función
        if (typeof renderSongResource === 'function') renderSongResource();
    } catch (e) {
        console.error("Error al cargar biblioteca manual:", e);
        alert("Ocurrió un error al cargar los cantos.");
    }
}

window.loadLibraryWithConsent = loadLibraryWithConsent;
window.setMode = setMode;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
// ============================================
// INTEGRACIÓN ZION CAST (JUMP SYSTEM)
// ============================================

// Integración Zion Cast Configurada Automáticamente (Local)




const zionBc = new BroadcastChannel('zion-presenter-local');

window.jumpToZionCast = function () {
    // Determinar ruta inteligente según el protocolo (Red vs Local)
    const isLocalFile = window.location.protocol === 'file:';
    const url = isLocalFile ? "zion-cast/zion_overlay.html" : "/zion-cast/zion_overlay.html";

    if (confirm("¿Cambiar proyección a Zion Cast?\n\nLa ventana del visor se redirigirá automáticamente.")) {

        console.log("🚀 [SENDER] Iniciando salto a Zion Cast...", url);

        const jumpData = {
            type: 'app_jump',
            targetUrl: url,
            payload: { url: url },
            roomCode: 'GLOBAL'
        };

        // 1. Canal local dedicado
        if (typeof zionBc !== 'undefined') zionBc.postMessage(jumpData);

        // 2. Canales globales
        if (window.bc) window.bc.postMessage(jumpData);
        if (window.displayChannel) window.displayChannel.postMessage(jumpData);

        // 3. Red (Socket.IO) - CRUCIAL para que funcione en otras máquinas de la red
        if (window.networkSocket && window.networkSocket.connected) {
            window.networkSocket.emit('remote_action', jumpData);
            console.log("📡 [SENDER] Salto enviado por RED local.");
        }

        if (typeof showToast === 'function') {
            showToast("Sincronizando visor remoto...", "info");
        }
    }
};

function initCastSystem() {
    const container = document.getElementById('castView');
    if (!container) return;

    // "PANTALLA COMPLETA TOTAL" - Preparación previa
    container.style.display = "block";
    container.style.opacity = "0"; // Invisible al inicio para evitar el flash
    container.className = ""; // Limpiar clases anteriores
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.zIndex = "200000";
    container.style.background = "#000";
    container.style.padding = "0";
    container.style.margin = "0";

    // Activamos la animación bonita con un pequeño delay para que el DOM se asiente
    requestAnimationFrame(() => {
        container.classList.add('cast-portal-active');
        // Eliminar la opacidad inline para que no bloquee el estado final de la animación
        setTimeout(() => { container.style.opacity = "1"; }, 500);
    });

    // Ocultar barra de configuración
    const optionsCard = document.getElementById('optionsCard');
    if (optionsCard) optionsCard.style.display = 'none';

    // Si ya existe el iframe, no lo recreamos para no perder conexión
    if (container.querySelector('iframe')) return;

    // URL MAESTRA DEL PANEL DE CONTROL (Local)
    const ZION_CAST_PANEL_URL = "/zion-cast/zion_panel.html";

    container.innerHTML = `
        <div style="height: 100vh; width: 100vw; display: flex; flex-direction: column; position: relative; background: #000;">
            
            <iframe id="zionCastIframe" src="${ZION_CAST_PANEL_URL}" 
                style="flex: 1; width: 100%; height: 100%; border: none;" 
                allow="autoplay; fullscreen"></iframe>

            <!-- BARRA DE CONTROL FLOTANTE (DOCK) -->
            <div style="position: absolute; top: 0; left: 0; z-index: 200001; display: flex; align-items: center; gap: clamp(4px, 0.8vw, 12px); background: rgba(10, 10, 10, 0.95); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: clamp(5px, 0.8vh, 12px) clamp(10px, 1.5vw, 25px) clamp(5px, 0.8vh, 12px) clamp(8px, 1.2vw, 18px); border-radius: 0 0 clamp(10px, 1.5vw, 25px) 0; border: 1px solid rgba(0, 229, 255, 0.3); border-top: none; border-left: none; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                
                <!-- BOTÓN DE VOLVER -->
                <button onclick="exitCastMode()" 
                    title="Volver a Zion Presenter" class="cast-dock-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                <div style="width: 1px; height: clamp(20px, 2.5vw, 35px); background: rgba(255,255,255,0.1); margin: 0 clamp(2px, 0.5vw, 10px);"></div>

                <!-- BOTÓN DE REFRESCAR -->
                <button onclick="refreshCastIframe()" 
                    title="Refrescar Panel" class="cast-dock-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>

                <!-- BOTÓN DE PASAR A VISOR (Jump) -->
                <button onclick="jumpToZionCast()" 
                    title="Pasar Proyector a Modo Zion Cast" class="cast-dock-btn" style="background: rgba(0, 229, 255, 0.15) !important; border-color: rgba(0, 229, 255, 0.4) !important;">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function exitCastMode() {
    const container = document.getElementById('castView');
    if (container) {
        container.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
        container.style.opacity = "0";
        container.style.transform = "scale(0.95) translateY(10px)";

        setTimeout(() => {
            const bcReturn = new BroadcastChannel('zion-presenter-local');
            const bcCast = new BroadcastChannel('zion_channel');

            const isLocalFile = window.location.protocol === 'file:';
            const returnUrl = isLocalFile ? "../cantos_overlay.html" : "/v/";

            const jumpMsg = {
                type: 'app_jump',
                targetUrl: returnUrl,
                payload: { url: returnUrl }
            };

            bcReturn.postMessage(jumpMsg);
            bcCast.postMessage(jumpMsg);

            if (window.networkSocket && window.networkSocket.connected) {
                window.networkSocket.emit('remote_action', jumpMsg);
            }

            container.style.display = "none";
            container.style.position = "";
            container.style.top = "";
            container.style.left = "";
            container.style.width = "";
            container.style.height = "";
            container.style.zIndex = "";
            container.style.background = "";
            container.style.opacity = "";
            container.className = "";
        }, 400);
    }

    const optionsCard = document.getElementById('optionsCard');
    if (optionsCard) optionsCard.style.display = '';

    setMode('songs');
}

function refreshCastIframe() {
    const iframe = document.getElementById('zionCastIframe');
    if (iframe) iframe.src = iframe.src;
}

window.initCastSystem = initCastSystem;
window.exitCastMode = exitCastMode;
window.refreshCastIframe = refreshCastIframe;

window.currentMode = window.currentMode || "songs";

document.addEventListener("DOMContentLoaded", () => {
    try { init() } catch (e) { console.error("Error:", e) }
});