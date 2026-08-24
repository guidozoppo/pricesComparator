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
        mostrarMensaje("Seleccioná el PDF del proveedor y el Excel del negocio.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("pdf", pdfFile);
    formData.append("excel", excelFile);

    boton.disabled = true;
    boton.classList.add("btn--loading");
    boton.querySelector(".btn__label").textContent = "Comparando";
    ocultarMensaje();

    try {
        const response = await fetch("/comparar", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Error al comparar los archivos.");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = "resultado-comparacion.xlsx";
        enlace.click();
        URL.revokeObjectURL(url);

        mostrarMensaje("Comparación completada. Se descargó el archivo Excel con los resultados.", "success");
    } catch (error) {
        mostrarMensaje(error.message, "error");
    } finally {
        boton.disabled = false;
        boton.classList.remove("btn--loading");
        boton.querySelector(".btn__label").textContent = "Comparar";
    }
});
