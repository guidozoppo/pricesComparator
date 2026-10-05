import * as XLSX from "xlsx";
import { normalizarCodigo, normalizarEncabezado, convertirPrecio } from "./utils.js";

export async function leerExcelProveedor(excelFile) {
    if (!excelFile) {
        throw new Error("No se seleccionó el archivo del proveedor.");
    }

    const arrayBuffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const articulosProveedor = new Map();

    for (const nombreHoja of workbook.SheetNames) {
        const worksheet = workbook.Sheets[nombreHoja];
        const filas = XLSX.utils.sheet_to_json(
            worksheet,
            {
                header: 1,
                defval: ""
            }
        );

        if (filas.length === 0) {
            continue;
        }

        const columnas = buscarColumnasProveedor(filas);

        if (columnas.codigo === -1 || columnas.precio === -1) {
            console.warn(`No se encontraron las columnas necesarias en la hoja: ${nombreHoja}`);
            continue;
        }

        const filaInicioDatos = columnas.filaEncabezados + 1;

        for (let i = filaInicioDatos; i < filas.length; i++) {
            const fila = filas[i];
            const codigo = normalizarCodigo(fila[columnas.codigo]);

            if (!codigo) {
                continue;
            }

            const precio = convertirPrecio(fila[columnas.precio]);

            if (!articulosProveedor.has(codigo)) {
                articulosProveedor.set(codigo, []);
            }

            articulosProveedor.get(codigo).push({ precio, hoja: nombreHoja, fila: i + 1 });
        }
    }
    return articulosProveedor;
}

export async function leerExcelNegocio(excelFile) {
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
            key => normalizarCodigo(key) === "ARTICULO"
        );

        const columnaPrecio = Object.keys(primeraFila).find(key => {
            const normalizada = normalizarCodigo(key);

            return (
                normalizada === "PRECIOFINAL" ||
                normalizada === "PRECIO FINAL" ||
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

function buscarColumnasProveedor(filas) {
    for (let numeroFila = 0; numeroFila < filas.length; numeroFila++) {
        const fila = filas[numeroFila];

        let columnaCodigo = -1;
        let columnaPrecio = -1;

        for (let numeroColumna = 0; numeroColumna < fila.length; numeroColumna++) {
            const encabezado = normalizarEncabezado(fila[numeroColumna]);

            if (esEncabezadoCodigo(encabezado)) {
                columnaCodigo = numeroColumna;
            }

            if (esEncabezadoPrecio(encabezado)) {
                columnaPrecio = numeroColumna;
            }
        }

        if (columnaCodigo !== -1 && columnaPrecio !== -1) {
            return {
                codigo: columnaCodigo,
                precio: columnaPrecio,
                filaEncabezados: numeroFila
            };
        }
    }

    return {
        codigo: -1,
        precio: -1,
        filaEncabezados: -1
    };
}


function esEncabezadoCodigo(encabezado) {
    return [
        "CODIGO",
        "COD°",
        "COD."
    ].includes(encabezado);
}


function esEncabezadoPrecio(encabezado) {
    return [
        "PRECIO",
        "PRECIO UNITARIO"
    ].includes(encabezado);
}