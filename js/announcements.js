// ============================================
// ANNOUNCEMENTS MODULE (Modular Architecture)
// ============================================

const annState = {
    list: [],
    mediaSources: [],
    currentId: null,
    activeMediaId: null,
    isPlaying: false
};

function initAnnouncementsSystem() {
    const container = document.getElementById('announcementsView');
    if (!container) return;

    // 1. Inyectar Estructura Modular
    container.innerHTML = `
        <!-- COL 1: BIBLIOTECA DE ANUNCIOS -->
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
                    <button class="nav-tab" onclick="setMode('bible')">Biblia</button>
                    <button class="nav-tab active" onclick="setMode('announcements')">Anuncios</button>
                    <button class="nav-tab" onclick="setMode('presentations')">Slides</button>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
                <h3 style="margin:0; font-size:11px; opacity:0.9; border-bottom: none; color: var(--section-header-text); font-weight: 700;">LISTADO</h3>
                <div style="display:flex; align-items:center; gap:5px;">
                    <input type="number" id="presentationDuration" value="${localStorage.getItem('announcement_duration') || '7'}" style="width:35px; font-size:10px; padding:2px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:white; text-align:center; margin-bottom: 0;" title="Segundos por diapositiva" oninput="localStorage.setItem('announcement_duration', this.value)">
                    <button id="btnStartPresentation" class="primary" style="font-size:10px; padding: 2px 8px; display:flex; align-items:center;" onclick="togglePresentationMode()" title="Reproducción automática de anuncios">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        AUTO
                    </button>
                </div>
            </div>
            <div class="search-box" style="margin-bottom: 10px;">
                <button class="primary" onclick="createNewAnnouncement()" style="width: 100%; font-size: 11px; padding: 6px; height: 30px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                    <span>+</span> NUEVO ANUNCIO
                </button>
            </div>
            <div class="scroll-list" id="announcementsList"></div>
        </div>

        <!-- COL 2: EDITOR -->
        <div class="glass-card col-setlist" style="grid-column: 2; grid-row: 1; display:flex; flex-direction:column;">
            <h2 style="margin-bottom: 10px;">Editar Anuncio</h2>
            <input type="text" id="editAnnTitle" placeholder="Título (Opcional)" style="margin-bottom: 10px; font-weight: bold;" oninput="saveCurrentAnnouncement()">
            <textarea id="editAnnBody" placeholder="Escribe el contenido del anuncio aquí..." style="flex: 1; resize: none; font-size: 16px; min-height: 0; margin-bottom: 10px;" oninput="saveCurrentAnnouncement()"></textarea>
            <div style="display: flex; gap: 10px;">
                <button class="primary" style="flex: 1; height: 50px; font-size: 16px;" onclick="projectCurrentAnnouncement()">PROYECTAR ANUNCIO</button>
            </div>

            <!-- TICKER SIEMPRE VISIBLE -->
            <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--section-header-text);">TICKER</span>
                </div>
                
                <div id="tickerControls" style="padding-top: 10px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div class="control-group" style="display: flex; align-items: center; justify-content: space-between;">
                            <label style="font-weight: 600; font-size: 12px; opacity: 0.8;">Activar</label>
                            <button id="tickerToggleBtn" onclick="toggleTickerEnabled()" 
                                style="width: 48px; height: 28px; border-radius: 14px; border: 2px solid var(--card-border); background: var(--bg); cursor: pointer; position: relative; transition: all 0.3s; padding: 0;">
                                <svg id="tickerPowerIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.5; transition: all 0.3s;">
                                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                    <line x1="12" y1="2" x2="12" y2="12"></line>
                                </svg>
                            </button>
                        </div>

                        <div class="control-group">
                            <label style="font-weight: 600; font-size: 12px; opacity: 0.8;">Texto</label>
                            <input type="text" id="tickerText"
                                placeholder="Ej: ¡Bienvenidos a la Casa de Dios! Servicio a las 7pm"
                                oninput="updateTicker()"
                                style="width: 100%; padding: 10px; font-size: 14px; border-radius: 6px; border: 1px solid var(--card-border); background: var(--card-bg); color: var(--text);">
                        </div>

                        <div class="control-group">
                            <label style="font-weight: 600; font-size: 12px; opacity: 0.8;">Tamaño</label>
                            <input type="range" id="tickerSize" min="1" max="8" value="3" oninput="updateTicker()" style="width: 100%;">
                            <small style="opacity: 0.6; font-size: 11px;">Pequeño ←→ Gigante</small>
                        </div>

                        <div class="control-group">
                            <label style="font-weight: 600; font-size: 12px; opacity: 0.8;">Velocidad</label>
                            <input type="range" id="tickerSpeed" min="1" max="10" value="5" oninput="updateTicker()" style="width: 100%;">
                        </div>

                        <div class="control-group">
                            <label style="font-weight: 600; font-size: 12px; opacity: 0.8;">Posición</label>
                            <select id="tickerPosition" onchange="updateTicker()"
                                style="width: 100%; padding: 8px; font-size: 14px; border-radius: 6px; border: 1px solid var(--card-border); background: var(--card-bg); color: var(--text);">
                                <option value="bottom">Inferior</option>
                                <option value="top">Superior</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- COL 3: MONITOR LIVE -->
        <div class="glass-card col-live" style="grid-column: 3; grid-row: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <!-- Indicador LED Premium (Reemplaza al Logo) -->
                    <div id="netStatus_announcements" title="Estado de la Red" 
                        style="width: clamp(12px, 1.5vw, 18px); 
                               height: clamp(12px, 1.5vw, 18px); 
                               border-radius: 50%; background: #666; 
                               border: 2px solid rgba(255,255,255,0.2); 
                               box-shadow: inset 0 1px 2px rgba(255,255,255,0.2), 0 0 5px rgba(0,0,0,0.5);
                               transition: all 0.3s; flex-shrink: 0;"></div>
                    <h2 style="margin:0; border:none; padding:0;">VISTA EN VIVO</h2>
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
                    <button id="btnOpenOverlayAnnouncements" class="primary icon-btn btn-overlay-main" onclick="openOverlay()" title="Pantalla de Proyección">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </button>
                </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
                <!-- Botón Anuncio Anterior -->
                <button class="secondary" onclick="prevAnnouncement()" style="height: 100px; min-width: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;" title="Anuncio Anterior">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                <!-- Monitor Central -->
                <div class="slide-preview" id="announcementLivePreview" style="margin: 0; flex: 1; position: relative; overflow: hidden;">
                    <!-- Oreja de Borrado Sutil -->
                    <div class="monitor-ear" onclick="blackout()" title="Borrar Pantalla (Blackout)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                    </div>

                    <div style="display:flex; align-items:center; justify-content:center; opacity:0.12; transform: scale(0.65); pointer-events:none; gap:10px;">
                        <img src="img/solologo.png" alt="Logo" style="width: 70px; height: 70px; object-fit: contain;">
                        <div style="text-align:left;"><div style="font-weight:900; font-size:26px; letter-spacing:1px; color:currentColor; line-height:0.8;">ZION</div><div style="font-weight:300; font-size:13px; letter-spacing:3px; color:currentColor; line-height:1; margin-top:2px;">PRESENTER</div></div>
                    </div>
                </div>

                <!-- Botón Anuncio Siguiente -->
                <button class="secondary" onclick="nextAnnouncement()" style="height: 100px; min-width: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;" title="Anuncio Siguiente">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
            
            <!-- MEDIA PLAYBACK CONTROLS -->
            <div id="mediaPlaybackControls" style="display:none; align-items:center; gap:12px; border-top: 1px solid rgba(128,128,128,0.1); padding-top:12px; margin-top:10px; margin-bottom:12px;">
                <div style="font-size:11px; font-weight:600; opacity:0.7; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" id="activeMediaName">Sin medio activo</div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="primary icon-btn shadow-sm" id="btnPlayPauseMedia" onclick="togglePlayback()" style="width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                        <svg id="svgPlay" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-left:2px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        <svg id="svgPause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
                    </button>
                    <button class="icon-btn-minimal danger" onclick="clearMedia()" title="Quitar Medio" style="width:32px; height:32px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>

            <!-- MEDIA SOURCES PANEL -->
            <div style="display:flex; flex-direction:column; gap:5px; flex: 1; min-height: 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:11px; opacity:0.7;">FUENTES MULTIMEDIA</h3>
                    <button class="secondary" style="font-size:10px; padding: 2px 6px;" onclick="addMediaSource()">+ MEDIA</button>
                    <input type="file" id="mediaInput" style="display:none;" accept="image/*,video/*" multiple onchange="handleMediaSelect(this)">
                </div>
                <div class="scroll-list" id="mediaSourcesList" style="flex:1; background:transparent; border-radius:12px; padding:0; border: 1px solid rgba(128,128,128,0.05);">
                    <!-- Items rendered dynamically -->
                </div>
            </div>
        </div>
    `;

    loadAnnouncements();
    loadMediaSources();
    setupMediaDragAndDrop();
    if (typeof updateNetworkUI === 'function') updateNetworkUI();
    // Forzar actualización visual del monitor para usar el estilo global
    if (window.refreshAllMonitors) setTimeout(window.refreshAllMonitors, 100);
}

