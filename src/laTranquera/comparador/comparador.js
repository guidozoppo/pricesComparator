import { MULTIPLICADOR_IVA, MULTIPLICADOR_TRANQUERA, MULTIPLICADOR_TRANQUERA_RESTA, PORCENTAJE_DIF_OK } from "../../../constant";
import { redondearPrecio } from "../../casa-jonas/comparador/utils";

export function comparar(articulosProveedor, articulosNegocio) {
    const resultados = [];

    for (const fila of articulosNegocio.filas) {
        const articulo = fila.Articulo;
        const nombre = fila.Nombre;
        const precioFinal = fila['Precio Final'];
        const hoja = fila.hoja;

        const articuloBusqueda = articulo.toString();
        const ocurrencias = articulosProveedor.get(articuloBusqueda);

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

        let precioCalculado;
        if (hoja === 'Bombachas T60 y Niños') {
            precioCalculado = precioProveedor * MULTIPLICADOR_TRANQUERA_RESTA * MULTIPLICADOR_IVA * MULTIPLICADOR_TRANQUERA;
        } else if (hoja === 'Bombachas +T60') {
            precioCalculado = precioProveedor * MULTIPLICADOR_IVA * MULTIPLICADOR_TRANQUERA;
        } else if (hoja === 'Pantalones y Camisas') {
            precioCalculado = precioProveedor * MULTIPLICADOR_TRANQUERA_RESTA * MULTIPLICADOR_IVA * MULTIPLICADOR_TRANQUERA;
        } else if (hoja === 'Mamelucos y demas') {
            precioCalculado = precioProveedor * MULTIPLICADOR_IVA * MULTIPLICADOR_TRANQUERA;
        }

        const diferencia = redondearPrecio(precioCalculado - precioFinal);
        let estado;
        const porcentaje = ((precioCalculado - precioFinal) / precioFinal) * 100

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