/* ========================================
   ZION CAST - TUTORIAL ENGINE
   Lógica interactiva paso a paso
   ======================================== */

const ZionTutorial = {
    currentStep: 0,
    steps: [
        {
            element: '#headerLogoArea',
            title: 'Zion Cast',
            text: 'Tu potente controlador para OBS. Esta herramienta proyecta 5 globos principales: Predicador, Pensamiento, Mensaje Central, Cita Base y Última Cita.',
            position: 'bottom'
        },
        {
            element: '.monitor-wrapper',
            title: 'Monitor Interactivo',
            text: 'Mueve y cambia el tamaño de los globos directamente aquí. Arrastra con el mouse y usa la manija blanca para redimensionar. ¡Lo que ves es lo que sale!',
            position: 'top'
        },
        {
            element: '#visibilityControls',
            title: 'Control de Visibilidad',
            text: 'Aquí decides qué globos se ven en pantalla. "TODOS" activa el Modo Cast completo con los 5 elementos.',
            position: 'bottom'
        },
        {
            element: '#center',
            title: 'Contenido Central',
            text: 'Escribe aquí los puntos clave de tu mensaje. Estos aparecerán en el globo central del visor.',
            position: 'bottom'
        },
        {
            element: '.slots-area',
            title: 'Memorias (Slots)',
            text: 'Guarda tus puntos clave en estos slots para cambiarlos rápidamente durante la predicación.',
            position: 'top'
        },
        {
            element: '#bibleInput',
            title: 'Buscador Bíblico',
            text: 'Al buscar un versículo, Zion Cast entra automáticamente en "Modo Versículo", ocultando todo lo demás para resaltar la Palabra.',
            position: 'bottom'
        },
        {
            element: '#bibleInput',
            title: 'Atajo Rápido (Tecla B)',
            text: 'Presiona la tecla "B" en cualquier momento para limpiar el buscador, ver tus versículos recientes y empezar una nueva cita al instante.',
            position: 'bottom'
        },
        {
            element: '#btnExitVerse',
            title: 'Volver a Modo Cast',
            text: 'Presiona este botón después de leer un versículo para regresar al Modo Cast y mostrar nuevamente tus 5 globos.',
            position: 'bottom'
        },
        {
            element: '.perm-card',
            title: 'Textos Permanentes',
            text: 'Aquí configuras los textos fijos como el nombre del Predicador, el Título o la Cita Base del mensaje.',
            position: 'top'
        },
        {
            element: '#netStatus',
            title: 'Estado de Conexión',
            text: 'Verifica siempre que el LED esté en verde para asegurar que el visor de OBS está recibiendo tus cambios.',
            position: 'bottom'
        },
        {
            element: '#themeSelector',
            title: 'Personalización',
            text: 'Cambia el look de tu panel con temas como Amarillo Limón o Rosa Ale. ¡Todo sincronizado!',
            position: 'bottom'
        },
        {
            element: '#btnViewer',
            title: 'Abrir Visor (OBS)',
            text: 'Haz clic aquí para obtener el enlace del visor que debes agregar como fuente de navegador en OBS o vMix.',
            position: 'bottom'
        },
        {
            element: '#btnBackground',
            title: 'Fondo del Visor',
            text: '¿Quieres una imagen de fondo? Conéctate a Unsplash desde aquí para elegir fotos impactantes.',
            position: 'bottom'
        },
        {
            element: '#unsplashSearch',
            title: 'Buscador de Imágenes',
            text: 'Escribe lo que buscas (ej: "Monte", "Cielo") y selecciona la mejor imagen para ambientar tu predicación.',
            position: 'bottom'
        },

        {
            element: '#headerLogoArea',
            title: '¡Todo Listo!',
            text: 'Ya conoces el poder de Zion Cast. Estamos aquí para que tu mensaje brille con excelencia. ¡Que Dios te use grandemente!',
            position: 'bottom'
        }
    ],

    init() {
        // Crear elementos del DOM si no existen
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

        // Si es la primera vez que entra, sugerir el tutorial (opcional)
        // O simplemente esperar a que el usuario presione el botón de ayuda
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
        localStorage.setItem('zion_tutorial_shown', 'true');

        // --- CERRAR TODO AL TERMINAR ---
        const drawer = document.getElementById('configDrawer');
        if (drawer && drawer.style.transform === 'translateY(0%)') {
            if (typeof toggleConfigDrawer === 'function') toggleConfigDrawer();
        }

        const unsplashModal = document.getElementById('unsplashModal');
        if (unsplashModal && unsplashModal.style.display === 'flex') {
            if (typeof toggleUnsplashModal === 'function') toggleUnsplashModal();
        }
    },

    showStep() {
        const step = this.steps[this.currentStep];
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

        // --- LÓGICA ESPECIAL PARA EL DRAWER (CONFIGURACIÓN) ---
        const drawer = document.getElementById('configDrawer');
        const isInsideDrawer = drawer && drawer.contains(el);
        const isDrawerOpen = drawer && drawer.style.transform === 'translateY(0%)';

        // --- LÓGICA ESPECIAL PARA EL MODAL DE FONDOS (UNSPLASH) ---
        const unsplashModal = document.getElementById('unsplashModal');
        const isInsideUnsplash = unsplashModal && unsplashModal.contains(el);
        const isUnsplashOpen = unsplashModal && (unsplashModal.style.display === 'flex');

        if (isInsideDrawer && !isDrawerOpen) {
            if (typeof toggleConfigDrawer === 'function') toggleConfigDrawer();
            setTimeout(() => this.positionTooltipAndSpotlight(el, step, tooltip, spotlight), 400);
        } else if (!isInsideDrawer && isDrawerOpen) {
            if (typeof toggleConfigDrawer === 'function') toggleConfigDrawer();
            setTimeout(() => this.positionTooltipAndSpotlight(el, step, tooltip, spotlight), 400);
        } else if (isInsideUnsplash && !isUnsplashOpen) {
            if (typeof toggleUnsplashModal === 'function') toggleUnsplashModal();
            setTimeout(() => this.positionTooltipAndSpotlight(el, step, tooltip, spotlight), 400);
        } else if (!isInsideUnsplash && isUnsplashOpen && step.element !== '#btnBackground') {
            if (typeof toggleUnsplashModal === 'function') toggleUnsplashModal();
            setTimeout(() => this.positionTooltipAndSpotlight(el, step, tooltip, spotlight), 400);
        } else {
            this.positionTooltipAndSpotlight(el, step, tooltip, spotlight);
        }

        // Actualizar contenido
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-text').textContent = step.text;
        badge.textContent = this.currentStep + 1;
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Finalizar' : 'Siguiente';
    },

    positionTooltipAndSpotlight(el, step, tooltip, spotlight) {
        // Posicionar Foco (Spotlight)
        const rect = el.getBoundingClientRect();
        const padding = 10;

        spotlight.style.width = `${rect.width + (padding * 2)}px`;
        spotlight.style.height = `${rect.height + (padding * 2)}px`;
        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.left = `${rect.left - padding}px`;

        // Posicionar Tooltip
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
            }

            // Evitar que se salga de la pantalla
            if (left < 10) left = 10;
            if (left + tooltipRect.width > window.innerWidth - 10) left = window.innerWidth - tooltipRect.width - 10;
            if (top < 10) top = rect.bottom + 25; // Si no cabe arriba, poner abajo

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.classList.add('active');
        }, 100);

        // Scroll suave al elemento si es necesario
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ZionTutorial.init();
});
