// ============================================
// MODULO DE PRESENTACIONES (AUTÓNOMO)
// ============================================

// 1. Configuración de Estado
const presState = {
    slides: JSON.parse(localStorage.getItem('zion_presentation_slides') || '[]'),
    currentIndex: -1,
    fitMode: localStorage.getItem('zion_pres_fitMode') || 'contain' // 'contain' o 'fill'
};

// 2. Canal de Comunicación (Usar el canal principal de Zion)
// NO creamos el canal aquí - usaremos window.displayChannel que se crea en main.js
let presChannel = null;

function getPresChannel() {
    // Siempre intentar usar el canal global primero
    if (window.displayChannel) {
        return window.displayChannel;
    }

    // Si no existe window.displayChannel, crear uno con el Room ID correcto
    if (!presChannel) {
        const roomId = localStorage.getItem('zion_room_id') || 'DEFAULT';
        const channelName = `zion-presenter-${roomId}`;
        presChannel = new BroadcastChannel(channelName);
        console.log(`⚠️ Presentaciones: Canal creado manualmente - ${channelName}`);
    }

    return presChannel;
}

// ===================================
// INICIALIZACIÓN
// ===================================
function initPresentationsSystem() {
    const container = document.getElementById('presentationsView');
    if (!container) return;

    // Renderizar Interfaz
    container.innerHTML = `
        <!-- COL 1: BIBLIOTECA -->
        <div class="glass-card col-library" style="grid-column: 1; grid-row: 1; display: flex; flex-direction: column;">
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
                    <button class="nav-tab" onclick="setMode('announcements')">Anuncios</button>
                    <button class="nav-tab active" onclick="setMode('presentations')">Slides</button>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 5px;">
                <!-- Botón de Carga -->
                <button class="primary" onclick="document.getElementById('slideUpload').click()" 
                        style="width: 100%; height: 45px; font-weight: 700; background: var(--accent); border: none; border-radius: 8px; color: var(--btn-text-color); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    SUBIR PDF / IMÁGENES
                </button>
                <input type="file" id="slideUpload" multiple accept=".pdf,image/*,.pptx" style="display: none;" onchange="handleSlideUpload(event)">
                
                <!-- Barra de Progreso -->
                <div id="presProgressBarContainer" style="display:none; width: 100%; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; height: 6px; margin-top:2px;">
                    <div id="presProgressBar" style="width: 0%; height: 100%; background: var(--accent); transition: width 0.3s;"></div>
                </div>
                <div id="presStatusText" style="font-size: 10px; color: var(--text-muted); text-align: center;"></div>

                <!-- INFO: PowerPoint a PDF -->
                <div style="margin-top: 0px; padding: 6px 10px; background: rgba(255,152,0,0.08); border: 1px dashed rgba(255,152,0,0.2); border-radius: 8px; display: flex; gap: 8px; align-items: center;">
                    <div style="color: #FF9800; flex-shrink: 0;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <div style="font-size: 9.5px; line-height: 1.2; color: var(--text-muted); flex: 1;">
                        <span style="color: #FF9800; font-weight: 700;">PPT a PDF:</span> 
                        Guárdalas como <span style="color: #FF9800; font-weight: 700;">PDF</span> para poder subirlas.
                    </div>
                    <button onclick="showPPTTutorial()" style="padding: 4px 8px; font-size: 8.5px; background: rgba(255,152,0,0.15); border: 1px solid rgba(255,152,0,0.3); border-radius: 4px; color: #FF9800; cursor: pointer; font-weight: 800; white-space: nowrap; transition: all 0.2s;">
                        ¿VER CÓMO?
                    </button>
                </div>
            </div>

            <div style="margin-top: 5px; flex: 1; overflow-y: auto;" class="scroll-list" id="slidesLibrary"></div>

            <div style="margin-top: 10px; display: flex; gap: 5px;">
                <button class="secondary" style="flex: 1; font-size: 11px;" onclick="clearSlides()">Limpiar</button>
                <button class="secondary" style="flex: 1; font-size: 11px;" onclick="saveSlidesToLocalStorage()">Guardar</button>
            </div>
        </div>
        
        <!-- COL 2 & 3: VISTA PREVIA -->
        <div class="glass-card" style="grid-column: 2 / span 2; grid-row: 1; display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <!-- Indicador LED Premium -->
                    <div id="netStatus_pres" title="Estado de la Red" 
                        style="width: clamp(12px, 1.5vw, 18px); 
                               height: clamp(12px, 1.5vw, 18px); 
                               border-radius: 50%; background: #666; 
                               border: 2px solid rgba(255,255,255,0.2); 
                               box-shadow: inset 0 1px 2px rgba(255,255,255,0.2), 0 0 5px rgba(0,0,0,0.5);
                               transition: all 0.3s; flex-shrink: 0;"></div>
                    <h2 style="margin:0; border:none; padding:0;">Vista Previa</h2>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <div id="slideInfo" style="font-weight: 800; color: var(--accent); margin-right: 10px; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 4px; font-size: 13px;">0 / 0</div>
                    
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
                    <button id="btnOpenOverlayPres" class="primary icon-btn btn-overlay-main" onclick="openOverlay()" title="Pantalla de Proyección">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </button>
                </div>
            </div>

            <div id="mainSlidePreview" style="flex: 1; background: #000; border-radius: 12px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                 <!-- Contenedor de la Diapositiva (zion-monitor-content para que no sea borrado por el motor unificado) -->
                 <div id="presContent" class="zion-monitor-content" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; z-index:1;">
                    <div class="zion-watermark" style="opacity:0.12; transform: scale(0.65); pointer-events:none; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <img src="img/solologo.png" alt="" style="width: 70px; height: 70px; object-fit: contain;">
                        <div style="text-align:left;">
                            <div style="font-weight:900; font-size:26px; letter-spacing:1px; color:currentColor; line-height:0.8;">ZION</div>
                            <div style="font-weight:300; font-size:13px; letter-spacing:3px; color:currentColor; line-height:1; margin-top:2px;">PRESENTER</div>
                        </div>
                    </div>
                 </div>
                 
                 <!-- Oreja de Borrado Sutil (Blackout) - MÁS GRANDE para Slides -->
                 <div class="monitor-ear" onclick="blackout()" title="Borrar Pantalla (Blackout)" 
                      style="z-index: 10; width: 100px; height: 36px; right: 30px; background: rgba(239, 68, 68, 0.4);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        <line x1="12" y1="2" x2="12" y2="12"></line>
                    </svg>
                 </div>
            </div>

            <div style="display: flex; gap: 15px; height: 60px;">
                <button class="secondary" onclick="presPrevSlide()" style="flex: 1; font-weight: 800; font-size: 16px;">❮ ANTERIOR</button>
                
                <button class="secondary" id="presFitModeBtn" onclick="togglePresFitMode()" style="flex: 0.8; font-size:11px; display:flex; flex-direction:column; align-items:center; justify-content:center; line-height:1.2; padding: 5px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:3px;">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                        <path d="M9 9h6v6H9z"></path>
                    </svg>
                    <span id="presFitModeText">AJUSTAR</span>
                </button>
                
                <button class="secondary" onclick="presNextSlide()" style="flex: 1; font-weight: 800; font-size: 16px;">SIGUIENTE ❯</button>
            </div>
        </div>
    `;

    renderSlides();

    // Inicializar texto del botón según el modo guardado
    const fitBtn = document.getElementById('presFitModeText');
    if (fitBtn) {
        fitBtn.textContent = presState.fitMode === 'contain' ? 'AJUSTAR' : 'EXTENDER';
    }

    if (typeof updateNetworkUI === 'function') updateNetworkUI();
    // Forzar actualización visual del monitor para usar el estilo global (background + logo grande)
    if (window.refreshAllMonitors) setTimeout(window.refreshAllMonitors, 100);
}

