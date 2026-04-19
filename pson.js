(function () {

function esVariableValida(nombre) {
    return /^[A-Z_][A-Z0-9_]*$/.test(nombre);
}

function resolverVariables(codigo, contexto = {}) {
    return codigo.replace(/\b[A-Z_][A-Z0-9_]*\b/g, (match) => {

        if (!esVariableValida(match)) {
            throw new Error(`Variable inválida: ${match}`);
        }

        if (!(match in contexto)) {
            throw new Error(`Variable no definida: ${match}`);
        }

        return JSON.stringify(contexto[match]);
    });
}

// 👉 CONTEXTO GLOBAL DE VARIABLES (EDÍTELO AQUÍ)
const CONTEXTO_PSON = {
    TOTAL: 100,
    IVA: 19,
    NOMBRE: "Samuel",
    ACTIVO: true
};

function ejecutarPSONEnTags() {
    const bloques = document.querySelectorAll('plumescript[type="PSON"]');

    bloques.forEach((tag, index) => {
        try {
            const codigo = tag.textContent.trim();
            if (!codigo) return;

            // 🔥 Resolver variables antes de parsear
            const codigoProcesado = resolverVariables(codigo, CONTEXTO_PSON);

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

            // 🔥 Resolver variables en archivos
            const codigoProcesado = resolverVariables(texto, CONTEXTO_PSON);

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

// Auto-run seguro
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
} else {
    iniciar();
}

})();
