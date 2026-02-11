const fs = require('fs');
const path = require('path');

const biblesDir = path.join(__dirname, 'js', 'bibles');
const files = fs.readdirSync(biblesDir).filter(f => f.endsWith('.js') && f.startsWith('bible_'));

console.log('Verificando biblias...\n');

files.forEach(file => {
    const filePath = path.join(biblesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extraer el nombre de la variable
    const varMatch = content.match(/var\s+(\w+)\s*=/);
    if (!varMatch) {
        console.log(`❌ ${file}: No se pudo encontrar la variable`);
        return;
    }

    const varName = varMatch[1];

    // Evaluar el archivo para cargar la biblia
    try {
        eval(content);
        const bible = eval(varName);

        // Buscar 2 Crónicas (índice 13 en el array de 66 libros)
        const cronicas2 = bible[13];
        if (!cronicas2 || cronicas2.name !== '2 Crónicas') {
            console.log(`⚠️  ${file}: No se encontró 2 Crónicas en el índice esperado`);
            return;
        }

        // Verificar capítulo 31 (índice 30)
        const cap31Data = cronicas2.chapters[30];
        const cap31 = cap31Data.verses || cap31Data;

        if (!cap31 || cap31.length === 0) {
            console.log(`❌ ${file}: Capítulo 31 de 2 Crónicas está vacío`);
            return;
        }

        // Contar versículos vacíos
        let emptyCount = 0;
        cap31.forEach((v, i) => {
            if (!v || v.trim() === '') {
                emptyCount++;
            }
        });

        if (emptyCount > 0) {
            console.log(`❌ ${file}: ${emptyCount} versículos vacíos en 2 Crónicas 31 (de ${cap31.length} total)`);
        } else {
            console.log(`✅ ${file}: OK (${cap31.length} versículos)`);
        }

    } catch (err) {
        console.log(`❌ ${file}: Error al evaluar - ${err.message}`);
    }
});
