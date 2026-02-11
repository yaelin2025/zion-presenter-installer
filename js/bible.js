// ============================================
// BIBLE MODULE (Modular Architecture)
// ============================================

// Usar el bc global (ya interceptado por projection.js)
// const bibleChannel = new BroadcastChannel('cantos_channel');

// ESTADO CENTRALIZADO DEL MÓDULO (Global para acceso remoto)
window.bibleState = {
    data: [],
    data2: [], // Para la segunda versión
    currentBook: null,
    currentChapter: null,
    currentVerseIndex: -1,
    recentVerses: JSON.parse(localStorage.getItem('bosquejos_recent_verses') || '[]'),
    isHistoryMode: false,
    version: 'RV1960',
    version2: 'RV1909',
    isDualMode: false
};

// Función para validar versiones al inicio
function validateBibleVersions() {
    const savedV1 = localStorage.getItem('bosquejos_bible_version');
    const savedV2 = localStorage.getItem('bosquejos_bible_version2');

    if (savedV1 && isBibleUnlocked(savedV1)) bibleState.version = savedV1;
    if (savedV2 && isBibleUnlocked(savedV2)) bibleState.version2 = savedV2;
}

const BIBLE_VERSIONS = {
    'RV1960': { name: 'Reina Valera 1960', file: 'js/bible_rv1960.js', var: 'bibleSource_RV1960', isFree: true },
    'RV1909': { name: 'Reina Valera Antigua (1909)', file: 'js/bible_rv1909.js', var: 'bibleSource_RV1909', isFree: true },
    'OSO': { name: 'Sagradas Escrituras (Oso)', file: 'js/bible_oso.js', var: 'bibleSource_OSO', isFree: true },
    'LXX': { name: 'Septuaginta (LXX)', file: 'js/bible_lxx.js', var: 'bibleSource_LXX', isFree: true },
    // Versiones con Copyright (Requieren activación manual)
    'DHH': { name: 'Dios Habla Hoy', file: 'js/bible_dhh.js', var: 'bibleSource_DHH', hasCopy: true },
    'NVI': { name: 'Nueva Versión Internacional', file: 'js/bible_nvi.js', var: 'bibleSource_NVI', hasCopy: true },
    'NTV': { name: 'Nueva Traducción Viviente', file: 'js/bible_ntv.js', var: 'bibleSource_NTV', hasCopy: true },
    'TLA': { name: 'Traducción Lenguaje Actual', file: 'js/bible_tla.js', var: 'bibleSource_TLA', hasCopy: true },
    'LBLA': { name: 'Biblia de las Américas', file: 'js/bible_lbla.js', var: 'bibleSource_LBLA', hasCopy: true },
    'PDT': { name: 'Palabra de Dios para Todos', file: 'js/bible_pdt.js', var: 'bibleSource_PDT', hasCopy: true },
    'RVA2015': { name: 'Reina Valera Actualizada 2015', file: 'js/bible_rva2015.js', var: 'bibleSource_RVA2015', hasCopy: true },
    'RV1995': { name: 'Reina Valera 1995', file: 'js/bible_rv1995.js', var: 'bibleSource_RV1995', hasCopy: true },
    'RVC2011': { name: 'Reina Valera Contemporánea', file: 'js/bible_rvc2011.js', var: 'bibleSource_RVC2011', hasCopy: true },
    'RVG': { name: 'Reina Valera Gomez', file: 'js/bible_rvg.js', var: 'bibleSource_RVG', hasCopy: true },
    'RVP2008': { name: 'Reina Valera Purificada', file: 'js/bible_rvp2008.js', var: 'bibleSource_RVP2008', hasCopy: true },
    'BTX': { name: 'Biblia Textual (BTX)', file: 'js/bible_btx.js', var: 'bibleSource_BTX', hasCopy: true }
};

// HELPER: Verificar si una biblia está desbloqueada
function isBibleUnlocked(id) {
    if (BIBLE_VERSIONS[id] && BIBLE_VERSIONS[id].isFree) return true;
    const unlocked = JSON.parse(localStorage.getItem('zion_unlocked_bibles') || '[]');
    return unlocked.includes(id);
}

// HELPER: Desbloquear una biblia
function unlockBible(id) {
    const unlocked = JSON.parse(localStorage.getItem('zion_unlocked_bibles') || '[]');
    if (!unlocked.includes(id)) {
        unlocked.push(id);
        localStorage.setItem('zion_unlocked_bibles', JSON.stringify(unlocked));
        // Actualizar los selects en la UI
        updateBibleSelects();
        return true;
    }
    return false;
}

function updateBibleSelects() {
    const select1 = document.getElementById('bibleVersionSelect');
    const select2 = document.getElementById('bibleVersionSelect2');

    const options = Object.entries(BIBLE_VERSIONS)
        .filter(([id]) => isBibleUnlocked(id))
        .map(([id, info]) => `<option value="${id}">${info.name}</option>`)
        .join('');

    if (select1) {
        const currentVal = select1.value;
        select1.innerHTML = options;
        if (isBibleUnlocked(currentVal)) select1.value = currentVal;
    }
    if (select2) {
        const currentVal = select2.value;
        select2.innerHTML = options;
        if (isBibleUnlocked(currentVal)) select2.value = currentVal;
    }
}

