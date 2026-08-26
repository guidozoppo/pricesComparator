# Comparador de precios PDF + Excel

## 1. Requisitos

Tener instalado Node.js.

## 2. Estructura

```text
comparador-precios/
├── comparar.js
├── package.json
├── archivos/
│   ├── precios-proveedor.pdf
│   └── articulos.xlsx
└── resultados/
```

El Excel debe tener como mínimo estas columnas:

- `Articulo`
- `Precio Final`

El PDF contiene los precios del proveedor.

## 3. Instalar dependencias

Desde la carpeta del proyecto:

```bash
npm install
```

## 4. Ejecutar

Con los nombres/rutas por defecto:

```bash
node comparar.js
```

También se pueden pasar las rutas manualmente:

```bash
node comparar.js "C:\ruta\precios.pdf" "C:\ruta\articulos.xlsx" "C:\ruta\resultado.xlsx"
```

## 5. Cálculo

Para cada artículo que exista en el Excel:

```text
Precio PDF sin IVA × 2
```

El resultado se compara con `Precio Final` del Excel.

## 6. Estados

- `OK`: coincide.
- `DIFERENCIA`: no coincide.
- `NO ENCONTRADO EN PDF`: el artículo del Excel no aparece en el PDF.
- `PRECIO EXCEL INVÁLIDO`: no se pudo interpretar el precio del Excel.

Los artículos que aparecen en el PDF pero no están en el Excel se ignoran.

El programa genera un Excel con dos hojas:

- `Comparación`
- `Resumen`
Aplicación web para comparar precios entre un PDF de proveedor y un archivo Excel del negocio.