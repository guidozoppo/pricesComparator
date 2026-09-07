import * as pdfjsLib from "pdfjs-dist";

import {
    normalizarArticulo,
    convertirPrecio
} from "./utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

async function obtenerTextoPDF(pdfFile) {
    const arrayBuffer = await pdfFile.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    let textoCompleto = "";

    for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
        const page = await pdf.getPage(pagina);

        const content = await page.getTextContent();

        const items = content.items
            .filter((item) => item.str && item.str.trim().length > 0);

        const lineas = [];

        for (const item of items) {
            const posicionY = item.transform[5];

            let lineaExistente = lineas.find(
                (linea) => Math.abs(linea.posicionY - posicionY) < 2
            );

            if (!lineaExistente) {
                lineaExistente = {
                    posicionY,
                    items: []
                };

                lineas.push(lineaExistente);
            }

            lineaExistente.items.push(item);
        }

        lineas.sort((a, b) => b.posicionY - a.posicionY);

        const textoPagina = lineas
            .map((linea) => {
                linea.items.sort(
                    (a, b) => a.transform[4] - b.transform[4]
                );

                return linea.items
                    .map((item) => item.str.trim())
                    .join(" ");
            })
            .join("\n");

        textoCompleto += textoPagina + "\n";
    }

    return textoCompleto;
}

async function leerPDF(articulosExcel, pdfFile) {
    console.log(`\nLeyendo PDF: ${pdfFile.name}`);

    const texto = await obtenerTextoPDF(pdfFile);

    const lineas = texto
        .split("\n")
        .map((linea) => linea.trim())
        .filter((linea) => linea.length > 0);

    const preciosPDF = new Map();

    const ocurrencias = new Map();

    const descripcionesPDF = new Map();

    for (const articuloOriginal of articulosExcel) {
        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) {
            continue;
        }

        const lineasCoincidentes = lineas.filter((linea) =>
            linea.toUpperCase().startsWith(articulo)
        );

        if (lineasCoincidentes.length === 0) {
            continue;
        }

        const preciosEncontrados = [];

        for (const linea of lineasCoincidentes) {
            const precios = linea.match(/\$\s*(\d+(?:\.\d+)?)/g);

            if (!precios || precios.length === 0) {
                continue;
            }

            const descripcion = linea
                .substring(articulo.length)
                .split("$")[0]
                .trim();

            const precioSinIVA = precios[0]
                .replace("$", "")
                .trim();

            const precio = convertirPrecio(precioSinIVA);

            if (precio !== null) {
                preciosEncontrados.push(precio);

                if (!descripcionesPDF.has(articulo)) {
                    descripcionesPDF.set(
                        articulo,
                        descripcion
                    );
                }
            }
        }

        if (preciosEncontrados.length === 0) {
            continue;
        }

        preciosPDF.set(
            articulo,
            preciosEncontrados[0]
        );

        ocurrencias.set(
            articulo,
            lineasCoincidentes.length
        );
    }

    return {
        preciosPDF,
        ocurrencias,
        descripcionesPDF
    };
}

export {
    obtenerTextoPDF,
    leerPDF
};