
(function (global) {

const PSON = global.PSON || {};

PSON.parse = async function (codigo) {

    const variables = {};

    const declarationRegex =
        /^[ \t]*([A-Z][a-zA-Z0-9_]*)[ \t]*=[ \t]*([^;\r\n]+);[ \t]*$/gm;

    const declarations = [...codigo.matchAll(declarationRegex)];

    for (const declaration of declarations) {

        const nombre = declaration[1];
        const valor = declaration[2].trim();

        const textInput = valor.match(
            /^input\s*\(\s*(["'])([\s\S]*?)\1\s*\)$/
        );

        const intInput = valor.match(
            /^int\.input\s*\(\s*(["'])([\s\S]*?)\1\s*\)$/
        );

        if (textInput || intInput) {

            if (typeof PSON.input !== "function") {
                throw new Error(
                    "El sistema PSON.input() no está disponible."
                );
            }

            const mensaje = (textInput || intInput)[2];
            const respuesta = await PSON.input(mensaje);

            if (intInput) {

                const numero = Number(respuesta);

                if (
                    String(respuesta).trim() === "" ||
                    !Number.isSafeInteger(numero)
                ) {
                    throw new Error(
                        `Valor entero inválido en ${nombre}: ${respuesta}`
                    );
                }

                variables[nombre] = numero;

            } else {

                variables[nombre] = String(respuesta);

            }

            continue;
        }

        if (!isNaN(valor) && valor.trim() !== "") {

            variables[nombre] = Number(valor);

        } else {

            throw new Error(
                `Valor inválido en ${nombre}: ${valor}`
            );

        }
    }

    codigo = codigo.replace(declarationRegex, "");

    let resultado = "";
    let quote = null;
    let escaped = false;
    let i = 0;

    while (i < codigo.length) {

        const char = codigo[i];

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

        if (char === '"' || char === "'") {

            quote = char;
            resultado += char;
            i++;
            continue;

        }

        const variableMatch = codigo.slice(i).match(
            /^[A-Z][a-zA-Z0-9_]*/
        );

        if (variableMatch) {

            const nombre = variableMatch[0];

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

    codigo = codigo.replace(
        /operation\(([^)]+)\)/g,
        (match, expresion) => {

            try {

                const valor = Function(
                    `"use strict"; return (${expresion});`
                )();

                return JSON.stringify(valor);

            } catch (e) {

                throw new Error(
                    `Error en operación: ${expresion}`
                );

            }

        }
    );

    const matchObject = codigo.match(
        /object\s*\(\s*({[\s\S]*})\s*\)\s*;?/
    );

    if (!matchObject) {

        throw new Error(
            "No se encontró object({...})"
        );

    }

    let objeto = matchObject[1];

    objeto = objeto.replace(/;/g, ",");
    objeto = objeto.replace(/,\s*}/g, "}");

    try {

        return Function(
            `"use strict"; return (${objeto});`
        )();

    } catch (e) {

        console.error("[PSON GENERATED OBJECT]:", objeto);

        throw new Error(
            "Error al generar el objeto: " + e.message
        );

    }

};

global.PSON = PSON;

})(window);
