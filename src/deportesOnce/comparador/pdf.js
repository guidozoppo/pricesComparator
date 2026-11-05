import * as pdfjsLib from "pdfjs-dist";

//import { normalizarArticulo, convertirPrecio } from "./utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();


function normalizarArticulo(valor) {
    return String(valor ?? "")
        .toUpperCase()
        .trim();
}

function esCodigoArticulo(texto) {
    return /^[A-Z]{2,5}\s*-\s*[A-Z0-9]+(?:\s*\/\s*[A-Z0-9]+)?$/i.test(
        String(texto ?? "").trim()
    );
}

function esTextoSinPrecio(texto) {
    return /^(SIN\s+STOCK|COTIZAR|DISCONTINUADA)$/i.test(
        String(texto ?? "").trim()
    );
}

function convertirPrecioPDF(texto) {
    if (!texto) return 0;

    const valor = String(texto)
        .trim()
        .replace(/\$/g, "")
        .replace(/\s/g, "");

    if (esTextoSinPrecio(valor)) {
        return 0;
    }

    // Formatos admitidos: 3.500,00 - 9999,00 - 25.000,00
    if (!/^\d+(?:\.\d{3})*,\d{2}$/.test(valor)) {
        return 0;
    }

    const precio = Number(
        valor.replace(/\./g, "").replace(",", ".")
    );

    return Number.isFinite(precio) ? precio : 0;
}

