// ============================================
// TIMER & STOPWATCH MODULE (Performance Optimized)
// ============================================

// USAR EL CANAL GLOBAL (bc) en lugar de crear uno nuevo
// Esto permite que los mensajes via Socket.IO para compatibilidad web
let timerChannel;

// Esperar a que bc esté disponible
function ensureChannel() {
    if (typeof bc !== 'undefined' && bc) {
        timerChannel = bc;
        return true;
    }
    return !!timerChannel;
}

let timerInterval = null;

// ELEMENT CACHE (Performance)
let cachedDisplays = [];
let cachedArrows = [];
let cachedControlsBoxes = [];
let cachedTabBtnsControl = [];
let cachedTabBtnsDesign = [];
let cachedTabContentsControl = [];
let cachedTabContentsDesign = [];
let cachedBtnModesCount = [];
let cachedBtnModesStop = [];
let cachedInputBoxes = [];
let cachedStopwatchBoxes = [];
let cachedActionBoxes = [];
let cachedInputMins = [];
let cachedBtnPauses = [];
let cachedCornerBoxes = [];

const timerState = {
    mode: 'countdown',
    paused: true,
    remaining: 0,
    config: {
        fontSize: parseInt(localStorage.getItem('timer_font_size')) || 48,
        opacity: parseInt(localStorage.getItem('timer_opacity')) || 60,
        posX: parseInt(localStorage.getItem('timer_pos_x')) || 0,
        posY: parseInt(localStorage.getItem('timer_pos_y')) || 0,
        visible: localStorage.getItem('timer_visible') === 'true' || true,
        centered: localStorage.getItem('timer_centered') === 'true' || false
    }
};

