
(function (global) {

const PSON = {};

// ============================================================
// CONFIGURATION
// ============================================================

let inputPending = null;
let inputCounter = 0;

// ============================================================
// CONSOLE INPUT SYSTEM
// ============================================================

PSON.answer = function (value) {

    if (!inputPending) {
        console.error("[PSON ERROR]: No input requested.");
        return;
    }

    const resolve = inputPending;

    inputPending = null;

    resolve(value);

};

PSON.input = function (message) {

    return new Promise(resolve => {

        if (inputPending) {
            throw new Error("Another input is already pending.");
        }

        inputPending = resolve;

        inputCounter++;

        console.log(
            `%c[PSON INPUT #${inputCounter}] ${message}`,
            "color:#00bfff;font-weight:bold;font-size:13px"
        );

        console.log(
            '%cType: PSON.answer("your response")',
            "color:#999"
        );

    });

};

// ============================================================
// VARIABLE NAME VALIDATION
// ============================================================

PSON.validVariable = function (name) {

    return /^[A-Z][a-zA-Z0-9_]*$/.test(name) ||
           /^_[A-Z][a-zA-Z0-9_]*$/.test(name);

};

// ============================================================
// MAIN PARSER
// ============================================================

PSON.parse = async function (codigo) {

    const variables = {};

    // --------------------------------------------------------
    // 1. EXTRACT VARIABLES
    // --------------------------------------------------------

    const declarationRegex =
        /^[ \t]*([A-Z][a-zA-Z0-9_]*|_[A-Z][a-zA-Z0-9_]*)[ \t]*=[ \t]*([^;\r\n]+);[ \t]*$/gm;

    const declarations = [...codigo.matchAll(declarationRegex)];

    for (const declaration of declarations) {

        const nombre = declaration[1];
        const valor = declaration[2].trim();

        // TEXT INPUT

        const textInput = valor.match(
            /^input\s*\(\s*(["'])([\s\S]*?)\1\s*\)$/
        );

        // INTEGER INPUT

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
                    !Number.isSafeInteger(number)
                ) {

                    throw new Error(
                        `Invalid integer value in ${nombre}: ${response}`
                    );

                }

                variables[nombre] = number;

            } else {

                variables[nombre] = String(response);

            }

            continue;

        }

        // NUMERIC VALUES

        if (valor.trim() !== "" && !isNaN(valor)) {

            variables[nombre] = Number(valor);

        } else {

            throw new Error(
                `Invalid value in ${nombre}: ${valor}`
            );

        }

    }

    // --------------------------------------------------------
    // 2. REMOVE VARIABLE DECLARATIONS
    // --------------------------------------------------------

    codigo = codigo.replace(declarationRegex, "");

    // --------------------------------------------------------
    // 3. REPLACE DIRECT VARIABLE REFERENCES
    // --------------------------------------------------------

    let resultado = "";

    let quote = null;
    let escaped = false;

    let i = 0;

    while (i < codigo.length) {

        const char = codigo[i];

        // INSIDE STRING

        if (quote !== null) {

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

        // STRING START

        if (char === '"' || char === "'") {

            quote = char;

            resultado += char;

            i++;
            continue;

        }

        // VARIABLE DETECTION

        const variableMatch = codigo.slice(i).match(
            /^([A-Z][a-zA-Z0-9_]*|_[A-Z][a-zA-Z0-9_]*)/
        );

        if (variableMatch) {

            const nombre = variableMatch[1];

            if (
                Object.prototype.hasOwnProperty.call(
                    variables,
                    nombre
                )
            ) {

                resultado += JSON.stringify(variables[nombre]);

                i += nombre.length;

                continue;

            }

        }

        resultado += char;

        i++;

    }

    codigo = resultado;

    // --------------------------------------------------------
    // 4. OPERATION(...)
    // --------------------------------------------------------

    codigo = codigo.replace(
        /operation\(([^)]+)\)/g,
        (match, expresion) => {

            try {

                const value = Function(
                    `"use strict"; return (${expresion});`
                )();

                return JSON.stringify(value);

            } catch (e) {

                throw new Error(
                    `Operation error: ${expresion}`
                );

            }

        }
    );

    // --------------------------------------------------------
    // 5. EXTRACT OBJECT
    // --------------------------------------------------------

    const matchObject = codigo.match(
        /object\s*\(\s*({[\s\S]*})\s*\)\s*;?/
    );

    if (!matchObject) {

        throw new Error(
            "No se encontró object({...})"
        );

    }

    let objeto = matchObject[1];

    // --------------------------------------------------------
    // 6. PSON SYNTAX CONVERSION
    // --------------------------------------------------------

    objeto = objeto.replace(/;/g, ",");

    objeto = objeto.replace(/,\s*}/g, "}");

    // --------------------------------------------------------
    // 7. GENERATE JAVASCRIPT OBJECT
    // --------------------------------------------------------

    try {

        return Function(
            `"use strict"; return (${objeto});`
        )();

    } catch (e) {

        console.error("[PSON GENERATED OBJECT]:", objeto);

        throw new Error(
            "Object generation error: " + e.message
        );

    }

};

// ============================================================
// GLOBAL EXPORT
// ============================================================

global.PSON = PSON;

})(window);
