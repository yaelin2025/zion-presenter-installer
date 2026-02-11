// ============================================
// SONGS & SETLIST MODULE (Modular Architecture)
// ============================================

let songs = [];
let setlist = []; // Array de IDs
let currentSong = null;
let currentStanzaIndex = -1;
let activeListSource = 'library'; // 'library' o 'setlist'

function initSongsSystem() {
    const container = document.getElementById('songsView');
    if (!container) return;

    // 1. Inyectar Estructura Modular
    container.innerHTML = `
        <!-- COLUMNA 1: BIBLIOTECA -->
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
                    <button class="nav-tab active" onclick="setMode('songs')">Cantos</button>
                    <button class="nav-tab" onclick="setMode('bible')">Biblia</button>
                    <button class="nav-tab" onclick="setMode('announcements')">Anuncios</button>
                    <button class="nav-tab" onclick="setMode('presentations')">Slides</button>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
                <div style="position: relative; width: 100%;">
                    <input type="text" id="searchInput" placeholder="Buscar canto..." style="width: 100%; padding: 8px 35px 8px 10px; font-size: 13px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 0;" oninput="handleSearchInput()">
                    <button id="clearSearchBtn" class="btn-clear-input" onclick="clearSearch()" style="display: none;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button class="primary" onclick="addNewSong()" style="flex: 1; font-size: 11px; padding: 6px; height: 30px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span>+</span> NUEVO CANTO
                    </button>
                </div>
            </div>
            <div class="scroll-list" id="libraryList" data-scroll-listener="false"></div>
            <div style="margin-top: 10px; display: flex; gap: 5px;">
                <button class="secondary" style="flex:1; font-size: 10px;" onclick="importDatabase()">Importar</button>
                <button class="secondary" style="flex:1; font-size: 10px;" onclick="cleanupDuplicates()" title="Elimina cantos con el mismo título y letra">Limpiar</button>
                <button class="secondary" style="flex:1; font-size: 10px;" onclick="exportToJS()" title="Guardar cambios en la base de datos">Guardar DB</button>
                <button class="danger" style="flex:1; font-size: 10px;" onclick="deleteAllSongs()" title="Borrar TODOS los cantos de la base de datos">Borrar Todo</button>
            </div>
        </div>

        <!-- COLUMNA 2: LISTA DE HOY -->
        <div class="glass-card col-setlist" style="grid-column: 2; grid-row: 1;">
            <h2>Lista de Hoy</h2>
            <div class="scroll-list" id="setlistList">
                <div class="list-item" style="justify-content:center; color:rgba(255,255,255,0.4);">Lista vacía</div>
            </div>
            <button class="secondary" onclick="clearSetlist()" style="margin-top:10px;">Limpiar Lista</button>
        </div>

        <!-- COLUMNA 3: EN VIVO -->
        <div class="glass-card col-live" style="grid-column: 3; grid-row: 1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <!-- Indicador LED Premium -->
                    <div id="netStatus_songs" title="Estado de la Red" 
                        style="width: 14px; height: 14px; border-radius: 50%; background: #666; 
                               border: 2px solid rgba(255,255,255,0.2); transition: all 0.3s;"></div>
                    <h2 style="margin:0; border:none; padding:0;">Control En Vivo</h2>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <button class="icon-btn btn-cast-jump" onclick="setMode('cast')" title="Zion Cast" style="color: #00e5ff;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path>
                        </svg>
                    </button>
                    <button class="icon-btn btn-resources" onclick="toggleResourcesModal()" title="Biblias y Biblioteca">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                    </button>
                    <button class="icon-btn btn-theme-toggle" onclick="toggleLightMode()" title="Tema">
                        <svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    </button>
                    <button class="icon-btn btn-remote" onclick="showRemoteQR()" title="Control Remoto">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12" y2="18"></line></svg>
                    </button>
                    <button id="btnOpenOverlaySongs" class="primary icon-btn btn-overlay-main" onclick="openOverlay()" title="Pantalla de Proyección">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </button>
                </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
                <!-- Botón Anterior -->
                <button class="secondary" onclick="prevSlide()" style="height: 100px; min-width: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;" title="Anterior">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                <!-- Monitor Central -->
                <div class="slide-preview" id="livePreview" style="margin: 0; flex: 1; position: relative; overflow: hidden;">
                    <div class="monitor-ear" onclick="blackout()" title="Blackout">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                    </div>

                    <div class="zion-watermark" style="opacity:0.12; transform: scale(0.65); pointer-events:none; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <img src="img/solologo.png" alt="" style="width: 70px; height: 70px; object-fit: contain;">
                        <div style="text-align:left;">
                            <div style="font-weight:900; font-size:26px; letter-spacing:1px; color:currentColor; line-height:0.8;">ZION</div>
                            <div style="font-weight:300; font-size:13px; letter-spacing:3px; color:currentColor; line-height:1; margin-top:2px;">PRESENTER</div>
                        </div>
                    </div>
                </div>

                <!-- Botón Siguiente (Derecha) -->
                <button class="secondary" onclick="nextSlide()" style="height: 100px; min-width: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;" title="Siguiente">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
            
            <h2 style="margin-top: 15px;">Estrofas del Canto Actual</h2>
            <div class="scroll-list" id="currentLyricsList">
                <div class="list-item" style="justify-content: center; color: rgba(255,255,255,0.4);">Selecciona un canto</div>
            </div>
        </div>
    `;

    renderLibrary();
    renderSetlist();
    if (typeof updateNetworkUI === 'function') updateNetworkUI();
    // Forzar actualización visual del monitor para usar el estilo global (background + logo grande)
    if (window.refreshAllMonitors) setTimeout(window.refreshAllMonitors, 100);
}

