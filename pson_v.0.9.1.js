(function (global) {

const PSON = {};

PSON.parse = function (codigo) {

    const variables = {};

    // 1. Extraer variables
    codigo = codigo.replace(/([A-Z_][A-Z0-9_]*)\s*=\s*([^;]+);/g, (match, nombre, valor) => {
        valor = valor.trim();

        // Solo números por ahora (evita romper todo)
        if (!isNaN(valor)) {
            variables[nombre] = Number(valor);
        } else {
            throw new Error(`Valor inválido en variable ${nombre}: ${valor}`);
        }

        return "";
    });

    // 2. Reemplazar var(...)
    codigo = codigo.replace(/var\(([^)]+)\)/g, (match, nombre) => {
        nombre = nombre.trim();

        if (!(nombre in variables)) {
            throw new Error(`Variable no definida: ${nombre}`);
        }

        return variables[nombre];
    });

    // 3. Evaluar operation(...)
    codigo = codigo.replace(/operation\(([^)]+)\)/g, (match, expr) => {
        try {
            // Evaluación controlada
            return Function(`return (${expr})`)();
        } catch (e) {
            throw new Error(`Error en operación: ${expr}`);
        }
    });

    // 4. Buscar object(...)
    const match = codigo.match(/object\s*\(\s*({[\s\S]*})\s*\)/);

    if (!match) {
        throw new Error("No se encontró object({...})");
    }

    let objeto = match[1];

    // 5. Convertir ; → ,
    objeto = objeto.replace(/;/g, ",");

    // 6. Quitar coma final
    objeto = objeto.replace(/,\s*}/g, "}");

    // DEBUG (IMPORTANTE)
    console.log("[PSON DEBUG JSON]:", objeto);

    // 7. Parsear
    return JSON.parse(objeto);
};

global.PSON = PSON;

})(window);
