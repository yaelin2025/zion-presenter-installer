// ============================================
// UNSPLASH INTEGRATION
// ============================================

class UnsplashIntegration {
    constructor() {
        this.accessKey = 'wJMZZX8FpwpZirlDF66IRsZp6q4P70EsVbD3UaVFlKo';
        this.baseURL = 'https://api.unsplash.com';
    }

    async search(query, page = 1, perPage = 12) {
        const url = `${this.baseURL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&client_id=${this.accessKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Error al buscar en Unsplash');
        }

        const data = await response.json();
        return {
            results: data.results,
            total: data.total,
            totalPages: data.total_pages
        };
    }

    async getCurated(page = 1, perPage = 12) {
        const url = `${this.baseURL}/photos?page=${page}&per_page=${perPage}&client_id=${this.accessKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Error al cargar fotos curadas');
        }

        return await response.json();
    }

    generateGalleryHTML(images) {
        return images.map(img => `
            <div class="unsplash-image-card" onclick="applyUnsplashBackground('${img.urls.regular}', '${img.user.name}', '${img.user.links.html}')">
                <img src="${img.urls.small}" alt="${img.alt_description || 'Imagen'}" loading="lazy">
                <div class="unsplash-overlay">
                    <button class="clean-apply-btn">Aplicar</button>
                    <p class="clean-credit">Foto por <a href="${img.user.links.html}?utm_source=zion_presenter&utm_medium=referral" target="_blank">${img.user.name}</a></p>
                </div>
            </div>
        `).join('');
    }
}

const unsplashAPI = new UnsplashIntegration();

function applyUnsplashBackground(imageUrl, authorName, authorUrl) {
    // Update UI preview
    const preview = document.getElementById('bgPreviewThumb');
    const text = document.getElementById('bgPreviewText');

    if (preview) {
        preview.style.backgroundImage = `url(${imageUrl})`;
    }

    if (text) {
        text.textContent = 'Unsplash';
        text.style.color = '#667eea';
    }

    // SAVE TO LOCALSTORAGE
    localStorage.setItem('bosquejos_bg', imageUrl);
    localStorage.setItem('bosquejos_bg_type', 'image');
    localStorage.setItem('bosquejos_bg_source', 'url');

    // Send to overlay
    const message = {
        type: 'bg',
        action: 'update',
        payload: {
            image: imageUrl,
            mediaType: 'image',
            loop: false,
            sourceMode: 'url',
            muted: true,
            fitMode: 'cover',
            isContent: false
        }
    };

    if (typeof bc !== 'undefined' && bc) {
        bc.postMessage(message);
        console.log('📡 Fondo enviado vía BroadcastChannel');
    } else if (typeof networkSocket !== 'undefined' && networkSocket) {
        const room = window.zionRoomCode || localStorage.getItem('zion_panel_room');
        networkSocket.emit('remote_action', { ...message, room: room });
        console.log('📡 Fondo enviado vía Socket.IO');
    } else {
        console.error('❌ No hay canal de comunicación disponible');
    }

    console.log(`✅ Fondo Unsplash aplicado y guardado: ${imageUrl}`);

    // 🔥 NUEVO: Refrescar monitores locales inmediatamente
    if (window.refreshAllMonitors) {
        window.refreshAllMonitors();
    }
}