function initBibleSystem() {
    // Validar versiones antes de inyectar el HTML
    validateBibleVersions();

    const container = document.getElementById('bibleView');
    if (!container) return;

    // 1. Inyectar Estructura Modular
    container.innerHTML = `
        <div class="glass-card col-library" style="grid-column: 1; grid-row: 1;">
            <div class="view-header" style="text-align: center; margin-bottom: 10px; padding: 0 10px 10px 10px; min-height: 110px; display: flex; flex-direction: column; justify-content: flex-end; position: relative;">
                <div onclick="showCredits()" style="margin: 0 auto 5px auto; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: transform 0.2s;" onmouseenter="this.style.transform='scale(1.02)'" onmouseleave="this.style.transform='scale(1)'">
                    <img src="img/solologo.png" alt="Logo" style="width: 80px; height: 80px; object-fit: contain;">
                    <div style="text-align: left;">
                        <div class="main-logo-text" style="font-weight: 800; font-size: 30px; letter-spacing: 2px; color: inherit; line-height: 0.9;">ZION</div>
                        <div style="font-weight: 300; font-size: 14px; letter-spacing: 5px; color: var(--text); line-height: 1; margin-top: 4px;">PRESENTER</div>
                    </div>
                </div>
                <div class="nav-tabs">
                    <button class="nav-tab" onclick="setMode('songs')">Cantos</button>
                    <button class="nav-tab active" onclick="setMode('bible')">Biblia</button>
                    <button class="nav-tab" onclick="setMode('announcements')">Anuncios</button>
                    <button class="nav-tab" onclick="setMode('presentations')">Slides</button>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
                <div style="position: relative; width: 100%;">
                    <input type="text" id="bibleSearch" placeholder="Buscar libro, cita o texto..." 
                           style="margin-bottom:0; width: 100%; padding: 8px 35px 8px 10px; font-size: 13px; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 6px; color: var(--text);">
                    <button id="clearBibleBtn" class="btn-clear-input" style="display: none;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; gap: 6px; align-items: stretch; height: 32px;">
                        <select id="bibleVersionSelect" style="flex: 1; height: 32px; font-size: 11px; padding: 0 10px; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 6px; color: var(--text); cursor: pointer; outline: none; box-sizing: border-box; margin: 0;">
                            ${Object.entries(BIBLE_VERSIONS)
            .filter(([id]) => isBibleUnlocked(id))
            .map(([id, info]) => `<option value="${id}">${info.name}</option>`).join('')}
                        </select>
                        <button id="btnToggleHistory" class="secondary" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 14px; margin: 0; padding: 0; flex-shrink: 0;" title="Historial">H</button>
                        <button id="btnToggleDual" class="secondary" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; position: relative; margin: 0; padding: 0; flex-shrink: 0;" title="Modo Comparativa (Dual)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="17"></line></svg>
                            <div id="dualIndicator" style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: var(--accent); border-radius: 50%; display: ${bibleState.isDualMode ? 'block' : 'none'}; border: 2px solid var(--card-bg);"></div>
                        </button>
                    </div>
                    
                    <div id="dualVersionContainer" style="display: ${bibleState.isDualMode ? 'flex' : 'none'}; gap: 6px; align-items: center; height: 32px; animation: slideDown 0.3s ease;">
                        <div style="font-size: 10px; opacity: 0.5; font-weight: 800; color: var(--accent); width: 14px; text-align: center;">VS</div>
                        <select id="bibleVersionSelect2" style="flex: 1; height: 32px; font-size: 11px; padding: 0 10px; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 6px; color: var(--accent); cursor: pointer; outline: none; border-color: rgba(255,152,0,0.3); box-sizing: border-box; margin: 0;">
                            ${Object.entries(BIBLE_VERSIONS)
            .filter(([id]) => isBibleUnlocked(id))
            .map(([id, info]) => `<option value="${id}">${info.name}</option>`).join('')}
                        </select>
                        <div style="width: 70px;"></div> <!-- Compensar el ancho de los botones de arriba -->
                    </div>
                </div>
            </div>
            <div class="scroll-list" id="booksList"></div>
        </div>

        <div class="glass-card col-setlist" style="grid-column: 2; grid-row: 1;">
            <h2>Capítulos</h2>
            <div class="scroll-list chapters-grid" id="chaptersList"></div>
        </div>

        <div class="glass-card col-live" style="grid-column: 3; grid-row: 1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <!-- Indicador LED Premium -->
                    <div id="netStatus_bible" title="Estado de la Red" 
                        style="width: clamp(12px, 1.5vw, 18px); 
                               height: clamp(12px, 1.5vw, 18px); 
                               border-radius: 50%; background: #666; 
                               border: 2px solid rgba(255,255,255,0.2); 
                               box-shadow: inset 0 1px 2px rgba(255,255,255,0.2), 0 0 5px rgba(0,0,0,0.5);
                               transition: all 0.3s; flex-shrink: 0;"></div>
                    <h2 style="margin:0; border:none; padding:0;" id="verseHeader">Versículos</h2>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <button class="icon-btn btn-cast-jump" onclick="setMode('cast')" title="Zion Cast" style="color: #00e5ff;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                    </button>
                    <button class="icon-btn btn-theme-toggle" onclick="toggleLightMode()" title="Cambiar Tema">
                        <svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    </button>
                    <button class="icon-btn btn-remote" onclick="showRemoteQR()" title="Control Remoto">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12" y2="18"></line></svg>
                    </button>
                    <button id="btnOpenOverlayBible" class="primary icon-btn btn-overlay-main" onclick="openOverlay()" title="Pantalla de Proyección">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </button>
                </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
                <!-- Botón Versículo Anterior -->
                <button class="secondary" onclick="prevVerse()" style="height: 100px; min-width: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;" title="Versículo Anterior">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                <!-- Monitor Central -->
                <div class="slide-preview" id="biblePreview" style="margin: 0; flex: 1; position: relative; overflow: hidden;">
                    <!-- Oreja de Borrado Sutil -->
                    <div class="monitor-ear" onclick="blackout()" title="Borrar Pantalla (Blackout)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                    </div>

                     <div style="display:flex; align-items:center; justify-content:center; opacity:0.12; transform: scale(0.65); pointer-events:none; gap:10px;">
                        <img src="img/solologo.png" alt="Logo" style="width: 70px; height: 70px; object-fit: contain;">
                        <div style="text-align:left;"><div style="font-weight:900; font-size:26px; letter-spacing:1px; color:currentColor; line-height:0.8;">ZION</div><div style="font-weight:300; font-size:13px; letter-spacing:3px; color:currentColor; line-height:1; margin-top:2px;">PRESENTER</div></div>
                    </div>
                </div>

                <!-- Botón Versículo Siguiente -->
                <button class="secondary" onclick="nextVerse()" style="height: 100px; min-width: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;" title="Versículo Siguiente">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
            
            <div class="scroll-list" id="versesList"></div>
        </div>
    `;

    // 2. Vincular Eventos
    document.getElementById('bibleSearch').oninput = (e) => { toggleBibleClearBtn(); filterBooks(); };
    document.getElementById('bibleSearch').onkeydown = (e) => {
        if (e.key === 'Enter') {
            handleQuickSearch(e.target.value);
            e.target.blur(); // Desactivar campo para permitir navegación por flechas
        }
    };
    document.getElementById('clearBibleBtn').onclick = clearBibleSearch;
    document.getElementById('bibleVersionSelect').onchange = (e) => changeBibleVersion(e.target.value, 1);
    document.getElementById('bibleVersionSelect2').onchange = (e) => changeBibleVersion(e.target.value, 2);
    document.getElementById('btnToggleDual').onclick = () => toggleDualMode(!bibleState.isDualMode);
    document.getElementById('btnToggleHistory').onclick = toggleBibleHistory;
    // document.getElementById('btnBibleBlackout').onclick = blackout; // REMOVED: Element doesn't exist in DOM
    document.getElementById('bibleVersionSelect').value = bibleState.version;
    document.getElementById('bibleVersionSelect2').value = bibleState.version2;

    loadBibleData();
    if (typeof updateNetworkUI === 'function') updateNetworkUI();
    // Forzar actualización visual del monitor para usar el estilo global (background + logo grande)
    if (window.refreshAllMonitors) setTimeout(window.refreshAllMonitors, 100);
}

