import * as pdfjsLib from "pdfjs-dist";

import { normalizarArticulo, convertirPrecio } from "./utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

async function obtenerTextoPDF(pdfFile) {
    const arrayBuffer = await pdfFile.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    const registros = [];

    for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
        const page = await pdf.getPage(pagina);
        const content = await page.getTextContent();

        const items = content.items.filter(
            item => item.str && item.str.trim().length > 0
        );

        const lineas = [];

        for (const item of items) {
            const posicionY = item.transform[5];

            let linea = lineas.find(
                l => Math.abs(l.posicionY - posicionY) < 2
            );

            if (!linea) {
                linea = {
                    posicionY,
                    items: []
                };

                lineas.push(linea);
            }

            linea.items.push(item);
        }

        lineas.sort((a, b) => b.posicionY - a.posicionY);

        for (const linea of lineas) {
            const columnas = {
                articulo: [],
                descripcion: [],
                color: [],
                talle: [],
                precio: []
            };

            linea.items.sort(
                (a, b) => a.transform[4] - b.transform[4]
            );

            for (const item of linea.items) {
                const x = item.transform[4];
                const valor = item.str.trim();

                if (x < 100) {
                    columnas.articulo.push(valor);
                } else if (x < 350) {
                    columnas.descripcion.push(valor);
                } else if (x < 450) {
                    columnas.color.push(valor);
                } else if (x < 500) {
                    columnas.talle.push(valor);
                } else {
                    columnas.precio.push(valor);
                }
            }

            registros.push({
                articulo: columnas.articulo.join(" "),
                descripcion: columnas.descripcion.join(" "),
                color: columnas.color.join(" "),
                talle: columnas.talle.join(" "),
                precio: columnas.precio.join(" ")
            });
        }
    }

    return registros;
}

async function leerPDF(articulosExcel, pdfFile) {
    const filasPDF = await obtenerTextoPDF(pdfFile);

    const registros = [];

    let articuloActual = "";
    let descripcionActual = "";
    let colorActual = "";

    for (const fila of filasPDF) {
        const articulo = fila.articulo.trim().replace(/\.$/, "");
        const descripcion = fila.descripcion.trim();

        // Detectar un nuevo artículo
        if (articulo && descripcion) {
            articuloActual = articulo;
            descripcionActual = descripcion;
            colorActual = "";
        }

        if (!articuloActual) {
            continue;
        }

        // Actualizar el color cuando aparece uno nuevo
        if (fila.color.trim()) {
            colorActual = fila.color.trim();
        }

        const talle = fila.talle.trim();
        const precio = fila.precio.trim();

        // Solo generar un registro cuando hay talle y precio
        if (!talle || !precio) {
            continue;
        }

        registros.push({
            articulo: articuloActual,
            descripcion: descripcionActual,
            color: colorActual,
            talle,
            precio
        });
    }

    return registros;
}

export { obtenerTextoPDF, leerPDF };