function toggleTickerPanel() {
    const controls = document.getElementById('tickerControls');
    const arrow = document.getElementById('tickerToggleArrow');

    if (!controls || !arrow) return;

    if (controls.style.display === 'none') {
        controls.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        controls.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

let tickerEnabled = false;

function toggleTickerEnabled() {
    tickerEnabled = !tickerEnabled;

    const btn = document.getElementById('tickerToggleBtn');
    const icon = document.getElementById('tickerPowerIcon');

    if (!btn || !icon) return;

    if (tickerEnabled) {
        // Encendido
        btn.style.background = 'var(--accent)';
        btn.style.borderColor = 'var(--accent)';
        icon.style.opacity = '1';
        icon.style.stroke = '#fff';
    } else {
        // Apagado
        btn.style.background = 'var(--bg)';
        btn.style.borderColor = 'var(--card-border)';
        icon.style.opacity = '0.5';
        icon.style.stroke = 'currentColor';
    }

    updateTicker();
}

function setupMediaDragAndDrop() {
    const dropZone = document.getElementById('mediaSourcesList');
    if (!dropZone) return;

    // 1. Prevent defaults globally
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    // 2. Performance Optimized Highlight (Class Toggle)
    // dragenter/dragleave fires less frequently than dragover
    let dragCounter = 0; // Fix flickering issue when entering children

    dropZone.addEventListener('dragenter', (e) => {
        dragCounter++;
        dropZone.classList.add('drag-highlight');
    }, false);

    dropZone.addEventListener('dragleave', (e) => {
        dragCounter--;
        if (dragCounter === 0) {
            dropZone.classList.remove('drag-highlight');
        }
    }, false);

    dropZone.addEventListener('drop', (e) => {
        dragCounter = 0;
        dropZone.classList.remove('drag-highlight');
    }, false);

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            processMediaFiles(files);
        }
    }, false);
}