function loadBibleData() {
    loadSingleVersion(bibleState.version, 1);
    if (bibleState.isDualMode) {
        loadSingleVersion(bibleState.version2, 2);
    }
}

function loadSingleVersion(versionId, slot) {
    const vInfo = BIBLE_VERSIONS[versionId];
    if (!vInfo) return;

    if (slot === 1) {
        const list = document.getElementById('booksList');
        if (list) list.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.5; font-size:12px;">Cargando Biblia...</div>';
    }

    const finalizeLoad = () => {
        let sourceData = window[vInfo.var];
        if (sourceData && Array.isArray(sourceData)) {
            const formattedData = formatBibleData(sourceData);
            if (slot === 1) {
                bibleState.data = formattedData;
                renderBooks();
                if (bibleState.currentBook !== null) renderChapters();
                if (bibleState.currentChapter !== null) renderVerses();
                if (bibleState.currentVerseIndex !== -1) refreshBibleProjection();
            } else {
                bibleState.data2 = formattedData;
                if (bibleState.isDualMode && bibleState.currentVerseIndex !== -1) {
                    refreshBibleProjection();
                }
            }
        } else {
            console.error(`Variable ${vInfo.var} no encontrada en el script cargado.`);
            if (slot === 1) {
                const list = document.getElementById('booksList');
                if (list) list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--accent);">Error: La versión ${versionId} no se cargó correctamente.</div>`;
            }
        }
    };

    if (typeof window[vInfo.var] !== 'undefined') {
        finalizeLoad();
    } else {
        const script = document.createElement('script');
        script.src = vInfo.file + '?v=' + new Date().getTime(); // Evitar caché
        script.onload = finalizeLoad;
        script.onerror = () => {
            console.error(`Error de red al cargar ${vInfo.file}`);
            if (slot === 1) {
                const list = document.getElementById('booksList');
                if (list) list.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.5;">Error de red al cargar la versión.</div>';
            }
        };
        document.head.appendChild(script);
    }
}