function initTimerSystem() {
    const containers = document.querySelectorAll('#songsView .col-live');
    if (containers.length === 0) return;

    // Reset caches
    cachedDisplays = []; cachedArrows = []; cachedControlsBoxes = [];
    cachedTabBtnsControl = []; cachedTabBtnsDesign = [];
    cachedTabContentsControl = []; cachedTabContentsDesign = [];
    cachedBtnModesCount = []; cachedBtnModesStop = [];
    cachedInputBoxes = []; cachedStopwatchBoxes = []; cachedActionBoxes = [];
    cachedInputMins = []; cachedBtnPauses = []; cachedCornerBoxes = [];

    if (!document.getElementById('timerStyles')) {
        const style = document.createElement('style');
        style.id = 'timerStyles';
        style.textContent = `
            .timer-switch { position: relative; display: inline-block; width: 34px; height: 18px; }
            .timer-switch input { opacity: 0; width: 0; height: 0; }
            .timer-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: .4s; border-radius: 34px; }
            .timer-slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 3px; bottom: 3px; background-color: #aaa; transition: .4s; border-radius: 50%; }
            input:checked + .timer-slider { background-color: var(--accent); }
            input:checked + .timer-slider:before { transform: translateX(16px); background-color: white; }
            .timer-btn-mode { padding: 6px; border-radius: 6px; background: transparent; border: none; cursor: pointer; color: var(--text-muted); font-weight: bold; font-size: 11px; flex:1; transition: 0.2s; }
            .timer-btn-mode.active { background: var(--active-bg); color: var(--active-item-text) !important; border: 1px solid var(--accent); }
            .timer-setting-row { display: flex; flex-direction: column; gap: 4px; padding: 6px 0; }
            .timer-setting-label { display: flex; justify-content: space-between; font-size: 10px; color: var(--accent); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; opacity: 0.9; }
            .timer-range { width: 100%; height: 6px; cursor: pointer; border-radius: 3px; accent-color: var(--accent); margin: 8px 0; }
            .timer-card-instance { margin-top: 6px; height: auto; min-height: fit-content; contain: content; }
            
            /* Mejorar apariencia de los sliders en Timer */
            .timer-card-instance input[type="range"] {
                -webkit-appearance: none;
                width: 100%;
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
                height: 6px;
                outline: none;
            }
            .timer-card-instance input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                background: var(--accent);
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 10px var(--accent);
            }
        `;
        document.head.appendChild(style);
    }

    containers.forEach((container, index) => {
        const timerCard = document.createElement('div');
        timerCard.className = 'glass-card timer-card-instance';
        timerCard.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" class="timer-header">
                 <span style="font-weight:bold; font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Temporizador</span>
                 <span class="timer-arrow" style="font-size:10px; opacity:0.5; transition:transform 0.3s;">▼</span>
            </div>
            
            <div class="timer-controls-box" style="display:none; flex-direction:column; gap:8px; margin-top:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;">
                <div style="display:flex; background:rgba(0,0,0,0.2); padding:2px; border-radius:8px;">
                    <button class="timer-btn-mode tab-btn-control active">CONTROL</button>
                    <button class="timer-btn-mode tab-btn-design">DISEÑO</button>
                </div>

                <div class="tab-content-control" style="display:flex; flex-direction:column; gap:8px;">
                    <div style="background:var(--input-bg); padding:10px; border-radius:8px; display:flex; justify-content:center; border:1px solid var(--input-border);">
                        <div class="display-text" style="font-size:32px; font-weight:700; font-family:monospace; color:var(--text);">00:00:00</div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px; background:rgba(255,255,255,0.05); padding:2px; border-radius:6px;">
                        <button class="timer-btn-mode btn-mode-count">CUENTA ATRÁS</button>
                        <button class="timer-btn-mode btn-mode-stop">CRONÓMETRO</button>
                    </div>

                    <div class="input-box-countdown" style="display:none; gap:8px; align-items:center;">
                        <input type="number" class="in-mins" value="5" style="width:80px; font-size:18px; font-weight:700; text-align:center; padding:10px 8px; border-radius:8px; background:var(--input-bg); color:var(--text); border:2px solid var(--input-border);">
                        <button class="primary btn-start-c" style="padding:8px 12px; font-size:11px;">INICIAR</button>
                    </div>
                    <div class="box-stopwatch" style="display:none;">
                        <button class="primary btn-start-s" style="width:100%; padding:6px;">INICIAR</button>
                    </div>
                    <div class="box-actions" style="display:none; gap:4px;">
                        <button class="btn-p danger" style="flex:1; padding:6px;">PAUSA</button>
                        <button class="secondary btn-r" style="padding:6px;">RESET</button>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:6px 8px; border-radius:6px;">
                        <span style="font-size:10px; color:var(--accent); font-weight:700; letter-spacing:1px;">PROYECTAR</span>
                        <label class="timer-switch">
                            <input type="checkbox" class="chk-visible" ${timerState.config.visible ? 'checked' : ''}>
                            <span class="timer-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="tab-content-design" style="display:none; flex-direction:column; gap:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:4px 8px; border-radius:6px; margin-bottom:4px;">
                        <span style="font-size:10px; color:var(--accent); font-weight:700; letter-spacing:1px;">CENTRAR (GIGANTE)</span>
                        <label class="timer-switch">
                            <input type="checkbox" class="chk-centered" ${timerState.config.centered ? 'checked' : ''}>
                            <span class="timer-slider"></span>
                        </label>
                    </div>

                    <div class="timer-setting-row">
                        <div class="timer-setting-label"><span>Tamaño</span><span class="v-size">${timerState.config.fontSize}px</span></div>
                        <input type="range" class="r-size" min="20" max="600" value="${timerState.config.fontSize}">
                    </div>

                    <div class="timer-setting-row">
                        <div class="timer-setting-label"><span>Oscur. Globo</span><span class="v-opacity">${timerState.config.opacity}%</span></div>
                        <input type="range" class="r-opacity" min="0" max="100" value="${timerState.config.opacity}">
                    </div>

                    <div class="pos-box" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; ${timerState.config.centered ? 'display:none;' : ''}">
                        <div class="timer-setting-row">
                            <div class="timer-setting-label"><span>Horiz.</span><span class="v-x">${timerState.config.posX}</span></div>
                            <input type="range" class="r-x" min="-600" max="600" value="${timerState.config.posX}">
                        </div>
                        <div class="timer-setting-row">
                            <div class="timer-setting-label"><span>Vertical</span><span class="v-y">${timerState.config.posY}</span></div>
                            <input type="range" class="r-y" min="-600" max="600" value="${timerState.config.posY}">
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(timerCard);

        // Cache elements
        const display = timerCard.querySelector('.display-text');
        const arrow = timerCard.querySelector('.timer-arrow');
        const controlsBox = timerCard.querySelector('.timer-controls-box');
        const tBtnC = timerCard.querySelector('.tab-btn-control');
        const tBtnD = timerCard.querySelector('.tab-btn-design');
        const tContC = timerCard.querySelector('.tab-content-control');
        const tContD = timerCard.querySelector('.tab-content-design');
        const bModeC = timerCard.querySelector('.btn-mode-count');
        const bModeS = timerCard.querySelector('.btn-mode-stop');
        const inBoxC = timerCard.querySelector('.input-box-countdown');
        const boxS = timerCard.querySelector('.box-stopwatch');
        const boxA = timerCard.querySelector('.box-actions');
        const inMins = timerCard.querySelector('.in-mins');
        const bPause = timerCard.querySelector('.btn-p');
        const posB = timerCard.querySelector('.pos-box');

        cachedDisplays.push(display); cachedArrows.push(arrow); cachedControlsBoxes.push(controlsBox);
        cachedTabBtnsControl.push(tBtnC); cachedTabBtnsDesign.push(tBtnD);
        cachedTabContentsControl.push(tContC); cachedTabContentsDesign.push(tContD);
        cachedBtnModesCount.push(bModeC); cachedBtnModesStop.push(bModeS);
        cachedInputBoxes.push(inBoxC); cachedStopwatchBoxes.push(boxS); cachedActionBoxes.push(boxA);
        cachedInputMins.push(inMins); cachedBtnPauses.push(bPause); cachedCornerBoxes.push(posB);

        // Events
        timerCard.querySelector('.timer-header').onclick = toggleTimerControls;
        tBtnC.onclick = () => switchTimerTab('control');
        tBtnD.onclick = () => switchTimerTab('design');
        bModeC.onclick = () => setTimerMode('countdown');
        bModeS.onclick = () => setTimerMode('stopwatch');
        timerCard.querySelector('.btn-start-c').onclick = startCountdown;
        timerCard.querySelector('.btn-start-s').onclick = startStopwatch;
        bPause.onclick = pauseTimer;
        timerCard.querySelector('.btn-r').onclick = resetTimer;

        timerCard.querySelector('.chk-visible').onchange = (e) => updateTimerConfig('visible', e.target.checked);
        timerCard.querySelector('.chk-centered').onchange = (e) => updateTimerConfig('centered', e.target.checked);
        timerCard.querySelector('.r-size').oninput = (e) => updateTimerConfig('fontSize', e.target.value);
        timerCard.querySelector('.r-opacity').oninput = (e) => updateTimerConfig('opacity', e.target.value);
        timerCard.querySelector('.r-x').oninput = (e) => updateTimerConfig('posX', e.target.value);
        timerCard.querySelector('.r-y').oninput = (e) => updateTimerConfig('posY', e.target.value);
    });


    setTimerMode('countdown');
    // NO sincronizar automáticamente (solo cuando usuario lo use)
    // syncBroadcast();
}