function loadAnnouncements() {
    const saved = localStorage.getItem('bosquejos_announcements_v2');
    if (saved) {
        annState.list = JSON.parse(saved);
    } else {
        annState.list = [
            { id: '1', title: 'Bienvenida', body: '¡Bienvenidos a la Casa de Dios!\nNos alegra tenerte aquí.' },
            { id: '2', title: 'Ofrenda', body: 'Dios ama al dador alegre.\n2 Corintios 9:7' }
        ];
    }
    renderAnnouncementsList();
}

function saveAnnouncementsData() {
    localStorage.setItem('bosquejos_announcements_v2', JSON.stringify(annState.list));
}

function renderAnnouncementsList() {
    const list = document.getElementById('announcementsList');
    if (!list) return;
    list.innerHTML = '';
    annState.list.forEach(ann => {
        const item = document.createElement('div');
        item.className = `list-item ${annState.currentId === ann.id ? 'active' : ''}`;
        item.setAttribute('data-id', ann.id);

        // Preview del cuerpo (primeras palabras)
        const preview = (ann.body || '').split('\n')[0].substring(0, 40) + (ann.body && ann.body.length > 40 ? '...' : '');

        item.innerHTML = `
            <div style="flex:1; min-width:0;">
                <div class="ann-title" style="font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ann.title || 'Sin Título'}</div>
                <div class="ann-preview" style="color:var(--text-muted); font-size:11px; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${preview || 'Sin contenido'}</div>
            </div>
            <button class="danger" style="padding:0 !important; border-radius:50% !important; width:26px !important; height:26px !important; display:flex; align-items:center; justify-content:center; flex-shrink:0;" onclick="event.stopPropagation(); deleteAnnouncement('${ann.id}')" title="Borrar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        item.onclick = () => selectAnnouncement(ann.id);
        list.appendChild(item);
    });
}

function createNewAnnouncement() {
    const newId = Date.now().toString();
    annState.list.push({ id: newId, title: 'Nuevo Anuncio', body: '' });
    saveAnnouncementsData();
    renderAnnouncementsList();
    selectAnnouncement(newId);

    setTimeout(() => {
        const bodyInput = document.getElementById('editAnnBody');
        if (bodyInput) bodyInput.focus();
    }, 50);
}

function deleteAnnouncement(id) {
    annState.list = annState.list.filter(a => a.id !== id);
    if (annState.currentId === id) {
        annState.currentId = null;
        const titleInput = document.getElementById('editAnnTitle');
        const bodyInput = document.getElementById('editAnnBody');
        if (titleInput) titleInput.value = '';
        if (bodyInput) bodyInput.value = '';
    }
    saveAnnouncementsData();
    renderAnnouncementsList();
}

function selectAnnouncement(id) {
    annState.currentId = id;
    const ann = annState.list.find(a => a.id === id);
    if (ann) {
        document.getElementById('editAnnTitle').value = ann.title;
        document.getElementById('editAnnBody').value = ann.body;
    }
    renderAnnouncementsList();
}

let saveTimeout;

function scheduleSaveAnnouncement() {
    // 1. Update internal state immediately so UI doesn't lag
    if (!annState.currentId) return;
    const title = document.getElementById('editAnnTitle').value;
    const body = document.getElementById('editAnnBody').value;
    const ann = annState.list.find(a => a.id === annState.currentId);

    if (ann) {
        ann.title = title;
        ann.body = body;

        // 2. Optimistic UI update
        // Actualizamos el título y el preview en la lista lateral SIN re-renderizar todo
        const listItem = document.querySelector(`.list-item[data-id="${ann.id}"]`);
        if (listItem) {
            const titleEl = listItem.querySelector('.ann-title');
            const previewEl = listItem.querySelector('.ann-preview');
            if (titleEl) titleEl.innerText = title || "Sin Título";
            if (previewEl) {
                const preview = body.split('\n')[0].substring(0, 40) + (body.length > 40 ? '...' : '');
                previewEl.innerText = preview || "Sin contenido";
            }
        }

        // 3. Debounce expensive operations (Storage + Preview Render)
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveAnnouncementsData();
            // ACTUALIZACIÓN DE VISTA PREVIA diferida para evitar lag al escribir
            updatePreviewText('announcementLivePreview', body);
        }, 300); // 300ms de espera es un buen balance
    }
}

// Alias for compatibility with HTML oninput
const saveCurrentAnnouncement = scheduleSaveAnnouncement;

function projectCurrentAnnouncement() {
    const body = document.getElementById('editAnnBody').value;
    // Forzar actualización inmediata al proyectar
    updatePreviewText('announcementLivePreview', body);
    const title = document.getElementById('editAnnTitle').value;
    const lines = body.split('\n').filter(l => l.trim() !== '');

    if (typeof bc !== 'undefined') {
        bc.postMessage({
            type: 'slide',
            payload: {
                lines: lines,
                title: title || "ANUNCIO",
                author: "",
                isBible: false,
                isAnnouncement: true
            }
        });
    }
    updatePreviewText('announcementLivePreview', body);
}

window.initAnnouncementsSystem = initAnnouncementsSystem;
window.createNewAnnouncement = createNewAnnouncement;
window.deleteAnnouncement = deleteAnnouncement;
window.selectAnnouncement = selectAnnouncement;
window.saveCurrentAnnouncement = saveCurrentAnnouncement;
window.projectCurrentAnnouncement = projectCurrentAnnouncement;
window.toggleTickerPanel = toggleTickerPanel;
window.toggleTickerEnabled = toggleTickerEnabled;
// Expose ticker state
Object.defineProperty(window, 'tickerEnabled', {
    get: function () { return tickerEnabled; },
    set: function (value) { tickerEnabled = value; }
});

// ============================================
// LOGICA DE MEDIOS (FOTOS Y VIDEOS)
// ============================================

function loadMediaSources() {
    const saved = localStorage.getItem('bosquejos_ann_media');
    if (saved) {
        annState.mediaSources = JSON.parse(saved);
    } else {
        annState.mediaSources = [];
    }
    renderMediaSources();
}

function saveMediaSources() {
    localStorage.setItem('bosquejos_ann_media', JSON.stringify(annState.mediaSources));
}

async function addMediaSource() {
    let files = [];

    // Usar el input web estándar para compatibilidad universal
    document.getElementById('mediaInput').click();
}

let currentPreviewBlobUrl = null;

async function handleMediaSelect(input) {
    if (input.files && input.files.length > 0) {
        await processMediaFiles(input.files);
        input.value = "";
    }
}

async function processMediaFiles(files) {
    // Procesar archivos secuencialmente
    for (const file of Array.from(files)) {
        // Filtrar solo tipos permitidos
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;

        const isVideo = file.type.startsWith('video');
        const type = isVideo ? 'video' : 'image';
        const id = Date.now().toString() + Math.random().toString().substr(2, 5);

        // LÍMITE TÉRMICO Y DE RENDIMIENTO
        const fileSizeMB = file.size / (1024 * 1024);
        const isHuge = fileSizeMB > 50;

        try {
            console.log(`Procesando archivo: ${file.name} (${fileSizeMB.toFixed(1)} MB)`);

            let mode = 'db';

            // Si es gigante, NO guardar en DB para evitar bloqueo de I/O
            if (isHuge) {
                console.warn("[!] Archivo > 50MB. Modo Memoria Activado (No persistente).");
                mode = 'memory';
            } else if (window.MediaDB) {
                await window.MediaDB.saveFile(id, file);
                console.log("Archivo guardado en DB:", id);
            }

            const newMedia = {
                id: id,
                name: file.name,
                path: id,
                type: type,
                mode: mode,
                file: isHuge ? file : null, // Guardar referencia en memoria si es gigante
                loop: false,
                muted: true,
                fitMode: 'cover'
            };
            annState.mediaSources.push(newMedia);

            if (isHuge && typeof showToast !== 'undefined') {
                showToast(`Info: "${file.name}" disponible solo en esta sesión.`, 'info');
            }

        } catch (e) {
            console.error("Error guardando medio:", e);
            alert(`Error procesando "${file.name}".`);
        }
    }
    // No guardar mediaSources en localStorage si hay referencias a memoria (circular JSON),
    // pero como 'file' no es serializable, JSON.stringify lo ignorará automáticamente.
    // Sin embargo, al recargar, estos items memory-only se perderán, lo cual es el comportamiento esperado.
    saveMediaSources();
    renderMediaSources();
}

function renderMediaSources() {
    const list = document.getElementById('mediaSourcesList');
    if (!list) return;
    list.innerHTML = '';

    annState.mediaSources.forEach(media => {
        const item = document.createElement('div');
        item.className = 'media-item';

        const typeIcon = media.type === 'video'
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';

        // Fit Mode helper
        let fitIcon = '';
        if (media.fitMode === 'cover') {
            fitIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="7"/></svg>';
        } else if (media.fitMode === 'contain') {
            fitIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>';
        } else {
            fitIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12h16M4 12l4-4m-4 4l4 4m12-4l-4-4m4 4l-4 4"/></svg>';
        }

        // Controls Group
        let controlsHtml = `
            <div class="btn-group-capsule">
                <!-- FIT MODE -->
                <button class="icon-btn-minimal ${media.fitMode !== 'cover' ? 'active' : ''}" onclick="toggleFitMode('${media.id}')" title="Modo de ajuste">
                    ${fitIcon}
                </button>
        `;

        if (media.type === 'video') {
            // LOOP BUTTON
            controlsHtml += `
                <button class="icon-btn-minimal ${media.loop ? 'active' : ''}" onclick="toggleLoop('${media.id}')" title="Bucle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="17 1 21 5 17 9"></polyline>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                        <polyline points="7 23 3 19 7 15"></polyline>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                </button>
                <!-- MUTE BUTTON -->
                <button class="icon-btn-minimal ${!media.muted ? 'active' : ''}" onclick="toggleMute('${media.id}')" title="Audio">
                    ${media.muted
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'}
                </button>
            `;
        }
        controlsHtml += '</div>';

        item.innerHTML = `
            <div style="flex-shrink:0; display:flex;">${typeIcon}</div>
            <div style="flex:1; font-size:12px; font-weight:600; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; opacity:0.8;" title="${media.name}">
                ${media.name}
            </div>
            ${controlsHtml}
            <div style="display:flex; gap:6px; margin-left:4px;">
                <button class="primary icon-btn" onclick="projectMedia('${media.id}')" title="Proyectar" style="width:32px; height:32px; border-radius:10px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
                <button class="icon-btn-minimal danger" onclick="deleteMediaSource('${media.id}')" title="Eliminar" style="width:32px; height:32px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

async function deleteMediaSource(id) {
    const action = () => {
        // Eliminar de DB también para liberar espacio
        if (window.MediaDB) {
            try { window.MediaDB.deleteFile(id); } catch (e) { }
        }
        if (annState.activeMediaId === id) clearMedia();
        annState.mediaSources = annState.mediaSources.filter(m => m.id !== id);
        saveMediaSources();
        renderMediaSources();
    };

    if (typeof showConfirm !== 'undefined') {
        showConfirm("¿Eliminar este archivo de multimedia?", action);
    } else if (confirm("¿Eliminar este archivo?")) {
        action();
    }
}

function toggleFitMode(id) {
    const media = annState.mediaSources.find(m => m.id === id);
    if (media) {
        const modes = ['cover', 'contain', 'fill'];
        let currentIdx = modes.indexOf(media.fitMode || 'cover');
        media.fitMode = modes[(currentIdx + 1) % modes.length];

        saveMediaSources();
        renderMediaSources();

        // Sincronizar si es el activo
        if (annState.activeMediaId === id && typeof bc !== 'undefined') {
            bc.postMessage({
                type: 'bg',
                action: 'update_setting',
                payload: { fitMode: media.fitMode }
            });
        }
    }
}

function toggleMute(id) {
    const media = annState.mediaSources.find(m => m.id === id);
    if (media && media.type === 'video') {
        media.muted = !media.muted;
        saveMediaSources();
        renderMediaSources();

        // Sincronizar si es el activo
        if (annState.activeMediaId === id && typeof bc !== 'undefined') {
            bc.postMessage({
                type: 'bg',
                action: 'update_setting',
                payload: { muted: media.muted }
            });
        }
    }
}

function toggleLoop(id) {
    const media = annState.mediaSources.find(m => m.id === id);
    if (media && media.type === 'video') {
        media.loop = !media.loop;
        saveMediaSources();
        renderMediaSources();

        // Si es el medio activo, sincronizar inmediatamente
        if (annState.activeMediaId === id && typeof bc !== 'undefined') {
            bc.postMessage({
                type: 'bg',
                action: 'update_setting',
                payload: { loop: media.loop }
            });
        }
    }
}

function projectMedia(id) {
    const media = annState.mediaSources.find(m => m.id === id);
    if (!media) return;

    if (typeof bc !== 'undefined') {
        console.log("Proyectando:", media.name);

        const isMemoryMode = media.mode === 'memory' && media.file;

        // 1. ENVIAR AL PROYECTOR (Overlay)
        // Si es Memory Mode, enviamos el OBJETO FILE (Blob) directamente
        // Si es DB Mode, enviamos el ID para que el overlay lo lea de la DB
        bc.postMessage({
            type: 'bg',
            action: 'update',
            payload: {
                image: isMemoryMode ? media.file : media.path,
                mediaType: media.type,
                loop: media.loop || false,
                muted: media.muted !== undefined ? media.muted : true,
                fitMode: media.fitMode || 'cover',
                sourceMode: isMemoryMode ? 'memory' : 'db',
                isContent: true
            }
        });

        // Update active state
        annState.activeMediaId = id;
        annState.isPlaying = true;
        updateMediaControlsUI();

        // 2. VISTA PREVIA LOCAL (Panel de Control)
        // OPTIMIZACIÓN TÉRMICA: NO REPRODUCIR VIDEO AQUÍ
        const preview = document.getElementById('announcementLivePreview');
        if (currentPreviewBlobUrl) {
            URL.revokeObjectURL(currentPreviewBlobUrl);
            currentPreviewBlobUrl = null;
        }

        if (media.type === 'video') {
            // Placeholder Estático Animado (0% GPU Decoding)
            const videoHtml = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--accent); background:rgba(0,0,0,0.2); width:100%;">
                    <div class="pulsing-circle" style="width:40px; height:40px; border:2px solid currentColor; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </div>
                    <div style="font-size:10px; font-weight:bold; letter-spacing:1px;">VIDEO EN VIVO</div>
                    <div style="font-size:9px; opacity:0.7; margin-top:2px;">${media.name}</div>
                </div>
            `;
            updateMonitorContent('announcementLivePreview', videoHtml, true);
        } else {
            // Para Imágenes
            updateMonitorContent('announcementLivePreview', '<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--accent); font-size:10px;">Cargando imagen...</div>', true);

            const loadPromise = isMemoryMode
                ? Promise.resolve(media.file)
                : window.MediaDB.getFile(media.path);

            loadPromise.then(blob => {
                if (blob) {
                    currentPreviewBlobUrl = URL.createObjectURL(blob);
                    const imgHtml = `<img src="${currentPreviewBlobUrl}" style="width:100%; height:100%; object-fit:contain; opacity:0.8;">`;
                    updateMonitorContent('announcementLivePreview', imgHtml, true);
                }
            }).catch(e => {
                console.error("Error preview:", e);
                updateMonitorContent('announcementLivePreview', '<div style="color:red; font-size:10px;">Error img</div>', true);
            });
        }
    }
}

function updateMediaControlsUI() {
    const controls = document.getElementById('mediaPlaybackControls');
    const nameLabel = document.getElementById('activeMediaName');
    const btnPlayPause = document.getElementById('btnPlayPauseMedia');
    const svgPlay = document.getElementById('svgPlay');
    const svgPause = document.getElementById('svgPause');

    if (!annState.activeMediaId) {
        if (controls) controls.style.display = 'none';
        return;
    }

    const media = annState.mediaSources.find(m => m.id === annState.activeMediaId);
    if (!media) return;

    if (controls) controls.style.display = 'flex';
    if (nameLabel) nameLabel.innerText = media.name;

    if (media.type === 'video') {
        if (btnPlayPause) btnPlayPause.style.display = 'flex';
        if (svgPlay) svgPlay.style.display = annState.isPlaying ? 'none' : 'block';
        if (svgPause) svgPause.style.display = annState.isPlaying ? 'block' : 'none';
    } else {
        if (btnPlayPause) btnPlayPause.style.display = 'none';
    }
}

function togglePlayback() {
    if (!annState.activeMediaId) return;
    const media = annState.mediaSources.find(m => m.id === annState.activeMediaId);
    if (!media || media.type !== 'video') return;

    annState.isPlaying = !annState.isPlaying;

    if (typeof bc !== 'undefined') {
        bc.postMessage({
            type: 'bg',
            action: annState.isPlaying ? 'play' : 'pause'
        });
    }
    updateMediaControlsUI();
}

// Funciones de Navegación Rápida
function prevAnnouncement() {
    if (!annState.currentId) return;
    const currentIndex = annState.list.findIndex(a => a.id === annState.currentId);
    if (currentIndex > 0) {
        selectAnnouncement(annState.list[currentIndex - 1].id);
        projectCurrentAnnouncement();
    }
}

function nextAnnouncement() {
    if (!annState.currentId && annState.list.length > 0) {
        selectAnnouncement(annState.list[0].id);
        projectCurrentAnnouncement();
        return;
    }
    const currentIndex = annState.list.findIndex(a => a.id === annState.currentId);
    if (currentIndex !== -1 && currentIndex < annState.list.length - 1) {
        selectAnnouncement(annState.list[currentIndex + 1].id);
        projectCurrentAnnouncement();
    }
}

window.prevAnnouncement = prevAnnouncement;
window.nextAnnouncement = nextAnnouncement;

function clearMedia() {
    if (currentPreviewBlobUrl) {
        URL.revokeObjectURL(currentPreviewBlobUrl);
        currentPreviewBlobUrl = null;
    }
    annState.activeMediaId = null;
    annState.isPlaying = false;

    // En lugar de solo borrar, restaurar el fondo guardado del panel
    if (typeof bc !== 'undefined') {
        const savedBg = localStorage.getItem('bosquejos_bg');
        const savedType = localStorage.getItem('bosquejos_bg_type') || 'image';
        const savedSource = localStorage.getItem('bosquejos_bg_source') || 'url';

        if (savedBg && savedBg !== 'current_bg') {
            // Restaurar el fondo que estaba antes
            console.log('🔄 Restaurando fondo anterior:', savedBg);
            bc.postMessage({
                type: 'bg',
                action: 'update',
                payload: {
                    image: savedBg,
                    mediaType: savedType,
                    sourceMode: savedSource,
                    loop: true,
                    muted: true,
                    fitMode: 'cover',
                    isContent: false  // Es fondo global, no contenido temporal
                }
            });
        } else if (savedBg === 'current_bg' && savedSource === 'db') {
            // Si el fondo está en IndexedDB, recuperarlo
            console.log('Restaurando fondo desde DB');
            if (typeof MediaDB !== 'undefined') {
                MediaDB.getFile('current_bg').then(file => {
                    if (file) {
                        const blobUrl = URL.createObjectURL(file);
                        bc.postMessage({
                            type: 'bg',
                            action: 'update',
                            payload: {
                                image: blobUrl,
                                mediaType: savedType,
                                sourceMode: 'db',
                                loop: savedType === 'video',
                                muted: true,
                                fitMode: 'cover',
                                isContent: false
                            }
                        });
                    } else {
                        bc.postMessage({ type: 'bg', action: 'clear' });
                    }
                }).catch(() => {
                    bc.postMessage({ type: 'bg', action: 'clear' });
                });
            } else {
                bc.postMessage({ type: 'bg', action: 'clear' });
            }
        } else {
            // No hay fondo guardado, entonces sí borrar
            console.log('No hay fondo guardado, limpiando');
            bc.postMessage({ type: 'bg', action: 'clear' });
        }
    }

    // Usar el motor unificado de monitores para restaurar el logo sobre el fondo
    if (typeof updateMonitorContent === 'function') {
        updateMonitorContent('announcementLivePreview', ZION_PLACEHOLDER, true);
    }
    updateMediaControlsUI();
}

// EXPOSE GLOBALS
window.annState = annState;
window.loadAnnouncements = loadAnnouncements;
window.loadMediaSources = loadMediaSources;
window.addMediaSource = addMediaSource;
window.handleMediaSelect = handleMediaSelect;
window.deleteMediaSource = deleteMediaSource;
window.toggleFitMode = toggleFitMode;
window.toggleMute = toggleMute;
window.toggleLoop = toggleLoop;
window.togglePresentationMode = togglePresentationMode;

let presentationInterval = null;
let currentPresentationIndex = 0;

function togglePresentationMode() {
    const btn = document.getElementById('btnStartPresentation');
    const durationInput = document.getElementById('presentationDuration');
    const duration = parseInt(durationInput.value) * 1000 || 5000;

    if (presentationInterval) {
        clearInterval(presentationInterval);
        presentationInterval = null;
        if (btn) {
            btn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                AUTO
            `;
            btn.style.background = '';
        }
        showToast("Presentación detenida");
    } else {
        if (!annState.list || annState.list.length === 0) {
            showToast("Primero crea algunos anuncios", "error");
            return;
        }
        if (btn) {
            btn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;"><rect x="6" y="6" width="12" height="12"></rect></svg>
                DETENER
            `;
            btn.style.background = 'var(--danger)';
        }
        showToast("Iniciando carrusel de anuncios");

        currentPresentationIndex = 0;
        selectAndProject(annState.list[currentPresentationIndex].id);

        presentationInterval = setInterval(() => {
            currentPresentationIndex++;
            if (currentPresentationIndex >= annState.list.length) {
                currentPresentationIndex = 0;
            }
            selectAndProject(annState.list[currentPresentationIndex].id);
        }, duration);
    }
}

function stopPresentationMode() {
    if (presentationInterval) {
        clearInterval(presentationInterval);
        presentationInterval = null;
        const btn = document.getElementById('btnStartPresentation');
        if (btn) {
            btn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                AUTO
            `;
            btn.style.background = '';
        }
        console.log("Carrusel de anuncios detenido automáticamente.");
    }
}

window.stopPresentationMode = stopPresentationMode;

function selectAndProject(id) {
    selectAnnouncement(id);
    setTimeout(() => {
        projectCurrentAnnouncement();
    }, 100);
}
window.projectMedia = projectMedia;
window.togglePlayback = togglePlayback;
window.clearMedia = clearMedia;
window.initAnnouncementsSystem = initAnnouncementsSystem;
