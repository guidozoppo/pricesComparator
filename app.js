import { leerPDF } from "./src/comparador/pdf.js";
import { leerExcel } from "./src/comparador/excel.js";
import { comparar } from "./src/comparador/comparador.js";
import { generarExcel } from "./src/comparador/excelExport.js";

const pdfInput = document.getElementById("pdfProveedor");
const excelInput = document.getElementById("excelNegocio");
const pdfFileName = document.getElementById("pdfFileName");
const excelFileName = document.getElementById("excelFileName");
const boton = document.getElementById("compararBtn");
const statusMessage = document.getElementById("statusMessage");

function mostrarMensaje(texto, tipo) {
    statusMessage.textContent = texto;
    statusMessage.className = `message message--${tipo}`;
}

function ocultarMensaje() {
    statusMessage.textContent = "";
    statusMessage.className = "message message--hidden";
}

function actualizarArchivo(input, nombreElemento) {
    const archivo = input.files[0];
    const cajaUpload = input.closest(".upload-field").querySelector(".upload-box");

    if (archivo) {
        nombreElemento.textContent = archivo.name;
        cajaUpload.classList.add("upload-box--selected");
    } else {
        nombreElemento.textContent = "Ningún archivo seleccionado";
        cajaUpload.classList.remove("upload-box--selected");
    }

    ocultarMensaje();
}

pdfInput.addEventListener("change", () => {
    actualizarArchivo(pdfInput, pdfFileName);
});

excelInput.addEventListener("change", () => {
    actualizarArchivo(excelInput, excelFileName);
});

boton.addEventListener("click", async () => {
    const pdfFile = pdfInput.files[0];
    const excelFile = excelInput.files[0];

    if (!pdfFile || !excelFile) {
        mostrarMensaje(
            "Seleccioná el PDF del proveedor y el Excel del negocio.",
            "error"
        );
        return;
    }

    boton.disabled = true;
    boton.classList.add("btn--loading");
    boton.querySelector(".btn__label").textContent = "Leyendo PDF";
    ocultarMensaje();

    try {
        const resultadoExcel = await leerExcel(excelFile);

        const articulosExcel = resultadoExcel.filas.map(
            fila => fila[resultadoExcel.columnaArticulo]
        );

        const resultadoPDF = await leerPDF(
            articulosExcel,
            pdfFile
        );

        const resultadoComparacion = comparar(
            resultadoPDF,
            resultadoExcel
        );

        console.log("========================================");
        console.log("RESULTADO DE COMPARACIÓN");
        console.log("========================================");

        console.log("Resumen:", resultadoComparacion.resumen);

        console.log("Resultados:", resultadoComparacion.resultados);

        console.log("========================================");

        generarExcel(
            resultadoComparacion.resultados,
            resultadoComparacion.resumen
        );
    } catch (error) {
        console.error(error);

        mostrarMensaje(
            `Error al leer el PDF: ${error.message}`,
            "error"
        );
    } finally {
        boton.disabled = false;
        boton.classList.remove("btn--loading");
        boton.querySelector(".btn__label").textContent = "Comparar";
    }
});