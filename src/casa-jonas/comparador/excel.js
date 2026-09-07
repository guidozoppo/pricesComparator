import * as XLSX from "xlsx";

import {
    normalizarArticulo
} from "./utils.js";

async function leerExcel(excelFile) {
    console.log(`Leyendo Excel: ${excelFile.name}`);

    const arrayBuffer = await excelFile.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
        type: "array"
    });

    const nombreHoja = workbook.SheetNames[0];
    const hoja = workbook.Sheets[nombreHoja];

    const filas = XLSX.utils.sheet_to_json(hoja, {
        defval: ""
    });

    if (filas.length === 0) {
        throw new Error("El Excel no contiene datos.");
    }

    const primeraFila = filas[0];

    const columnaArticulo = Object.keys(primeraFila).find(
        key => normalizarArticulo(key) === "ARTICULO"
    );

    const columnaPrecio = Object.keys(primeraFila).find(
        key => {
            const normalizada = normalizarArticulo(key);

            return (
                normalizada === "PRECIOFINAL" ||
                normalizada === "PRECIO"
            );
        }
    );

    if (!columnaArticulo) {
        throw new Error(
            'No se encontró la columna "Articulo" en el Excel.'
        );
    }

    if (!columnaPrecio) {
        throw new Error(
            'No se encontró la columna "Precio Final" (o "Precio") en el Excel.'
        );
    }

    return {
        filas,
        columnaArticulo,
        columnaPrecio
    };
}

export {
    leerExcel
};