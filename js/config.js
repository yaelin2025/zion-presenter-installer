// ============================================
// CONFIG MODULE - Theme & Visual Settings
// ============================================

const themeColors = [
    "#0ea5e9", "#CCFF00", "#FF007F", "#8b5cf6",
    "#6366f1", "#0047AB", "#06b6d4", "#14b8a6",
    "#10b981", "#FFD700", "#FF6600", "#FF0000",
    "#FFC1CC", "#64748b", "#334155", "#7c3aed"
];

let currentThemeColor = "#0ea5e9";
let isLightMode = false;

// ============================================
// LIGHT/DARK MODE TOGGLE
// ============================================

function toggleLightMode() {
    isLightMode = !isLightMode;
    applyLightMode();
    applyTheme(currentThemeColor);
    localStorage.setItem("bosquejos_lightmode", isLightMode);
}

function applyLightMode() {
    if (isLightMode) {
        document.body.classList.add("light-theme");
    } else {
        document.body.classList.remove("light-theme");
    }

    // Update theme icons
    document.querySelectorAll(".theme-icon").forEach(icon => {
        icon.innerHTML = isLightMode
            ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
            : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    });

    // Update button titles
    document.querySelectorAll(".btn-theme-toggle").forEach(btn => {
        btn.title = isLightMode ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro";
    });
}

// ============================================
// LOAD CONFIGURATION
// ============================================

function loadConfig() {
    // Load light mode preference
    const lightModeValue = localStorage.getItem("bosquejos_lightmode");
    isLightMode = lightModeValue === "true";
    applyLightMode();

    // Load saved config
    const savedConfig = localStorage.getItem("bosquejos_config");

    if (savedConfig) {
        const config = JSON.parse(savedConfig);

        // Restore all settings
        if (config.fontFamily) document.getElementById("fontFamily").value = config.fontFamily;
        if (config.maxFontSize) document.getElementById("maxFontSize").value = config.maxFontSize;
        if (config.uppercase !== undefined) document.getElementById("uppercase").checked = config.uppercase;
        if (config.textShadow) document.getElementById("textShadow").value = config.textShadow;
        if (config.marginSize) document.getElementById("marginSize").value = config.marginSize;
        if (config.marginSizeX) document.getElementById("marginSizeX").value = config.marginSizeX;
        if (config.transitionEffect) document.getElementById("transitionEffect").value = config.transitionEffect;
        if (config.bgDim) document.getElementById("bgDim").value = config.bgDim;
        if (config.bgBlur) document.getElementById("bgBlur").value = config.bgBlur;
        if (config.boldText !== undefined) document.getElementById("boldText").checked = config.boldText;
        if (config.autoFit !== undefined) document.getElementById("autoFit").checked = config.autoFit;
        if (config.textColor) document.getElementById("textColor").value = config.textColor;
        if (config.shadowColor) document.getElementById("shadowColor").value = config.shadowColor;

        const lineHeightInput = document.getElementById("lineHeight");
        if (config.lineHeight && lineHeightInput) {
            lineHeightInput.value = config.lineHeight;
        }

        if (config.transitionDuration) {
            document.getElementById("transitionDuration").value = config.transitionDuration;
        }

        // Apply theme
        if (config.themeColor) {
            applyTheme(config.themeColor);
        } else {
            applyTheme(themeColors[0]);
        }

        updateConfig();
    } else {
        // First time setup
        applyTheme(themeColors[0]);
        renderColorPicker();
        updateConfig();
    }

    restoreBackgroundPreview();

    // Enable transitions after initial load
    setTimeout(() => {
        document.body.classList.add("theme-transition");
    }, 100);
}

// ============================================
// BACKGROUND PREVIEW RESTORATION
// ============================================

