/**
 * ZION CAST - Room System
 * Handles room code generation, persistence, and UI updates
 */

let currentRoomCode = null;



// Initialize or recover room code
function initRoomCode() {
    // Para la versión instalador local, eliminamos el sistema de salas
    currentRoomCode = 'GLOBAL';
    localStorage.setItem('zion_cast_room', 'GLOBAL');
    console.log(`🔐 Sistema de comunicación GLOBAL activo`);

    // Export to window immediately
    window.currentRoomCode = currentRoomCode;

    // Update UI
    updateRoomBadge();

    // Join room via socket
    const joinRoom = () => {
        if (typeof socket !== "undefined" && socket && socket.emit) {
            console.log("📡 Solicitando sincronización GLOBAL");
            socket.emit("join_room", { roomCode: 'GLOBAL' });
            socket.off("room_joined").on("room_joined", (data) => {
                console.log("✅ Sistema GLOBAL confirmado");
            });
        } else {
            setTimeout(joinRoom, 200);
        }
    };
    if (typeof socket !== "undefined" && socket) {
        socket.on("connect", joinRoom);
        if (socket.connected) joinRoom();
    } else {
        joinRoom();
    }
}
// 
// // Inject room badge into header
// function injectRoomBadge() {
//     const header = document.querySelector('header');
//     const logoDiv = header ? header.querySelector('.logo-text') : null;
// 
//     if (logoDiv && !document.getElementById('roomBadge')) {
//         const badge = document.createElement('div');
//         badge.id = 'roomBadge';
//         badge.style.cssText = `
//             background: linear-gradient(135deg, rgba(255,183,77,0.15) 0%, rgba(255,82,82,0.15) 50%, rgba(224,64,251,0.15) 100%);
//             border: 1px solid rgba(255,183,77,0.3);
//             border-radius: 6px;
//             padding: 4px 10px;
//             display: flex;
//             align-items: center;
//             gap: 6px;
//             cursor: pointer;
//             transition: all 0.2s;
//         `;
//         badge.title = 'Clic para copiar enlace del visor';
//         badge.onclick = copyOverlayLink;
// 
//         badge.innerHTML = `
//             <span style="font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 600;">SALA</span>
//             <span id="roomCodeDisplay" style="font-size: 0.85rem; color: #FFB74D; font-weight: 900; letter-spacing: 1px;">${currentRoomCode || '---'}</span>
//         `;
// 
//         logoDiv.insertAdjacentElement('afterend', badge);
//     }
// }
// 
// Update room badge display
function updateRoomBadge() {
    const display = document.getElementById('roomCodeDisplay');
    if (display) {
        display.textContent = currentRoomCode || '---';
    }
}

// Copy overlay link to clipboard
function copyOverlayLink() {
    const baseURL = window.location.origin === 'null' || !window.location.origin || window.location.protocol === 'file:' ?
        window.location.href.substring(0, window.location.href.lastIndexOf('/')) :
        window.location.origin;
    const overlayURL = `${baseURL}/zion_overlay.html?room=${currentRoomCode}`;

    navigator.clipboard.writeText(overlayURL).then(() => {
        const badge = document.getElementById('roomBadge');
        if (badge) {
            const originalBg = badge.style.background;
            const originalBorder = badge.style.borderColor;

            badge.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.3) 100%)';
            badge.style.borderColor = 'rgba(16,185,129,0.5)';

            setTimeout(() => {
                badge.style.background = originalBg;
                badge.style.borderColor = originalBorder;
            }, 1000);
        }
        console.log(`📋 Overlay link copied: ${overlayURL}`);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert(`Enlace del visor:\n${overlayURL}`);
    });
}

// Export for global access
window.copyOverlayLink = copyOverlayLink;

// Viewer Modal Functions
function toggleViewerModal() {
    const modal = document.getElementById('viewerModal');
    if (modal) {
        const isVisible = modal.classList.contains('visible');

        if (isVisible) {
            modal.classList.remove('visible');
        } else {
            modal.classList.add('visible');
            // Update the link when opening
            updateViewerLinkInput();
        }
    }
}

function updateViewerLinkInput() {
    const input = document.getElementById('viewerLinkInput');

    if (input) {
        const baseURL = window.location.origin === 'null' || !window.location.origin || window.location.protocol === 'file:' ?
            window.location.href.substring(0, window.location.href.lastIndexOf('/')) :
            window.location.origin;
        const overlayURL = `${baseURL}/zion_overlay.html`;
        input.value = overlayURL;
        console.log('✅ Viewer link updated:', overlayURL);
    } else {
        console.warn('⚠️ Could not update viewer link - input not found');
    }
}

function copyViewerLink() {
    const input = document.getElementById('viewerLinkInput');
    if (input) {
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
            showCopyFeedback();
        }).catch(() => {
            document.execCommand('copy');
            showCopyFeedback();
        });
    }
}

function showCopyFeedback() {
    const feedback = document.getElementById('copyFeedback');
    if (feedback) {
        feedback.style.opacity = '1';
        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 2000);
    }
}

// Export modal functions
window.toggleViewerModal = toggleViewerModal;
window.copyViewerLink = copyViewerLink;
window.showCopyFeedback = showCopyFeedback;

window.openViewerPopup = function () {
    // En modo local siempre usamos el archivo directo
    const url = `zion_overlay.html`;
    const w = 1280;
    const h = 720;
    const left = (screen.width / 2) - (w / 2);
    const top = (screen.height / 2) - (h / 2);

    window.open(url, 'ZionCastPopup', `width=${w},height=${h},top=${top},left=${left},menubar=no,location=no,status=no,resizable=yes`);
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRoomCode);
} else {
    initRoomCode();
}
