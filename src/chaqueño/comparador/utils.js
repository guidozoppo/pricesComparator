export function normalizarCodigo(codigo) {
    if (codigo === null || codigo === undefined) {
        return "";
    }

    return String(codigo).trim().toUpperCase();
}

export function normalizarEncabezado(encabezado) {
    if (encabezado === null || encabezado === undefined) {
        return "";
    }

    return String(encabezado)
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

export function convertirPrecio(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    if (typeof valor === "number") {
        return Number.isFinite(valor)
            ? valor
            : null;
    }

    const texto = String(valor)
        .trim()
        .replace(/\$/g, "")
        .replace(/\s/g, "");

    if (texto === "" || texto === "-") {
        return null;
    }

    const ultimoPunto = texto.lastIndexOf(".");
    const ultimaComa = texto.lastIndexOf(",");

    let precioNormalizado = texto;

    if (ultimoPunto !== -1 && ultimaComa !== -1) {
        if (ultimaComa > ultimoPunto) {
            precioNormalizado = texto
                .replace(/\./g, "")
                .replace(",", ".");
        } else {
            precioNormalizado = texto
                .replace(/,/g, "");
        }

    } else if (ultimaComa !== -1) {
        precioNormalizado = texto.replace(",", ".");
    }

    const precio = Number(precioNormalizado);

    return Number.isFinite(precio)
        ? precio
        : null;
}