async function restoreBackgroundPreview() {
    const bgPath = localStorage.getItem("bosquejos_bg");
    const bgType = localStorage.getItem("bosquejos_bg_type") || "image";
    const bgSource = localStorage.getItem("bosquejos_bg_source");

    if (!bgPath) return;

    // If background is stored in IndexedDB
    if (bgSource === "db" && window.MediaDB) {
        try {
            const file = await window.MediaDB.getFile(bgPath);
            if (file) {
                updateBgPreview(URL.createObjectURL(file), bgType);
            }
        } catch (error) {
            console.error("Error restaurando preview DB:", error);
        }
    } else if (bgSource !== "db") {
        // Local file path
        updateBgPreview(null, bgType);
        document.getElementById("bgPreviewText").innerText = "Fondo Local Activo";
    }
}

// ============================================
// UPDATE CONFIGURATION
// ============================================

let configThrottleTimer = null;
const THROTTLE_MS = 32; // ~30fps para suavidad máxima

function updateConfig(immediate = false) {
    const executeUpdate = () => {
        const config = {
            fontFamily: document.getElementById("fontFamily").value,
            maxFontSize: document.getElementById("maxFontSize") ? document.getElementById("maxFontSize").value : 300,
            uppercase: document.getElementById("uppercase").checked,
            boldText: document.getElementById("boldText").checked,
            autoFit: document.getElementById("autoFit").checked,
            textColor: document.getElementById("textColor").value,
            shadowColor: document.getElementById("shadowColor").value,
            textShadow: document.getElementById("textShadow").value,
            marginSize: document.getElementById("marginSize").value,
            marginSizeX: document.getElementById("marginSizeX") ? document.getElementById("marginSizeX").value : 80,
            lineHeight: document.getElementById("lineHeight") ? document.getElementById("lineHeight").value : 0.95,
            transitionEffect: document.getElementById("transitionEffect").value,
            transitionDuration: document.getElementById("transitionDuration") ? document.getElementById("transitionDuration").value : 1.0,
            bgDim: document.getElementById("bgDim").value,
            bgBlur: document.getElementById("bgBlur").value,
            themeColor: currentThemeColor
        };

        // Actualizar indicadores visuales (spans) en el panel
        const updateVal = (id, suffix = "") => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(id + "Val");
            if (el && valEl) valEl.innerText = el.value + suffix;
        };
        updateVal("maxFontSize", "px");
        updateVal("textShadow");
        updateVal("marginSize");
        updateVal("marginSizeX");
        updateVal("lineHeight");
        updateVal("bgDim", "%");
        updateVal("bgBlur", "px");
        if (document.getElementById("transitionDurationVal")) {
            document.getElementById("transitionDurationVal").innerText = config.transitionDuration + "s";
        }

        localStorage.setItem("bosquejos_config", JSON.stringify(config));

        // Optimización: Solo actualizar textareas visibles
        const textareas = document.querySelectorAll("#announcementsView textarea");
        if (textareas.length > 0) {
            textareas.forEach(textarea => {
                textarea.style.fontFamily = config.fontFamily;
                textarea.style.textTransform = config.uppercase ? "uppercase" : "none";
            });
        }

        // Send config to overlay via BroadcastChannel
        if (typeof bc !== 'undefined' && bc) {
            bc.postMessage({
                type: "config",
                payload: config
            });
        }

        // Refrescar monitores locales después de guardar (con la nueva config)
        if (window.refreshAllMonitors) {
            window.refreshAllMonitors();
        }
    };

    if (immediate) {
        executeUpdate();
    } else {
        // Implementación de THROTTLE: Se ejecuta máximo una vez cada THROTTLE_MS
        if (!configThrottleTimer) {
            executeUpdate();
            configThrottleTimer = setTimeout(() => {
                configThrottleTimer = null;
            }, THROTTLE_MS);
        }
    }
}

// ============================================
// COLOR PICKER
// ============================================

