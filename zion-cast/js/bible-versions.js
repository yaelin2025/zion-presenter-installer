// Índice de versiones de la Biblia disponibles en Zion Cast
const BIBLE_VERSIONS = [
    { id: 'RV1960', name: 'Reina Valera 1960', file: 'bible_rv1960.js', default: true },
    { id: 'RV1995', name: 'Reina Valera 1995', file: 'bible_rv1995.js' },
    { id: 'RVA2015', name: 'Reina Valera Actualizada 2015', file: 'bible_rva2015.js' },
    { id: 'RV1909', name: 'Reina Valera Antigua 1909', file: 'bible_rv1909.js' },
    { id: 'RVC2011', name: 'Reina Valera Contemporánea 2011', file: 'bible_rvc2011.js' },
    { id: 'RVG', name: 'Reina Valera Gomez', file: 'bible_rvg.js' },
    { id: 'RVP2008', name: 'Reina Valera Purificada 2008', file: 'bible_rvp2008.js' },
    { id: 'NVI', name: 'Nueva Versión Internacional 1999', file: 'bible_nvi.js' },
    { id: 'NTV', name: 'Nueva Traducción Viviente', file: 'bible_ntv.js' },
    { id: 'LBLA', name: 'La Biblia de las Américas', file: 'bible_lbla.js' },
    { id: 'BTX', name: 'La Biblia Textual', file: 'bible_btx.js' },
    { id: 'DHH', name: 'Dios Habla Hoy', file: 'bible_dhh.js' },
    { id: 'PDT', name: 'Palabra de Dios para Todos', file: 'bible_pdt.js' },
    { id: 'LXX', name: 'Septuaginta (LXX)', file: 'bible_lxx.js' },
    { id: 'OSO', name: 'Sagradas Escrituras 1569', file: 'bible_oso.js' }
];

// Variable global para la versión actual
let currentBibleVersion = 'RV1960';

// Función para cargar una versión de la Biblia
async function loadBibleVersion(versionId) {
    const version = BIBLE_VERSIONS.find(v => v.id === versionId);
    if (!version) {
        console.error(`Versión ${versionId} no encontrada`);
        return false;
    }

    try {
        // Eliminar script anterior si existe (excepto RV1960 que es la base)
        const oldScript = document.querySelector(`script[data-bible-version]`);
        if (oldScript) oldScript.remove();

        // Cargar nuevo script
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `js/bibles/${version.file}`;
            script.dataset.bibleVersion = versionId;
            script.onload = () => {
                // Asignar la variable cargada a bibleSource
                const varName = `bibleSource_${versionId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
                if (window[varName]) {
                    window.bibleSource = window[varName];
                    currentBibleVersion = versionId;
                    console.log(`✅ Biblia cargada: ${version.name}`);

                    // Actualizar UI si existe la función
                    if (typeof window.onBibleVersionChanged === 'function') {
                        window.onBibleVersionChanged(versionId, version.name);
                    }

                    resolve(true);
                } else {
                    reject(new Error(`Variable ${varName} no encontrada`));
                }
            };
            script.onerror = () => reject(new Error(`Error cargando ${version.file}`));
            document.head.appendChild(script);
        });
    } catch (error) {
        console.error('Error cargando versión de la Biblia:', error);
        return false;
    }
}

// Inicializar selector cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('bibleVersionSelector');
    if (!selector) return;

    // Event listener para cambio de versión
    selector.addEventListener('change', async (e) => {
        const versionId = e.target.value;
        console.log(`Cambiando a versión: ${versionId}`);

        // Guardar posición actual si existe
        const currentBook = typeof selectedBookIndex !== 'undefined' ? selectedBookIndex : 0;
        const currentChap = typeof selectedChapter !== 'undefined' ? selectedChapter : 1;

        // Cargar nueva versión
        const loaded = await loadBibleVersion(versionId);

        if (loaded) {
            // Guardar preferencia inmediatamente
            localStorage.setItem('zion_bibleVersion', versionId);

            // Recargar el navegador con la nueva versión (sin delay)
            if (typeof window.selectBook === 'function' && currentBook >= 0) {
                window.selectBook(currentBook);
                if (typeof window.selectChapter === 'function' && currentChap > 0) {
                    window.selectChapter(currentBook, currentChap);

                    // Si hay un versículo proyectado, reproyectarlo inmediatamente
                    if (window.lastProjectedVerse && typeof window.displayVerseInEditor === 'function') {
                        const { bookIdx, chap, verse, verseEnd } = window.lastProjectedVerse;
                        // Usar requestAnimationFrame para la siguiente frame (más rápido que setTimeout)
                        requestAnimationFrame(() => {
                            window.displayVerseInEditor(bookIdx, chap, verse, verseEnd);
                        });
                    }
                }
            }
        }
    });

    // Nota: Se eliminó la carga desde localStorage para que siempre inicie con RV1960 por defecto
    selector.value = 'RV1960';
});
