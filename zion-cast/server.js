const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    pingInterval: 10000,  // Enviar ping cada 10 segundos
    pingTimeout: 5000,    // Esperar 5 segundos por pong
    transports: ['websocket', 'polling'],  // Intentar websocket primero, fallback a polling
    maxHttpBufferSize: 50 * 1024 * 1024 // Permitir transferencia de imágenes grandes (50MB)
});

// ============================================
// SISTEMA DE ANALÍTICA ZION ADMIN (CON PERSISTENCIA)
// ============================================
const LOG_FILE = path.join(__dirname, 'zion-cast-analytics.json');
const ANNOUNCEMENT_FILE = path.join(__dirname, 'zion-cast-announcement.json');
const STATS_FILE = path.join(__dirname, 'zion-cast-stats.json');
let activityLog = [];
let currentAnnouncement = null;
let totalLifetimeConnections = 0;
let knownRooms = []; // Lista de salas únicas históricas
const MAX_LOG_ENTRIES = 1000;
const ADMIN_PIN = '2025';

// CARGAR DATOS AL INICIAR
try {
    if (fs.existsSync(LOG_FILE)) {
        const fileContent = fs.readFileSync(LOG_FILE, 'utf8');
        const savedData = JSON.parse(fileContent);
        activityLog = Array.isArray(savedData) ? savedData : (savedData.logs || []);
    }
    if (fs.existsSync(ANNOUNCEMENT_FILE)) {
        const annContent = fs.readFileSync(ANNOUNCEMENT_FILE, 'utf8');
        currentAnnouncement = JSON.parse(annContent).image || null;
    }
    if (fs.existsSync(STATS_FILE)) {
        const statsContent = fs.readFileSync(STATS_FILE, 'utf8');
        const stats = JSON.parse(statsContent);
        totalLifetimeConnections = stats.totalConnections || 0;
        knownRooms = stats.knownRooms || [];
    }
    console.log(`[SYSTEM] Registros cargados: ${activityLog.length} | Conexiones: ${totalLifetimeConnections} | Salas: ${knownRooms.length}`);
} catch (e) {
    console.error("Error en carga inicial:", e);
}

// FUNCIÓN PARA GUARDAR LOGS (Ligera y rápida)
function saveLogsToDisk() {
    try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(activityLog.slice(0, MAX_LOG_ENTRIES), null, 2));
    } catch (e) {
        console.error("Error al guardar logs:", e);
    }
}

// FUNCIÓN PARA GUARDAR ANUNCIO (Solo cuando cambia)
function saveAnnouncementToDisk() {
    try {
        fs.writeFileSync(ANNOUNCEMENT_FILE, JSON.stringify({ image: currentAnnouncement }));
    } catch (e) {
        console.error("Error al guardar anuncio:", e);
    }
}

// FUNCIÓN PARA GUARDAR ESTADÍSTICAS
function saveStatsToDisk() {
    try {
        fs.writeFileSync(STATS_FILE, JSON.stringify({
            totalConnections: totalLifetimeConnections,
            knownRooms: knownRooms
        }));
    } catch (e) {
        console.error("Error al guardar estadísticas:", e);
    }
}

// Middleware para parsear JSON (Aumentado para recibir imágenes base64)
app.use(express.json({ limit: '50mb' }));

// Función para registrar actividad (CON BLINDAJE TOTAL)
function logActivity(type, data) {
    try {
        const entry = {
            timestamp: new Date().toISOString(),
            type: type,
            ...data
        };

        activityLog.unshift(entry); // Añadir al inicio

        if (activityLog.length > MAX_LOG_ENTRIES) {
            activityLog.pop();
        }

        saveLogsToDisk();
        console.log(`[ANALYTICS] ${type}:`, data);
    } catch (err) {
        // Blindaje: Si falla la analítica, el servidor SIGUE ADELANTE
        console.error("⚠️ Error silencioso en analítica:", err);
    }
}

const PORT = process.env.PORT || 4000;

