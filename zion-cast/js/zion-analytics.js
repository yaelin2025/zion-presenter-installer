/**
 * ZION CAST - Analytics & Admin System
 * Handles activity tracking and global notifications
 */

// ANALÍTICA (Notificar inicio de sesión)
async function trackActivity() {
    try {
        const geoResponse = await fetch('https://ipapi.co/json/').catch(() => null);
        const geo = geoResponse ? await geoResponse.json() : {};

        const payload = {
            roomCode: window.currentRoomCode || localStorage.getItem('zion_cast_room') || 'N/A',
            location: geo.city ? `${geo.city}, ${geo.country_name}` : 'Desconocida',
            platform: navigator.platform,
            version: 'Zion Cast 1.0',
            action: 'inicio_sesion'
        };

        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log("📊 Analítica sincronizada");
    } catch (e) { }
}

// GLOBAL ADMIN ALERT
function showGlobalAlert(title, message) {
    const existing = document.getElementById('zion-global-alert');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'zion-global-alert';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(15px); z-index:200000; display:flex; align-items:center; justify-content:center; opacity:0; transition:all 0.5s ease;';

    const card = document.createElement('div');
    card.style.cssText = 'background: linear-gradient(135deg, rgba(20,20,30,0.95), rgba(10,10,15,0.98)); border: 1px solid rgba(255,152,0,0.3); padding: 40px; border-radius: 24px; width: 90%; max-width: 500px; text-align:center; box-shadow: 0 30px 100px rgba(0,0,0,0.8); transform: translateY(40px) scale(0.9); transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); position:relative; overflow:hidden;';

    const glow = document.createElement('div');
    glow.style.cssText = 'position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg, #FF9800, #E040FB);';
    card.appendChild(glow);

    const titleEl = document.createElement('h2');
    titleEl.innerText = title || "AVISO DEL ADMINISTRADOR";
    titleEl.style.cssText = 'color:#FF9800; font-size:24px; font-weight:900; margin-bottom:15px; letter-spacing:1px; font-family:sans-serif; text-transform:uppercase;';
    card.appendChild(titleEl);

    const msgEl = document.createElement('p');
    msgEl.innerText = message;
    msgEl.style.cssText = 'color:rgba(255,255,255,0.9); font-size:16px; line-height:1.6; margin-bottom:30px; font-family:sans-serif; font-weight:400;';
    card.appendChild(msgEl);

    const btn = document.createElement('button');
    btn.innerText = "ENTENDIDO";
    btn.style.cssText = 'padding:14px 40px; border-radius:12px; border:none; background:linear-gradient(135deg, #FF9800, #E040FB); color:#fff; font-weight:900; cursor:pointer; letter-spacing:1px; transition:all 0.3s ease;';
    btn.onclick = () => {
        overlay.style.opacity = '0';
        card.style.transform = 'translateY(40px) scale(0.9)';
        setTimeout(() => overlay.remove(), 500);
    };
    card.appendChild(btn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
    }, 50);
}

// FUNCIÓN PARA MOSTRAR ANUNCIO VISUAL (IMAGEN) RESPONSIVO
function showAnnouncementImage(imageSrc) {
    if (!imageSrc) {
        const existing = document.getElementById('zion-image-announcement');
        if (existing) existing.remove();
        return;
    }

    const existing = document.getElementById('zion-image-announcement');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'zion-image-announcement';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.9); backdrop-filter:blur(10px); z-index:210000; display:flex; align-items:center; justify-content:center; opacity:0; transition:all 0.5s ease; padding:20px;';

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
    // CLAVE: max-width y max-height responsivos para que NO se salga de la pantalla en Cast
    img.style.cssText = 'max-width:100%; max-height:75vh; border-radius:16px; box-shadow:0 0 50px rgba(0,0,0,0.8); border:2px solid rgba(255,152,0,0.3); object-fit:contain; height:auto;';
    container.appendChild(img);

    const entBtn = document.createElement('button');
    entBtn.innerText = "CERRAR AVISO";
    entBtn.style.cssText = 'padding:14px 60px; border-radius:12px; border:none; background: #FF9800; color:#fff; font-weight:900; cursor:pointer; letter-spacing:1px; box-shadow:0 10px 20px rgba(0,0,0,0.3);';
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
            console.log("📣 NOTIFICACIÓN GLOBAL RECIBIDA:", data);
            showGlobalAlert(data.title, data.message);
        });
        activeSocket.on('announcement_update', (data) => {
            console.log("🖼️ ACTUALIZACIÓN DE ANUNCIO RECIBIDA");
            showAnnouncementImage(data.image);
        });
    } else {
        setTimeout(initAnalytics, 500);
    }
}

// Iniciar analítica
setTimeout(trackActivity, 3000);
setTimeout(checkAnnouncement, 1500);
initAnalytics();
