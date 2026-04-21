(function (global) {

const PSON = {};

PSON.parse = function (codigo) {

    const variables = {};

    codigo = codigo.replace(/([A-Z_][A-Z0-9_]*)\s*=\s*([^;]+);/g, (m, nombre, valor) => {
        valor = valor.trim();

        if (!isNaN(valor)) {
            variables[nombre] = Number(valor);
        } else {
            throw new Error(`Valor inválido en ${nombre}`);
        }

        return "";
    });

    codigo = codigo.replace(/var\(([^)]+)\)/g, (m, nombre) => {
        nombre = nombre.trim();

        if (!(nombre in variables)) {
            throw new Error(`Variable no definida: ${nombre}`);
        }

        return variables[nombre];
    });

    codigo = codigo.replace(/operation\(([^)]+)\)/g, (m, expr) => {
        try {
            return Function(`return (${expr})`)();
        } catch {
            throw new Error(`Error en operación: ${expr}`);
        }
    });

    const match = codigo.match(/object\s*\(\s*({[\s\S]*})\s*\)/);

    if (!match) {
        throw new Error("No se encontró object({...})");
    }

    let objeto = match[1];

    objeto = objeto.replace(/;/g, ",");

    objeto = objeto.replace(/\[\s*([^\]]+)\s*\]/g, (m, contenido) => {
        if (contenido.includes(":")) {
            return `{ ${contenido} }`;
        }
        return `[${contenido}]`;
    });

    objeto = objeto.replace(/,\s*}/g, "}");

    console.log("[PSON DEBUG JS]:", objeto);

    try {
        return Function(`return (${objeto})`)();
    } catch (e) {
        console.error("Código JS generado:", objeto);
        throw e;
    }
};

global.PSON = PSON;

})(window);
