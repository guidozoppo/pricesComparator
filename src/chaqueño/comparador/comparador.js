import { ESTADO_DIFERENCIA, ESTADO_OK, PORCENTAJE_DIF_OK, MULTIPLICADOR_CHAQUEÑO, MULTIPLICADOR_CHAQUEÑO_RESTA, MULTIPLICADOR_IVA } from "../../../constant";
import { redondearPrecio } from "../../casa-jonas/comparador/utils";

export function comparar(articulosProveedor, articulosNegocio) {

    const resultados = [];

    for (const articuloNegocio of articulosNegocio) {

        const { articulo, nombre, precioFinal, cantidad } = articuloNegocio;
        const ocurrencias = articulosProveedor.get(articulo);

        // El artículo no existe en el proveedor
        if (!ocurrencias) {
            resultados.push({
                articulo,
                nombre,
                precioProveedor: null,
                precioCalculado: null,
                precioVenta: precioFinal,
                diferencia: null,
                estado: "NO SE ENCONTRÓ ARTICULO"
            });

            continue;
        }

        // El artículo aparece más de una vez
        if (ocurrencias.length > 1) {
            resultados.push({
                articulo,
                nombre,
                precioProveedor: null,
                precioCalculado: null,
                precioVenta: precioFinal,
                diferencia: null,
                estado: `ARTICULO ENCONTRADO ${ocurrencias.length} VECES`
            });

            continue;
        }

        const articuloProveedor = ocurrencias[0];

        const precioProveedor = articuloProveedor.precio;

        // El artículo existe pero no tiene precio
        if (precioProveedor === null) {
            resultados.push({
                articulo,
                nombre,
                precioProveedor: null,
                precioCalculado: null,
                precioVenta: precioFinal,
                diferencia: null,
                estado: "SIN PRECIO EN PROVEEDOR"
            });
            continue;
        }

        const precioParcial = precioProveedor * MULTIPLICADOR_CHAQUEÑO_RESTA * MULTIPLICADOR_IVA * MULTIPLICADOR_CHAQUEÑO;
        const precioCalculado = redondearPrecio(precioParcial);

        const diferencia = redondearPrecio((precioCalculado - precioFinal) / cantidad);
        let estado;
        const porcentaje = ((precioCalculado - (precioFinal * cantidad)) / (precioFinal * cantidad)) * 100;

        if (Math.abs(porcentaje) <= PORCENTAJE_DIF_OK) {
            estado = ESTADO_OK;
        } else {
            estado = ESTADO_DIFERENCIA;
        }

        resultados.push({
            articulo,
            nombre,
            precioProveedor,
            precioCalculado,
            precioVenta: precioFinal,
            diferencia,
            estado
        });
    }
    return resultados;
}