function saveData() {
    try {
        const songsToSave = songs.filter(s => s.source !== 'file' || s.edited === true);
        localStorage.setItem('bosquejos_songs', JSON.stringify(songsToSave));
        localStorage.setItem('bosquejos_setlist', JSON.stringify(setlist));
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn("Espacio lleno");
            if (typeof showToast === 'function') showToast("MB. Memoria llena. No se pueden guardar más cambios.", 'error');
        } else {
            console.error("Error al guardar:", e);
        }
    }
}

// Variables para Scroll Infinito
let currentFilteredSongs = [];
let loadedCount = 0;
const BATCH_SIZE = 50;

function renderLibrary(forceCount) {
    const list = document.getElementById('libraryList');
    if (!list) return;
    const searchInput = document.getElementById('searchInput');
    const termRaw = searchInput ? searchInput.value : '';
    const normalize = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    const term = normalize(termRaw);

    currentFilteredSongs = songs.filter(s => {
        if (!s._search) {
            const norm = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
            s._search = norm(s.title) + " " + norm(s.lyrics) + " " + norm(s.singer || "");
        }
        return s._search.includes(term);
    });

    const targetCount = forceCount || BATCH_SIZE; // Usar el conteo previo si existe
    list.innerHTML = '';
    loadedCount = 0;

    if (list.dataset.scrollListener !== 'true') {
        let scrollTimeout = null;
        list.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (list.scrollTop + list.clientHeight >= list.scrollHeight - 100) {
                    renderBatch();
                }
            }, 50);
        });
        list.dataset.scrollListener = 'true';
    }

    renderBatch(targetCount);
}

function renderBatch(batchSize) {
    const size = batchSize || BATCH_SIZE;
    if (loadedCount >= currentFilteredSongs.length) return;
    const list = document.getElementById('libraryList');
    if (!list) return;

    const nextBatch = currentFilteredSongs.slice(loadedCount, loadedCount + size);
    const fragment = document.createDocumentFragment();

    nextBatch.forEach(song => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.dataset.id = song.id;
        if (currentSong && currentSong.id === song.id) item.classList.add('active');

        item.innerHTML = `
            <div style="flex:1; overflow:hidden; display: flex; flex-direction: column; pointer-events: none;">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight: 600;">${song.title}</span>
                ${song.singer ? `<span style="font-size: 10px; opacity: 0.5; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Líder: ${song.singer}</span>` : ''}
            </div>
            <div style="display:flex; gap:5px; align-items: center;">
                <button class="primary" style="padding:0; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center;" onclick="addToSetlist('${song.id}', event)" title="Agregar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button class="secondary" style="padding:0; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center;" onclick="editSong('${song.id}', event)" title="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="danger" style="padding:0; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center;" onclick="deleteSong('${song.id}', event)" title="Borrar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;

        item.onclick = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            selectSong(song, 'library');
        };
        fragment.appendChild(item);
    });

    requestAnimationFrame(() => {
        list.appendChild(fragment);
    });

    loadedCount += nextBatch.length;
}

