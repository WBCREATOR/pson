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
            throw new Error(`Valor inválido en ${nombre}: ${valor}`);
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

    // 3. Variables directas
    codigo = codigo.replace(/\b([A-Z_][A-Z0-9_]*)\b/g, (match) => {
        if (match in variables) {
            return variables[match];
        }
        return match;
    });

    // 4. operation(...)
    codigo = codigo.replace(/operation\(([^)]+)\)/g, (m, expr) => {
        try {
            return Function(`return (${expr})`)();
        } catch {
            throw new Error(`Error en operación: ${expr}`);
        }
    });

    // 5. object(...)
    const match = codigo.match(/object\s*\(\s*({[\s\S]*})\s*\)/);

    if (!match) {
        throw new Error("No se encontró object({...})");
    }

    let objeto = match[1];

    objeto = objeto.replace(/;/g, ",");
    objeto = objeto.replace(/,\s*}/g, "}");

    // 6. Ejecutar como JS
    try {
        return Function(`return (${objeto})`)();
    } catch (e) {
        throw new Error("Error al generar objeto JS");
    }
};

global.PSON = PSON;

})(window);
