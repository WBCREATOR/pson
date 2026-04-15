(function(global){

function safeEvalOperation(expr) {
    // Solo permite números y operadores básicos
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
        throw new Error("Operación inválida: " + expr);
    }
    return Function("return (" + expr + ")")();
}

function parseValue(value) {
    value = value.trim();

    // operation(...)
    if (value.startsWith("operation(")) {
        const inner = value.slice(10, -1);
        return safeEvalOperation(inner);
    }

    if (value.startsWith('"') || value.startsWith("'")) {
        return value.slice(1, -1);
    }

    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;

    if (!isNaN(value)) return Number(value);

    throw new Error("Valor inválido: " + value);
}

function parsePSON(input) {
    const variables = {};

    // 1. Variables
    const varRegex = /(\w+)\s*=\s*(.*?);/g;
    let match;

    while ((match = varRegex.exec(input))) {
        const name = match[1];
        const rawValue = match[2];

        variables[name] = parseValue(rawValue);
    }

    // 2. Reemplazar var(...)
    input = input.replace(/var\((\w+)\)/g, (_, name) => {
        if (!(name in variables)) {
            throw new Error("Variable no definida: " + name);
        }
        return JSON.stringify(variables[name]);
    });

    // 3. Resolver operation dentro del objeto
    input = input.replace(/operation\((.*?)\)/g, (_, expr) => {
        return JSON.stringify(safeEvalOperation(expr));
    });

    // 4. Extraer object(...)
    const objMatch = input.match(/object\s*\(([\s\S]*)\);?/);
    if (!objMatch) throw new Error("No se encontró object(...)");

    let jsonLike = objMatch[1];

    jsonLike = jsonLike.replace(/;/g, ",");
    jsonLike = jsonLike.replace(/,\s*([}\]])/g, "$1");

    return JSON.parse(jsonLike);
}

// Export global
global.PSON = {
    parse: parsePSON
};

})(window);