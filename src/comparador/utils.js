function normalizarArticulo(valor) {
    return String(valor ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
}

function convertirPrecio(valor) {
    if (typeof valor === "number") {
        return Math.round(valor * 100);
    }

    let texto = String(valor ?? "")
        .trim()
        .replace(/\$/g, "")
        .replace(/\s/g, "");

    if (!texto) return null;

    // Soporta:
    // 1.999,99
    // 1999,99
    // 1999.99
    // 1,999.99
    if (texto.includes(",") && texto.includes(".")) {
        if (texto.lastIndexOf(",") > texto.lastIndexOf(".")) {
            // Formato argentino: 1.999,99
            texto = texto.replace(/\./g, "").replace(",", ".");
        } else {
            // Formato internacional: 1,999.99
            texto = texto.replace(/,/g, "");
        }
    } else if (texto.includes(",")) {
        // Decimal con coma
        texto = texto.replace(",", ".");
    }

    const numero = Number(texto);

    if (!Number.isFinite(numero)) {
        return null;
    }

    // Trabajamos en centavos para evitar errores de precisión de JavaScript.
    return Math.round(numero * 100);
}

function formatearPrecioCentavos(centavos) {
    if (centavos === null || centavos === undefined) return "";

    return (centavos / 100).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function limpiarTextoPDF(texto) {
    return texto
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{2,}/g, "\n");
}

export {
    normalizarArticulo,
    convertirPrecio,
    formatearPrecioCentavos,
    limpiarTextoPDF
};