function setTimerMode(mode) {
    timerState.mode = mode;
    resetTimer(false);
    cachedBtnModesCount.forEach(b => b.classList.toggle('active', mode === 'countdown'));
    cachedBtnModesStop.forEach(b => b.classList.toggle('active', mode === 'stopwatch'));
    cachedInputBoxes.forEach(b => b.style.display = (mode === 'countdown') ? 'flex' : 'none');
    cachedStopwatchBoxes.forEach(b => b.style.display = (mode === 'stopwatch') ? 'block' : 'none');
    cachedActionBoxes.forEach(b => b.style.display = 'none');
}

function startCountdown() {
    const mins = parseInt(cachedInputMins[0]?.value) || 5;
    timerState.remaining = mins * 60;
    timerState.paused = false;
    startInterval();
    updateActionUI();
}

function startStopwatch() {
    timerState.remaining = 0;
    timerState.paused = false;
    startInterval();
    updateActionUI();
}

function pauseTimer() {
    timerState.paused = !timerState.paused;

    if (timerState.paused) {
        // Parar completamente el interval (ahorra CPU)
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    } else {
        // Reanudar: reiniciar el interval
        startInterval();
    }

    cachedBtnPauses.forEach(btn => {
        btn.innerText = timerState.paused ? "REANUDAR" : "PAUSA";
        btn.className = "btn-p " + (timerState.paused ? "primary" : "danger");
    });
}

function resetTimer(updateUI = true) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerState.paused = true;
    timerState.remaining = 0;
    cachedDisplays.forEach(d => d.innerText = "00:00:00");
    if (updateUI) { setTimerMode(timerState.mode); syncBroadcast(); }
}

function updateActionUI() {
    cachedInputBoxes.forEach(b => b.style.display = 'none');
    cachedStopwatchBoxes.forEach(b => b.style.display = 'none');
    cachedActionBoxes.forEach(b => b.style.display = 'flex');
}

let timerThrottleTimer = null;

