const MULTIPLICADOR = 1.6;

const DIFERENCIA_MINIMA = -500;
const DIFERENCIA_MAXIMA = 500;

function redondearPrecio(valor) {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function comparar(articulosProveedor, articulosNegocio) {

    const resultados = [];

    for (const articuloNegocio of articulosNegocio) {

        const { articulo, nombre, precioFinal } = articuloNegocio;

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

        const precioCalculado = redondearPrecio(precioProveedor * MULTIPLICADOR);

        const diferencia = redondearPrecio(precioCalculado - precioFinal);

        let estado;

        if (diferencia > DIFERENCIA_MINIMA && diferencia < DIFERENCIA_MAXIMA) {
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