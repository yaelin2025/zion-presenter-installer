const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs'); // Requerido para persistencia
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8, // 100MB para soportar imágenes Base64 pesadas
    pingTimeout: 60000
});

// ============================================
// SISTEMA DE ANALÍTICA ZION ADMIN (CON PERSISTENCIA)
// ============================================
const LOG_FILE = path.join(__dirname, 'zion-analytics.json');
const ANNOUNCEMENT_FILE = path.join(__dirname, 'zion-announcement.json');
const STATS_FILE = path.join(__dirname, 'zion-stats.json');
let activityLog = [];
let currentAnnouncement = null;
let totalLifetimeConnections = 0;
let activeSessions = new Map(); // Rastreo de sesiones activas: socketId -> {connectedAt, type, ua}
const MAX_LOG_ENTRIES = 1000;
const ADMIN_PIN = '0202';

// ============================================
// CONFIGURACIÓN DE FÁBRICA ZION CAST
// ============================================
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

// Estado Único Global para Zion Cast (Eliminamos salas)
const zionCastState = {
    styles: JSON.parse(JSON.stringify(FACTORY_STYLES)),
    verseStyles: JSON.parse(JSON.stringify(FACTORY_VERSE_STYLES)),
    update: null,
    theme: 'theme-azure',
    background: null
};

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
    }
    console.log(`[SYSTEM] Registros cargados: ${activityLog.length} | Conexiones: ${totalLifetimeConnections}`);
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
            totalConnections: totalLifetimeConnections
        }));
    } catch (e) {
        console.error("Error al guardar estadísticas:", e);
    }
}

// Middleware para parsear JSON (Aumentado para recibir imágenes base64)
app.use(express.json({ limit: '20mb' }));

// Función para registrar actividad
function logActivity(type, data) {
    const entry = {
        timestamp: new Date().toISOString(),
        type: type,
        ...data
    };

    activityLog.unshift(entry); // Añadir al inicio

    // Mantener solo los últimos MAX_LOG_ENTRIES
    if (activityLog.length > MAX_LOG_ENTRIES) {
        activityLog.pop();
    }

    saveLogsToDisk(); // Persistencia inmediata
    console.log(`[ANALYTICS] ${type}:`, data);
}

