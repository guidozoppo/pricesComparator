import * as XLSX from "xlsx";

export function generarExcel(resultados) {
    const datosExcel = resultados.map(resultado => ({
        "ARTICULO": resultado.articulo,
        "NOMBRE": resultado.nombre,
        "PRECIO PROVEEDOR": resultado.precioProveedor,
        "PRECIO NUEVO (x1.4 ó x1.3)": resultado.precioCalculado,
        "PRECIO VIEJO": resultado.precioVenta,
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

    XLSX.writeFile(workbook, `comparacion-perfumeria-${fecha}.xlsx`);
    /*const workbook = XLSX.utils.book_new();

    // ============================================================
    // HOJA DE RESULTADOS
    // ============================================================
    console.log(resultados)
    const hojaResultados = XLSX.utils.json_to_sheet(resultados);

    // Filtros automáticos en los encabezados
    hojaResultados["!autofilter"] = {
        ref: hojaResultados["!ref"]
    };

    // Ancho de las columnas
    hojaResultados["!cols"] = [
        { wch: 16 },
        { wch: 60 },
        { wch: 20 },
        { wch: 23 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 }
    ];

    XLSX.utils.book_append_sheet(
        workbook,
        hojaResultados,
        "Comparación"
    );

    // ============================================================
    // GENERAR ARCHIVO
    // ============================================================

    const contenido = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array"
    });

    const blob = new Blob(
        [contenido],
        {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
    );

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "resultado-comparacion.xlsx";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);

    console.log("Resultado generado: resultado-comparacion.xlsx");*/
}