function toggleDualMode(enabled) {
    bibleState.isDualMode = enabled;
    localStorage.setItem('bosquejos_bible_dual', enabled);

    const container = document.getElementById('dualVersionContainer');
    const indicator = document.getElementById('dualIndicator');
    const btn = document.getElementById('btnToggleDual');

    if (container) container.style.display = enabled ? 'flex' : 'none';
    if (indicator) indicator.style.display = enabled ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', enabled);

    if (enabled) {
        loadSingleVersion(bibleState.version2, 2);
    } else {
        if (bibleState.currentVerseIndex !== -1) refreshBibleProjection();
    }
}

function changeBibleVersion(version, slot) {
    if (slot === 1) {
        bibleState.version = version;
        localStorage.setItem('bosquejos_bible_version', version);
        loadSingleVersion(version, 1);
    } else {
        bibleState.version2 = version;
        localStorage.setItem('bosquejos_bible_version2', version);
        loadSingleVersion(version, 2);
    }
}

const BIBLE_BOOKS_ES = [
    "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio", "Josué", "Jueces", "Rut", "1 Samuel", "2 Samuel", "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras", "Nehemías", "Ester", "Job", "Salmos", "Proverbios", "Eclesiastés", "Cantares", "Isaías", "Jeremías", "Lamentaciones", "Ezequiel", "Daniel", "Oseas", "Joel", "Amós", "Abdías", "Jonás", "Miqueas", "Nahúm", "Habacuc", "Sofonías", "Hageo", "Zacarías", "Malaquías",
    "Mateo", "Marcos", "Lucas", "Juan", "Hechos", "Romanos", "1 Corintios", "2 Corintios", "Gálatas", "Efesios", "Filipenses", "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses", "1 Timoteo", "2 Timoteo", "Tito", "Filemón", "Hebreos", "Santiago", "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan", "Judas", "Apocalipsis"
];

function formatBibleData(source) {
    if (!Array.isArray(source)) return [];

    // Detectar si es formato antiguo (array de arrays) buscando 'abbrev' o estructura
    const isOldFormat = source.length > 0 && (source[0].abbrev || Array.isArray(source[0].chapters[0]));

    if (isOldFormat) {
        return source.map((b, index) => ({
            name: BIBLE_BOOKS_ES[index] || b.name || b.abbrev,
            chapters: b.chapters.map((c, i) => ({
                number: i + 1,
                verses: Array.isArray(c) ? c : (c.verses || [])
            }))
        }));
    } else {
        // Ya está en el nuevo formato (como los generados por convert_bibles.js)
        return source;
    }
}

// Mantenemos esta por compatibilidad si otros módulos la llaman, 
// pero internamente loadSingleVersion ya hace el trabajo.
function processBibleSource(source) {
    bibleState.data = formatBibleData(source);
    renderBooks();
}

function renderBooks() {
    const list = document.getElementById('booksList');
    if (!list) return;
    list.innerHTML = '';

    if (bibleState.isHistoryMode) {
        renderHistory();
        return;
    }

    bibleState.data.forEach((book, index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        if (bibleState.currentBook === index) item.classList.add('active');
        item.innerText = book.name;
        item.onclick = () => selectBook(index);
        list.appendChild(item);
    });
}

function filterBooks() {
    const term = document.getElementById('bibleSearch').value.toLowerCase();
    const list = document.getElementById('booksList');
    if (!list) return;
    list.innerHTML = '';

    bibleState.data.forEach((book, index) => {
        if (book.name.toLowerCase().includes(term)) {
            const item = document.createElement('div');
            item.className = 'list-item';
            if (bibleState.currentBook === index) item.classList.add('active');
            item.innerText = book.name;
            item.onclick = () => selectBook(index);
            list.appendChild(item);
        }
    });
}

function selectBook(index) {
    bibleState.currentBook = index;
    bibleState.currentChapter = null;
    bibleState.currentVerseIndex = -1;
    renderBooks();
    renderChapters();
    document.getElementById('versesList').innerHTML = '';
    document.getElementById('verseHeader').innerText = 'Versículos';
}

function renderChapters() {
    const list = document.getElementById('chaptersList');
    if (!list) return;
    list.innerHTML = '';

    if (bibleState.currentBook === null) return;

    const chapters = bibleState.data[bibleState.currentBook].chapters;
    chapters.forEach((chapter, index) => {
        const item = document.createElement('button'); // USAR BUTTON
        // Añadimos una clase para estilos activos
        item.className = (bibleState.currentChapter === index) ? 'active' : '';
        item.innerText = chapter.number;
        item.onclick = () => selectChapter(index);
        list.appendChild(item);
    });
}