function renderColorPicker() {
    const colorGrid = document.getElementById("colorGrid");
    if (!colorGrid) return;

    colorGrid.innerHTML = "";

    themeColors.forEach(color => {
        const colorBox = document.createElement("div");
        colorBox.style.backgroundColor = color;
        colorBox.style.height = "30px";
        colorBox.style.borderRadius = "6px";
        colorBox.style.cursor = "pointer";
        colorBox.style.border = currentThemeColor === color
            ? "2px solid white"
            : "1px solid rgba(255,255,255,0.2)";
        colorBox.style.boxShadow = currentThemeColor === color
            ? "0 0 10px " + color
            : "none";
        colorBox.style.transition = "transform 0.2s";

        colorBox.onmouseover = () => colorBox.style.transform = "scale(1.1)";
        colorBox.onmouseout = () => colorBox.style.transform = "scale(1)";

        // Detener propagación para evitar que se cierre el panel
        colorBox.onclick = (event) => {
            event.stopPropagation();
            applyTheme(color);
        };

        colorGrid.appendChild(colorBox);
    });
}

// ============================================
// APPLY THEME
// ============================================

function applyTheme(color) {
    currentThemeColor = color;

    const darkerColor = adjustBrightness(color, -25);
    const glowColor = hexToRgba(color, 0.4);

    // Calculate brightness
    const brightness = (
        299 * parseInt(color.substr(1, 2), 16) +
        587 * parseInt(color.substr(3, 2), 16) +
        114 * parseInt(color.substr(5, 2), 16)
    ) / 1000;

    const isVeryLight = brightness > 180;
    const isVeryDark = brightness < 40;
    const rootStyle = document.documentElement.style;

    // Set CSS variables based on color brightness
    if (isVeryDark) {
        rootStyle.setProperty("--accent", "#27272a");
        rootStyle.setProperty("--brand-gradient", "#27272a");
        rootStyle.setProperty("--brand-glow", "rgba(255, 255, 255, 0.15)");
        rootStyle.setProperty("--text-accent", "#ffffff");
    } else {
        rootStyle.setProperty("--accent", color);
        rootStyle.setProperty("--brand-gradient", color);
        rootStyle.setProperty("--brand-glow", glowColor);
        rootStyle.setProperty("--text-accent", color);
    }

    // Button text color
    rootStyle.setProperty("--btn-text-color", (isVeryLight || isVeryDark) ? "#000000" : "#ffffff");

    if (isVeryDark) {
        rootStyle.setProperty("--btn-text-color", "#fff");
    }

    rootStyle.setProperty("--btn-text-shadow", isVeryLight ? "none" : "0 1px 2px rgba(0, 0, 0, 0.3)");
    rootStyle.setProperty("--active-bg", hexToRgba(color, 0.25));
    rootStyle.setProperty("--active-border", color);

    // Background handling
    if (isVeryDark) {
        const darkBase = `color-mix(in srgb, ${color}, #050510 50%)`;
        rootStyle.setProperty("--bg", darkBase);
        document.body.style.background = darkBase;
    } else {
        if (isLightMode) {
            // Fondo sólido TINTADO para Modo Claro: 75% Blanco Humo + 25% Color Tema
            const solidLight = `color-mix(in srgb, ${color}, #f3f4f6 75%)`;
            rootStyle.setProperty("--bg", solidLight);
            document.body.style.background = solidLight;
        } else {
            // Fondo sólido de alto contraste: 50% Base Azul Oscura + 50% Color Tema (Medio)
            const solidDark = `color-mix(in srgb, ${color}, #050510 50%)`;
            rootStyle.setProperty("--bg", solidDark);
            document.body.style.background = solidDark;
        }

        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundSize = "cover";
    }

    renderColorPicker();
    updateConfig();
}

// ============================================
// OPTIONS PANEL TOGGLE
// ============================================

function toggleOptionsPanel(forceState) {
    const optionsCard = document.getElementById("optionsCard");

    // Si se pasa un parámetro, forzar ese estado
    if (forceState === true) {
        optionsCard.classList.add("expanded");
    } else if (forceState === false) {
        optionsCard.classList.remove("expanded");
    } else {
        // Sin parámetro, hacer toggle normal
        optionsCard.classList.toggle("expanded");
    }
}