function renderSetlist() {
    const list = document.getElementById('setlistList');
    if (!list) return;
    list.innerHTML = '';
    if (setlist.length === 0) {
        list.innerHTML = '<div class="list-item" style="justify-content:center; color:rgba(255,255,255,0.4);">Lista vacía</div>';
        return;
    }

    setlist.forEach((songId, index) => {
        const song = songs.find(s => s.id === songId);
        if (!song) return;

        const div = document.createElement('div');
        div.className = 'list-item';
        if (currentSong && currentSong.id === song.id) div.classList.add('active');

        div.draggable = true;
        div.dataset.index = index;
        div.ondragstart = handleDragStart;
        div.ondragover = handleDragOver;
        div.ondragleave = handleDragLeave;
        div.ondrop = handleDrop;
        div.ondragend = handleDragEnd;

        div.innerHTML = `
            <div class="drag-handle" title="Arrastrar para reordenar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="8" y1="18" x2="16" y2="18"></line></svg>
            </div>
            <div style="flex:1; overflow:hidden; display: flex; flex-direction: column; pointer-events:none;">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight: 500;">${index + 1}. ${song.title}</span>
                ${song.singer ? `<span style="font-size: 8px; opacity: 0.5;">${song.singer}</span>` : ''}
            </div>
            <div style="display:flex; gap:5px; align-items: center;">
                <button class="secondary" style="padding:0; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center;" onclick="editSong('${song.id}', event)" title="Editar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="danger" style="padding:0; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center;" onclick="event.stopPropagation(); removeFromSetlist(${index}, event)" title="Quitar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;
        div.onclick = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            selectSong(song, 'setlist');
        };
        list.appendChild(div);
    });
}

// Drag & Drop con feedback mejorado
let draggedItemIndex = null;

function handleDragStart(e) {
    const item = e.target.closest('.list-item');
    if (!item) return;
    draggedItemIndex = Number(item.dataset.index);

    // Necesario para que algunos navegadores en Windows no muestren el ícono de "prohibido"
    e.dataTransfer.setData('text/plain', draggedItemIndex);
    e.dataTransfer.effectAllowed = 'move';

    setTimeout(() => {
        item.classList.add('dragging');
        document.body.classList.add('is-dragging');
    }, 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest('.list-item');
    if (item && Number(item.dataset.index) !== draggedItemIndex) {
        item.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const item = e.target.closest('.list-item');
    if (item) item.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target.closest('.list-item');
    if (target) target.classList.remove('drag-over');

    if (!target) return;
    const targetIndex = Number(target.dataset.index);

    if (draggedItemIndex !== null && draggedItemIndex !== targetIndex) {
        const itemToMove = setlist[draggedItemIndex];
        setlist.splice(draggedItemIndex, 1);
        setlist.splice(targetIndex, 0, itemToMove);
        saveData();
        renderSetlist();
    }
    draggedItemIndex = null;
}

function handleDragEnd(e) {
    const item = e.target.closest('.list-item');
    if (item) item.classList.remove('dragging');
    document.body.classList.remove('is-dragging');
    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('drag-over'));
    draggedItemIndex = null;
}

function addToSetlist(id, event) {
    if (event) event.stopPropagation();
    const song = songs.find(s => s.id === id);
    if (!song) return;
    setlist.push(id);
    saveData();
    renderSetlist();
}

function removeFromSetlist(index, event) {
    if (event) event.stopPropagation();
    setlist.splice(index, 1);
    saveData();
    renderSetlist();
}

function clearSetlist() {
    if (typeof showConfirm === 'function') {
        showConfirm('¿Limpiar la lista de hoy?', () => {
            setlist = [];
            saveData();
            renderSetlist();
        });
    } else {
        setlist = [];
        saveData();
        renderSetlist();
    }
}

function selectSong(song, source = 'library') {
    currentSong = song;
    activeListSource = source;
    const list = document.getElementById('currentLyricsList');
    if (!list) return;
    list.innerHTML = '';
    list.scrollTop = 0; // Resetear scroll al inicio
    const stanzas = song.lyrics.split(/\n\s*\n/).filter(line => line.trim() !== '');
    stanzas.forEach((stanza, index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'flex-start';
        item.style.flexShrink = '0';
        item.style.height = 'auto';
        item.style.gap = '4px';
        item.style.padding = '5px 8px';
        item.style.minHeight = '0';
        item.innerHTML = `<div style="white-space: pre-wrap; line-height: 1.2; font-size: 12px; pointer-events: none;">${stanza}</div>`;
        item.onclick = () => projectStanza(index);
        list.appendChild(item);
    });
    updatePreviewText('livePreview', "[ LISTO ]");
    currentStanzaIndex = -1;

    // Sincronizar UI en ambas listas
    renderSetlist();
    const libraryList = document.getElementById('libraryList');
    if (libraryList) {
        const oldActives = libraryList.querySelectorAll('.active');
        oldActives.forEach(el => el.classList.remove('active'));
        const newActive = libraryList.querySelector(`.list-item[data-id="${song.id}"]`);
        if (newActive) newActive.classList.add('active');
    }
}

function addNewSong() {
    if (typeof toggleOptionsPanel === 'function') toggleOptionsPanel(false);
    document.getElementById('songId').value = '';
    document.getElementById('songTitle').value = '';
    document.getElementById('songLyrics').value = '';
    const singerInput = document.getElementById('songSinger');
    if (singerInput) singerInput.value = '';
    document.getElementById('modalTitle').innerText = 'Nuevo Canto';
    document.getElementById('songModal').style.display = 'flex';
    document.getElementById('songModal').classList.add('active');
    updateSongPreview();
    setTimeout(() => document.getElementById('songTitle').focus(), 50);
}

function editSong(id, event) {
    if (event) event.stopPropagation();
    if (typeof toggleOptionsPanel === 'function') toggleOptionsPanel(false);
    const song = songs.find(s => s.id === id);
    if (!song) return;
    document.getElementById('songId').value = song.id;
    document.getElementById('songTitle').value = song.title;
    document.getElementById('songLyrics').value = song.lyrics;
    const singerInput = document.getElementById('songSinger');
    if (singerInput) singerInput.value = song.singer || '';

    document.getElementById('modalTitle').innerText = 'Editar Canto';
    document.getElementById('songModal').style.display = 'flex';
    document.getElementById('songModal').classList.add('active');
    updateSongPreview();
    setTimeout(() => document.getElementById('songLyrics').focus(), 50);
}

function saveSong() {
    const id = document.getElementById('songId').value;
    const title = document.getElementById('songTitle').value;
    const lyrics = document.getElementById('songLyrics').value;
    const singer = document.getElementById('songSinger')?.value || '';
    if (!title || !lyrics) {
        if (typeof showToast === 'function') showToast("El título y la letra son obligatorios", "error");
        return;
    }

    // Guardar posiciones y estado actual
    const libList = document.getElementById('libraryList');
    const setList = document.getElementById('setlistList');
    const libScroll = libList ? libList.scrollTop : 0;
    const setScroll = setList ? setList.scrollTop : 0;
    const currentLoaded = Math.max(loadedCount, BATCH_SIZE); // Cuántos cantos había cargados

    if (id) {
        const index = songs.findIndex(s => s.id === id);
        if (index !== -1) {
            // Limpiar caché de búsqueda para que se actualice el visual
            delete songs[index]._search;
            songs[index] = { ...songs[index], title, lyrics, singer, edited: true };
            if (currentSong && currentSong.id === id) selectSong(songs[index], activeListSource);
        }
    } else {
        songs.push({ id: Date.now().toString(), title, lyrics, singer, source: 'local' });
    }

    saveData();
    renderLibrary(currentLoaded); // IMPORTANTE: Redibujar la misma cantidad que había
    renderSetlist();

    // Restaurar scroll (Usando un pequeño delay para asegurar que el DOM se haya renderizado y calculado alturas)
    setTimeout(() => {
        if (libList) libList.scrollTop = libScroll;
        if (setList) setList.scrollTop = setScroll;
    }, 50);

    closeSongModal();
}

function deleteSong(id, event) {
    if (event) event.stopPropagation();
    songs = songs.filter(s => s.id !== id);
    if (songs.length === 0) {
        localStorage.removeItem('zion_library_loaded');
    }
    saveData();
    renderLibrary();
}

function closeSongModal() {
    const modal = document.getElementById('songModal');
    if (!modal) return;

    // Cerrar directamente sin animaciones
    modal.style.display = 'none';
}

function projectStanza(index) {
    if (!currentSong) return;
    const stanzas = currentSong.lyrics.split(/\n\s*\n/).filter(line => line.trim() !== '');
    if (index < 0 || index >= stanzas.length) return;

    currentStanzaIndex = index;
    const text = stanzas[index];
    updatePreviewText('livePreview', text);

    if (typeof bc !== 'undefined') {
        bc.postMessage({
            type: 'slide',
            payload: { lines: [text], title: "", author: currentSong.author || "", isBible: false }
        });
    }

    const list = document.getElementById('currentLyricsList');
    if (list) {
        Array.from(list.children).forEach((child, i) => {
            if (i === index) {
                child.classList.add('active');
                let targetScroll = child.offsetTop - (list.clientHeight / 2) + (child.clientHeight / 2);
                list.scrollTo({ top: targetScroll < 0 ? 0 : targetScroll, behavior: 'smooth' });
            } else {
                child.classList.remove('active');
            }
        });
    }
}

function prevSongSlide() {
    if (currentStanzaIndex > 0) projectStanza(currentStanzaIndex - 1);
}

function nextSongSlide() {
    if (currentSong) {
        const stanzas = currentSong.lyrics.split(/\n\s*\n/).filter(line => line.trim() !== '');
        if (currentStanzaIndex < stanzas.length - 1) projectStanza(currentStanzaIndex + 1);
    }
}

function exportToJS() {
    const exportData = songs.map(s => ({
        id: s.id,
        ti: s.title,
        le: s.lyrics,
        cantante: s.singer || "",
        estilo: s.style || "0"
    }));
    const jsContent = `var jscanciones = ${JSON.stringify(exportData, null, 0)}; `;

    // HACK: Eliminado soporte de Electron para unificar a descarga web estándar
    const blob = new Blob([jsContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Canciones.js`;
    a.click();
}

function cleanupDuplicates() {
    const originalCount = songs.length;
    const seen = new Set();
    const uniqueSongs = [];

    songs.forEach(song => {
        // Normalizar para comparar: título + letra (sin espacios extras ni mayúsculas)
        const contentKey = (song.title + song.lyrics)
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();

        if (!seen.has(contentKey)) {
            seen.add(contentKey);
            uniqueSongs.push(song);
        }
    });

    const removedCount = originalCount - uniqueSongs.length;

    if (removedCount > 0) {
        if (typeof showConfirm === 'function') {
            showConfirm(`Se encontraron ${removedCount} cantos repetidos. ¿Deseas eliminarlos?`, () => {
                songs = uniqueSongs;
                saveData();
                renderLibrary();
                if (typeof showToast === 'function') showToast(`[OK] Se eliminaron ${removedCount} duplicados.`, 'success');
            });
        } else {
            songs = uniqueSongs;
            saveData();
            renderLibrary();
            alert(`Se eliminaron ${removedCount} duplicados.`);
        }
    } else {
        if (typeof showToast === 'function') {
            showToast("No se encontraron cantos repetidos.", 'info');
        } else {
            alert("No se encontraron cantos repetidos.");
        }
    }
}

function deleteAllSongs() {
    const confirmation = confirm("¿ESTÁS SEGURO?\n\nEsta acción eliminará TODOS los cantos de tu biblioteca permanentemente. No se puede deshacer.");
    if (confirmation) {
        const doubleConfirmation = confirm("CONFIRMACIÓN FINAL\n\n¿Realmente deseas borrar TODA la base de datos de cantos?");
        if (doubleConfirmation) {
            // Guardar IDs borrados para que no vuelvan a aparecer al recargar si vienen de archivo
            const deletedIds = songs.map(s => s.id);
            const currentDeletedIds = JSON.parse(localStorage.getItem('bosquejos_deleted_ids') || '[]');
            const newDeletedIds = [...new Set([...currentDeletedIds, ...deletedIds])];
            localStorage.setItem('bosquejos_deleted_ids', JSON.stringify(newDeletedIds));

            songs = [];
            localStorage.removeItem('zion_library_loaded');
            saveData();
            renderLibrary();
            if (typeof showToast === 'function') {
                showToast("Biblioteca vaciada correctamente.", 'success');
            } else {
                alert("Biblioteca vaciada.");
            }
        }
    }
}

function importDatabase() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.js'; // Acepta ambos formatos
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => {
            try {
                let content = event.target.result;
                let imported;

                // Si es un archivo .js, extraer el JSON del formato 'var jscanciones = ...'
                if (file.name.endsWith('.js')) {
                    const jsonStr = content.replace(/^var\s+jscanciones\s*=\s*/, '').replace(/;\s*$/, '');
                    imported = JSON.parse(jsonStr);
                } else {
                    // Si es .json, parsear directamente
                    imported = JSON.parse(content);
                }

                if (Array.isArray(imported)) {
                    // Normalizar formato si viene del .js (ti/le -> title/lyrics)
                    songs = imported.map(s => ({
                        id: s.id || generateUUID(),
                        title: s.title || s.ti,
                        lyrics: s.lyrics || s.le,
                        singer: s.singer || s.cantante || ""
                    }));
                    saveData();
                    renderLibrary();
                    if (typeof showToast === 'function') {
                        showToast(`${songs.length} cantos importados correctamente`, 'success');
                    }
                }
            } catch (err) {
                console.error('Error al importar:', err);
                if (typeof showToast === 'function') {
                    showToast('Error al importar el archivo', 'error');
                }
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function toggleClearBtn() {
    const input = document.getElementById('searchInput');
    const btn = document.getElementById('clearSearchBtn');
    if (input && btn) btn.style.display = input.value.length > 0 ? 'block' : 'none';
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
        toggleClearBtn();
        renderLibrary();
        input.focus();
    }
}

// DEBOUNCE SEARCH
let searchTimer = null;
function handleSearchInput() {
    toggleClearBtn();
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        renderLibrary();
    }, 300); // 300ms de calma
}

window.handleSearchInput = handleSearchInput;
window.initSongsSystem = initSongsSystem;
window.renderSetlist = renderSetlist;
window.addToSetlist = addToSetlist;
window.removeFromSetlist = removeFromSetlist;
window.clearSetlist = clearSetlist;
window.toggleClearBtn = toggleClearBtn;
window.clearSearch = clearSearch;
window.prevSongSlide = prevSongSlide;
window.nextSongSlide = nextSongSlide;
window.saveSong = saveSong;
window.closeSongModal = closeSongModal;
if (typeof closeModal === 'function') window.closeModal = closeModal;
window.deleteAllSongs = deleteAllSongs;

// LIVE PREVIEW LOGIC
function updateSongPreview() {
    const lyrics = document.getElementById('songLyrics').value;
    const previewContainer = document.getElementById('songLivePreview');
    const counter = document.getElementById('slideCounter');
    if (!previewContainer) return;

    if (!lyrics.trim()) {
        previewContainer.innerHTML = '<div style="height: 100%; display: flex; align-items: center; justify-content: center; opacity: 0.3; text-align: center; padding: 20px;">Escribe para ver como se verán las diapositivas.</div>';
        if (counter) counter.innerText = '0 Diapositivas';
        return;
    }

    const stanzas = lyrics.split(/\n\s*\n/).filter(s => s.trim() !== '');
    if (counter) counter.innerText = `${stanzas.length} Diapositiva${stanzas.length !== 1 ? 's' : ''}`;

    previewContainer.innerHTML = stanzas.map((stanza, idx) => `
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; position: relative;">
            <div style="position: absolute; top: 5px; right: 8px; font-size: 9px; opacity: 0.4;">#${idx + 1}</div>
            <div style="font-size: 13px; white-space: pre-wrap; color: rgba(255,255,255,0.8);">${stanza.trim()}</div>
        </div>
    `).join('');
}

window.updateSongPreview = updateSongPreview;

// Atajos de teclado para el Modal
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('songModal');
    if (modal && (modal.style.display === 'flex' || modal.classList.contains('active'))) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            saveSong();
        }
    }
});

