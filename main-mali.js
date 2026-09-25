import { leerExcelProveedor, leerExcelNegocio } from "./src/mali/comparador/excel.js";
import { comparar } from "./src/mali/comparador/comparador.js";
import { exportarExcel } from "./src/mali/comparador/excelExport.js";

const excelProveedorInput = document.getElementById("excelProveedor");
const excelNegocioInput = document.getElementById("excelNegocio");
const compararBtn = document.getElementById("compararBtn");
const excelProveedorFileName = document.getElementById("excelProveedorFileName");
const excelNegocioFileName = document.getElementById("excelNegocioFileName");
const statusMessage = document.getElementById("statusMessage");

excelProveedorInput.addEventListener("change", () => {
    actualizarArchivo(excelProveedorInput, excelProveedorFileName);
});

excelNegocioInput.addEventListener("change", () => {
    actualizarArchivo(excelNegocioInput, excelNegocioFileName);
});

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

function mostrarMensaje(texto, tipo) {
    statusMessage.textContent = texto;
    statusMessage.className = `message message--${tipo}`;
}

function ocultarMensaje() {
    statusMessage.textContent = "";
    statusMessage.className = "message message--hidden";
}

compararBtn.addEventListener("click",
    async () => {

        const excelProveedorFile = excelProveedorInput.files[0];
        const excelNegocioFile = excelNegocioInput.files[0];


        if (!excelProveedorFile || !excelNegocioFile) {
            mostrarMensaje(
                "Seleccioná el Excel del proveedor y el Excel del negocio.",
                "error"
            );
            return;
        }

        compararBtn.disabled = true;
        compararBtn.classList.add("btn--loading");
        compararBtn.querySelector(".btn__label").textContent = "Leyendo archivos";
        ocultarMensaje();

        try {
            const articulosProveedor = await leerExcelProveedor(excelProveedorFile);
            const articulosNegocio = await leerExcelNegocio(excelNegocioFile);
            const resultados = comparar(articulosProveedor, articulosNegocio);
            exportarExcel(resultados);
            mostrarMensaje("Comparación realizada correctamente. El archivo se descargó automáticamente.", "success");
        } catch (error) {
            console.error("Error al procesar los archivos: ", error);
            mostrarMensaje(error.message || "Ocurrió un error al procesar los archivos.", "error");
        } finally {
            compararBtn.disabled = false;
            compararBtn.classList.remove("btn--loading");
            compararBtn.querySelector(".btn__label").textContent = "Comparar";
        }
    }
); 