function selectChapter(index) {
    bibleState.currentChapter = index;
    bibleState.currentVerseIndex = -1;
    renderChapters();
    renderVerses();
}

function renderVerses() {
    const list = document.getElementById('versesList');
    if (!list) return;
    list.innerHTML = '';

    if (bibleState.currentBook === null || bibleState.currentChapter === null) return;

    const bookName = bibleState.data[bibleState.currentBook].name;
    const chapterNum = bibleState.data[bibleState.currentBook].chapters[bibleState.currentChapter].number;
    document.getElementById('verseHeader').innerText = `${bookName} ${chapterNum}`;

    const verses = bibleState.data[bibleState.currentBook].chapters[bibleState.currentChapter].verses;
    verses.forEach((verse, index) => {
        const item = document.createElement('div');
        item.className = `list-item bible-verse-item ${bibleState.currentVerseIndex === index ? 'active' : ''}`;
        item.innerHTML = `<strong>${index + 1}</strong> ${verse}`;
        item.onclick = () => selectVerse(index);
        list.appendChild(item);
    });
}

function selectVerse(index) {
    bibleState.currentVerseIndex = index;
    renderVerses();
    refreshBibleProjection();

    // Solo añadir al historial cuando el usuario HACE CLIC (no en refrescos automáticos)
    const bookName = bibleState.data[bibleState.currentBook].name;
    const chapterNum = bibleState.data[bibleState.currentBook].chapters[bibleState.currentChapter].number;
    const verseNum = index + 1;
    const text = bibleState.data[bibleState.currentBook].chapters[bibleState.currentChapter].verses[index];
    addToHistory(bookName, chapterNum, verseNum, text);
}

function refreshBibleProjection() {
    if (bibleState.currentBook === null || bibleState.currentChapter === null || bibleState.currentVerseIndex === -1) return;

    const index = bibleState.currentVerseIndex;
    const bookName = bibleState.data[bibleState.currentBook].name;
    const chapterNum = bibleState.data[bibleState.currentBook].chapters[bibleState.currentChapter].number;
    const verseNum = index + 1;
    const text = bibleState.data[bibleState.currentBook].chapters[bibleState.currentChapter].verses[index];

    let secondText = null;
    if (bibleState.isDualMode && bibleState.data2 && bibleState.data2[bibleState.currentBook]) {
        const book2 = bibleState.data2[bibleState.currentBook];
        if (book2.chapters[bibleState.currentChapter]) {
            secondText = book2.chapters[bibleState.currentChapter].verses[index];
        }
    }

    projectVerse(bookName, chapterNum, verseNum, text, secondText);
}

function projectVerse(book, chapter, verse, text, secondText) {
    // Actualizar Monitor usando el motor WYSIWYG
    let previewHtml = `<div><strong>${book} ${chapter}:${verse}</strong><br>${text}</div>`;
    if (secondText) {
        previewHtml += `<hr style="margin:10px 0; opacity:0.3; border:none; border-top:1px solid currentColor; width: 100%;">
                        <div style="opacity:0.9; font-size:0.9em; margin-top:5px;">${secondText}</div>
                        <div style="font-size:0.6em; opacity:0.6; margin-top:2px; text-transform:uppercase;">${BIBLE_VERSIONS[bibleState.version2].name}</div>`;
    }

    if (window.updatePreviewHTML) {
        updatePreviewHTML('biblePreview', previewHtml);
    }

    const payload = {
        lines: [text],
        versions: [bibleState.version],
        title: `${book} ${chapter}:${verse} (${bibleState.version})`,
        author: "",
        isBible: true
    };

    if (secondText) {
        payload.lines.push(secondText);
        payload.versions.push(bibleState.version2);
        payload.title = `${book} ${chapter}:${verse}`;
    }

    bc.postMessage({
        type: 'slide',
        payload: payload
    });
}

function addToHistory(book, chapter, verse, text) {
    // Evitar Duplicados: Si ya existe, lo eliminamos para re-insertarlo al principio (mismo orden cronológico)
    bibleState.recentVerses = bibleState.recentVerses.filter(v =>
        !(v.book === book && v.chapter === parseInt(chapter) && v.verse === parseInt(verse))
    );

    const item = { book, chapter: parseInt(chapter), verse: parseInt(verse), text, time: new Date().getTime() };
    bibleState.recentVerses.unshift(item);
    if (bibleState.recentVerses.length > 20) bibleState.recentVerses.pop();
    localStorage.setItem('bosquejos_recent_verses', JSON.stringify(bibleState.recentVerses));
}

function toggleBibleHistory() {
    bibleState.isHistoryMode = !bibleState.isHistoryMode;
    const btn = document.getElementById('btnToggleHistory');
    if (btn) btn.classList.toggle('active', bibleState.isHistoryMode);
    renderBooks();
}

