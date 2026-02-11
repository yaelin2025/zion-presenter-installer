
// ============================================
// UTILITIES (Funciones de Ayuda)
// ============================================

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function fitTextToBox(el) {
    let size = 18;
    el.style.fontSize = size + 'px';
    let safe = 0;
    while ((el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) && size > 8 && safe < 20) {
        size--;
        el.style.fontSize = size + 'px';
        safe++;
    }
}

function adjustBrightness(col, amt) {
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    var num = parseInt(col, 16);
    var r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

function hexToRgba(hex, alpha) {
    let r = 0, g = 0, b = 0;
    if (hex.length == 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length == 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    return "rgba(" + +r + "," + +g + "," + +b + "," + alpha + ")";
}

function updateDate() {
    const dateEl = document.getElementById('currentDate');
    if (!dateEl) return;

    // Formato: Domingo, 24 de Octubre
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);

    // Capitalizar primera letra
    dateEl.innerText = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}

// =======================
// TOAST NOTIFICATIONS
// =======================
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed; top:70px; left:50%; transform:translateX(-50%); z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.innerText = message;

    // Glassmorphism Style
    toast.style.cssText = 'background: rgba(20, 20, 20, 0.95); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 12px 24px; border-radius: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-size: 13px; font-family: "Inter", sans-serif; font-weight: 500; opacity: 0; transform: translateY(-20px) scale(0.9); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); white-space: nowrap; pointer-events:auto;';

    if (type === 'error') {
        toast.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        toast.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.1)';
        toast.style.color = '#fca5a5';
    }

    container.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0) scale(1)';
        }, 10);
    });

    // Animate Out
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px) scale(0.9)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// =======================
// CUSTOM CONFIRM MODAL
// =======================
function showConfirm(message, onConfirm) {
    // Remove existing if any
    const existing = document.getElementById('custom-confirm-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-confirm-modal';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:100000; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s;';

    const card = document.createElement('div');
    card.style.cssText = 'background: rgba(20, 20, 20, 0.95); border: 1px solid rgba(255,255,255,0.1); padding: 25px; border-radius: 16px; width: 300px; text-align:center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);';

    const text = document.createElement('p');
    text.innerText = message;
    text.style.cssText = 'color:#fff; margin-bottom:20px; font-size:15px; font-family:"Inter",sans-serif;';

    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex; gap:10px; justify-content:center;';

    const btnCancel = document.createElement('button');
    btnCancel.innerText = "Cancelar";
    btnCancel.className = "secondary"; // Reuse existing css class if possible, else style manually
    btnCancel.style.cssText = 'padding:8px 16px; border-radius:8px; border:1px solid #444; background:transparent; color:#aaa; cursor:pointer;';

    const btnConfirm = document.createElement('button');
    btnConfirm.innerText = "Aceptar";
    btnConfirm.className = "primary";
    btnConfirm.style.cssText = 'padding:8px 16px; border-radius:8px; border:none; background:#2563eb; color:#fff; cursor:pointer;';

    btnCancel.onclick = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    };

    btnConfirm.onclick = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
        if (onConfirm) onConfirm();
    };

    btnGroup.appendChild(btnCancel);
    btnGroup.appendChild(btnConfirm);
    card.appendChild(text);
    card.appendChild(btnGroup);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Animate In
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        card.style.transform = 'scale(1)';
    });
}
// =======================
// MODAL MANAGEMENT
// =======================

// Función universal para cerrar modales con animación
// Función universal para cerrar modales con animación
function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 400);
}

// =======================
// GLOBAL ADMIN ALERT
// =======================
function showGlobalAlert(title, message) {
    // Remover anterior si existe
    const existing = document.getElementById('zion-global-alert');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'zion-global-alert';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:200000; display:flex; align-items:center; justify-content:center; opacity:0; transition:all 0.5s ease;';

    const card = document.createElement('div');
    card.style.cssText = 'background: linear-gradient(135deg, rgba(20,20,30,0.95), rgba(10,10,15,0.98)); border: 1px solid rgba(0,255,255,0.2); padding: 40px; border-radius: 24px; width: 90%; max-width: 500px; text-align:center; box-shadow: 0 30px 100px rgba(0,0,0,0.8), 0 0 40px rgba(0,255,255,0.1); transform: translateY(40px) scale(0.9); transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); position:relative; overflow:hidden;';

    const glow = document.createElement('div');
    glow.style.cssText = 'position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg, #00ffff, #8a2be2);';
    card.appendChild(glow);

    const titleEl = document.createElement('h2');
    titleEl.innerText = title || "AVISO DEL ADMINISTRADOR";
    titleEl.style.cssText = 'color:#00ffff; font-size:24px; font-weight:900; margin-bottom:15px; letter-spacing:1px; font-family:"Inter",sans-serif; text-transform:uppercase;';
    card.appendChild(titleEl);

    const msgEl = document.createElement('p');
    msgEl.innerText = message;
    msgEl.style.cssText = 'color:rgba(255,255,255,0.9); font-size:16px; line-height:1.6; margin-bottom:30px; font-family:"Inter",sans-serif; font-weight:400;';
    card.appendChild(msgEl);

    const btn = document.createElement('button');
    btn.innerText = "ENTENDIDO";
    btn.style.cssText = 'padding:14px 40px; border-radius:12px; border:none; background:linear-gradient(135deg, #00ffff, #8a2be2); color:#000; font-weight:900; cursor:pointer; letter-spacing:1px; transition:all 0.3s ease; box-shadow:0 10px 20px rgba(0,0,0,0.3);';
    btn.onmouseover = () => btn.style.transform = 'translateY(-3px) scale(1.05)';
    btn.onmouseout = () => btn.style.transform = 'translateY(0) scale(1)';
    btn.onclick = () => {
        overlay.style.opacity = '0';
        card.style.transform = 'translateY(40px) scale(0.9)';
        setTimeout(() => overlay.remove(), 500);
    };
    card.appendChild(btn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        setTimeout(() => {
            overlay.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, 50);
    });
}

// Export modal functions
window.closeModal = closeModal;
window.showGlobalAlert = showGlobalAlert;
