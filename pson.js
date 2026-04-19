(function () {

function esVariableValida(nombre) {
    return /^[A-Z_][A-Z0-9_]*$/.test(nombre);
}

// Detecta asignaciones tipo: VAR = algo;
function extraerAsignaciones(codigo) {
    const regex = /^([A-Z_][A-Z0-9_]*)\s*=\s*(.+?);$/gm;
    let match;
    const asignaciones = [];

    while ((match = regex.exec(codigo)) !== null) {
        asignaciones.push({
            nombre: match[1],
            valor: match[2]
        });
    }

    return asignaciones;
}

function resolverExpresion(expr, contexto) {
    return expr.replace(/\b[A-Z_][A-Z0-9_]*\b/g, (v) => {
        if (!(v in contexto)) {
            throw new Error(`Variable no definida: ${v}`);
        }
        return contexto[v];
    });
}

function evaluarAsignaciones(codigo, contexto) {
    const asignaciones = extraerAsignaciones(codigo);

    asignaciones.forEach(({ nombre, valor }) => {

        if (!esVariableValida(nombre)) {
            throw new Error(`Variable inválida: ${nombre}`);
        }

        let evaluado = valor.trim();

        // Resolver variables dentro de la expresión
        evaluado = resolverExpresion(evaluado, contexto);

        // Si es operation(...)
        if (evaluado.startsWith("operation(")) {
            const contenido = evaluado.slice(10, -1);

            try {
                // ⚠️ evaluación matemática controlada
                const resultado = Function(`return (${contenido})`)();
                contexto[nombre] = resultado;
            } catch {
                throw new Error(`Operación inválida en ${nombre}`);
            }
        } else {
            // valor directo
            try {
                contexto[nombre] = JSON.parse(evaluado);
            } catch {
                contexto[nombre] = evaluado;
            }
        }
    });

    return contexto;
}

function reemplazarVariablesFinal(codigo, contexto) {
    return codigo.replace(/\b[A-Z_][A-Z0-9_]*\b/g, (v) => {
        if (v in contexto) return JSON.stringify(contexto[v]);
        return v;
    });
}

function procesarPSON(codigo) {
    const contexto = {};

    // 🔥 1. evaluar variables dinámicas
    evaluarAsignaciones(codigo, contexto);

    // 🔥 2. reemplazar variables en todo el código
    const codigoFinal = reemplazarVariablesFinal(codigo, contexto);

    return codigoFinal;
}

function ejecutarPSONEnTags() {
    const bloques = document.querySelectorAll('plumescript[type="PSON"]');

    bloques.forEach((tag, index) => {
        try {
            let codigo = tag.textContent.trim();
            if (!codigo) return;

            codigo = procesarPSON(codigo);

            console.log("[DEBUG FINAL]", codigo);

            const resultado = PSON.parse(codigo);

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
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            let texto = await res.text();

            texto = procesarPSON(texto);

            console.log("[DEBUG FILE FINAL]", texto);

            const resultado = PSON.parse(texto);

            console.log(`[PSON file #${i}: ${url}]`, resultado);

        } catch (e) {
            console.error(`[PSON ERROR file #${i}: ${url}]`, e.message);
        }
    }
}

function iniciar() {
    if (!window.PSON) {
        console.error("[PSON] Motor no encontrado");
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