function renderHistory() {
    const list = document.getElementById('booksList');
    if (!list) return;
    list.innerHTML = '<div style="padding:10px; font-size:11px; color:var(--accent); font-weight:bold; text-transform:uppercase; letter-spacing:1px;">Historial Reciente</div>';

    bibleState.recentVerses.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'list-item bible-verse-item'; // Usamos la misma clase de globos
        div.style.padding = '10px 15px !important';
        div.style.marginBottom = '6px !important';

        div.innerHTML = `
            <div style="margin-bottom: 4px;">
                <strong style="color: var(--accent); font-size: 0.9em;">${item.book} ${item.chapter}:${item.verse}</strong>
            </div>
            <div style="font-size: 12px; line-height: 1.4; opacity: 0.9;">${item.text}</div>
        `;

        div.onclick = () => {
            // 1. Encontrar el índice del libro en la data actual
            const bIdx = bibleState.data.findIndex(b => b.name === item.book);
            if (bIdx >= 0) {
                // 2. SALIR del Historial
                bibleState.isHistoryMode = false;
                const btn = document.getElementById('btnToggleHistory');
                if (btn) btn.classList.remove('active');

                // 3. NAVEGAR paso a paso para actualizar todas las listas visualmente
                selectBook(bIdx);
                const cIdx = item.chapter - 1;
                if (bibleState.data[bIdx].chapters[cIdx]) {
                    selectChapter(cIdx);
                    const vIdx = item.verse - 1;
                    if (bibleState.data[bIdx].chapters[cIdx].verses[vIdx]) {
                        // 4. Seleccionar versículo final y PROYECTAR
                        selectVerse(vIdx);

                        // 5. Scroll al versículo para feedback visual inmediato
                        setTimeout(() => {
                            const list = document.getElementById('versesList');
                            if (list && list.children[vIdx]) {
                                list.children[vIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
                            }
                        }, 100);
                    }
                }
            } else {
                // Fallback de seguridad: Solo proyectar si por algún motivo el libro no está en esta versión
                projectVerse(item.book, item.chapter, item.verse, item.text);
            }
        };
        list.appendChild(div);
    });
}

function clearBibleSearch() {
    document.getElementById('bibleSearch').value = '';
    toggleBibleClearBtn();
    filterBooks();
}

function toggleBibleClearBtn() {
    const val = document.getElementById('bibleSearch').value;
    document.getElementById('clearBibleBtn').style.display = val ? 'block' : 'none';
}

// Mapa de abreviaturas comunes
const BIBLE_ABBREVS = {
    'gn': 'Génesis', 'gen': 'Génesis',
    'ex': 'Éxodo', 'exo': 'Éxodo',
    'lv': 'Levítico', 'lev': 'Levítico',
    'nm': 'Números', 'num': 'Números',
    'dt': 'Deuteronomio', 'deut': 'Deuteronomio',
    'jos': 'Josué',
    'jue': 'Jueces', 'juec': 'Jueces',
    'rt': 'Rut', 'rut': 'Rut',
    '1s': '1 Samuel', '1sm': '1 Samuel', '1sam': '1 Samuel',
    '2s': '2 Samuel', '2sm': '2 Samuel', '2sam': '2 Samuel',
    '1r': '1 Reyes', '1re': '1 Reyes',
    '2r': '2 Reyes', '2re': '2 Reyes',
    '1cr': '1 Crónicas', '1cron': '1 Crónicas',
    '2cr': '2 Crónicas', '2cron': '2 Crónicas',
    'esd': 'Esdras',
    'neh': 'Nehemías',
    'est': 'Ester',
    'job': 'Job',
    'sal': 'Salmos', 'sl': 'Salmos',
    'pr': 'Proverbios', 'prov': 'Proverbios',
    'ec': 'Eclesiastés', 'ecl': 'Eclesiastés',
    'cnt': 'Cantares', 'cant': 'Cantares',
    'is': 'Isaías', 'isa': 'Isaías',
    'jr': 'Jeremías', 'jer': 'Jeremías',
    'lm': 'Lamentaciones', 'lam': 'Lamentaciones',
    'ez': 'Ezequiel',
    'dn': 'Daniel', 'dan': 'Daniel',
    'os': 'Oseas',
    'jl': 'Joel',
    'am': 'Amós',
    'ab': 'Abdías',
    'jon': 'Jonás',
    'miq': 'Miqueas',
    'nah': 'Nahúm',
    'hab': 'Habacuc',
    'sof': 'Sofonías',
    'hag': 'Hageo',
    'zac': 'Zacarías',
    'mal': 'Malaquías',
    'mt': 'Mateo', 'mat': 'Mateo',
    'mr': 'Marcos', 'mar': 'Marcos',
    'lc': 'Lucas', 'luc': 'Lucas',
    'jn': 'Juan', 'jua': 'Juan',
    'hch': 'Hechos', 'hech': 'Hechos',
    'ro': 'Romanos', 'rom': 'Romanos',
    '1co': '1 Corintios', '1cor': '1 Corintios',
    '2co': '2 Corintios', '2cor': '2 Corintios',
    'ga': 'Gálatas', 'gal': 'Gálatas',
    'ef': 'Efesios', 'efe': 'Efesios',
    'fil': 'Filipenses',
    'col': 'Colosenses',
    '1ts': '1 Tesalonicenses', '1tes': '1 Tesalonicenses',
    '2ts': '2 Tesalonicenses', '2tes': '2 Tesalonicenses',
    '1ti': '1 Timoteo', '1tim': '1 Timoteo',
    '2ti': '2 Timoteo', '2tim': '2 Timoteo',
    'tit': 'Tito',
    'flm': 'Filemón',
    'heb': 'Hebreos',
    'stg': 'Santiago', 'sant': 'Santiago',
    '1p': '1 Pedro', '1pe': '1 Pedro',
    '2p': '2 Pedro', '2pe': '2 Pedro',
    '1jn': '1 Juan', '1jua': '1 Juan',
    '2jn': '2 Juan', '2jua': '2 Juan',
    '3jn': '3 Juan', '3jua': '3 Juan',
    'jud': 'Judas',
    'ap': 'Apocalipsis', 'apoc': 'Apocalipsis'
};

