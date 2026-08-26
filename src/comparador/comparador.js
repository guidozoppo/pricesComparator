import {
    normalizarArticulo,
    convertirPrecio
} from "./utils.js";

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

            if (
                diferencia / 100 < 1000 &&
                diferencia / 100 > -1000
            ) {
                estado = "OK";
                ok++;
            } else {
                estado = "DIFERENCIA";
                diferencias++;
            }
        }

        resultados.push({
            "Articulo": articuloOriginal,
            "Nombre": descripcion,
            "Precio PDF sin IVA":
                precioPDF !== undefined
                    ? precioPDF / 100
                    : "",
            "Precio calculado (x2)":
                precioCalculado !== null
                    ? precioCalculado / 100
                    : "",
            "Precio para la venta":
                precioExcel !== null
                    ? precioExcel / 100
                    : "",
            "Diferencia":
                diferencia !== null
                    ? diferencia / 100
                    : "",
            "Veces en PDF":
                datosPDF.ocurrencias.get(articulo) || 0,
            "Estado": estado
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