// Configuración de Fábrica (Preferencia Tema Azure por defecto)
const FACTORY_STYLES = {
    center: { w: 1260, h: 500, scale: 0.9, padX: 60, padY: 50, x: 0, y: 15, op: 0.8, radius: 50, autoW: false, badgeRadius: 50, badgeX: 80, badgeScale: 2, badgeY: 25, fs: 200, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' },
    title: { w: 600, h: 70, scale: 1.8, padX: 20, padY: 0, x: 0, y: 10, op: 0.8, radius: 20, autoW: true, fs: 40, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' },
    bl: { w: 400, h: 60, scale: 1.65, padX: 15, padY: 0, x: 15, y: 10, op: 0.8, radius: 20, autoW: true, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' },
    br: { w: 400, h: 60, scale: 1.4, padX: 20, padY: 0, x: 15, y: 15, op: 0.8, radius: 20, autoW: true, fs: 84, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' },
    cb: { w: 400, h: 60, scale: 1.65, padX: 15, padY: 0, x: 0, y: 10, op: 0.8, radius: 20, autoW: true, c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' }
};

const FACTORY_VERSE_STYLES = {
    verseW: "90vw", verseH: "80vh", verseX: "5vw", verseY: "10vh", versePad: "60px", verseOp: 0.88, verseSizeCita: "2.6rem"
};

// Estado en memoria por sala
const roomStates = {};

app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'zion_panel.html')));
app.get('/overlay', (req, res) => res.sendFile(path.join(__dirname, 'zion_overlay.html')));

// ============================================
// ENDPOINTS DE ANALÍTICA & ADMIN
// ============================================

app.post('/api/analytics/track', (req, res) => {
    try {
        const { roomCode, location, platform, action, version } = req.body;
        logActivity('user_activity', {
            roomCode: roomCode || 'unknown',
            location: location || 'unknown',
            platform: platform || 'unknown',
            action: action || 'session_start',
            version: version || 'unknown',
            ip: req.ip,
            ua: req.headers['user-agent']
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/analytics/dashboard', (req, res) => {
    try {
        const { pin } = req.body;
        if (pin !== ADMIN_PIN) return res.status(401).json({ success: false, error: 'PIN incorrecto' });

        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        const recentActivity = activityLog.filter(entry => new Date(entry.timestamp).getTime() > oneHourAgo);
        const todayActivity = activityLog.filter(entry => new Date(entry.timestamp).getTime() > oneDayAgo);

        // Conexiones totales (sockets individuales)
        const totalSockets = io.sockets.sockets.size;

        // Contar salas con al menos un cliente
        // io.sockets.adapter.rooms es un Map donde las llaves son nombres de sala o IDs de socket
        // Filtramos solo las que tienen 3 caracteres (nuestro formato de sala)
        const activeRooms = Array.from(io.sockets.adapter.rooms.keys()).filter(r => r.length === 3).length;

        res.json({
            success: true,
            stats: {
                activeConnections: totalSockets,
                activeRooms: activeRooms,
                recentActivity: recentActivity.length,
                todayActivity: todayActivity.length,
                totalLogs: activityLog.length,
                totalLifetimeConnections: totalLifetimeConnections,
                totalUniqueRooms: knownRooms.length
            },
            logs: activityLog.slice(0, 50)
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/api/admin/broadcast', (req, res) => {
    try {
        const { pin, message, title } = req.body;
        if (pin !== ADMIN_PIN) return res.status(401).json({ success: false, error: 'Acceso denegado' });
        if (!message) return res.status(400).json({ success: false, error: 'Mensaje vacío' });

        io.emit('global_notification', {
            title: title || 'Aviso de Zion Cast Admin',
            message: message,
            timestamp: new Date().toISOString()
        });

        logActivity('global_broadcast', { message: message });
        res.json({ success: true, message: 'Broadcast enviado exitosamente' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// NUEVO: GESTIÓN DE ANUNCIOS VISUALES (IMAGEN)
app.post('/api/admin/announcement', (req, res) => {
    try {
        const { pin, imageData } = req.body;
        if (pin !== ADMIN_PIN) return res.status(401).json({ success: false, error: 'Acceso denegado' });

        // BLINDAJE: Si imageData es null o vacío, forzar borrado absoluto
        currentAnnouncement = (imageData === null || imageData === "") ? null : imageData;
        saveAnnouncementToDisk();

        // Notificar a todos los conectados en tiempo real
        io.emit('announcement_update', { image: currentAnnouncement });

        logActivity('announcement_changed', { active: !!currentAnnouncement });
        res.json({ success: true, message: currentAnnouncement ? 'Anuncio activado' : 'Anuncio eliminado' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// NUEVO: OBTENER ANUNCIO ACTUAL (Para cuando alguien arranca la web)
app.get('/api/announcement/current', (req, res) => {
    res.json({ success: true, image: currentAnnouncement });
});

io.on('connection', (socket) => {
    let currentRoom = null;
    console.log('Cliente conectado:', socket.id);

    // Incrementar contador histórico y guardar
    totalLifetimeConnections++;
    saveStatsToDisk();

    logActivity('socket_connected', {
        socketId: socket.id,
        ip: socket.handshake.address,
        ua: socket.handshake.headers['user-agent']
    });

    socket.on('join_room', (data) => {
        let roomCode = data.roomCode;
        if (!roomCode) return;
        roomCode = roomCode.toUpperCase(); // Forzar mayúsculas para evitar fragmentación de salas

        if (currentRoom) socket.leave(currentRoom);
        currentRoom = roomCode;
        socket.join(currentRoom);

        // LÓGICA DE SALAS ÚNICAS HISTÓRICAS
        if (!knownRooms.includes(currentRoom)) {
            knownRooms.push(currentRoom);
            saveStatsToDisk();
            console.log(`[NEW ROOM] Nueva sala descubierta: ${currentRoom}`);
        }

        // Inicializar sala si es nueva
        if (!roomStates[currentRoom]) {
            roomStates[currentRoom] = {
                styles: JSON.parse(JSON.stringify(FACTORY_STYLES)),
                verseStyles: JSON.parse(JSON.stringify(FACTORY_VERSE_STYLES)),
                update: null,
                theme: 'theme-azure', // Guardar tema por sala
                background: null // Guardar fondo por sala
            };
        }

        const state = roomStates[currentRoom];

        // 0. Sincronizar tema actual
        socket.emit('dispatch', { type: 'theme', theme: state.theme });

        // 1. Sincronización inmediata de estilos de globos
        Object.keys(state.styles).forEach(target => {
            socket.emit('dispatch', { type: 'zion:style', payload: { target, style: state.styles[target] } });
        });

        // 2. Sincronización inmediata de estilos de versículo
        socket.emit('dispatch', { type: 'zion:verseStyle', payload: state.verseStyles });

        // 3. Sincronización de fondo
        if (state.background) {
            socket.emit('dispatch', { type: 'zion:background', payload: state.background });
        }

        // 4. Sincronización de contenido con delay
        if (state.update) {
            setTimeout(() => {
                socket.emit('dispatch', state.update);
            }, 800);
        }

        socket.emit('room_joined', { roomCode: currentRoom });

        logActivity('room_joined', {
            socketId: socket.id,
            roomCode: currentRoom
        });
    });

    socket.on('dispatch', (action) => {
        if (!currentRoom) return;

        const state = roomStates[currentRoom];
        if (state) {
            if (action.type === 'zion:update') state.update = action;
            if (action.type === 'zion:background') state.background = action.payload;
            if (action.type === 'zion:style') {
                const { target, style } = action.payload;
                if (state.styles[target]) Object.assign(state.styles[target], style);
            }
            if (action.type === 'zion:verseStyle') Object.assign(state.verseStyles, action.payload);

            // Persistencia del TEMA
            if (action.type === 'theme') {
                state.theme = action.theme;

                // Solo actualizar colores si es un tema predefinido (no custom)
                if (action.theme !== 'custom') {
                    // Cuando se cambia el tema, actualizamos los colores de fábrica en la memoria del servidor
                    // para que cualquier reconexión herede los colores del tema elegido.
                    const themeColors = {
                        'theme-electric': { c1: '#00e5ff', c2: '#00b0ff', c3: '#0081ff' },
                        'theme-neon': { c1: '#ff00ff', c2: '#cc00cc', c3: '#990099' },
                        'theme-lime': { c1: '#39ff14', c2: '#32e612', c3: '#28b80e' },
                        'theme-cosmic': { c1: '#d500f9', c2: '#aa00ff', c3: '#651fff' },
                        'theme-emerald': { c1: '#1de9b6', c2: '#00bfa5', c3: '#00796b' },
                        'theme-sunset': { c1: '#ff1744', c2: '#f50057', c3: '#c51162' },
                        'theme-gold': { c1: '#ffc400', c2: '#ffab00', c3: '#ff8f00' },
                        'theme-midnight': { c1: '#c6ff00', c2: '#aeea00', c3: '#827717' },
                        'theme-azure': { c1: '#00b0ff', c2: '#0091ea', c3: '#00b8d4' },
                        'theme-flame': { c1: '#ff9100', c2: '#ff6d00', c3: '#e65100' }
                    };
                    const colors = themeColors[action.theme];
                    if (colors) {
                        Object.keys(state.styles).forEach(k => {
                            state.styles[k].c1 = colors.c1;
                            state.styles[k].c2 = colors.c2;
                            state.styles[k].c3 = colors.c3;
                        });
                    }
                }
                // Para modo 'custom', los colores ya vienen en los mensajes zion:style individuales
            }
        }

        io.to(currentRoom).emit('dispatch', action);
    });

    socket.on('disconnect', (reason) => {
        console.log(`Cliente desconectado de sala ${currentRoom}. Razón: ${reason}`);
        logActivity('socket_disconnected', {
            socketId: socket.id,
            roomCode: currentRoom,
            reason: reason
        });
    });
});

server.listen(PORT, () => console.log(`🚀 Zion Cast iniciado en puerto ${PORT}`));
