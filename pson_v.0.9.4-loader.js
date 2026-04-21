(function () {

function ejecutarPSONEnTags() {
    const bloques = document.querySelectorAll('plumescript[type="PSON"]');

    bloques.forEach((tag, index) => {
        try {
            const codigo = tag.textContent.trim();
            if (!codigo) return;

            const resultado = window.PSON.parse(codigo);

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
            const resultado = window.PSON.parse(texto);

            console.log(`[PSON file #${i}: ${url}]`, resultado);

        } catch (e) {
            console.error(`[PSON ERROR file #${i}: ${url}]`, e.message);
        }
    }
}

function iniciar() {
    if (!window.PSON || typeof window.PSON.parse !== "function") {
        console.error("[PSON] Motor no encontrado o inválido");
        return;
    }

    ejecutarPSONEnTags();
    cargarArchivosPSON();
}

// Auto-run
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
} else {
    iniciar();
}

})();
