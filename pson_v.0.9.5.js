
(function (global) {

const PSON = {};

let inputQueue = [];
let inputPending = null;
let inputId = 0;

// ============================================================
// CONSOLE INPUT
// ============================================================

PSON.answer = function (value) {

    if (!inputPending) {
        console.error("[PSON] No hay ninguna entrada pendiente.");
        return;
    }

    const resolve = inputPending;
    inputPending = null;

    resolve(value);

};

PSON.input = function (message) {

    return new Promise(resolve => {

        inputPending = resolve;
        inputId++;

        console.log(`%c[PSON INPUT #${inputId}] ${message}`, "color:#00bfff;font-weight:bold");
        console.log(
            `%cEscriba: PSON.answer("su respuesta")`,
            "color:#aaa"
        );

    });

};

// ============================================================
// PARSER
// ============================================================

PSON.parse = async function (codigo) {

    const variables = {};

    const declarationRegex =
        /(^|[;\n])\s*([A-Z][a-zA-Z0-9_]*|_[A-Z][a-zA-Z0-9_]*)\s*=\s*([^;\n]+);/g;

    const declarations = [...codigo.matchAll(declarationRegex)];

    for (const declaration of declarations) {

        const nombre = declaration[2];
        const valor = declaration[3].trim();

        const textInput = valor.match(
            /^input\s*\(\s*(["'])([\s\S]*?)\1\s*\)$/
        );

        const intInput = valor.match(
            /^int\.input\s*\(\s*(["'])([\s\S]*?)\1\s*\)$/
        );

        if (textInput || intInput) {

            const message = (textInput || intInput)[2];

            const response = await PSON.input(message);

            if (intInput) {

                const number = Number(response);

                if (
                    String(response).trim() === "" ||
                    !Number.isInteger(number)
                ) {
                    throw new Error(
                        `Se esperaba un número entero en ${nombre}`
                    );
                }

                variables[nombre] = number;

            } else {

                variables[nombre] = String(response);

            }

        } else {

            if (!isNaN(valor) && valor.trim() !== "") {

                variables[nombre] = Number(valor);

            } else {

                throw new Error(
                    `Valor inválido en ${nombre}: ${valor}`
                );

            }

        }

    }

    codigo = codigo.replace(declarationRegex, "");

    // Replace direct variables outside strings

    let resultado = "";
    let quote = null;
    let escaped = false;
    let i = 0;

    while (i < codigo.length) {

        const char = codigo[i];

        if (quote) {

            resultado += char;

            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }

            i++;
            continue;

        }

        if (char === '"' || char === "'") {

            quote = char;
            resultado += char;
            i++;
            continue;

        }

        const variableMatch = codigo.slice(i).match(
            /^([A-Z][a-zA-Z0-9_]*|_[A-Z][a-zA-Z0-9_]*)\b/
        );

        if (variableMatch) {

            const nombre = variableMatch[1];

            if (Object.prototype.hasOwnProperty.call(variables, nombre)) {

                resultado += JSON.stringify(variables[nombre]);
                i += nombre.length;
                continue;

            }

        }

        resultado += char;
        i++;

    }

    codigo = resultado;

    // operation(...)

    codigo = codigo.replace(
        /operation\(([^)]+)\)/g,
        (match, expresion) => {

            try {
                return JSON.stringify(
                    Function(`return (${expresion})`)()
                );
            } catch {
                throw new Error(
                    `Error en operación: ${expresion}`
                );
            }

        }
    );

    // object(...)

    const matchObject = codigo.match(
        /object\s*\(\s*({[\s\S]*})\s*\)\s*;?/
    );

    if (!matchObject) {
        throw new Error("No se encontró object({...})");
    }

    let objeto = matchObject[1];

    objeto = objeto.replace(/;/g, ",");
    objeto = objeto.replace(/,\s*}/g, "}");

    try {

        return Function(`return (${objeto})`)();

    } catch (e) {

        console.error("Generated object:", objeto);

        throw new Error(
            "Error al generar objeto JS: " + e.message
        );

    }

};

global.PSON = PSON;

})(window);
