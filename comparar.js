const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const XLSX = require("xlsx");

// ============================================================
// CONFIGURACIÓN
// ============================================================

const PDF_PATH = process.argv[2] || path.join(__dirname, "archivos", "precios-proveedor.pdf");
const EXCEL_PATH = process.argv[3] || path.join(__dirname, "archivos", "articulos.xlsx");
const OUTPUT_PATH = process.argv[4] || path.join(__dirname, "resultados", "resultado-comparacion.xlsx");

const MULTIPLICADOR = 2;

// ============================================================
// UTILIDADES
// ============================================================

function normalizarArticulo(valor) {
    return String(valor ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
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

    // Soporta:
    // 1.999,99
    // 1999,99
    // 1999.99
    // 1,999.99
    if (texto.includes(",") && texto.includes(".")) {
        if (texto.lastIndexOf(",") > texto.lastIndexOf(".")) {
            // Formato argentino: 1.999,99
            texto = texto.replace(/\./g, "").replace(",", ".");
        } else {
            // Formato internacional: 1,999.99
            texto = texto.replace(/,/g, "");
        }
    } else if (texto.includes(",")) {
        // Decimal con coma
        texto = texto.replace(",", ".");
    }

    const numero = Number(texto);

    if (!Number.isFinite(numero)) {
        return null;
    }

    // Trabajamos en centavos para evitar errores de precisión de JavaScript.
    return Math.round(numero * 100);
}

function formatearPrecioCentavos(centavos) {
    if (centavos === null || centavos === undefined) return "";

    return (centavos / 100).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function limpiarTextoPDF(texto) {
    return texto
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{2,}/g, "\n");
}

// ============================================================
// EXTRACCIÓN DEL PDF
// ============================================================
/*
async function leerPDF(articulosExcel) {
    console.log(`\nLeyendo PDF: ${PDF_PATH}`);

    const buffer = fs.readFileSync(PDF_PATH);
    const data = await pdfParse(buffer);

    const texto = data.text
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ");

    console.log("texto ",
        texto
            .split("\n")
            .slice(0, 30)
            .map((linea, index) => `${index}: ${linea}`)
            .join("\n")
    );

    const preciosPDF = new Map();
    const ocurrencias = new Map();

    for (const articuloOriginal of articulosExcel) {

        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) {
            continue;
        }

        const articuloEscapado = articulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        
        //  * Buscamos:
        //  *
        //  * ARTICULO
        //  *   ↓
        //  * cualquier texto de la descripción
        //  *   ↓
        //  * $
        //  *   ↓
        //  * precio
        //  *
        //  * NO ponemos (?![A-Z0-9_-])
        //  * porque el PDF puede devolver:
        //  *
        //  * JO907117ALFOMBRA
        //  *
        //  * en lugar de:
        //  *
        //  * JO907117 ALFOMBRA
         
        //console.log("articuloEscapado ", articuloEscapado)
        const regex = new RegExp(
            articuloEscapado +
            "[\\s\\S]{0,300}?" +
            "\\$\\s*" +
            "(\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{2})|\\d+(?:[.,]\\d{2}))",
            "gi"
        );

        // console.log(`\nArtículo: ${articulo}`);
        //console.log(`Regex: ${regex}`);

        const matches = [...texto.matchAll(regex)];

        // console.log(`Matches encontrados: ${matches.length}`);

        const preciosEncontrados = matches
            .map(match => {
                //console.log(`Coincidencia: ${match[0]}`);
                // console.log(`Precio capturado: ${match[1]}`);

                return convertirPrecio(match[1]);
            })
            .filter(precio => precio !== null);

        if (preciosEncontrados.length === 0) {
            console.log(`NO SE ENCONTRÓ: ${articulo}`);
            continue;
        }

        
        //  * Si aparece varias veces usamos el primero,
        //  * ya que nos indicaste que las repeticiones
        //  * tienen el mismo precio.
         
        preciosPDF.set(
            articulo,
            preciosEncontrados[0]
        );

        ocurrencias.set(
            articulo,
            preciosEncontrados.length
        );

        console.log(
            `ENCONTRADO: ${articulo} -> ${formatearPrecioCentavos(preciosEncontrados[0])}`
        );
    }

    console.log("\n========================================");
    console.log(
        `Artículos del Excel buscados: ${articulosExcel.length}`
    );
    console.log(
        `Artículos encontrados en PDF: ${preciosPDF.size}`
    );
    console.log("========================================");

    return {
        preciosPDF,
        ocurrencias
    };
}*/

async function leerPDF(articulosExcel, pdfPath = PDF_PATH) {
    console.log(`\nLeyendo PDF: ${pdfPath}`);

    const buffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(buffer);

    const lineas = data.text
        .split("\n")
        .map((linea) => linea.trim())
        .filter((linea) => linea.length > 0);

    const preciosPDF = new Map();
    const ocurrencias = new Map();
    const descripcionesPDF = new Map();

    for (const articuloOriginal of articulosExcel) {
        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) {
            continue;
        }

        const lineasCoincidentes = lineas.filter((linea) =>
            linea.toUpperCase().startsWith(articulo)
        );

        if (lineasCoincidentes.length === 0) {
            continue;
        }

        const preciosEncontrados = [];

        for (const linea of lineasCoincidentes) {
            const precios = linea.match(/\$\s*(\d+(?:\.\d+)?)/g);

            if (!precios || precios.length === 0) {
                continue;
            }

            const descripcion = linea
                .substring(articulo.length)
                .split("$")[0]
                .trim();

            const precioSinIVA = precios[0]
                .replace("$", "")
                .trim();

            const precio = convertirPrecio(precioSinIVA);

            if (precio !== null) {
                preciosEncontrados.push(precio);

                if (!descripcionesPDF.has(articulo)) {
                    descripcionesPDF.set(
                        articulo,
                        descripcion
                    );
                }
            }
        }

        if (preciosEncontrados.length === 0) {
            continue;
        }

        preciosPDF.set(articulo, preciosEncontrados[0]);

        ocurrencias.set(
            articulo,
            lineasCoincidentes.length
        );
    }

    return {
        preciosPDF,
        ocurrencias,
        descripcionesPDF
    };
}