// ===================================
// LÓGICA DE CARGA
// ===================================
async function handleSlideUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const bar = document.getElementById('presProgressBar');
    const container = document.getElementById('presProgressBarContainer');
    const status = document.getElementById('presStatusText');

    if (container) container.style.display = 'block';

    for (const file of files) {
        const name = file.name.toLowerCase();
        if (status) status.textContent = `Procesando ${file.name}...`;

        if (name.endsWith('.pdf')) {
            await processPDFFile(file, bar, status);
        } else if (file.type.startsWith('image/')) {
            await processImageFile(file);
        } else if (name.endsWith('.ppt') || name.endsWith('.pptx')) {
            alert(`⚠️ Para Powerpoint:\nPor favor guarda como PDF antes de subir.\nEsto garantiza calidad perfecta.`);
        }
    }

    if (container) container.style.display = 'none';
    if (status) status.textContent = 'Carga Completa';

    // AUTO-PLAY: Seleccionar primera diapositiva automáticamente
    if (presState.slides.length > 0) {
        showSlide(0);
    }
}

async function processPDFFile(file, bar, status) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const total = pdf.numPages;

        for (let i = 1; i <= total; i++) {
            if (status) status.textContent = `PDF: Pág ${i}/${total}`;
            if (bar) bar.style.width = `${(i / total) * 100}%`;

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            presState.slides.push({
                name: `Slide ${i}`,
                data: canvas.toDataURL('image/jpeg', 0.8)
            });
        }
        renderSlides();
        saveSlidesToLocalStorage();
    } catch (e) {
        console.error(e);
        alert("Error leyendo PDF. Verifica que no tenga contraseña.");
    }
}

