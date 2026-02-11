/**
 * ZION PRESENTER - Analytics & Admin System
 * Gestiona el rastreo de actividad y avisos visuales (flyers)
 */

async function trackActivity() {
    try {
        const geoResponse = await fetch('https://ipapi.co/json/').catch(() => null);
        const geo = geoResponse ? await geoResponse.json() : {};

        const payload = {
            roomCode: window.zionRoomCode || localStorage.getItem('zion_panel_room') || 'N/A',
            location: geo.city ? `${geo.city}, ${geo.country_name}` : 'Desconocida',
            platform: navigator.platform,
            version: 'Zion Presenter 2.0',
            action: 'inicio_sesion'
        };

        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) { }
}

function showGlobalAlert(title, message) {
    const existing = document.getElementById('zion-alert-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'zion-alert-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:200000; display:flex; align-items:center; justify-content:center; opacity:0; transition:all 0.5s ease;';

    const card = document.createElement('div');
    card.style.cssText = 'background:#1a1a2e; border:1px solid #00ffff; border-radius:20px; padding:35px; width:90%; max-width:450px; text-align:center; box-shadow:0 30px 100px rgba(0,0,0,0.8); transform:translateY(40px); transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);';

    card.innerHTML = `
        <h2 style="color:#00ffff; margin-bottom:15px; font-weight:900; font-family:'Inter',sans-serif;">${title}</h2>
        <p style="color:rgba(255,255,255,0.9); margin-bottom:30px; line-height:1.6; font-family:'Inter',sans-serif;">${message}</p>
        <button onclick="this.closest('#zion-alert-overlay').remove()" style="padding:14px 40px; background:#00ffff; color:#000; border:none; border-radius:12px; font-weight:900; cursor:pointer; letter-spacing:1px;">ENTENDIDO</button>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 50);
}

function showAnnouncementImage(imageSrc) {
    if (!imageSrc) {
        // Borrar nueva versión
        const existing = document.getElementById('zion-image-announcement');
        if (existing) existing.remove();
        // Borrar versión vieja si existiera por caché
        const old = document.getElementById('zionFlyerModal');
        if (old) old.style.display = 'none';
        return;
    }

    // Remover anterior si existe
    const existing = document.getElementById('zion-image-announcement');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'zion-image-announcement';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:210000; display:flex; align-items:center; justify-content:center; opacity:0; transition:all 0.5s ease; padding:20px;';

    const container = document.createElement('div');
    container.style.cssText = 'position:relative; width:100%; max-width:1000px; display:flex; flex-direction:column; align-items:center; gap:20px; transform:scale(0.9); transition:all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = 'position:absolute; top:-60px; right:0; background:none; border:none; color:white; font-size:50px; cursor:pointer; line-height:1; opacity:0.7; font-family:sans-serif;';
    closeBtn.onclick = () => {
        overlay.style.opacity = '0';
        container.style.transform = 'scale(0.9)';
        setTimeout(() => overlay.remove(), 500);
    };
    container.appendChild(closeBtn);

    const img = document.createElement('img');
    img.src = imageSrc;
    // CLAVE: max-width y max-height responsivos para que NO se salga de la pantalla
    img.style.cssText = 'max-width:100%; max-height:75vh; border-radius:16px; box-shadow:0 0 50px rgba(0,0,0,0.8); border:2px solid rgba(0,255,255,0.3); object-fit:contain; height:auto;';
    container.appendChild(img);

    const entBtn = document.createElement('button');
    entBtn.innerText = "CERRAR AVISO";
    entBtn.style.cssText = 'padding:14px 60px; border-radius:12px; border:none; background: #00ffff; color:#000; font-weight:900; cursor:pointer; letter-spacing:1px; box-shadow:0 10px 20px rgba(0,0,0,0.3);';
    entBtn.onclick = () => closeBtn.onclick();
    container.appendChild(entBtn);

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = '1';
        container.style.transform = 'scale(1)';
    }, 100);
}

async function checkAnnouncement() {
    try {
        const response = await fetch('/api/announcement/current');
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && data.image) {
            showAnnouncementImage(data.image);
        }
    } catch (e) { }
}

function initAnalytics() {
    const activeSocket = (typeof socket !== 'undefined' && socket) || (typeof networkSocket !== 'undefined' && networkSocket);

    if (activeSocket) {
        activeSocket.on('global_notification', (data) => {
            showGlobalAlert(data.title, data.message);
        });
        activeSocket.on('announcement_update', (data) => {
            showAnnouncementImage(data.image);
        });
    } else {
        setTimeout(initAnalytics, 500);
    }
}

// Inicialización Automática
setTimeout(trackActivity, 5000);
setTimeout(checkAnnouncement, 2000);
initAnalytics();
