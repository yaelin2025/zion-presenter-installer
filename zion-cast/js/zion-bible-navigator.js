// BIBLE NAVIGATOR LOGIC (Zion Presenter Style)
// Maps indices 0-65 to books

const BIBLE_BOOKS = [
    "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio",
    "Josué", "Jueces", "Rut", "1 Samuel", "2 Samuel", "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas",
    "Esdras", "Nehemías", "Ester", "Job", "Salmos", "Proverbios", "Eclesiastés", "Cantares",
    "Isaías", "Jeremías", "Lamentaciones", "Ezequiel", "Daniel",
    "Oseas", "Joel", "Amós", "Abdías", "Jonás", "Miqueas", "Nahúm", "Habacuc", "Sofonías", "Hageo", "Zacarías", "Malaquías",
    "Mateo", "Marcos", "Lucas", "Juan", "Hechos", "Romanos", "1 Corintios", "2 Corintios", "Gálatas", "Efesios", "Filipenses", "Colosenses",
    "1 Tesalonicenses", "2 Tesalonicenses", "1 Timoteo", "2 Timoteo", "Tito", "Filemón",
    "Hebreos", "Santiago", "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan", "Judas", "Apocalipsis"
];

// --- SISTEMA DE VERSÍCULOS RECIENTES ---
let recentVerses = JSON.parse(localStorage.getItem('zion_recent_verses') || '[]');

window.addToRecent = function (ref, text, b, c, v) {
    // Evitar duplicados (quitar si existe y re-insertar al inicio)
    recentVerses = recentVerses.filter(item => item.ref !== ref);

    // Agregar al inicio
    recentVerses.unshift({ ref, text, b, c, v, timestamp: new Date().getTime() });

    // Limitar a los últimos 10
    if (recentVerses.length > 10) {
        recentVerses = recentVerses.slice(0, 10);
    }

    // Guardar en persistencia local
    localStorage.setItem('zion_recent_verses', JSON.stringify(recentVerses));
};