function processImageFile(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => {
            presState.slides.push({ name: file.name, data: e.target.result });
            renderSlides();
            saveSlidesToLocalStorage();
            resolve();
        };
        reader.readAsDataURL(file);
    });
}

// ===================================
// MINI TUTORIAL PowerPoint -> PDF
// ===================================
function showPPTTutorial() {
    const title = "PowerPoint a PDF";
    const steps = `
        <div style="text-align: left; padding: 10px 0;">
            <div style="margin-bottom: 12px; display: flex; gap: 10px;">
                <span style="background: var(--accent); color: #000; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; flex-shrink:0;">1</span>
                <span>Abre tu presentación en <b>PowerPoint</b>.</span>
            </div>
            <div style="margin-bottom: 12px; display: flex; gap: 10px;">
                <span style="background: var(--accent); color: #000; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; flex-shrink:0;">2</span>
                <span>Ve al menú <b>Archivo</b> > <b>Exportar</b> (o Guardar como).</span>
            </div>
            <div style="margin-bottom: 12px; display: flex; gap: 10px;">
                <span style="background: var(--accent); color: #000; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; flex-shrink:0;">3</span>
                <span>Selecciona el formato <b>PDF (*.pdf)</b>.</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <span style="background: var(--accent); color: #000; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; flex-shrink:0;">4</span>
                <span>¡Listo! Arrastra ese PDF aquí para proyectar.</span>
            </div>
        </div>
    `;

    // Crear Overlay y Card (Estilo Zion)
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:200000; display:flex; align-items:center; justify-content:center; opacity:0; transition:all 0.3s;';

    const card = document.createElement('div');
    card.classList.add('glass-card');
    card.style.cssText = 'padding: 30px; width: 90%; max-width: 400px; text-align: center; border: 1px solid var(--accent); transform: scale(0.9); transition: all 0.3s;';

    card.innerHTML = `
        <h2 style="margin-top:0; color:var(--accent); letter-spacing:1px; border:none; padding:0;">${title}</h2>
        <div style="margin: 20px 0;">${steps}</div>
        <button class="primary" style="width: 100%; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; background: var(--accent); color: var(--btn-text-color);" onclick="this.parentElement.parentElement.style.opacity='0'; setTimeout(()=>this.parentElement.parentElement.remove(), 300)">ENTENDIDO</button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        card.style.transform = 'scale(1)';
    });
}

// ===================================
// NAVEGACIÓN (Lógica Robusta)
// ===================================

function renderSlides() {
    const list = document.getElementById('slidesLibrary');
    const info = document.getElementById('slideInfo');
    if (!list) return;

    list.innerHTML = '';

    // Actualizar Info
    if (info) info.textContent = presState.slides.length > 0 ?
        `${presState.currentIndex + 1} / ${presState.slides.length}` : "0 / 0";

    presState.slides.forEach((slide, index) => {
        const item = document.createElement('div');
        const isActive = index === presState.currentIndex;

        item.className = 'slide-item'; // Clase para CSS limpio
        item.style.cssText = `
            display: flex; gap: 10px; padding: 6px; cursor: pointer;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: ${isActive ? 'rgba(255,165,0,0.15)' : 'transparent'};
            border-left: 3px solid ${isActive ? 'orange' : 'transparent'};
        `;

        item.onclick = () => showSlide(index);
        item.innerHTML = `
            <img src="${slide.data}" style="width:60px; height:34px; object-fit:cover; border-radius:4px; background:#000;">
            <div style="flex:1; overflow:hidden; font-size:12px; display:flex; align-items:center;">
                ${slide.name}
            </div>
        `;
        list.appendChild(item);
    });
}

function showSlide(index) {
    if (!presState.slides.length) return;

    // Clamp
    if (index < 0) index = 0;
    if (index >= presState.slides.length) index = presState.slides.length - 1;

    presState.currentIndex = index;

    // 1. Actualizar Lista (Highlight)
    renderSlides();

    // 2. Scroll al item
    const list = document.getElementById('slidesLibrary');
    if (list && list.children[index]) {
        list.children[index].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    // 3. Vista Previa Principal (Actualizar el contenedor zion-monitor-content)
    const presContent = document.getElementById('presContent') || document.querySelector('#mainSlidePreview .zion-monitor-content');
    if (presContent) {
        presContent.innerHTML = `<img src="${presState.slides[index].data}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
        presContent.style.opacity = "1"; // Asegurar visibilidad
    }

    // 4. EMISIÓN (CRÍTICO)
    const roomCode = localStorage.getItem('zion_panel_room') || 'DEFAULT';
    console.log(`📤 Enviando diapositiva ${index + 1} a sala: ${roomCode}`);

    // Obtener el canal correcto
    const channel = getPresChannel();

    if (!channel) {
        console.error("❌ No hay canal de comunicación disponible");
        return;
    }

    // Enviar mensaje de presentación con roomCode para el puente de red
    const presPayload = {
        type: 'presentation',
        roomCode: roomCode,
        payload: {
            image: presState.slides[index].data,
            fitMode: presState.fitMode
        }
    };

    // USAR SISTEMA UNIFICADO (CRÍTICO)
    if (typeof window.sendToVisor === 'function') {
        window.sendToVisor(presPayload);
    } else {
        const channel = getPresChannel();
        if (channel) channel.postMessage(presPayload);
    }

    // 5. AUTO-DIM (Opcional - para que el fondo sea negro en slides)
    const dimInput = document.getElementById('bgDim');
    if (dimInput && dimInput.value != 90) {
        if (window.originalBgDim === undefined) {
            window.originalBgDim = dimInput.value;
        }
        dimInput.value = 90;
        if (typeof updateConfig === 'function') updateConfig();
    }
}

