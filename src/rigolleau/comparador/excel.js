import * as XLSX from "xlsx";

import {
    normalizarArticulo
} from "./utils.js";

async function leerExcel(excelFile) {
    const arrayBuffer = await excelFile.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
        type: "array"
    });

    if (workbook.SheetNames.length === 0) {
        throw new Error("El Excel no contiene hojas.");
    }

    const todasLasFilas = [];

    // Recorrer todas las hojas del Excel
    for (const nombreHoja of workbook.SheetNames) {

        const hoja = workbook.Sheets[nombreHoja];

        const filas = XLSX.utils.sheet_to_json(hoja, {
            defval: ""
        });

        if (filas.length === 0) {
            continue;
        }

        const primeraFila = filas[0];

        const columnaArticulo = Object.keys(primeraFila).find(
            key => normalizarArticulo(key) === "ARTICULO"
        );

        const columnaPrecio = Object.keys(primeraFila).find(key => {
            const normalizada = normalizarArticulo(key);

            return (
                normalizada === "PRECIOFINAL" ||
                normalizada === "PRECIO"
            );
        });

        if (!columnaArticulo) {
            throw new Error(
                `No se encontró la columna "Articulo" en la hoja "${nombreHoja}".`
            );
        }

        if (!columnaPrecio) {
            throw new Error(
                `No se encontró la columna "Precio Final" (o "Precio") en la hoja "${nombreHoja}".`
            );
        }

        // Agregar cada fila indicando de qué hoja proviene
        for (const fila of filas) {
            todasLasFilas.push({
                ...fila,
                hoja: nombreHoja,
            });
        }
    }

    if (todasLasFilas.length === 0) {
        throw new Error("El Excel no contiene datos.");
    }

    return {
        filas: todasLasFilas
    };
}

export {
    leerExcel
};