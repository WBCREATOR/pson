
(function (global) {

const PSON = {};

PSON.parse = function (codigo) {

    const variables = {};

    // 1. Variables and input declarations
    codigo = codigo.replace(
        /([A-Z_][A-Z0-9_]*)\s*=\s*([^;]+);/g,
        (m, nombre, valor) => {

            valor = valor.trim();

            // Text input
            const textInput = valor.match(
                /^input\s*\(\s*(["'])([\s\S]*?)\1\s*\)$/
            );

            // Integer input
            const intInput = valor.match(
                /^int\.input\s*\(\s*(["'])([\s\S]*?)\1\s*\)$/
            );

            if (textInput || intInput) {

                const message = (textInput || intInput)[2];

                const response = global.prompt(message);

                if (response === null) {
                    throw new Error(`Entrada cancelada: ${nombre}`);
                }

                if (intInput) {

                    const number = Number(response);

                    if (response.trim() === "" || !Number.isInteger(number)) {
                        throw new Error(`Se esperaba un número entero en ${nombre}`);
                    }

                    variables[nombre] = number;

                } else {

                    variables[nombre] = response;

                }

                return "";
            }

            // Numeric variables
            if (!isNaN(valor) && valor.trim() !== "") {
                variables[nombre] = Number(valor);
            } else {
                throw new Error(`Valor inválido en ${nombre}: ${valor}`);
            }

            return "";
        }
    );

    // 2. var(...)
    codigo = codigo.replace(/var\(([^)]+)\)/g, (m, nombre) => {

        nombre = nombre.trim();

        if (!(nombre in variables)) {
            throw new Error(`Variable no definida: ${nombre}`);
        }

        return JSON.stringify(variables[nombre]);
    });

    // 3. Direct variables
    codigo = codigo.replace(/\b([A-Z_][A-Z0-9_]*)\b/g, (match) => {

        if (match in variables) {
            return JSON.stringify(variables[match]);
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

    // 6. Generate JavaScript object
    try {
        return Function(`return (${objeto})`)();
    } catch (e) {
        console.error("Generated object:", objeto);
        throw new Error("Error al generar objeto JS: " + e.message);
    }

};

global.PSON = PSON;

})(window);
