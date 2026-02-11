/**
 * ========================================
 * ZION CAST - WELCOME MODAL SYSTEM
 * Sistema modular de bienvenida y anuncios
 * ========================================
 * 
 * Características:
 * - Bienvenida diaria personalizada
 * - Anuncios especiales
 * - Notificaciones de actualizaciones
 * - Mensajes para ocasiones especiales
 * - Completamente desacoplado del código existente
 */

class ZionWelcomeSystem {
    constructor() {
        this.storageKey = 'zion_welcome_data';
        this.data = this.loadData();
        this.specialDates = this.getSpecialDates();
        this.init();
    }

    // Inicializar el sistema
    init() {
        console.log('🎉 Sistema de bienvenida iniciando...');
        // Crear el modal en el DOM
        this.createModal();

        // Aparecer ANTES de que el splash comience a desvanecerse
        setTimeout(() => {
            console.log('⏰ Verificando mensaje...');
            this.checkAndShow();
        }, 2200); // 300ms antes del fade-out del splash para evitar flash
    }

    // Cargar datos del localStorage
    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            lastShown: null,
            dismissedIds: [],
            preferences: {
                showDaily: true,
                showUpdates: true,
                showSpecial: true
            },
            stats: {
                firstUse: new Date().toISOString(),
                totalOpens: 0
            }
        };
    }

    // Guardar datos en localStorage
    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    // Obtener versículo aleatorio de la Biblia RV1960
    getRandomVerse() {
        // Verificar si la Biblia está cargada
        if (typeof bibleSource_RV1960 === 'undefined') {
            // Fallback a versículos predefinidos si la Biblia no está cargada
            const fallbackVerses = [
                {
                    text: "Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos.",
                    ref: "Mateo 18:20"
                },
                {
                    text: "Este es el día que hizo Jehová; nos gozaremos y alegraremos en él.",
                    ref: "Salmos 118:24"
                }
            ];
            return fallbackVerses[Math.floor(Math.random() * fallbackVerses.length)];
        }

        // Seleccionar libro aleatorio
        const randomBook = bibleSource_RV1960[Math.floor(Math.random() * bibleSource_RV1960.length)];

        // Seleccionar capítulo aleatorio
        const randomChapter = randomBook.chapters[Math.floor(Math.random() * randomBook.chapters.length)];

        // Seleccionar versículo aleatorio
        const randomVerseIndex = Math.floor(Math.random() * randomChapter.length);
        const verseText = randomChapter[randomVerseIndex];

        // Calcular número de capítulo y versículo
        const chapterNumber = randomBook.chapters.indexOf(randomChapter) + 1;
        const verseNumber = randomVerseIndex + 1;

        return {
            text: verseText,
            ref: `${randomBook.name} ${chapterNumber}:${verseNumber}`
        };
    }

    // Fechas especiales
    getSpecialDates() {
        return {
            '12-25': { name: 'Navidad', icon: '🎄', message: 'Que en esta Navidad, la luz de Cristo ilumine cada transmisión.' },
            '01-01': { name: 'Año Nuevo', icon: '🎊', message: 'Un nuevo año para llevar el mensaje de esperanza a más corazones.' },
            '04-18': { name: 'Viernes Santo', icon: '✝️', message: 'Recordando el sacrificio que nos dio vida eterna.' },
            '04-20': { name: 'Domingo de Resurrección', icon: '🕊️', message: '¡Él ha resucitado! Celebremos la victoria sobre la muerte.' },
            '12-31': { name: 'Fin de Año', icon: '🎆', message: 'Gracias por un año más de servicio y dedicación.' }
        };
    }

    // Verificar si debe mostrar el modal
    checkAndShow() {
        console.log('✅ checkAndShow ejecutado');

        // Incrementar contador de aperturas
        this.data.stats.totalOpens++;

        // Determinar qué tipo de mensaje mostrar
        const message = this.determineMessage();
        console.log('📝 Mensaje determinado:', message);

        if (message) {
            this.showModal(message);
            // Guardar estadísticas (sin bloquear futuras apariciones)
            this.saveData();
        } else {
            console.warn('⚠️ No hay mensaje para mostrar');
        }
    }

    // Obtener período actual del día
    getCurrentPeriod() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) {
            return 'morning'; // Mañana: 6am - 12pm
        } else if (hour >= 12 && hour < 19) {
            return 'afternoon'; // Tarde: 12pm - 7pm
        } else {
            return 'night'; // Noche: 7pm - 6am
        }
    }

    // Determinar qué mensaje mostrar
    determineMessage() {
        // 1. Verificar actualizaciones críticas (prioridad máxima)
        const criticalUpdate = this.checkCriticalUpdates();
        if (criticalUpdate) return criticalUpdate;

        // 2. Verificar fechas especiales
        const specialDate = this.checkSpecialDate();
        if (specialDate && this.data.preferences.showSpecial) return specialDate;

        // 3. Mensaje de bienvenida diario
        if (this.data.preferences.showDaily) {
            return this.getDailyWelcome();
        }

        return null;
    }

    // Verificar actualizaciones críticas
    checkCriticalUpdates() {
        // Aquí puedes definir actualizaciones importantes
        // Ejemplo:
        /*
        const updates = [
            {
                id: 'update-v1.1',
                type: 'update',
                priority: 'high',
                title: '¡Nueva versión disponible!',
                message: 'ZionCast v1.1 incluye mejoras de rendimiento y nuevas características.',
                actions: [
                    { label: 'Ver detalles', action: 'showChangelog' },
                    { label: 'Más tarde', action: 'dismiss' }
                ]
            }
        ];

        for (const update of updates) {
            if (!this.data.dismissedIds.includes(update.id)) {
                return update;
            }
        }
        */
        return null;
    }

    // Verificar fecha especial
    checkSpecialDate() {
        const now = new Date();
        const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (this.specialDates[monthDay]) {
            const special = this.specialDates[monthDay];
            return {
                type: 'special',
                title: `¡${special.name}!`,
                icon: special.icon,
                message: special.message,
                verse: this.getRandomVerse()
            };
        }
        return null;
    }

    // Obtener mensaje de bienvenida diario
    getDailyWelcome() {
        const hour = new Date().getHours();
        let greeting;

        if (hour >= 6 && hour < 12) {
            greeting = '¡Buenos días!';
        } else if (hour >= 12 && hour < 19) {
            greeting = '¡Buenas tardes!';
        } else {
            greeting = '¡Buenas noches!';
        }

        // Logo oficial de ZionCast
        const icon = `<img src="img/solologo.png" width="80" height="80" style="object-fit: contain; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));">`;

        const daysUsing = this.calculateDaysUsing();

        return {
            type: 'daily',
            title: greeting,
            icon: icon,
            message: 'Que tengas una transmisión bendecida y llena del Espíritu Santo.',
            verse: this.getRandomVerse(),
            stats: daysUsing > 0 ? `Llevas ${daysUsing} ${daysUsing === 1 ? 'día' : 'días'} usando ZionCast` : null
        };
    }

    // Calcular días usando la aplicación
    calculateDaysUsing() {
        if (!this.data.stats.firstUse) return 0;
        const first = new Date(this.data.stats.firstUse);
        const now = new Date();
        const diff = Math.floor((now - first) / (1000 * 60 * 60 * 24));
        return diff;
    }

    // Crear el modal en el DOM
    createModal() {
        const backdrop = document.createElement('div');
        backdrop.id = 'zionWelcomeBackdrop';
        backdrop.innerHTML = `
            <div class="zion-welcome-card" onclick="event.stopPropagation()">
                <div class="zion-welcome-content">
                    <!-- Contenido dinámico se insertará aquí -->
                </div>
            </div>
        `;

        // Cerrar al hacer clic en el backdrop
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.closeModal();
            }
        });

        document.body.appendChild(backdrop);
    }

    // Mostrar el modal con el mensaje
    showModal(message) {
        console.log('🎨 Mostrando modal con mensaje:', message);
        const backdrop = document.getElementById('zionWelcomeBackdrop');
        const content = backdrop.querySelector('.zion-welcome-content');

        // Construir el contenido según el tipo de mensaje
        let html = '';

        // Icono
        if (message.icon) {
            html += `<div class="zion-welcome-icon">${message.icon}</div>`;
        }

        // Título
        html += `<h2 class="zion-welcome-title">${message.title}</h2>`;

        // Versículo (si existe)
        if (message.verse) {
            html += `
                <div class="zion-welcome-verse">
                    <p class="zion-welcome-verse-text">"${message.verse.text}"</p>
                    <p class="zion-welcome-verse-ref">— ${message.verse.ref}</p>
                </div>
            `;
        }

        // Mensaje
        if (message.message) {
            html += `<p class="zion-welcome-message">${message.message}</p>`;
        }

        // Estadísticas (si existen)
        if (message.stats) {
            html += `
                <div class="zion-welcome-stats">
                    <span class="zion-welcome-stats-icon"></span>
                    <span class="zion-welcome-stats-text">
                        <span class="zion-welcome-stats-highlight">${message.stats}</span>
                    </span>
                </div>
            `;
        }

        // Loader de progreso líquido + Botones de acción
        html += `
            <!-- Liquid Progress Loader -->
            <div class="zion-welcome-loader" id="welcomeLoader">
                <div class="zion-welcome-progress-container">
                    <div class="zion-welcome-progress-bar" id="welcomeProgressBar"></div>
                </div>
                <div class="zion-welcome-loader-text">Preparando tu experiencia...</div>
            </div>

            <!-- Botones (ocultos inicialmente) -->
            <div class="zion-welcome-actions" id="welcomeActions">
                <button class="zion-welcome-btn" onclick="zionWelcome.closeModal()">
                    Comenzar
                </button>
            </div>
        `;

        content.innerHTML = html;

        // Mostrar el modal inmediatamente
        backdrop.classList.add('show');

        // Iniciar animación de progreso después de que el modal aparezca
        setTimeout(() => {
            this.animateProgress();
        }, 500);
    }

    // Animar la barra de progreso
    animateProgress() {
        const progressBar = document.getElementById('welcomeProgressBar');
        const loaderText = document.querySelector('.zion-welcome-loader-text');
        const loader = document.getElementById('welcomeLoader');
        const actions = document.getElementById('welcomeActions');

        if (!progressBar) return;

        // Mensajes que cambian según el progreso
        const messages = [
            { threshold: 0, text: 'Cargando biblias...' },
            { threshold: 16, text: 'Preparando globitos de citas...' },
            { threshold: 33, text: 'Cargando overlays...' },
            { threshold: 50, text: 'Conectando sala de transmisión...' },
            { threshold: 66, text: 'Configurando interfaz...' },
            { threshold: 83, text: 'Finalizando preparación...' }
        ];

        let progress = 0;
        const duration = 6000; // 6 segundos
        const steps = 50;
        const increment = 100 / steps;
        const interval = duration / steps;

        const progressInterval = setInterval(() => {
            progress += increment;

            // Actualizar mensaje según el progreso
            for (let i = messages.length - 1; i >= 0; i--) {
                if (progress >= messages[i].threshold) {
                    if (loaderText) loaderText.textContent = messages[i].text;
                    break;
                }
            }

            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);

                // Cuando termina, primero ocultar loader
                setTimeout(() => {
                    if (loader) loader.classList.add('hidden');

                    // Esperar a que el loader desaparezca completamente, luego mostrar botón
                    setTimeout(() => {
                        if (actions) actions.classList.add('show');
                    }, 500); // Espera a que termine la transición del loader
                }, 300);
            }

            progressBar.style.width = `${progress}%`;
        }, interval);
    }

    // Cerrar el modal
    closeModal() {
        const backdrop = document.getElementById('zionWelcomeBackdrop');
        backdrop.classList.remove('show');
    }

    // Método público para mostrar un mensaje personalizado
    showCustomMessage(config) {
        this.showModal(config);
    }

    // Método público para resetear el sistema
    reset() {
        localStorage.removeItem(this.storageKey);
        this.data = this.loadData();
        console.log('Sistema de bienvenida reseteado');
    }
}

// Inicializar el sistema cuando el DOM esté listo
let zionWelcome;

document.addEventListener('DOMContentLoaded', () => {
    zionWelcome = new ZionWelcomeSystem();
});

// Exportar para uso global
window.ZionWelcomeSystem = ZionWelcomeSystem;