// ============================================================
// LECTURA DEL EXCEL
// ============================================================

function leerExcel(excelPath = EXCEL_PATH) {
    console.log(`Leyendo Excel: ${excelPath}`);

    const workbook = XLSX.readFile(excelPath);
    const nombreHoja = workbook.SheetNames[0];
    const hoja = workbook.Sheets[nombreHoja];

    const filas = XLSX.utils.sheet_to_json(hoja, {
        defval: ""
    });

    if (filas.length === 0) {
        throw new Error("El Excel no contiene datos.");
    }

    const primeraFila = filas[0];

    const columnaArticulo = Object.keys(primeraFila).find(
        key => normalizarArticulo(key) === "ARTICULO"
    );

    const columnaPrecio = Object.keys(primeraFila).find(
        key => {
            const normalizada = normalizarArticulo(key);
            return (
                normalizada === "PRECIOFINAL" ||
                normalizada === "PRECIO"
            );
        }
    );

    if (!columnaArticulo) {
        throw new Error(
            'No se encontró la columna "Articulo" en el Excel.'
        );
    }

    if (!columnaPrecio) {
        throw new Error(
            'No se encontró la columna "Precio Final" (o "Precio") en el Excel.'
        );
    }

    return {
        filas,
        columnaArticulo,
        columnaPrecio
    };
}

// ============================================================
// COMPARACIÓN
// ============================================================

