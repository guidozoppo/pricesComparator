const MULTIPLICADOR = 1.5;
const MULTIPLICADOR_IVA = 1.21;

//Si la variacion porcentual es +- del 5% está ok.
const PORCENTAJE_DIF_OK = 5;

function redondearPrecio(valor) {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
}

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

        const precioParcial = precioProveedor * MULTIPLICADOR_IVA
        const precioCalculado = redondearPrecio(precioParcial * MULTIPLICADOR);

        const diferencia = redondearPrecio((precioCalculado - precioFinal) / cantidad);
        let estado;
        const porcentaje = ((precioCalculado - (precioFinal * cantidad)) / (precioFinal * cantidad)) * 100

        if (Math.abs(porcentaje) <= PORCENTAJE_DIF_OK) {
            estado = "OK";
        } else {
            estado = "DIFERENCIA";
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