// ========================================
// INTEGRACIÓN CON CONTROL REMOTO
// ========================================

// Función para seleccionar un canto por índice (llamada desde el control remoto)
window.selectSongByIndex = function (index) {
    try {
        const setlistData = localStorage.getItem('bosquejos_setlist');
        const songsData = localStorage.getItem('bosquejos_songs');

        if (!setlistData || !songsData) {
            console.error('No hay cantos en la lista');
            return;
        }

        const setlist = JSON.parse(setlistData); // IDs
        const songs = JSON.parse(songsData); // Objetos completos

        if (index < 0 || index >= setlist.length) {
            console.error(`Índice de canto inválido: ${index}`);
            return;
        }

        const songId = setlist[index];
        const song = songs.find(s => s.id === songId);

        if (!song) {
            console.error(`Canto no encontrado con ID: ${songId}`);
            return;
        }

        console.log(`[SONG] Proyectando canto desde control remoto:`, song.title);

        // Llamar a la función de proyección de canto
        if (typeof showSong === 'function') {
            showSong(song);
        }

        // Notificar al control remoto cuál está activo
        if (typeof networkSocket !== 'undefined' && networkSocket) {
            const room = window.zionRoomCode || localStorage.getItem('zion_panel_room');
            networkSocket.emit('remote_action', {
                type: 'active_song',
                index: index,
                room: room
            });
        }
    } catch (e) {
        console.error('Error al seleccionar canto:', e);
    }
};

// Exponer arrays globalmente para acceso desde otros módulos
window.songs = songs;
window.setlist = setlist;
