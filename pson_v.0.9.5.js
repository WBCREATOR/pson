
(function (global) {

const PSON = {};

let inputResolver = null;
let inputCounter = 0;

// ============================================================
// CONSOLE INPUT SYSTEM
// ============================================================

PSON.answer = function (value) {

    if (!inputResolver) {
        console.error("[PSON ERROR]: No input is currently requested.");
        return;
    }

    const resolve = inputResolver;
    inputResolver = null;

    resolve(value);

};

PSON.input = function (message) {

    return new Promise(resolve => {

        inputCounter++;

        inputResolver = resolve;

        console.log(`[PSON INPUT #${inputCounter}] ${message}`);
        console.log(
            `[PSON] Enter: PSON.answer("YOUR RESPONSE")`
        );

    });

};

// ============================================================
// PSON PARSER
// ============================================================

PSON.parse = async function (codigo) {

    const variables = {};

    // 1. Extract variable declarations

    const declarationRegex =
        /(^|[;\n])\s*([A-Z][a-zA-Z0-9_]*|_[A-Z][a-zA-Z0-9_]*)\s*=\s*([^;\n]+);/g;

    const declarations = [...codigo.matchAll(declarationRegex)];

    for (const declaration of declarations) {

        const nombre = declaration[2];
        const valor = declaration[3].trim();

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

    // 2. Remove variable declarations

    codigo = codigo.replace(declarationRegex, "");

    // 3. Replace direct variable references
    // Only replace identifiers outside quoted strings.

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

        const remaining = codigo.slice(i);

        const variableMatch = remaining.match(
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

    // 4. Evaluate operation(...)

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

    // 5. Extract object({...})

    const matchObject = codigo.match(
        /object\s*\(\s*({[\s\S]*})\s*\)\s*;?/
    );

    if (!matchObject) {

        throw new Error("No se encontró object({...})");

    }

    let objeto = matchObject[1];

    // 6. Convert PSON semicolons into commas

    objeto = objeto.replace(/;/g, ",");

    // 7. Remove trailing commas

    objeto = objeto.replace(/,\s*}/g, "}");

    // 8. Generate JavaScript object

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
