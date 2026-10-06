import { ESTADO_DIFERENCIA, ESTADO_OK, MULTIPLICADOR_IVA, MULTIPLICADOR_PERFUMERIA_ALGODON, MULTIPLICADOR_PERFUMERIA_DEFAULT, MULTIPLICADOR_RIGOLLEAU, PORCENTAJE_DIF_OK } from "../../../constant.js";
import { redondearPrecio } from "../../casa-jonas/comparador/utils.js";
import { normalizarArticulo, convertirPrecio } from "./utils.js";

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

        const precioExcel = convertirPrecio(fila['Precio']);

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
            precioCalculado = precioPDF * MULTIPLICADOR_IVA * MULTIPLICADOR_RIGOLLEAU;
            diferencia = redondearPrecio(precioCalculado - precioExcel);

            const porcentaje = ((precioCalculado - (precioExcel)) / (precioExcel)) * 100;

            if (Math.abs(porcentaje) <= PORCENTAJE_DIF_OK) {
                estado = ESTADO_OK;
            } else {
                estado = ESTADO_DIFERENCIA;
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