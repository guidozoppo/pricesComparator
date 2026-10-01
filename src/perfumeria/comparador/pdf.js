import * as pdfjsLib from "pdfjs-dist";

import { normalizarArticulo, convertirPrecio } from "./utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const categoriasAOmitir = [
    "BEBIDAS ALCOHOLICAS", "ACEITES", "ADEREZOS", "ALIM.P/ANIMALES", "ARROZ", "AZUCAR Y EDULCORANTES ",
    "BEBIDAS ALCOHOLICAS", "BEBIDAS SIN ALCOHOL", "CACAOS", "CALDOS Y SOPAS", "CARNE DE CERDO", "CARNE VACUNA",
    "CIGARRILLOS", "CONDIMENTOS", "CONGELADOS", "DULCES", "EMBUTIDOS", "ENCURTIDOS", "ENLATADOS", "FIAMBRES",
    "FRUTAS Y VERDURAS", "GALLETITAS", "GOLOSINAS", "HARINAS Y PANIFICADOS", "HORNEABLES Y GELIFICABLES", "INFUSIONES",
    "JUGOS", "LACTEOS Y MARGARINAS", "PASTAS SECAS Y FRESCAS", "PRODUCTOS PARA FIESTAS", "PRODUCTOS SIN TACC",
    "SALES", "SNACKS",

];
//LIMPIEZA, 
const categoriasValidas = ["PAÑALES TOALLAS INTIMAS", "PERFUMERIA", "VARIOS", "LIMPIEZA"];

let omitirCategoria = false;

async function obtenerTextoPDF(pdfFile) {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const todosLosProductos = [];
    const errores = [];

    // Recorremos automáticamente todas las páginas
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

            let linea = lineas.find(l => Math.abs(l.y - y) < 2);

            if (!linea) {
                linea = { y, items: [] };
                lineas.push(linea);
            }

            linea.items.push(item);
        }

        // Ordenar filas de arriba hacia abajo
        lineas.sort((a, b) => b.y - a.y);

        function extraerProducto(elementos, columna) {
            const codigoMin = columna === "izquierda" ? 0 : 297.5;
            const codigoMax = columna === "izquierda" ? 50 : 328;

            // Buscar el código en el comienzo de la columna
            const codigoItem = elementos.find(item => {
                const x = item.transform[4];
                const texto = item.str.trim();

                return (
                    x >= codigoMin &&
                    x < codigoMax &&
                    /^\d{4,6}$/.test(texto)
                );
            });

            // Si no hay código, no es una fila de producto
            if (!codigoItem) return null;

            const codigo = codigoItem.str.trim();

            const formatoItem = elementos.find(item =>
                /^F\d+\.$/.test(item.str.trim())
            );

            let descripcion = "";

            if (formatoItem) {
                const xCodigo = codigoItem.transform[4];
                const xFormato = formatoItem.transform[4];

                descripcion = elementos
                    .filter(item => {
                        const x = item.transform[4];

                        return (
                            x > xCodigo &&
                            x < xFormato &&
                            item !== codigoItem
                        );
                    })
                    .sort((a, b) => a.transform[4] - b.transform[4])
                    .map(item => item.str.trim())
                    .filter(texto => texto !== "")
                    .join(" ")
                    .trim();
            }
            // Posiciones aproximadas de los tres precios
            const rangosPrecios = columna === "izquierda"
                ? [[190, 220], [220, 250], [250, 285]]
                : [[475, 510], [510, 540], [540, 580]];

            const precios = rangosPrecios.map(([min, max]) => {
                const item = elementos.find(item => {
                    const x = item.transform[4];
                    return x >= min && x < max;
                });

                return item ? item.str.trim() : null;
            });

            return { codigo, descripcion, precios };
        }

        // Procesar cada fila, separando las dos columnas
        for (const linea of lineas) {
            const textoLinea = linea.items
                .map(item => item.str.trim())
                .join(" ")
                .toUpperCase();

            const categoriaOmitida = categoriasAOmitir.some(categoria =>
                textoLinea.includes(categoria.trim().toUpperCase())
            );

            const categoriaValida = categoriasValidas.some(categoria =>
                textoLinea.includes(categoria.trim().toUpperCase())
            );

            // Si encontramos una categoría que debemos omitir
            if (categoriaOmitida) {
                omitirCategoria = true;
                continue;
            }

            // Si encontramos una categoría que debemos procesar
            if (categoriaValida) {
                omitirCategoria = false;
                continue;
            }

            // Mientras estemos dentro de la categoría que no interesa,
            // salteamos las filas
            if (omitirCategoria) {
                continue;
            }

            const izquierda = linea.items.filter(
                item => item.transform[4] < 297.5
            );

            const derecha = linea.items.filter(
                item => item.transform[4] >= 297.5
            );

            const productoIzq = extraerProducto(izquierda, "izquierda");
            const productoDer = extraerProducto(derecha, "derecha");

            for (const [producto, columna] of [
                [productoIzq, "izquierda"],
                [productoDer, "derecha"]
            ]) {
                if (!producto) continue;

                const registro = {
                    pagina: numeroPagina,
                    codigo: producto.codigo,
                    descripcion: producto.descripcion,
                    precio1: producto.precios[0],
                    precio2: producto.precios[1],
                    precio3: producto.precios[2],
                    columna
                };
                todosLosProductos.push(registro);

                if (producto.precios.some(precio => precio === null)) {
                    errores.push(registro);
                }
            }
        }
    }
    return todosLosProductos;
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
            const precioModificado = producto.precio1.replace(',', '');
            const precio = convertirPrecio(precioModificado);

            if (precio !== null) {

                preciosEncontrados.push(precio);

                // Guardar la primera descripción encontrada
                if (!descripcionesPDF.has(articulo)) {
                    descripcionesPDF.set(
                        articulo,
                        producto.descripcion
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