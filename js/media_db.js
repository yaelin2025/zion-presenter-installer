// ==========================================
// MEDIA DATABASE (IndexedDB Wrapper)
// Permite guardar imágenes y videos grandes en el navegador para modo Web
// ==========================================

const DB_NAME = 'ZionMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

const MediaDB = {
    db: null,

    async connect() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onerror = (event) => reject(event.target.error);
        });
    },

    async saveFile(id, file) {
        await this.connect();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ id, file, type: file.type, name: file.name, date: new Date() });
            request.onsuccess = () => resolve(id);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async getFile(id) {
        await this.connect();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            request.onsuccess = () => {
                if (request.result) resolve(request.result.file);
                else resolve(null);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async deleteFile(id) {
        await this.connect();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }
};

// Export global
window.MediaDB = MediaDB;
