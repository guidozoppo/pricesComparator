import { normalizarArticulo, convertirPrecio } from "./utils.js";

const MULTIPLICADOR = 2;

function comparar(datosPDF, datosExcel) {
    const resultados = [];

    let ok = 0;
    let diferencias = 0;
    let noEncontrados = 0;
    let preciosInvalidos = 0;

    for (const fila of datosExcel.filas) {
        const articuloOriginal = String(
            fila[datosExcel.columnaArticulo] ?? ""
        ).trim();

        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) continue;

        const precioExcel = convertirPrecio(
            fila[datosExcel.columnaPrecio]
        );

        const precioPDF = datosPDF.preciosPDF.get(articulo);
        const descripcion =
            datosPDF.descripcionesPDF.get(articulo) || "";

        let precioCalculado = null;
        let diferencia = null;
        let estado = "";

        if (precioPDF === undefined) {
            estado = "NO ENCONTRADO EN PDF";
            noEncontrados++;
        } else if (precioExcel === null) {
            estado = "PRECIO EXCEL INVÁLIDO";
            preciosInvalidos++;
        } else {
            precioCalculado = precioPDF * MULTIPLICADOR;
            diferencia = precioCalculado - precioExcel;
            const porcentaje = ((precioCalculado - (precioExcel)) / (precioExcel)) * 100;

            if (Math.abs(porcentaje) <= PORCENTAJE_DIF_OK) {
                estado = "OK";
                ok++;
            } else {
                estado = "DIFERENCIA";
                diferencias++;
            }
        }

        resultados.push({
            "articulo": articuloOriginal,
            "nombre": descripcion,
            "precioProveedor":
                precioPDF !== undefined
                    ? precioPDF / 100
                    : "",
            "precioCalculado":
                precioCalculado !== null
                    ? precioCalculado / 100
                    : "",
            "precioVenta":
                precioExcel !== null
                    ? precioExcel / 100
                    : "",
            "diferencia":
                diferencia !== null
                    ? diferencia / 100
                    : "",
            "Veces en PDF":
                datosPDF.ocurrencias.get(articulo) || 0,
            "estado": estado
        });
    }

    return {
        resultados,
        resumen: {
            "Artículos analizados": resultados.length,
            "OK": ok,
            "Diferencias": diferencias,
            "No encontrados en PDF": noEncontrados,
            "Precios inválidos": preciosInvalidos
        }
    };
}

export {
    comparar
};