window.showRecentVerses = function () {
    const resultsArea = document.getElementById('searchResults');
    if (!resultsArea) return;

    // TOGGLE LOGIC: Si ya está mostrando recientes, lo limpia
    const isShowing = resultsArea.innerHTML.includes('PROYECTADOS RECIENTEMENTE');

    if (isShowing) {
        // Volver al contexto actual (capítulo seleccionado)
        if (typeof selectedBookIndex !== 'undefined' && typeof selectedChapter !== 'undefined' &&
            selectedBookIndex !== -1 && selectedChapter !== -1) {
            // Restaurar la vista del capítulo actual
            selectChapter(selectedBookIndex, selectedChapter);
        } else {
            // Si no hay nada seleccionado, limpiar
            resultsArea.innerHTML = '';
        }
        return;
    }

    if (recentVerses.length === 0) {
        resultsArea.innerHTML = '<div style="padding:20px; text-align:center; color:rgba(255,255,255,0.4); font-size:0.8rem;">No hay versículos proyectados recientemente.</div>';
        return;
    }

    resultsArea.innerHTML = '<div style="padding:4px 8px; font-size:0.6rem; color:var(--accent); font-weight:800; opacity:0.6; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">PROYECTADOS RECIENTEMENTE</div>';
    resultsArea.scrollTop = 0; // Fix scroll persistence issue

    recentVerses.forEach(item => {
        const div = document.createElement('div');
        div.style.padding = "8px 10px";
        div.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        div.style.cursor = "pointer";
        div.style.transition = "none";
        div.style.borderLeft = "2px solid transparent";

        div.onmouseover = () => {
            div.style.background = "rgba(255,255,255,0.05)";
            div.style.borderLeftColor = "var(--accent)";
        };
        div.onmouseout = () => {
            div.style.background = "transparent";
            div.style.borderLeftColor = "transparent";
        };

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                <span style="color:var(--accent); font-weight:800; font-size:0.8rem;">${item.ref}</span>
                <span style="font-size:0.55rem; opacity:0.3; color:#fff;">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.7); line-height:1.2; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${item.text}</div>
        `;

        div.onclick = () => {
            setTimeout(() => {
                selectBook(item.b);
                selectChapter(item.b, item.c);
                displayVerseInEditor(item.b, item.c, item.v);
            }, 50);
        };

        resultsArea.appendChild(div);
    });
};

window.resetNavigator = function () {
    selectedBookIndex = -1;
    selectedChapter = -1;
    currentBookIdx = -1;
    currentChap = -1;
    currentVerse = 0;

    // Clear UI highlights
    document.querySelectorAll('#bookList li').forEach(li => {
        li.style.background = "transparent";
        li.style.color = "var(--text-secondary, #ffffff)";
        li.style.fontWeight = "normal";
    });

    const chapterGrid = document.getElementById('gridChapters');
    if (chapterGrid) chapterGrid.innerHTML = '';

    const resultsArea = document.getElementById('searchResults');
    if (resultsArea) {
        resultsArea.innerHTML = '';
        // Al resetear, mostramos los recientes por defecto
        showRecentVerses();
    }
};

// Sincroniza el estado interno del navegador sin proyectar (para que las flechas funcionen)
window.syncNavigator = function (bookIdx, chap, verse) {
    currentBookIdx = bookIdx;
    currentChap = chap;
    currentVerse = verse;
    selectedBookIndex = bookIdx;
    selectedChapter = chap;
};


let selectedBookIndex = 0;
let selectedChapter = 1;
let currentBookIdx = 0;
let currentChap = 1;
let currentVerse = 0; // 1-based index

// Helper to Jump to specific context and project
window.jumpToVerse = function (bookIndex, chapter, verse) {
    if (typeof selectBook === 'function') selectBook(bookIndex);
    if (typeof selectChapter === 'function') selectChapter(bookIndex, chapter);
    // Agregamos un pequeño delay para asegurar que el DOM se procesó antes de resaltar
    setTimeout(() => {
        if (typeof displayVerseInEditor === 'function') displayVerseInEditor(bookIndex, chapter, verse);
    }, 50);
};

document.addEventListener('DOMContentLoaded', () => {
    // Wait for bibleSource to load
    if (typeof bibleSource !== 'undefined') {
        initBibleNavigator();
    } else {
        setTimeout(initBibleNavigator, 500); // Retry
    }

    setupSearchExpansion();
});

function setupSearchExpansion() {
    // Fix layout for search results
    const results = document.getElementById('searchResults');
    if (results) {
        results.style.flex = "1";
        results.style.minHeight = "0"; // Critical for flex scrolling
        results.parentElement.style.display = "flex";
        results.parentElement.style.flexDirection = "column";
    }

    // Connect Search Button
    const btnSearch = document.getElementById('btnSearchKeywords');
    if (btnSearch) {
        btnSearch.onclick = handleKeywordSearch;
    }
}

function initBibleNavigator() {
    const bookList = document.getElementById('bookList');
    const chapterGrid = document.getElementById('gridChapters');
    // const verseGrid = document.getElementById('gridVerses'); // Removed

    if (!bookList || !chapterGrid) return;

    console.log("📘 Initializing Zion Bible Navigator...");

    // 1. Populate Books
    bookList.innerHTML = '';
    BIBLE_BOOKS.forEach((name, index) => {
        const li = document.createElement('li');
        li.textContent = name;
        li.style.padding = "4px 8px";
        li.style.cursor = "pointer";
        li.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        li.style.fontSize = "0.75rem";
        li.style.transition = "none";
        li.style.color = "var(--text-secondary, #ffffff)";

        li.onmouseover = () => { if (selectedBookIndex !== index) li.style.background = "rgba(255,255,255,0.05)"; };
        li.onmouseout = () => {
            if (selectedBookIndex !== index) li.style.background = "transparent";
        };
        li.onclick = () => selectBook(index);

        li.id = `book-item-${index}`;
        bookList.appendChild(li);
    });

    // Auto Select Genesis
    selectBook(0);

    // Mostrar recientes al inicio si existen
    if (recentVerses.length > 0) {
        showRecentVerses();
    }

    // Keyboard Navigation Listener
    document.addEventListener("keydown", handleArrowNavigation);
}

function handleArrowNavigation(e) {
    // Ignore if typing in an input
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        // If no verse selected, start at verse 1
        if (!currentVerse) {
            displayVerseInEditor(currentBookIdx, currentChap, 1);
        } else {
            projectNextVerse();
        }
    }
    if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!currentVerse) return; // Cannot go back if nothing selected
        projectPrevVerse();
    }
}

function projectNextVerse() {
    if (!bibleSource) return;
    const book = bibleSource[currentBookIdx];
    const chapterData = book.chapters[currentChap - 1];
    const verses = chapterData.verses || chapterData;

    // Solo avanzar si hay siguiente versículo en el capítulo actual
    if (currentVerse < verses.length) {
        displayVerseInEditor(currentBookIdx, currentChap, currentVerse + 1);
    }
    // Si ya estamos en el último versículo, no hacer nada
}

function projectPrevVerse() {
    if (!bibleSource) return;

    // Solo retroceder si hay versículo anterior en el capítulo actual
    if (currentVerse > 1) {
        displayVerseInEditor(currentBookIdx, currentChap, currentVerse - 1);
    }
    // Si ya estamos en el versículo 1, no hacer nada
}

function selectBook(index) {
    selectedBookIndex = index;
    currentBookIdx = index;
    currentChap = 1; // Default
    currentVerse = 0; // Reset verse

    // Update UI List
    document.querySelectorAll('#bookList li').forEach((li, idx) => {
        if (idx === index) {
            li.style.background = "var(--accent)";
            li.style.color = "var(--accent-text, white)";
            li.style.fontWeight = "bold";
            li.scrollIntoView({ block: "center", behavior: "smooth" });
        } else {
            li.style.background = "transparent";
            li.style.color = "var(--text-secondary, #ffffff)";
            li.style.fontWeight = "normal";
        }
    });

    // Populate Chapters
    populateChapters(index);
}

function populateChapters(bookIndex) {
    const chapterGrid = document.getElementById('gridChapters');
    chapterGrid.innerHTML = '';

    if (!bibleSource || !bibleSource[bookIndex]) {
        chapterGrid.innerHTML = '<div style="padding:10px;">Cargando...</div>';
        return;
    }

    const chapters = bibleSource[bookIndex].chapters.length;

    for (let i = 1; i <= chapters; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style.border = "1px solid rgba(255,255,255,0.1)";
        btn.style.background = "rgba(0,0,0,0.3)";
        btn.style.color = "#ffffff";
        btn.style.borderRadius = "4px";
        btn.style.cursor = "pointer";
        btn.style.fontSize = "0.7rem";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";

        btn.onmouseover = () => btn.style.background = "rgba(255,255,255,0.2)";
        btn.onmouseout = () => {
            // Reset if not active (we don't track active chapter persistently in this simplified version except visually)
            if (selectedChapter !== i) btn.style.background = "rgba(0,0,0,0.3)";
        };

        btn.onclick = () => selectChapter(bookIndex, i);

        chapterGrid.appendChild(btn);
    }

    // Select Chapter 1 by default
    selectChapter(bookIndex, 1);
}

function selectChapter(bookIndex, chapter) {
    selectedChapter = chapter;
    currentChap = chapter;
    currentVerse = 0; // Reset verse

    // Highlight Chapter Button
    const chapterGrid = document.getElementById('gridChapters');
    Array.from(chapterGrid.children).forEach(btn => {
        if (parseInt(btn.textContent) === chapter) {
            btn.style.background = "var(--accent)";
            btn.style.color = "var(--accent-text, white)";
            btn.style.fontWeight = "bold";
            btn.style.border = "none";
        } else {
            btn.style.background = "rgba(0,0,0,0.3)";
            btn.style.color = "#ffffff";
            btn.style.fontWeight = "normal";
            btn.style.border = "1px solid rgba(255,255,255,0.1)";
        }
    });

    // Populate Verses in SEARCH RESULTS (Column 3)
    const resultsArea = document.getElementById('searchResults');
    if (!resultsArea) return;

    resultsArea.innerHTML = '';
    resultsArea.scrollTop = 0; // Reset scroll on chapter change



    // Compatible con ambos formatos
    const chapterData = bibleSource[bookIndex].chapters[chapter - 1];
    const verses = chapterData.verses || chapterData; // Si tiene .verses usa eso, sino usa el array directo
    if (!verses) return;

    verses.forEach((text, i) => {
        const vNum = i + 1;
        const row = document.createElement('div');
        row.style.display = "flex";
        row.style.gap = "8px";
        row.style.padding = "4px 8px"; // Added horizontal padding
        row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        row.style.cursor = "pointer";
        row.style.borderRadius = "4px";
        row.id = `verse-row-${vNum}`; // ID for Navigation Tracking

        // Hover effect helper
        row.onmouseover = () => {
            if (!row.classList.contains('verse-active')) {
                row.style.background = "rgba(255,255,255,0.1)";
            }
        };
        row.onmouseout = () => {
            if (!row.classList.contains('verse-active')) {
                row.style.background = "transparent";
            } else {
                row.style.background = ""; // Rely on CSS class
            }
        };

        // Click to project
        row.onclick = () => displayVerseInEditor(bookIndex, chapter, vNum);

        // Number
        const numSpan = document.createElement('span');
        numSpan.textContent = vNum;
        numSpan.style.color = "var(--accent)";
        numSpan.style.fontWeight = "bold";
        numSpan.style.minWidth = "20px";
        numSpan.style.textAlign = "right";
        numSpan.style.fontSize = "0.85rem";

        // Text
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        textSpan.style.color = "#ffffff";
        textSpan.style.fontSize = "0.85rem";
        textSpan.style.lineHeight = "1.4";

        row.appendChild(numSpan);
        row.appendChild(textSpan);
        resultsArea.appendChild(row);
    });
}

// Exponer globalmente para uso desde búsqueda
window.displayVerseInEditor = displayVerseInEditor;

function displayVerseInEditor(bookIdx, chap, verse, verseEnd = null) {
    // 0. Update State
    currentBookIdx = bookIdx;
    currentChap = chap;
    currentVerse = verse;

    // Guardar para reproyección al cambiar versión
    window.lastProjectedVerse = { bookIdx, chap, verse, verseEnd };

    // 1. Get Text - compatible con ambos formatos
    const chapterData = bibleSource[bookIdx].chapters[chap - 1];
    let text = "";

    const end = verseEnd ? verseEnd : verse;
    for (let i = verse; i <= end; i++) {
        const vText = chapterData.verses ? chapterData.verses[i - 1] : chapterData[i - 1];
        if (vText) text += vText.trim() + " ";
    }

    const ref = `${BIBLE_BOOKS[bookIdx].toUpperCase()} ${chap}:${verse}${verseEnd ? '-' + verseEnd : ''}`;

    // 2. Mock 'Bible Input' search just for visual consistency
    const searchInput = document.getElementById('bibleInput');
    if (searchInput) searchInput.value = ref;

    // CRITICAL: Set verse mode FIRST before updating any fields
    if (window.state) {
        window.state.isVerse = true;    // Mark as Bible content FIRST
        window.state.currentVerseText = text; // Store verse text
        window.state.show.br = true;    // Show the bottom-right ref too
        if (window.updateToggleUI) window.updateToggleUI();
    }

    // 3. DON'T populate center field - keep user's sketch intact

    // 4. Populate Ultima Cita (br) only
    const lastCite = document.getElementById('br'); // Ultima Cita (Der)
    if (lastCite) lastCite.value = ref;

    // Use Global Send with Animations
    if (typeof window.send === 'function') {
        window.send(['center', 'cb', 'br']);
    }

    // Guardar en Recientes
    if (window.addToRecent) {
        window.addToRecent(ref, text, bookIdx, chap, verse);
    }

    // Optional: Flash feedback
    // toast(`Pasaje cargado: ${ref}`); // Assuming toast function exists or similar

    // 5. Highlight in UI (if list is visible)
    highlightCurrentVerse(verse);
}

function highlightCurrentVerse(verseNum) {
    const resultsArea = document.getElementById('searchResults');
    if (!resultsArea) return;

    console.log(`📍 Highlighting Verse: ${verseNum}`);

    // Clear previous active
    const prev = resultsArea.querySelector('.verse-active');
    if (prev) {
        prev.classList.remove('verse-active');
        prev.style.background = "transparent";
    }

    const row = document.getElementById(`verse-row-${verseNum}`);
    if (row) {
        row.classList.add('verse-active');
        row.style.background = ""; // Clean inline so CSS takes over
        row.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
        console.warn(`⚠️ Row verse-row-${verseNum} not found in DOM`);
    }
}

// --- KEYWORD SEARCH LOGIC ---

function handleKeywordSearch() {
    const input = document.getElementById('bibleInput');
    const results = document.getElementById('searchResults');
    if (!input || !results) return;

    // Helper to remove accents/diacritics
    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const rawQuery = input.value.trim();
    if (rawQuery.length < 3) {
        results.innerHTML = '<div style="padding:10px; color:var(--text-secondary, #ffffff); text-align:center;">Escribe al menos 3 letras...</div>';
        return;
    }

    const query = normalize(rawQuery);
    results.innerHTML = '<div style="padding:10px; color:var(--text-secondary, #ffffff); text-align:center;">Buscando...</div>';

    if (typeof bibleSource === 'undefined') {
        results.innerHTML = '<div style="padding:10px; color:salmon; text-align:center;">Biblia no cargada.</div>';
        return;
    }

    const found = [];
    let count = 0;
    const MAX_RESULTS = 50;

    // Search
    for (let b = 0; b < bibleSource.length; b++) {
        const book = bibleSource[b];
        if (!book || !book.chapters) continue;
        const bookName = BIBLE_BOOKS[b];

        for (let c = 0; c < book.chapters.length; c++) {
            const chap = book.chapters[c];
            if (!chap) continue;

            for (let v = 0; v < chap.length; v++) {
                const text = chap[v];
                if (text && normalize(text).includes(query)) {
                    found.push({
                        ref: `${bookName} ${c + 1}:${v + 1}`,
                        text: text,
                        b: b,
                        c: c + 1,
                        v: v + 1
                    });
                    count++;
                    if (count >= MAX_RESULTS) break;
                }
            }
            if (count >= MAX_RESULTS) break;
        }
        if (count >= MAX_RESULTS) break;
    }


    // Render
    if (found.length === 0) {
        results.innerHTML = '<div style="padding:10px; color:var(--text-secondary, #ffffff); text-align:center;">No se encontraron resultados.</div>';
        return;
    }

    results.innerHTML = '';
    found.forEach(item => {
        const div = document.createElement('div');
        div.style.padding = "10px";
        div.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        div.style.cursor = "pointer";
        div.style.transition = "background 0.2s";

        div.onmouseover = () => div.style.background = "rgba(255,255,255,0.05)";
        div.onmouseout = () => div.style.background = "transparent";

        // Highlight logic
        const highlightedText = item.text.replace(new RegExp(`(${query})`, 'gi'), '<span style="color:var(--accent-green); font-weight:bold; text-shadow:0 0 5px rgba(0,255,0,0.3);">$1</span>');

        div.innerHTML = `
            <div style="color:var(--accent-blue); font-weight:700; font-size:0.85rem; margin-bottom:4px;">${item.ref}</div>
            <div style="font-size:0.85rem; color:#ffffff; line-height:1.4;">${highlightedText}</div>
        `;

        div.onclick = () => {
            // Use timeout to allow click event to finish before destroying the DOM element
            setTimeout(() => {
                // Jump to Context
                selectBook(item.b);
                selectChapter(item.b, item.c);
                // Then Project & Highlight
                displayVerseInEditor(item.b, item.c, item.v);
            }, 50);
        };

        results.appendChild(div);
    });
}