function handleQuickSearch(query) {
    if (!query) return;
    const cleanQuery = query.trim().toLowerCase();

    // 1. Intentar búsqueda por Cita (Ej: "Juan 3:16", "Gn 1", "Mateo 5:9")
    // Regex mejorado: (Opcional número) (Nombre Libro) (Espacios) (Opcional Capítulo) (Opcional : Versículo)
    const citaRegex = /^((?:\d\s*)?[a-zA-ZáéíóúÁÉÍÓÚñÑ]+.*?)(?:\s+(\d+)(?:[:\.\s]+(\d+))?)?$/;
    const parts = cleanQuery.match(citaRegex);

    if (parts) {
        let bookNameStr = parts[1].trim();
        const chapNum = parts[2] ? parseInt(parts[2]) : null;
        const verseNum = parts[3] ? parseInt(parts[3]) : null;

        // Normalizar abreviaturas (ej: "jn" -> "juan")
        if (BIBLE_ABBREVS[bookNameStr]) {
            bookNameStr = BIBLE_ABBREVS[bookNameStr].toLowerCase();
        }

        // Normalizar (quitar acentos) tanto el input como los nombres de libros
        const normalize = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
        const normalizedSearch = normalize(bookNameStr);

        // Búsqueda aproximada del libro
        const bookIndex = bibleState.data.findIndex(b =>
            normalize(b.name).startsWith(normalizedSearch) ||
            (b.abbrev && normalize(b.abbrev) === normalizedSearch)
        );

        if (bookIndex >= 0) {
            selectBook(bookIndex);

            // Si hay capítulo, navegar a él
            if (chapNum !== null) {
                const chapIdx = chapNum - 1;
                if (bibleState.data[bookIndex].chapters[chapIdx]) {
                    selectChapter(chapIdx);

                    // Si hay versículo, seleccionarlo
                    if (verseNum !== null) {
                        const verseIdx = verseNum - 1;
                        setTimeout(() => {
                            const list = document.getElementById('versesList');
                            if (list && list.children[verseIdx]) {
                                list.children[verseIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
                                selectVerse(verseIdx);
                            }
                        }, 100);
                    }
                }
            }
            return; // Éxito en búsqueda por cita/libro
        }
    }

    // 2. Si no es cita, intentar búsqueda por TEXTO (Frase)
    performTextSearch(query);
}

function performTextSearch(query) {
    const normalize = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    const term = normalize(query.trim());

    if (term.length < 3) {
        showToast("Escribe al menos 3 caracteres para buscar frases", "error");
        return;
    }

    const results = [];
    const maxResults = 100;

    // Iterar toda la biblia
    for (let b = 0; b < bibleState.data.length; b++) {
        const book = bibleState.data[b];
        for (let c = 0; c < book.chapters.length; c++) {
            const chapter = book.chapters[c];
            for (let v = 0; v < chapter.verses.length; v++) {
                const text = chapter.verses[v];
                const normalizedText = normalize(text);

                if (normalizedText.includes(term)) {
                    results.push({
                        bookIdx: b,
                        chapIdx: c,
                        verseIdx: v,
                        bookName: book.name,
                        chapNum: chapter.number,
                        verseNum: v + 1,
                        text: text
                    });
                    if (results.length >= maxResults) break;
                }
            }
            if (results.length >= maxResults) break;
        }
        if (results.length >= maxResults) break;
    }

    renderSearchResults(results, query);
}

function renderSearchResults(results, term) {
    const list = document.getElementById('versesList');
    if (!list) return;
    list.innerHTML = '';

    const header = document.getElementById('verseHeader');
    if (header) header.innerText = `Resultados: "${term}" (${results.length})`;

    if (results.length === 0) {
        list.innerHTML = `
            <div style="padding: 30px; text-align: center; color: var(--text-muted); opacity: 0.7;">
                <div style="font-size: 40px; margin-bottom: 10px;">[SEARCH]</div>
                <div>No se encontraron resultados para "${term}"</div>
                <div style="font-size: 11px; margin-top: 5px;">Intenta buscar sin acentos o con palabras más simples.</div>
            </div>
        `;
        return;
    }

    results.forEach(res => {
        const item = document.createElement('div');
        item.className = 'list-item bible-verse-item';
        item.style.cursor = 'pointer';

        // Estructura de resultado restaurada al estilo original
        item.innerHTML = `
            <div style="margin-bottom: 5px;">
                <strong style="color: var(--accent); font-size: 0.9em;">
                    ${res.bookName} ${res.chapNum}:${res.verseNum}
                </strong>
            </div>
            <div style="font-size: 13px; line-height: 1.4;">
                ${highlightTerm(res.text, term)}
            </div>
        `;

        item.onclick = () => {
            bibleState.currentBook = res.bookIdx;
            bibleState.currentChapter = res.chapIdx;

            filterBooks(); // Resetear filtros de la lista izquierda si los hay
            renderChapters();
            renderVerses();

            setTimeout(() => {
                const vList = document.getElementById('versesList');
                if (vList && vList.children[res.verseIdx]) {
                    vList.children[res.verseIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
                    selectVerse(res.verseIdx);
                }
            }, 50);
        };

        list.appendChild(item);
    });
}

function highlightTerm(text, term) {
    const normalize = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    const normalizedText = normalize(text);
    const normalizedTerm = normalize(term);

    // Si no hay term o es vacío, retornar texto original
    if (!normalizedTerm) return text;

    const index = normalizedText.indexOf(normalizedTerm);
    if (index === -1) return text;

    // Extraer la parte original preservando mayúsculas/acentos
    const originalPart = text.substr(index, term.length);
    const regex = new RegExp(originalPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    return text.replace(regex, `<span style="color: var(--accent); font-weight: bold; text-decoration: underline;">$&</span>`);
}

function nextVerse() {
    if (bibleState.currentBook === null || bibleState.currentChapter === null) return;
    const verses = bibleState.data[bibleState.currentBook].chapters[bibleState.currentChapter].verses;
    if (bibleState.currentVerseIndex < verses.length - 1) {
        selectVerse(bibleState.currentVerseIndex + 1);
        // Scroll automático
        const list = document.getElementById('versesList');
        if (list && list.children[bibleState.currentVerseIndex]) {
            list.children[bibleState.currentVerseIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }
}

function prevVerse() {
    if (bibleState.currentBook === null || bibleState.currentChapter === null) return;
    if (bibleState.currentVerseIndex > 0) {
        selectVerse(bibleState.currentVerseIndex - 1);
        // Scroll automático
        const list = document.getElementById('versesList');
        if (list && list.children[bibleState.currentVerseIndex]) {
            list.children[bibleState.currentVerseIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }
}

window.initBibleSystem = initBibleSystem;
window.nextVerse = nextVerse;
window.prevVerse = prevVerse;
window.changeBibleVersion = changeBibleVersion;
window.toggleBibleHistory = toggleBibleHistory;
window.filterBooks = filterBooks;
window.handleQuickSearch = handleQuickSearch;
window.BIBLE_VERSIONS = BIBLE_VERSIONS;
window.isBibleUnlocked = isBibleUnlocked;
window.unlockBible = unlockBible;
window.updateBibleSelects = updateBibleSelects;
window.clearBibleSearch = clearBibleSearch;
window.toggleBibleClearBtn = toggleBibleClearBtn;
window.selectBook = selectBook;
window.selectChapter = selectChapter;
window.selectVerse = selectVerse;
window.renderBooks = renderBooks;


// ========================================
// INTEGRACIÓN CON CONTROL REMOTO
// ========================================

// Mostrar versículo desde el control remoto
window.showVerseFromRemote = function (verseReference) {
    console.log(`[BIBLE] Buscando versículo desde control remoto: ${verseReference}`);

    // Llamar directamente a handleQuickSearch con el query
    if (typeof handleQuickSearch === 'function') {
        handleQuickSearch(verseReference);
        console.log('[OK] Versículo proyectado desde control remoto');
    } else {
        console.warn('Sistema de búsqueda de versículos no disponible');
    }
};

// Funciones de Navegación Rápida
function prevVerse() {
    if (bibleState.currentVerseIndex > 0) {
        selectVerse(bibleState.currentVerseIndex - 1);
        scrollToVerse(bibleState.currentVerseIndex);
    }
}

function nextVerse() {
    const verses = document.querySelectorAll('#versesList .list-item');
    if (bibleState.currentVerseIndex < verses.length - 1) {
        selectVerse(bibleState.currentVerseIndex + 1);
        scrollToVerse(bibleState.currentVerseIndex);
    }
}

function scrollToVerse(index) {
    const list = document.getElementById('versesList');
    if (list && list.children[index]) {
        list.children[index].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
}

window.prevVerse = prevVerse;
window.nextVerse = nextVerse;