function updateTimerConfig(key, val) {
    let finalVal = val;
    if (key === 'posX' || key === 'posY') { if (Math.abs(parseInt(val)) <= 20) finalVal = 0; }
    timerState.config[key] = finalVal;
    localStorage.setItem('timer_' + key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`), finalVal);

    // Actualizar visualización en tiempo real
    if (key === 'fontSize') document.querySelectorAll('.v-size').forEach(el => el.innerText = finalVal + 'px');
    if (key === 'opacity') {
        document.querySelectorAll('.v-opacity').forEach(el => el.innerText = finalVal + '%');
        // Aplicar oscuridad local al globo de previsualización
        document.querySelectorAll('.display-text').forEach(el => {
            el.style.backgroundColor = `rgba(0,0,0,${finalVal / 100})`;
            el.style.opacity = "1"; // Números siempre sólidos
            el.style.borderRadius = "8px";
            el.style.padding = "10px";
        });
    }
    if (key === 'posX') document.querySelectorAll('.v-x').forEach(el => el.innerText = finalVal);
    if (key === 'posY') document.querySelectorAll('.v-y').forEach(el => el.innerText = finalVal);
    if (key === 'centered') cachedCornerBoxes.forEach(el => el.style.display = finalVal ? 'none' : 'grid');

    // Throttle para el broadcast y guardado
    if (!timerThrottleTimer) {
        syncBroadcast();
        timerThrottleTimer = setTimeout(() => {
            timerThrottleTimer = null;
        }, 32); // 30fps
    }
}

function syncBroadcast() {
    ensureChannel(); // Asegurar que usamos el canal global

    if (!timerChannel) {
        console.error('❌ Timer: No hay canal disponible');
        return;
    }

    const text = cachedDisplays[0] ? cachedDisplays[0].innerText : "00:00:00";
    timerChannel.postMessage({
        type: 'timer', action: 'update',
        payload: { text, ...timerState.config, opacity: timerState.config.opacity / 100 }
    });

    console.log('⏱️ Timer enviado:', text);
}

function startInterval() {
    if (timerInterval) clearInterval(timerInterval);
    let lastTime = Date.now();
    let lastSecond = -1;
    timerInterval = setInterval(() => {
        // No necesitamos check de pause, el interval se detiene completamente
        const now = Date.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        if (timerState.mode === 'countdown') {
            timerState.remaining -= delta;
            if (timerState.remaining <= 0) {
                timerState.remaining = 0;
                pauseTimer();
            }
        } else {
            timerState.remaining += delta;
        }

        const currentSecond = Math.floor(timerState.remaining);
        if (currentSecond !== lastSecond) {
            lastSecond = currentSecond;
            const text = formatTime(timerState.remaining);
            cachedDisplays.forEach(d => d.innerText = text);
            syncBroadcast();
        }
    }, 100);
}

function formatTime(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function switchTimerTab(tab) {
    const isC = tab === 'control';
    cachedTabBtnsControl.forEach(b => b.classList.toggle('active', isC));
    cachedTabBtnsDesign.forEach(b => b.classList.toggle('active', !isC));
    cachedTabContentsControl.forEach(b => b.style.display = isC ? 'flex' : 'none');
    cachedTabContentsDesign.forEach(b => b.style.display = isC ? 'none' : 'flex');
}

function toggleTimerControls() {
    const show = cachedControlsBoxes[0].style.display === 'none';
    cachedControlsBoxes.forEach(p => p.style.display = show ? 'flex' : 'none');
    cachedArrows.forEach(a => a.style.transform = show ? 'rotate(180deg)' : 'rotate(0deg)');
}

window.initTimerSystem = initTimerSystem;
window.updateTimerConfig = updateTimerConfig;

// ========================================
// INTEGRACIÓN CON CONTROL REMOTO
// ========================================

// Toggle play/pause del timer
window.toggleTimer = function () {
    // Buscar el botón de play/pause y hacer clic en él
    const playBtn = document.querySelector('[onclick*="toggleTimer"]') ||
        document.querySelector('.timer-play-btn');
    if (playBtn) {
        playBtn.click();
        console.log('⏯️ Timer toggle desde control remoto');
    } else {
        console.warn('⚠️ Botón de timer no encontrado');
    }
};

// Resetear el timer desde control remoto
window.resetTimerRemote = function () {
    // Buscar el botón de reset y simular click
    const resetBtn = document.querySelector('.btn-r');
    if (resetBtn && resetBtn.onclick) {
        resetBtn.onclick();
        console.log('🔄 Timer reseteado desde control remoto');
    }
};

// Función para enviar actualizaciones del timer al control remoto
window.sendTimerUpdate = function (timeString) {
    if (typeof networkSocket !== 'undefined' && networkSocket) {
        const room = window.zionRoomCode || localStorage.getItem('zion_panel_room');
        networkSocket.emit('remote_action', {
            type: 'timer_update',
            time: timeString,
            room: room
        });
    }
};