async function obtenerTextoPDF(pdfFile) {
    const arrayBuffer = await pdfFile.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    const productos = [];

    for (let numeroPagina = 1; numeroPagina <= pdf.numPages; numeroPagina++) {
        const page = await pdf.getPage(numeroPagina);
        const content = await page.getTextContent();

        const items = content.items.filter(item =>
            item.str && item.str.trim() !== ""
        );

        // Agrupar los elementos de texto por coordenada vertical.
        const lineas = [];

        for (const item of items) {
            const y = item.transform[5];

            let linea = lineas.find(
                l => Math.abs(l.y - y) < 2
            );

            if (!linea) {
                linea = { y, items: [] };
                lineas.push(linea);
            }

            linea.items.push(item);
        }

        // Ordenar de arriba hacia abajo.
        lineas.sort((a, b) => b.y - a.y);

        let productoActual = null;
        let ultimoYProducto = null;
        let xCodigoActual = null;

        for (const linea of lineas) {
            const itemsOrdenados = [...linea.items].sort(
                (a, b) => a.transform[4] - b.transform[4]
            );

            const textoLinea = itemsOrdenados
                .map(item => item.str.trim())
                .filter(Boolean)
                .join(" ");

            // Detectar códigos incluso cuando el código está dividido
            // en varios elementos de texto.
            const coincidenciaCodigo = textoLinea.match(
                /[A-Z]{2,5}\s*-\s*[A-Z0-9]+(?:\s*\/\s*[A-Z0-9]+)?/i
            );

            let codigoEncontrado = null;

            if (coincidenciaCodigo) {
                let codigoCandidato = coincidenciaCodigo[0];

                if (/^GD-\s*9819$/i.test(codigoCandidato) || /^GD-\s*9811$/i.test(codigoCandidato)) {
                    const siguienteCaracter = textoLinea
                        .slice(coincidenciaCodigo.index + codigoCandidato.length)
                        .match(/^\s+[A-Z0-9]/i);

                    if (siguienteCaracter) {
                        codigoCandidato += siguienteCaracter[0];
                    }
                    codigoEncontrado = codigoCandidato;
                } else if (esCodigoArticulo(codigoCandidato)) {
                    codigoEncontrado = codigoCandidato;
                }
            }

            if (codigoEncontrado) {
                const codigo = normalizarArticulo(codigoEncontrado);

                // Buscar el elemento donde comienza el código.
                const codigoItem = itemsOrdenados.find(item =>
                    item.str.toUpperCase().includes(
                        codigoEncontrado.split("-")[0].trim()
                    )
                );

                xCodigoActual = codigoItem
                    ? codigoItem.transform[4]
                    : itemsOrdenados[0].transform[4];

                const indiceCodigo = itemsOrdenados.indexOf(codigoItem);
                const itemsPosteriores = itemsOrdenados.slice(
                    indiceCodigo >= 0 ? indiceCodigo + 1 : 0
                );

                // Buscar el precio o el texto de disponibilidad.
                const precioItem = [...itemsPosteriores]
                    .reverse()
                    .find(item => {
                        const texto = item.str
                            .trim()
                            .replace(/\s/g, "");

                        return (
                            esTextoSinPrecio(texto) ||
                            /^\$?\d+(?:\.\d{3})*,\d{2}$/.test(texto)
                        );
                    });

                const precioLista = precioItem
                    ? convertirPrecioPDF(precioItem.str)
                    : 0;

                // La descripción está entre el código y el precio.
                const descripcionItems = precioItem
                    ? itemsPosteriores.filter(item =>
                        item.transform[4] < precioItem.transform[4]
                    )
                    : itemsPosteriores;

                const nombre = descripcionItems
                    .map(item => item.str.trim())
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                productoActual = {
                    pagina: numeroPagina,
                    codigo,
                    nombre,
                    precioLista
                };

                productos.push(productoActual);

                ultimoYProducto = linea.y;

                continue;
            }

            // Incorporar líneas siguientes cuando sean continuación
            // de la descripción del producto actual.
            if (productoActual && ultimoYProducto !== null) {
                const distancia = ultimoYProducto - linea.y;

                if (distancia > 0 && distancia <= 14) {
                    const textoContinuacion = textoLinea.trim();

                    const esEncabezado =
                        /^(ACTUALIZADO|ART\.|CODIGO|COD\.|DESCRIPCION|VARIOS|MARCA|MEDIDA|TALLE)/i
                            .test(textoContinuacion);

                    const xInicial = itemsOrdenados[0]?.transform[4] ?? 0;

                    if (
                        textoContinuacion &&
                        !esEncabezado &&
                        xCodigoActual !== null &&
                        xInicial > xCodigoActual + 25
                    ) {
                        productoActual.nombre = [
                            productoActual.nombre,
                            textoContinuacion
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .trim();

                        ultimoYProducto = linea.y;
                    }
                }
            }
        }
    }

    return productos;
}

async function leerPDF(articulosExcel, pdfFile) {
    const productosPDF = await obtenerTextoPDF(pdfFile);

    const preciosPDF = new Map();
    const ocurrencias = new Map();
    const descripcionesPDF = new Map();

    // Inicializar todos los artículos del Excel en cero.
    for (const articuloOriginal of articulosExcel) {
        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) continue;

        preciosPDF.set(articulo, 0);
        ocurrencias.set(articulo, 0);
    }

    // Agrupar los productos del PDF por código.
    const productosPorCodigo = new Map();

    for (const producto of productosPDF) {
        const codigo = normalizarArticulo(producto.codigo);

        if (!codigo) continue;

        if (!productosPorCodigo.has(codigo)) {
            productosPorCodigo.set(codigo, []);
        }

        productosPorCodigo.get(codigo).push(producto);
    }

    // Buscar cada artículo del Excel en los productos del PDF.
    for (const articuloOriginal of articulosExcel) {
        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) continue;

        const coincidencias = productosPorCodigo.get(articulo);

        // Si no existe en el PDF, permanece en cero.
        if (!coincidencias || coincidencias.length === 0) {
            continue;
        }

        ocurrencias.set(articulo, coincidencias.length);

        // Obtener la primera descripción disponible.
        const productoConDescripcion = coincidencias.find(
            producto => producto.nombre
        );

        if (productoConDescripcion) {
            descripcionesPDF.set(
                articulo,
                productoConDescripcion.nombre
            );
        }

        // Priorizar el primer precio numérico mayor a cero.
        const productoConPrecio = coincidencias.find(
            producto => producto.precioLista > 0
        );

        if (productoConPrecio) {
            preciosPDF.set(
                articulo,
                productoConPrecio.precioLista
            );
        }
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