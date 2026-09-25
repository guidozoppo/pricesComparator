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
    if (!excelFile) {
        throw new Error("No se seleccionó el archivo del negocio.");
    }

    const arrayBuffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });


    if (workbook.SheetNames.length === 0) {
        throw new Error("El archivo del negocio no contiene ninguna hoja.");
    }

    const nombreHoja = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[nombreHoja];

    const filas = XLSX.utils.sheet_to_json(
        worksheet,
        {
            header: 1,
            defval: ""
        }
    );

    if (filas.length === 0) {
        throw new Error("La hoja del negocio está vacía.");
    }

    const columnas = buscarColumnasNegocio(filas);

    if (columnas.articulo === -1 || columnas.nombre === -1 || columnas.precioFinal === -1 || columnas.cantidad === -1) {
        throw new Error("No se encontraron las columnas ARTICULO, NOMBRE, PRECIO FINAL y CANTIDAD.");
    }

    const articulosNegocio = [];

    const filaInicioDatos = columnas.filaEncabezados + 1;

    for (let i = filaInicioDatos; i < filas.length; i++) {

        const fila = filas[i];
        const articulo = normalizarCodigo(fila[columnas.articulo]);

        if (!articulo) {
            continue;
        }

        const nombre = String(fila[columnas.nombre] ?? "").trim();
        const cantidad = String(fila[columnas.cantidad] ?? "").trim();

        const precioFinal = convertirPrecio(fila[columnas.precioFinal]);

        articulosNegocio.push({ articulo, nombre, precioFinal, cantidad });
    }

    return articulosNegocio;
}

function buscarColumnasNegocio(filas) {

    for (let numeroFila = 0; numeroFila < filas.length; numeroFila++) {
        const fila = filas[numeroFila];

        let columnaArticulo = -1;
        let columnaNombre = -1;
        let columnaPrecioFinal = -1;
        let columnaCantidad = -1;

        for (let numeroColumna = 0; numeroColumna < fila.length; numeroColumna++) {

            const encabezado = normalizarEncabezado(fila[numeroColumna]);

            if (encabezado === "ARTICULO") {
                columnaArticulo = numeroColumna;
            }

            if (encabezado === "NOMBRE") {
                columnaNombre = numeroColumna;
            }

            if (encabezado === "PRECIO FINAL") {
                columnaPrecioFinal = numeroColumna;
            }

            if (encabezado === "CANTIDAD") {
                columnaCantidad = numeroColumna;
            }
        }

        if (columnaArticulo !== -1 && columnaNombre !== -1 && columnaPrecioFinal !== -1 && columnaCantidad !== 1) {
            return {
                articulo: columnaArticulo,
                nombre: columnaNombre,
                precioFinal: columnaPrecioFinal,
                cantidad: columnaCantidad,
                filaEncabezados: numeroFila
            };
        }
    }

    return {
        articulo: -1,
        nombre: -1,
        precioFinal: -1,
        filaEncabezados: -1
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