// Servir archivos estáticos
app.use(express.static(__dirname));
app.use('/zion-cast', express.static(path.join(__dirname, 'zion-cast')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para el visor remoto
app.get('/v/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'cantos_overlay.html'));
});

// ============================================
// ENDPOINTS DE ANALÍTICA
// ============================================

// Endpoint para recibir eventos de actividad desde el cliente
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

// Endpoint del panel de administración (protegido por PIN)
app.post('/api/analytics/dashboard', (req, res) => {
    try {
        const { pin } = req.body;

        if (pin !== ADMIN_PIN) {
            return res.status(401).json({ success: false, error: 'PIN incorrecto' });
        }

        // Calcular estadísticas
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        const recentActivity = activityLog.filter(entry =>
            new Date(entry.timestamp).getTime() > oneHourAgo
        );

        const todayActivity = activityLog.filter(entry =>
            new Date(entry.timestamp).getTime() > oneDayAgo
        );

        // Conexiones totales (sockets individuales)
        const totalSockets = io.sockets.sockets.size;

        // Contar salas activas (en modo global siempre es 1 si hay alguien)
        const activeRooms = io.sockets.adapter.rooms.size > 0 ? 1 : 0;

        // Preparar sesiones activas con duración
        const sessions = Array.from(activeSessions.entries()).map(([socketId, session]) => {
            const duration = now - session.connectedAt;

            // Detectar tipo de dispositivo del user agent
            let device = 'Unknown';
            if (session.ua) {
                if (session.ua.includes('iPhone')) device = 'iPhone';
                else if (session.ua.includes('iPad')) device = 'iPad';
                else if (session.ua.includes('Android')) device = 'Android';
                else if (session.ua.includes('OBS')) device = 'OBS';
                else if (session.ua.includes('Chrome')) device = 'Chrome';
                else if (session.ua.includes('Safari')) device = 'Safari';
                else if (session.ua.includes('Firefox')) device = 'Firefox';
            }

            return {
                socketId: socketId.substring(0, 8), // Acortar para privacidad
                room: 'GLOBAL',
                type: session.type,
                device: device,
                duration: duration, // milisegundos
                connectedAt: session.connectedAt
            };
        });

        // Ordenar por duración (más tiempo primero)
        sessions.sort((a, b) => b.duration - a.duration);

        res.json({
            success: true,
            stats: {
                activeConnections: totalSockets,
                activeRooms: activeRooms,
                recentActivity: recentActivity.length,
                todayActivity: todayActivity.length,
                totalLogs: activityLog.length,
                totalLifetimeConnections: totalLifetimeConnections
            },
            sessions: sessions, // Nueva propiedad
            logs: activityLog.slice(0, 50) // Últimos 50 eventos
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// NUEVO: Endpoint de Broadcast Global (Mensaje Maestro)
app.post('/api/admin/broadcast', (req, res) => {
    try {
        const { pin, message, title, style } = req.body;

        if (pin !== ADMIN_PIN) {
            return res.status(401).json({ success: false, error: 'Acceso denegado' });
        }

        if (!message) return res.status(400).json({ success: false, error: 'Mensaje vacío' });

        // Enviar a todos los sockets conectados
        io.emit('global_notification', {
            title: title || 'Aviso de Zion Admin',
            message: message,
            style: style || 'info', // info, warning, success
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

// NUEVO: Endpoint para obtener IP Local (Para el mando a distancia)
app.get('/api/network-info', (req, res) => {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const k in interfaces) {
        for (const k2 in interfaces[k]) {
            const address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    res.json({
        success: true,
        ips: addresses,
        primaryIp: addresses[0] || 'localhost',
        port: PORT
    });
});

// ============================================
// LÓGICA DE SOCKETS (Sin cambios en funcionalidad)
// ============================================
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Incrementar contador histórico y guardar
    totalLifetimeConnections++;
    saveStatsToDisk();

    // Registrar sesión activa
    const ua = socket.handshake.headers['user-agent'] || 'Unknown';
    activeSessions.set(socket.id, {
        connectedAt: Date.now(),
        room: null,
        type: 'unknown', // Se actualizará cuando se una a una sala
        ua: ua,
        ip: socket.handshake.address
    });

    // Registrar conexión
    logActivity('socket_connected', {
        socketId: socket.id,
        ip: socket.handshake.address,
        ua: ua
    });

    // Rastrear si este socket es un panel
    socket.isPanel = false;

    socket.on('join_room', () => {
        // En modo LOCAL (sin salas), todos están en el mismo sistema
        console.log(`📍 ${socket.id} unido al sistema global`);

        // Sincronizar estado actual de Zion Cast al unirse (Global)
        socket.emit('dispatch', { type: 'theme', theme: zionCastState.theme });

        Object.keys(zionCastState.styles).forEach(target => {
            socket.emit('dispatch', { type: 'zion:style', payload: { target, style: zionCastState.styles[target] } });
        });

        socket.emit('dispatch', { type: 'zion:verseStyle', payload: zionCastState.verseStyles });

        if (zionCastState.background) {
            socket.emit('dispatch', { type: 'zion:background', payload: zionCastState.background });
        }

        if (zionCastState.update) {
            setTimeout(() => {
                socket.emit('dispatch', zionCastState.update);
            }, 800);
        }

        // Registrar unión global
        logActivity('room_joined', { socketId: socket.id });

        // Confirmar al cliente
        socket.emit('room_joined', { roomCode: 'GLOBAL' });
    });

    socket.on('remote_action', (data) => {
        // Identificar Panel
        if (data.type === 'panel_status' && data.action === 'ready') {
            socket.isPanel = true;
            socket.panelRoom = data.room;
            console.log(`🎛️ Panel detectado en sala: ${data.room}`);

            // Actualizar tipo de sesión
            if (activeSessions.has(socket.id)) {
                activeSessions.get(socket.id).type = 'panel';
            }

            logActivity('panel_ready', {
                socketId: socket.id,
                roomCode: data.room
            });
        }

        // Identificar Mando Móvil (Viewer Status Joined)
        if (data.type === 'viewer_status' && data.action === 'joined') {
            // Actualizar tipo de sesión
            if (activeSessions.has(socket.id)) {
                activeSessions.get(socket.id).type = 'visor';
            }

            logActivity('remote_connected', {
                socketId: socket.id,
                roomCode: data.room,
                ua: socket.handshake.headers['user-agent']
            });
            console.log(`📱 Mando conectado en sala: ${data.room}`);
        }

        // Broadcasting GLOBAL (Sin salas)
        io.emit('network_update', data);
    });

    // SISTEMA DISPATCH (Zion Cast Integration)
    socket.on('dispatch', (action) => {
        const state = zionCastState;

        if (action.type === 'zion:update') state.update = action;
        if (action.type === 'zion:background') state.background = action.payload;
        if (action.type === 'zion:style') {
            const { target, style } = action.payload;
            if (state.styles[target]) Object.assign(state.styles[target], style);
        }
        if (action.type === 'zion:verseStyle') Object.assign(state.verseStyles, action.payload);

        if (action.type === 'theme') {
            state.theme = action.theme;
            if (action.theme !== 'custom') {
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
        }

        // Broadcast a todos (Sin salas)
        io.emit('dispatch', action);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);

        // Eliminar sesión activa
        activeSessions.delete(socket.id);

        // Registrar desconexión
        logActivity('socket_disconnected', {
            socketId: socket.id,
            wasPanel: socket.isPanel
        });

        // Si era un panel, notificar a todos
        if (socket.isPanel) {
            io.emit('network_update', {
                type: 'panel_status',
                action: 'disconnected'
            });
            console.log(`📴 Panel desconectado`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Zion Presenter → puerto ${PORT}`);
    console.log(`📊 Panel Admin disponible en: http://localhost:${PORT}/admin`);
});
