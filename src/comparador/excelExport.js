import * as XLSX from "xlsx";

function generarExcel(resultados, resumen) {
    const workbook = XLSX.utils.book_new();

    // ============================================================
    // HOJA DE RESULTADOS
    // ============================================================

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
    // HOJA DE RESUMEN
    // ============================================================

    const datosResumen = Object.entries(resumen).map(
        ([concepto, cantidad]) => ({
            "Concepto": concepto,
            "Cantidad": cantidad
        })
    );

    const hojaResumen = XLSX.utils.json_to_sheet(
        datosResumen
    );

    hojaResumen["!cols"] = [
        { wch: 30 },
        { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(
        workbook,
        hojaResumen,
        "Resumen"
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

    console.log("Resultado generado: resultado-comparacion.xlsx");
}

export {
    generarExcel
};