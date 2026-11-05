import { ESTADO_DIFERENCIA, ESTADO_OK, MULTIPLICADOR_IVA, MULTIPLICADOR_RIGOLLEAU, PORCENTAJE_DIF_OK } from "../../../constant.js";
import { redondearPrecio } from "../../casa-jonas/comparador/utils.js";
import { convertirPrecio } from "./utils.js";

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

        const precioExcel = convertirPrecio(fila['Precio']) / 100;

        let precioPDF = datosPDF.preciosPDF.get(articulo);
        let descripcion = datosPDF.descripcionesPDF.get(articulo) || "";
        if (descripcion.length === 0) {
            descripcion = datosExcel.filas.find(
                fila => normalizarArticulo(fila.Articulo) === articulo
            )?.Nombre || "";
        }


        /* if (articulo === "GD- 9819 A") {
            console.log(articulo, descripcion, precioExcel, precioPDF)
            console.log(datosPDF)
        } */
        let precioCalculado = null;
        let diferencia = null;
        let estado = "";

        if (precioPDF === undefined) {
            estado = "NO ENCONTRADO EN PDF";
            noEncontrados++;
        } else if (precioExcel === null) {
            estado = "PRECIO EXCEL INVÁLIDO";
            preciosInvalidos++;
        } else if (articulo === 'BUSCAR-ESTADO-WTP') {
            estado = "BUSCAR EN CONTACTO DE WHATSAPP";
        } else if (articulo === 'BUSCAR-EN-PDF') {
            estado = "BUSCAR EN PDF POR NOMBRE PORQUE NO TIENE ARTICULO";
        } else if (descripcion.includes("SIN STOCK") || precioPDF === 0) {
            estado = "SIN STOCK EN PROVEEDOR - SIN PRECIO";
        } else {
            if (articulo === 'GD-BO6100') {
                precioPDF = precioPDF / 100;
            }
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
                    ? precioPDF
                    : "",
            "precioCalculado":
                precioCalculado !== null
                    ? precioCalculado
                    : "",
            "precioVenta":
                precioExcel !== null
                    ? precioExcel
                    : "",
            "diferencia":
                diferencia !== null
                    ? diferencia
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

function normalizarArticulo(valor) {
    return String(valor ?? "")
        .trim()
        .toUpperCase();
}

export {
    comparar
};