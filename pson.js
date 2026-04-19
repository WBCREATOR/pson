(function () {

function extraerVariables(codigo) {
    const matches = codigo.match(/\b[A-Z_][A-Z0-9_]*\b/g);
    return matches ? [...new Set(matches)] : [];
}

function esVariableValida(nombre) {
    return /^[A-Z_][A-Z0-9_]*$/.test(nombre);
}

function resolverVariables(codigo, contexto = {}) {
    const variables = extraerVariables(codigo);

    variables.forEach(nombre => {
        if (!esVariableValida(nombre)) {
            throw new Error(`Variable inválida: ${nombre}`);
        }

        if (!(nombre in contexto)) {
            throw new Error(`Variable no definida: ${nombre}`);
        }

        const valor = JSON.stringify(contexto[nombre]);

        // reemplazo global seguro
        const regex = new RegExp(`\\b${nombre}\\b`, 'g');
        codigo = codigo.replace(regex, valor);
    });

    return codigo;
}

// 👉 DEFINA SUS VARIABLES AQUÍ
const CONTEXTO_PSON = {
    LOKINOS_PRECIO: 500,
    LOKINOS_COSTO: 300,
    IVA: 19
};

function ejecutarPSONEnTags() {
    const bloques = document.querySelectorAll('plumescript[type="PSON"]');

    bloques.forEach((tag, index) => {
        try {
            const codigo = tag.textContent.trim();
            if (!codigo) return;

            const codigoProcesado = resolverVariables(codigo, CONTEXTO_PSON);

            console.log("[DEBUG código procesado]", codigoProcesado);

            const resultado = PSON.parse(codigoProcesado);

            console.log(`[PSON inline #${index}]`, resultado);

        } catch (e) {
            console.error(`[PSON ERROR inline #${index}]`, e.message);
        }
    });
}

async function cargarArchivosPSON() {
    const links = document.querySelectorAll('link[rel="pson"]');

    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const url = link.getAttribute("href");

        if (!url) continue;

        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const texto = await res.text();

            const codigoProcesado = resolverVariables(texto, CONTEXTO_PSON);

            console.log("[DEBUG archivo procesado]", codigoProcesado);

            const resultado = PSON.parse(codigoProcesado);

            console.log(`[PSON file #${i}: ${url}]`, resultado);

        } catch (e) {
            console.error(`[PSON ERROR file #${i}: ${url}]`, e.message);
        }
    }
}

function iniciar() {
    if (!window.PSON) {
        console.error("[PSON] Motor no encontrado (pson.js no cargado)");
        return;
    }

    ejecutarPSONEnTags();
    cargarArchivosPSON();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
} else {
    iniciar();
}

})();