function presNextSlide() {
    console.log("Pres: Next Slide Clicked");
    showSlide(presState.currentIndex + 1);
}

function presPrevSlide() {
    console.log("Pres: Prev Slide Clicked");
    showSlide(presState.currentIndex - 1);
}



function clearSlides() {
    if (confirm("¿Borrar todo?")) {
        presState.slides = [];
        presState.currentIndex = -1;
        saveSlidesToLocalStorage();
        renderSlides();
        blackout();
    }
}

function saveSlidesToLocalStorage() {
    try {
        localStorage.setItem('zion_presentation_slides', JSON.stringify(presState.slides));
    } catch (e) { console.error("Storage full"); }
}

// Atajos de teclado seguros
document.addEventListener('keydown', (e) => {
    // Solo si el panel es visible
    const panel = document.getElementById('presentationsView');
    if (!panel || panel.offsetParent === null) return;

    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault(); presNextSlide();
    }
    if (e.key === 'ArrowLeft') {
        e.preventDefault(); presPrevSlide();
    }
    if (e.key === 'b' || e.key === 'B') {
        blackout();
    }
});

function togglePresFitMode() {
    // Alternar entre contain y cover
    presState.fitMode = presState.fitMode === 'contain' ? 'fill' : 'contain';
    localStorage.setItem('zion_pres_fitMode', presState.fitMode);

    // Actualizar texto del botón
    const btn = document.getElementById('presFitModeText');
    if (btn) {
        btn.textContent = presState.fitMode === 'contain' ? 'AJUSTAR' : 'EXTENDER';
    }

    console.log(`📐 Modo de ajuste: ${presState.fitMode}`);

    // Re-enviar la diapositiva actual con el nuevo modo
    if (presState.currentIndex >= 0) {
        showSlide(presState.currentIndex);
    }
}

// Guardar referencias globales por si el HTML las necesita
window.initPresentationsSystem = initPresentationsSystem;
window.handleSlideUpload = handleSlideUpload;
window.showSlide = showSlide;
window.presNextSlide = presNextSlide;
window.presPrevSlide = presPrevSlide;
window.blackout = blackout;
window.clearSlides = clearSlides;
window.saveSlidesToLocalStorage = saveSlidesToLocalStorage;
window.togglePresFitMode = togglePresFitMode;
window.showPPTTutorial = showPPTTutorial;
