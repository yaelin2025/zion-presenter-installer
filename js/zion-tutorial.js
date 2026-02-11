/* ========================================
   ZION PRESENTER - TUTORIAL ENGINE
   Lógica interactiva paso a paso
   ======================================== */

const ZionTutorial = {
    currentStep: 0,
    steps: [
        {
            element: '.view-header > div:nth-child(2)',
            title: '¡Bienvenido a Presenter!',
            text: 'Zion Presenter es tu plataforma completa para la proyección de alabanzas, biblias y anuncios con calidad profesional.',
            position: 'bottom',
            mode: 'songs' // Default start
        },
        {
            element: '.nav-tabs',
            title: 'Módulos Principales',
            text: 'Cambia rápidamente entre Cantos, Biblia, Anuncios y Slides. Cada módulo tiene su propia interfaz especializada.',
            position: 'bottom'
        },
        {
            element: '.nav-tab[onclick="setMode(\'presentations\')"]',
            title: 'Módulo de Slides',
            text: '¡Nuevo! Ahora puedes proyectar presentaciones PDF y PowerPoint directamente. Ideal para sermones y conferencias.',
            position: 'bottom'
        },
        {
            element: '.btn-resources',
            title: 'Centro de Recursos',
            text: 'Desde aquí podrás cargar nuestra lista de cantos y gestionar las versiones de la Biblia disponibles.',
            position: 'bottom'
        },
        {
            element: '.col-live h2',
            title: 'Control en Vivo',
            text: 'Este es el corazón del programa. Lo que ves aquí es lo que se está proyectando en tiempo real.',
            position: 'bottom'
        },
        {
            element: '#netStatus_songs',
            title: 'Estado de Red',
            text: 'Este indicador LED te confirma que la conexión con el visor externo está activa. Verde = Todo OK.',
            position: 'bottom',
            mode: 'songs'
        },
        {
            element: '.btn-overlay-main',
            title: 'Visor Local',
            text: 'Abre una ventana emergente con el visor. Arrástrala a tu segunda pantalla o proyector para mostrar la presentación en vivo.',
            position: 'left'
        },
        {
            element: '.btn-cast-jump',
            title: 'Salto a Zion Cast',
            text: 'Integra el poder de Zion Cast automáticamente. Este botón permite que tu visor actual cambie al modo PREDICACIÓN al instante, manteniendo una transición fluida sin configuraciones adicionales en el momento del servicio.',
            position: 'left'
        },
        {
            element: '.btn-remote',
            title: 'Conexión y Control Remoto',
            text: 'Descubre la versatilidad de conexión: utiliza esta sección para enlazar el visor con OBS o escanea el código QR con tu iPhone para tomar el control total de la presentación de forma inalámbrica desde cualquier punto.',
            position: 'left'
        },
        {
            element: '#optionsCard',
            title: 'Panel de Configuración',
            text: 'Haz clic aquí para desplegar las opciones avanzadas. Podrás personalizar fuentes, transiciones, fondos y colores.',
            position: 'top',
            isConfig: true
        },
        {
            element: '#fontFamily',
            title: 'Tipografía Profesional',
            text: 'Elige entre más de 15 fuentes profesionales de Google Fonts para tus proyecciones.',
            position: 'bottom',
            isConfig: true
        },
        {
            element: '#textColor',
            title: 'Colores de Texto',
            text: 'Personaliza el color de las letras y su sombra para asegurar la mejor legibilidad.',
            position: 'bottom',
            isConfig: true
        },
        {
            element: '#colorGrid',
            title: 'Color de Acento',
            text: 'Define el color de los botones y detalles de la interfaz para que combinen con tu estilo.',
            position: 'top',
            isConfig: true
        },
        {
            element: '#bgInput',
            title: 'Fondo Personalizado',
            text: 'Sube tus propias imágenes o videos (MP4/WebM) para usarlos como fondo en las canciones.',
            position: 'top',
            isConfig: true
        },
        {
            element: 'button[onclick="toggleUnsplashPanel()"]',
            title: 'Buscador Unsplash',
            text: 'Encuentra millones de imágenes profesionales directamente desde internet sin salir del programa.',
            position: 'top',
            isConfig: true
        },
        // --- MÓDULO CANTOS ---
        {
            element: '.col-library h2',
            title: 'Biblioteca de Cantos',
            text: 'Aquí se almacenan todos tus himnos y alabanzas. Todo se guarda automáticamente en tu base de datos local.',
            position: 'bottom',
            mode: 'songs'
        },
        {
            element: '#searchInput',
            title: 'Buscador Rápido',
            text: 'Escribe el título o parte de la letra para encontrar cualquier canto al instante.',
            position: 'bottom',
            mode: 'songs'
        },
        {
            element: '.col-library .primary',
            title: 'Editor Pro de Cantos',
            text: '¡Nuevo! Ahora puedes crear cantos con vista previa en vivo, contador de diapositivas y asignar al líder o cantante para diferenciar versiones.',
            position: 'bottom',
            mode: 'songs'
        },
        {
            element: '#libraryList',
            title: 'Identificación por Líder',
            text: 'Diferencia rápidamente quién canta cada versión. Además, ¡puedes usar el buscador para encontrar todos los cantos de un mismo líder!',
            position: 'bottom',
            mode: 'songs'
        },
        {
            element: '.col-setlist h2',
            title: 'Lista de Hoy',
            text: 'Arrastra los cantos desde la biblioteca hacia aquí para organizar el orden de tu servicio.',
            position: 'bottom',
            mode: 'songs'
        },
        // --- MÓDULO DE BIBLIA ---
        {
            element: '#bibleSearch',
            title: 'Buscador Inteligente',
            text: 'Encuentra pasajes al instante. Acepta formatos como "Jn 3:16", "Mateo 5.9" o búsqueda por texto.',
            position: 'bottom',
            mode: 'bible'
        },
        {
            element: '#bibleVersionSelect',
            title: 'Versiones Bíblicas',
            text: 'Elige entre múltiples versiones (RV1960, NVI, LBLA, etc.). Cambia de versión al instante sin perder tu versículo.',
            position: 'bottom',
            mode: 'bible'
        },
        {
            element: '#btnToggleHistory',
            title: 'Historial de Versículos',
            text: 'Accede rápidamente a los últimos versículos proyectados sin tener que volver a buscarlos.',
            position: 'bottom',
            mode: 'bible'
        },
        {
            element: '#btnToggleDual',
            title: 'Modo Dual (Comparativa)',
            text: 'Activa este botón para proyectar dos versiones simultáneamente. Ideal para estudios bíblicos comparativos.',
            position: 'bottom',
            mode: 'bible'
        },
        // --- MÓDULO ANUNCIOS ---
        {
            element: '.search-box .primary',
            title: 'Crear Anuncio',
            text: 'Redacta anuncios personalizados para la congregación. Título, mensaje y ¡listo para proyectar!',
            position: 'bottom',
            mode: 'announcements'
        },
        {
            element: '#mediaSourcesList',
            title: 'Multimedia (Fotos/Videos)',
            text: 'Sube imágenes o videos para proyectarlos en pantalla completa. Soporta "Arrastrar y Soltar" desde tu computadora.',
            position: 'top',
            mode: 'announcements'
        },
        {
            element: '#tickerControls',
            title: 'Ticker de Noticias',
            text: 'Activa el ticker para mostrar anuncios en movimiento en la parte inferior o superior de la pantalla. Personaliza el texto, velocidad, tamaño y posición.',
            position: 'top',
            mode: 'announcements'
        },
        {
            element: '.view-header > div:nth-child(2)',
            title: '¡Todo Listo!',
            text: 'Ahora tienes el control total. Que tu servicio sea de gran excelencia. ¡Bendiciones!',
            position: 'bottom',
            mode: 'songs'
        }
    ],

    init() {
        if (!document.getElementById('zion-tutorial-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'zion-tutorial-overlay';
            overlay.innerHTML = `
                <div class="tutorial-spotlight" id="tutorial-spotlight"></div>
                <div class="tutorial-tooltip" id="tutorial-tooltip">
                    <div class="tutorial-step-badge" id="tutorial-step-badge">1</div>
                    <div class="tutorial-title" id="tutorial-title"></div>
                    <div class="tutorial-text" id="tutorial-text"></div>
                    <div class="tutorial-actions">
                        <button class="tutorial-btn tutorial-btn-skip" onclick="ZionTutorial.end()">Saltar</button>
                        <button class="tutorial-btn tutorial-btn-next" onclick="ZionTutorial.next()" id="tutorial-next-btn">Siguiente</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    },

    start() {
        this.currentStep = 0;
        document.getElementById('zion-tutorial-overlay').classList.add('active');
        this.showStep();
    },

    next() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.end();
        } else {
            this.showStep();
        }
    },

    end() {
        document.getElementById('zion-tutorial-overlay').classList.remove('active');
        localStorage.setItem('zion_presenter_tutorial_shown', 'true');

        // Cerrar panel de opciones si quedó abierto
        const optionsCard = document.getElementById('optionsCard');
        if (optionsCard && optionsCard.classList.contains('expanded')) {
            if (typeof toggleOptionsPanel === 'function') toggleOptionsPanel();
        }
    },

    showStep() {
        const step = this.steps[this.currentStep];


        // 1. GESTIÓN AUTOMÁTICA DE MODO (Super Logic)
        if (step.mode && typeof setMode === 'function' && currentMode !== step.mode) {
            setMode(step.mode);
            // Esperar renderizado y reintentar
            setTimeout(() => this.showStep(), 300);
            return;
        }

        // --- MANEJO DEL PANEL DE OPCIONES (ANTES de buscar el elemento) ---
        const optionsCard = document.getElementById('optionsCard');
        if (optionsCard) {
            const isConfigStep = step.isConfig === true;
            const isExpanded = optionsCard.classList.contains('expanded');

            // Caso 1: Necesita abrir el panel (es un paso de config y está cerrado)
            if (isConfigStep && !isExpanded) {
                console.log(`🔧 Abriendo panel para: ${step.element}`);
                if (typeof toggleOptionsPanel === 'function') toggleOptionsPanel(true);
                else optionsCard.classList.add('expanded');

                // Esperar a que el panel se abra completamente antes de continuar
                setTimeout(() => this.showStep(), 500);
                return;
            }

            // Caso 2: Necesita cerrar el panel (NO es un paso de config y está abierto)
            if (!isConfigStep && isExpanded) {
                console.log(`🔧 Cerrando panel para el paso: ${step.element}`);
                if (typeof toggleOptionsPanel === 'function') toggleOptionsPanel(false);
                else optionsCard.classList.remove('expanded');

                setTimeout(() => this.showStep(), 500);
                return;
            }
        }

        // 2. BUSCAR ELEMENTO (ahora que el panel está abierto si es necesario)
        const el = document.querySelector(step.element);
        const tooltip = document.getElementById('tutorial-tooltip');
        const spotlight = document.getElementById('tutorial-spotlight');
        const badge = document.getElementById('tutorial-step-badge');
        const nextBtn = document.getElementById('tutorial-next-btn');

        if (!el) {
            console.warn(`Elemento no encontrado para el paso ${this.currentStep}: ${step.element}`);
            this.next();
            return;
        }

        // 2. ACTUALIZAR CONTENIDO PRIMERO
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-text').textContent = step.text;
        badge.textContent = this.currentStep + 1;
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Finalizar' : 'Siguiente';

        // Posicionar Foco
        this.positionTooltipAndSpotlight(el, step, tooltip, spotlight);

        // Scroll suave
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    positionTooltipAndSpotlight(el, step, tooltip, spotlight) {
        const rect = el.getBoundingClientRect();
        const padding = 10;

        spotlight.style.width = `${rect.width + (padding * 2)}px`;
        spotlight.style.height = `${rect.height + (padding * 2)}px`;
        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.left = `${rect.left - padding}px`;

        tooltip.classList.remove('active');

        setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            let top, left;

            if (step.position === 'bottom') {
                top = rect.bottom + 25;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            } else if (step.position === 'top') {
                top = rect.top - tooltipRect.height - 25;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            } else if (step.position === 'left') {
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - 25;
            } else if (step.position === 'right') {
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + 25;
            }

            // Evitar desbordamiento
            if (left < 10) left = 10;
            if (left + tooltipRect.width > window.innerWidth - 10) left = window.innerWidth - tooltipRect.width - 10;
            if (top < 10) top = 10;
            if (top + tooltipRect.height > window.innerHeight - 10) top = window.innerHeight - tooltipRect.height - 10;

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.classList.add('active');
        }, 100);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ZionTutorial.init();
});
