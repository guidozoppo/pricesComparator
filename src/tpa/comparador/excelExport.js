import * as XLSX from "xlsx";

export function exportarExcel(resultados) {

    const datosExcel = resultados.map(resultado => ({
        "ARTICULO": resultado.articulo,
        "NOMBRE": resultado.nombre,
        "PRECIO PROVEEDOR": resultado.precioProveedor,
        "PRECIO CALCULADO": resultado.precioCalculado,
        "PRECIO PARA LA VENTA": resultado.precioVenta,
        "DIFERENCIA": resultado.diferencia,
        "ESTADO": resultado.estado
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);

    // Agregar filtro a los encabezados
    if (datosExcel.length > 0) {

        const ultimaFila = datosExcel.length + 1;
        worksheet["!autofilter"] = { ref: `A1:G${ultimaFila}` };
    }

    // Ancho de columnas
    worksheet["!cols"] = [
        { wch: 15 },
        { wch: 45 },
        { wch: 18 },
        { wch: 18 },
        { wch: 22 },
        { wch: 15 },
        { wch: 32 }
    ];

    // Formato numérico para precios
    for (let fila = 2; fila <= datosExcel.length + 1; fila++) {
        const columnasNumericas = ["C", "D", "E", "F"];

        for (const columna of columnasNumericas) {
            const celda = worksheet[`${columna}${fila}`];

            if (celda && typeof celda.v === "number") {
                celda.z = "#,##0.00";
            }
        }
    }

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Comparación"
    );

    const fecha = new Date().toISOString().split("T")[0];

    XLSX.writeFile(workbook, `comparacion-tpa-${fecha}.xlsx`);
}