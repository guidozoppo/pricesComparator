import {
    normalizarArticulo,
    convertirPrecio
} from "./utils.js";

const MULTIPLICADOR_HOJA1 = 1.4;
const MULTIPLICADOR_HOJA2 = 1.3;

//Si la variacion porcentual es +- del 5% está ok.
const PORCENTAJE_DIF_OK = 5;

function redondearPrecio(valor) {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function comparar(datosPDF, datosExcel) {
    const resultados = [];

    let ok = 0;
    let diferencias = 0;
    let noEncontrados = 0;
    let preciosInvalidos = 0;

    for (const fila of datosExcel.filas) {
        const articuloOriginal = fila.Articulo;
        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) continue;


        const precioExcel = convertirPrecio(fila['Precio Final']);
        const hoja = fila.hoja;

        const precioPDF = datosPDF.preciosPDF.get(articulo);
        const descripcion = datosPDF.descripcionesPDF.get(articulo) || "";

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
            if (hoja === 'Hoja1') {
                precioCalculado = precioPDF * MULTIPLICADOR_HOJA1;
            } else if (hoja === 'Hoja2') {
                precioCalculado = precioPDF * MULTIPLICADOR_HOJA2;
            }

            diferencia = redondearPrecio((precioCalculado - precioExcel));

            const porcentaje = ((precioCalculado - (precioExcel)) / (precioExcel)) * 100

            if (Math.abs(porcentaje) <= PORCENTAJE_DIF_OK) {
                estado = "OK";
            } else {
                estado = "DIFERENCIA";
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
            "vecesEnPDF":
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