function comparar(datosPDF, datosExcel) {
    const resultados = [];

    let ok = 0;
    let diferencias = 0;
    let noEncontrados = 0;
    let preciosInvalidos = 0;

    for (const fila of datosExcel.filas) {
        const articuloOriginal = String(
            fila[datosExcel.columnaArticulo] ?? ""
        ).trim();

        const articulo = normalizarArticulo(articuloOriginal);

        if (!articulo) continue;

        const precioExcel = convertirPrecio(
            fila[datosExcel.columnaPrecio]
        );

        const precioPDF = datosPDF.preciosPDF.get(articulo);
        const descripcion = datosPDF.descripcionesPDF.get(articulo) || "";

        let precioCalculado = null;
        let diferencia = null;
        let estado = "";

        if (precioPDF === undefined) {
            estado = "NO ENCONTRADO EN PDF";
            noEncontrados++;
        } else if (precioExcel === null) {
            estado = "PRECIO EXCEL INVÁLIDO";
            preciosInvalidos++;
        } else {
            precioCalculado = precioPDF * MULTIPLICADOR;
            diferencia = precioCalculado - precioExcel;

            if ((diferencia / 100) < 1000 && (diferencia / 100) > -1000) {
                estado = "OK";
                ok++;
            } else {
                estado = "DIFERENCIA";
                diferencias++;
            }
        }

        resultados.push({
            "Articulo": articuloOriginal,
            "Nombre": descripcion,
            "Precio PDF sin IVA": precioPDF !== undefined
                ? precioPDF / 100
                : "",
            "Precio calculado (x2)": precioCalculado !== null
                ? precioCalculado / 100
                : "",
            "Precio para la venta": precioExcel !== null
                ? precioExcel / 100
                : "",
            "Diferencia": diferencia !== null
                ? diferencia / 100
                : "",
            "Veces en PDF": datosPDF.ocurrencias.get(articulo) || 0,
            "Estado": estado
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

// ============================================================
// GENERAR EXCEL DE RESULTADOS
// ============================================================

function generarExcel(resultados, resumen, outputPath = OUTPUT_PATH) {
    const workbook = XLSX.utils.book_new();

    const hojaResultados = XLSX.utils.json_to_sheet(resultados);

    hojaResultados["!autofilter"] = {
        ref: hojaResultados["!ref"]
    };

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

    const datosResumen = Object.entries(resumen).map(
        ([concepto, cantidad]) => ({
            "Concepto": concepto,
            "Cantidad": cantidad
        })
    );

    const hojaResumen = XLSX.utils.json_to_sheet(datosResumen);

    hojaResumen["!cols"] = [
        { wch: 30 },
        { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(
        workbook,
        hojaResumen,
        "Resumen"
    );

    const directorio = path.dirname(outputPath);

    if (!fs.existsSync(directorio)) {
        fs.mkdirSync(directorio, { recursive: true });
    }

    XLSX.writeFile(workbook, outputPath);

    console.log(`\nResultado generado: ${outputPath}`);
}

// ============================================================
// MAIN
// ============================================================

async function main(options = {}) {
    const pdfPath = options.pdfPath || PDF_PATH;
    const excelPath = options.excelPath || EXCEL_PATH;
    const outputPath = options.outputPath || OUTPUT_PATH;

    console.log("========================================");
    console.log("   COMPARADOR DE PRECIOS");
    console.log("========================================");

    if (!fs.existsSync(pdfPath)) {
        throw new Error(`No existe el PDF: ${pdfPath}`);
    }

    if (!fs.existsSync(excelPath)) {
        throw new Error(`No existe el Excel: ${excelPath}`);
    }

    const datosExcel = leerExcel(excelPath);

    const articulosExcel = datosExcel.filas
        .map(fila => fila[datosExcel.columnaArticulo])
        .filter(valor => String(valor ?? "").trim() !== "");

    const datosPDF = await leerPDF(articulosExcel, pdfPath);
    const { resultados, resumen } = comparar(datosPDF, datosExcel);

    generarExcel(resultados, resumen, outputPath);

    console.log("\n========================================");
    console.log("RESUMEN");
    console.log("========================================");

    for (const [concepto, cantidad] of Object.entries(resumen)) {
        console.log(`${concepto}: ${cantidad}`);
    }

    console.log("========================================\n");

    return { resultados, resumen, outputPath };
}

if (require.main === module) {
    main().catch((error) => {
        console.error("\nERROR:");
        console.error(error.message);
        process.exit(1);
    });
}

module.exports = { main };