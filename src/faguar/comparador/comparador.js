import { ESTADO_DIFERENCIA, ESTADO_NO_ENCONTRADO_PDF, ESTADO_OK, ESTADO_PRECIO_EXCEL_INVALIDO, MULTIPLICADOR_FAGUAR, MULTIPLICADOR_FAGUAR_2, MULTIPLICADOR_IVA, PORCENTAJE_DIF_OK } from "../../../constant.js";
import { normalizarArticulo } from "./utils.js";

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
        console.log(articulo, clave, registroPDF)
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
            if (descripcion.toUpperCase().includes("BUZO")) {
                precioCalculado = precioPDF * MULTIPLICADOR_FAGUAR_2;
            } else {
                precioCalculado = precioPDF * MULTIPLICADOR_IVA * MULTIPLICADOR_FAGUAR;

            }

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

function convertirPrecio(valor) {
    if (typeof valor === "number") {
        return Math.round(valor * 100);
    }

    let texto = String(valor ?? "")
        .trim()
        .replace(/\$/g, "")
        .replace(/\s/g, "");

    if (!texto) return null;

    // Tiene punto y coma
    if (texto.includes(",") && texto.includes(".")) {
        if (texto.lastIndexOf(",") > texto.lastIndexOf(".")) {
            // Formato argentino: 19.939,50
            texto = texto.replace(/\./g, "").replace(",", ".");
        } else {
            // Formato internacional: 19,939.50
            texto = texto.replace(/,/g, "");
        }
    } else if (texto.includes(",")) {
        // Coma decimal: 19939,50
        texto = texto.replace(",", ".");
    } else if (texto.includes(".")) {
        // Punto de miles: 19.939
        texto = texto.replace(/\./g, "");
    }

    const numero = Number(texto);

    if (!Number.isFinite(numero)) {
        return null;
    }

    return Math.round(numero * 100);
}

export {
    comparar
};