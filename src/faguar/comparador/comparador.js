import { ESTADO_DIFERENCIA, ESTADO_NO_ENCONTRADO_PDF, ESTADO_OK, ESTADO_PRECIO_EXCEL_INVALIDO, MULTIPLICADOR_CASA_JONAS, PORCENTAJE_DIF_OK } from "../../../constant.js";
import { normalizarArticulo, convertirPrecio } from "./utils.js";

function comparar(datosPDF, datosExcel) {
    const resultados = [];

    let ok = 0;
    let diferencias = 0;
    let noEncontrados = 0;
    let preciosInvalidos = 0;

    const indicePDF = crearIndicePDF(datosPDF);

    for (const fila of datosExcel.filas) {
        const articuloOriginal = String(
            fila[datosExcel.columnaArticulo] ?? ""
        ).trim();

        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) continue;

        const talleOriginal = String(
            fila[datosExcel.columnaTalle] ?? ""
        ).trim();

        const talle = normalizarTalle(talleOriginal);

        const clave = `${articulo}|${talle}`;
        const registroPDF = indicePDF.get(clave);

        const precioExcel = convertirPrecio(
            fila[datosExcel.columnaPrecio]
        );

        const precioPDF = registroPDF?.precio;

        const descripcion =
            registroPDF?.descripcion ||
            fila[datosExcel.columnaNombre] ||
            "";

        let precioCalculado = null;
        let diferencia = null;
        let estado = "";

        if (!registroPDF) {
            estado = ESTADO_NO_ENCONTRADO_PDF;
            noEncontrados++;
        } else if (precioExcel === null) {
            estado = ESTADO_PRECIO_EXCEL_INVALIDO;
            preciosInvalidos++;
        } else if (precioPDF === null) {
            estado = ESTADO_PRECIO_EXCEL_INVALIDO;
            preciosInvalidos++;
        } else {
            precioCalculado =
                precioPDF * MULTIPLICADOR_CASA_JONAS;

            diferencia = precioCalculado - precioExcel;

            const porcentaje =
                (diferencia / precioExcel) * 100;

            if (Math.abs(porcentaje) <= PORCENTAJE_DIF_OK) {
                estado = ESTADO_OK;
                ok++;
            } else {
                estado = ESTADO_DIFERENCIA;
                diferencias++;
            }
        }

        resultados.push({
            articulo: articuloOriginal,
            nombre: descripcion,
            talle: talleOriginal,

            precioProveedor:
                precioPDF !== null && precioPDF !== undefined
                    ? precioPDF / 100
                    : "",

            precioCalculado:
                precioCalculado !== null
                    ? precioCalculado / 100
                    : "",

            precioVenta:
                precioExcel !== null
                    ? precioExcel / 100
                    : "",

            diferencia:
                diferencia !== null
                    ? diferencia / 100
                    : "",

            estado
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

function normalizarTalle(talle) {
    return String(talle ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+AL\s+/g, "-")
        .replace(/\s*\/\s*/g, "-")
        .replace(/\s+/g, "");
}

function crearIndicePDF(datosPDF) {
    const indice = new Map();

    for (const fila of datosPDF) {
        const articulo = normalizarArticulo(fila.articulo);
        const talle = normalizarTalle(fila.talle);

        if (!articulo || !talle) continue;

        const clave = `${articulo}|${talle}`;
        const precio = convertirPrecio(fila.precio);

        if (!indice.has(clave)) {
            indice.set(clave, {
                articulo,
                descripcion: fila.descripcion,
                talle,
                precio
            });
        }
    }

    return indice;
}

export {
    comparar
};