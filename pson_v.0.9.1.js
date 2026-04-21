(function (global) {

const PSON = {};

PSON.parse = function (codigo) {

    const variables = {};

    // 1. Variables
    codigo = codigo.replace(/([A-Z_][A-Z0-9_]*)\s*=\s*([^;]+);/g, (m, nombre, valor) => {
        valor = valor.trim();

        if (!isNaN(valor)) {
            variables[nombre] = Number(valor);
        } else {
            throw new Error(`Valor inválido en ${nombre}`);
        }

        return "";
    });

    // 2. var(...)
    codigo = codigo.replace(/var\(([^)]+)\)/g, (m, nombre) => {
        nombre = nombre.trim();

        if (!(nombre in variables)) {
            throw new Error(`Variable no definida: ${nombre}`);
        }

        return variables[nombre];
    });

    // 3. operation(...)
    codigo = codigo.replace(/operation\(([^)]+)\)/g, (m, expr) => {
        try {
            return Function(`return (${expr})`)();
        } catch {
            throw new Error(`Error en operación: ${expr}`);
        }
    });

    // 4. object(...)
    const match = codigo.match(/object\s*\(\s*({[\s\S]*})\s*\)/);

    if (!match) {
        throw new Error("No se encontró object({...})");
    }

    let objeto = match[1];

    // 🔴 FIX CLAVE: convertir sintaxis PSON → JS válido

    // ; → ,
    objeto = objeto.replace(/;/g, ",");

    // "clave": valor  (ya es válido)
    // PERO esto:
    // "Lokinos": { ... } dentro de [] es inválido

    // 🔥 convertir arrays mal usados a objetos
    objeto = objeto.replace(/\[\s*([^\]]+)\s*\]/g, (m, contenido) => {
        if (contenido.includes(":")) {
            // Es realmente un objeto mal escrito como array
            return `{ ${contenido} }`;
        }
        return `[${contenido}]`;
    });

    // eliminar coma final
    objeto = objeto.replace(/,\s*}/g, "}");

    console.log("[PSON DEBUG JS]:", objeto);

    // 5. Evaluar como JS (NO JSON)
    try {
        return Function(`return (${objeto})`)();
    } catch (e) {
        console.error("Código JS generado:", objeto);
        throw e;
    }
};

global.PSON = PSON;

})(window);
