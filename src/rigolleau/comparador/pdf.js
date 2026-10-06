import * as pdfjsLib from "pdfjs-dist";

import { normalizarArticulo, convertirPrecio } from "./utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

async function obtenerTextoPDF(pdfFile) {

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const productos = [];

    for (let numeroPagina = 1; numeroPagina <= pdf.numPages; numeroPagina++) {

        const page = await pdf.getPage(numeroPagina);
        const content = await page.getTextContent();

        const items = content.items.filter(
            item => item.str && item.str.trim().length > 0
        );

        // Agrupar elementos que pertenecen a la misma fila
        const lineas = [];

        for (const item of items) {
            const y = item.transform[5];
            let linea = lineas.find(
                l => Math.abs(l.y - y) < 2
            );

            if (!linea) {
                linea = {
                    y,
                    items: []
                };

                lineas.push(linea);
            }

            linea.items.push(item);
        }

        // Ordenar de arriba hacia abajo
        lineas.sort((a, b) => b.y - a.y);

        for (const linea of lineas) {
            const itemsOrdenados = linea.items.sort(
                (a, b) => a.transform[4] - b.transform[4]
            );

            /*
             * Buscar código.
             */
            const codigoItem = linea.items.find(item => {
                const x = item.transform[4];
                const texto = item.str.trim();

                return (
                    x >= 150 &&
                    x < 200 &&
                    /^\d+\/\d+[A-Za-z]*$/.test(texto)
                );
            });

            if (!codigoItem) {
                continue;
            }

            const codigo = codigoItem.str.trim().split("/").pop();

            const precioItem = itemsOrdenados.find(item => {
                const x = item.transform[4];
                return x >= 440 && x < 485;
            });

            if (!precioItem) {
                continue;
            }

            const descripcionItems = itemsOrdenados.filter(item => {
                const x = item.transform[4];

                return (
                    x > codigoItem.transform[4] + codigoItem.width &&
                    x < precioItem.transform[4] &&
                    x < 400
                );
            });

            const nombre = descripcionItems
                .map(item => item.str.trim())
                .filter(texto => texto !== "")
                .join(" ");

            /*
             * Buscar PRECIO LISTA por posición X.
             *
             * El precio lista está aproximadamente entre X = 440 y X = 485.
             */

            const precioLista = parseFloat(
                precioItem.str
                    .trim()
                    .replace("$", "")
                    .replace(/\./g, "")
                    .replace(",", ".")
            );

            if (isNaN(precioLista)) {
                continue;
            }

            productos.push({
                pagina: numeroPagina,
                codigo,
                nombre,
                precioLista
            });
        }
    }

    return productos;
}

async function leerPDF(articulosExcel, pdfFile) {
    const productosPDF = await obtenerTextoPDF(pdfFile);

    const preciosPDF = new Map();
    const ocurrencias = new Map();
    const descripcionesPDF = new Map();

    for (const articuloOriginal of articulosExcel) {

        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) {
            continue;
        }

        // Buscar coincidencias por código
        const productosCoincidentes = productosPDF.filter(producto =>
            producto.codigo.toUpperCase().startsWith(articulo)
        );

        if (productosCoincidentes.length === 0) {
            continue;
        }

        const preciosEncontrados = [];

        for (const producto of productosCoincidentes) {

            // Utilizar únicamente el primer precio
            const precioModificado = producto.precioLista;
            const precio = convertirPrecio(precioModificado);

            if (precio !== null) {

                preciosEncontrados.push(precio);

                // Guardar la primera descripción encontrada
                if (!descripcionesPDF.has(articulo)) {
                    descripcionesPDF.set(
                        articulo,
                        producto.nombre
                    );
                }
            }
        }

        if (preciosEncontrados.length === 0) {
            continue;
        }

        // Guardar el primer precio encontrado
        preciosPDF.set(
            articulo,
            preciosEncontrados[0]
        );

        // Guardar cantidad de coincidencias
        ocurrencias.set(
            articulo,
            productosCoincidentes.length
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