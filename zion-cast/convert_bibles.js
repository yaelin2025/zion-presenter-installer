const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Script para Zion Cast - Convertidor de Biblias .bi a .js
const bibliasDir = path.join(__dirname, 'js', 'bibles');
const outputDir = path.join(__dirname, 'js', 'bibles');

const BIBLE_BOOKS_ES = [
    "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio", "Josué", "Jueces", "Rut", "1 Samuel", "2 Samuel", "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras", "Nehemías", "Ester", "Job", "Salmos", "Proverbios", "Eclesiastés", "Cantares", "Isaías", "Jeremías", "Lamentaciones", "Ezequiel", "Daniel", "Oseas", "Joel", "Amós", "Abdías", "Jonás", "Miqueas", "Nahúm", "Habacuc", "Sofonías", "Hageo", "Zacarías", "Malaquías",
    "Mateo", "Marcos", "Lucas", "Juan", "Hechos", "Romanos", "1 Corintios", "2 Corintios", "Gálatas", "Efesios", "Filipenses", "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses", "1 Timoteo", "2 Timoteo", "Tito", "Filemón", "Hebreos", "Santiago", "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan", "Judas", "Apocalipsis"
];

const BOOK_ABBREVIATIONS = {
    "gen": "Génesis", "exo": "Éxodo", "lev": "Levítico", "num": "Números", "deu": "Deuteronomio",
    "jos": "Josué", "jue": "Jueces", "rut": "Rut", "1sa": "1 Samuel", "2sa": "2 Samuel",
    "1re": "1 Reyes", "2re": "2 Reyes", "1cr": "1 Crónicas", "2cr": "2 Crónicas",
    "esd": "Esdras", "neh": "Nehemías", "est": "Ester", "job": "Job", "sal": "Salmos",
    "pro": "Proverbios", "ecl": "Eclesiastés", "can": "Cantares", "isa": "Isaías",
    "jer": "Jeremías", "lam": "Lamentaciones", "eze": "Ezequiel", "dan": "Daniel",
    "ose": "Oseas", "joe": "Joel", "amo": "Amós", "abd": "Abdías", "jon": "Jonás",
    "miq": "Miqueas", "nah": "Nahúm", "hab": "Habacuc", "sof": "Sofonías",
    "hag": "Hageo", "zac": "Zacarías", "mal": "Malaquías", "mat": "Mateo",
    "mar": "Marcos", "luc": "Lucas", "jua": "Juan", "hec": "Hechos", "rom": "Romanos",
    "1co": "1 Corintios", "2co": "2 Corintios", "gal": "Gálatas", "efe": "Efesios",
    "fil": "Filipenses", "col": "Colosenses", "1te": "1 Tesalonicenses",
    "2te": "2 Tesalonicenses", "1ti": "1 Timoteo", "2ti": "2 Timoteo", "tit": "Tito",
    "flm": "Filemón", "heb": "Hebreos", "stg": "Santiago", "1pe": "1 Pedro",
    "2pe": "2 Pedro", "1jn": "1 Juan", "2jn": "2 Juan", "3jn": "3 Juan",
    "jud": "Judas", "apo": "Apocalipsis"
};

function convertFile(fileName) {
    if (!fileName.endsWith('.bi')) return;

    console.log(`Procesando ${fileName}...`);
    const filePath = path.join(bibliasDir, fileName);

    // Extraer nombre completo y abreviatura
    const fullName = fileName.replace('.bi', '').split(' - ')[0].trim();
    let versionId = fileName.replace('.bi', '').split(' - ').pop().trim();
    const safeId = versionId.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    const tempDir = path.join(bibliasDir, 'temp_bible');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    try {
        execSync(`unzip -o "${filePath}" -d "${tempDir}"`, { stdio: 'ignore' });
        const extractedFiles = fs.readdirSync(tempDir);
        const internalFile = extractedFiles.find(f => f.endsWith('.bi') || f.toLowerCase().includes(versionId.toLowerCase()));

        if (!internalFile) {
            console.error(`No se encontró el archivo interno para ${fileName}`);
            return;
        }

        const content = fs.readFileSync(path.join(tempDir, internalFile), 'utf8');
        const lines = content.split(/\r?\n/);

        // Formato Zion Cast: array de objetos con name, abbrev y chapters (array de arrays de strings)
        const bibleData = [];

        for (let i = 0; i < 66; i++) {
            bibleData.push({
                name: BIBLE_BOOKS_ES[i],
                abbrev: Object.keys(BOOK_ABBREVIATIONS).find(k => BOOK_ABBREVIATIONS[k] === BIBLE_BOOKS_ES[i]) || BIBLE_BOOKS_ES[i].substring(0, 3).toLowerCase(),
                chapters: []
            });
        }

        lines.forEach(line => {
            const parts = line.split('|');
            if (parts.length >= 4) {
                const b = parseInt(parts[0]) - 1;
                const c = parseInt(parts[1]) - 1;
                const v = parseInt(parts[2]) - 1;
                const text = parts.slice(3).join('|').trim();

                if (b >= 0 && b < 66) {
                    if (!bibleData[b].chapters[c]) {
                        bibleData[b].chapters[c] = [];
                    }
                    bibleData[b].chapters[c][v] = text;
                }
            }
        });

        // Limpiar capítulos vacíos y rellenar versículos faltantes
        bibleData.forEach(book => {
            book.chapters = book.chapters.filter(c => c && c.length > 0).map(chap => {
                for (let i = 0; i < chap.length; i++) {
                    if (!chap[i]) chap[i] = "";
                }
                return chap;
            });
        });

        const outputFilePath = path.join(outputDir, `bible_${safeId.toLowerCase()}.js`);
        const outputContent = `// ${fullName} (${versionId})\nvar bibleSource_${safeId} = ${JSON.stringify(bibleData, null, 2)};\n`;
        fs.writeFileSync(outputFilePath, outputContent);

        console.log(`✅ Creado: bible_${safeId.toLowerCase()}.js`);

    } catch (err) {
        console.error(`❌ Error en ${fileName}:`, err.message);
    } finally {
        if (fs.existsSync(tempDir)) {
            try {
                fs.readdirSync(tempDir).forEach(f => fs.unlinkSync(path.join(tempDir, f)));
                fs.rmdirSync(tempDir);
            } catch (e) {
                // Ignorar errores de limpieza
            }
        }
    }
}

if (!fs.existsSync(bibliasDir)) {
    console.error("No existe la carpeta js/bibles");
} else {
    const files = fs.readdirSync(bibliasDir);
    const biFiles = files.filter(f => f.endsWith('.bi'));
    if (biFiles.length === 0) {
        console.log("No hay archivos .bi para procesar.");
    } else {
        console.log(`\nEncontrados ${biFiles.length} archivos .bi\n`);
        biFiles.forEach(convertFile);
        console.log("\n✅ Proceso terminado. Las biblias están listas para usar en Zion Cast.\n");
    }
}