// ============================================
// BACKGROUND UPLOAD
// ============================================

async function uploadBackground(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const filePath = file.path;
    const isVideo = file.type.startsWith("video/");

    // Desktop mode (Electron) - has file.path
    if (filePath) {
        try {
            localStorage.setItem("bosquejos_bg", filePath);
            localStorage.setItem("bosquejos_bg_type", isVideo ? "video" : "image");

            if (typeof bc !== 'undefined' && bc) {
                bc.postMessage({
                    type: "bg",
                    action: "update",
                    payload: {
                        image: filePath,
                        mediaType: isVideo ? "video" : "image"
                    }
                });
            }

            updateBgPreview(URL.createObjectURL(file), isVideo ? "video" : "image");

            // 🔥 NUEVO: Refrescar monitores locales inmediatamente
            if (window.refreshAllMonitors) window.refreshAllMonitors();

            console.log("Fondo cargado desde disco:", filePath);
        } catch (error) {
            console.error("Error guardando fondo local:", error);
        }
    } else {
        // Web mode - save to IndexedDB
        console.log("🚀 Modo Web Optimizado: Guardando en DB y enviando...");
        try {
            if (window.MediaDB) {
                await window.MediaDB.saveFile("current_bg", file);
                localStorage.setItem("bosquejos_bg", "current_bg");
                localStorage.setItem("bosquejos_bg_type", isVideo ? "video" : "image");
                localStorage.setItem("bosquejos_bg_source", "db");
            }

            if (typeof bc !== 'undefined' && bc) {
                bc.postMessage({
                    type: "bg",
                    action: "update",
                    payload: {
                        image: "current_bg",
                        mediaType: isVideo ? "video" : "image",
                        sourceMode: "db"
                    }
                });
            }

            updateBgPreview(URL.createObjectURL(file), isVideo ? "video" : "image");

            // 🔥 NUEVO: Refrescar monitores locales inmediatamente
            if (window.refreshAllMonitors) window.refreshAllMonitors();
        } catch (error) {
            console.error("Error envío binario/db:", error);
            alert("Error al guardar fondo. Asegúrate de tener espacio en disco.");
        }
    }
}

// ============================================
// CLEAR BACKGROUND
// ============================================

function clearBackground() {
    if (typeof bc !== 'undefined' && bc) {
        bc.postMessage({
            type: "bg",
            action: "clear"
        });
    }

    localStorage.removeItem("bosquejos_bg");
    localStorage.removeItem("bosquejos_bg_type");
    document.getElementById("bgInput").value = "";
    updateBgPreview(null);

    // 🔥 NUEVO: Refrescar monitores locales inmediatamente
    if (window.refreshAllMonitors) window.refreshAllMonitors();
}

// ============================================
// UPDATE BACKGROUND PREVIEW
// ============================================

function updateBgPreview(url, mediaType = "image") {
    const thumb = document.getElementById("bgPreviewThumb");
    const text = document.getElementById("bgPreviewText");

    if (url) {
        if (mediaType === "video") {
            thumb.style.backgroundImage = "none";
            thumb.style.backgroundColor = "#333";
            thumb.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><polygon points="10,9 16,12 10,15"/></svg>';
            thumb.style.display = "flex";
            thumb.style.alignItems = "center";
            thumb.style.justifyContent = "center";
            thumb.style.color = "#666";
        } else {
            thumb.innerHTML = "";
            thumb.style.backgroundImage = `url(${url})`;
            thumb.style.backgroundColor = "#222";
            thumb.style.display = "block";
        }
        text.innerText = "Fondo Activo";
        text.style.color = "var(--success)";
    } else {
        thumb.innerHTML = "";
        thumb.style.backgroundImage = "none";
        thumb.style.backgroundColor = "#222";
        thumb.style.display = "block";
        text.innerText = "Sin fondo";
        text.style.color = "#666";
    }
}
