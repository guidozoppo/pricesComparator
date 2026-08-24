const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { main } = require("./comparar");

const app = express();
const upload = multer({ dest: path.join(__dirname, "temp") });

app.use(express.static(__dirname));

app.post("/comparar", upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "excel", maxCount: 1 }
]), async (req, res) => {
    const pdfFile = req.files?.pdf?.[0];
    const excelFile = req.files?.excel?.[0];
    const archivosTemporales = [];

    if (!pdfFile || !excelFile) {
        return res.status(400).json({ error: "Debes enviar el PDF y el Excel." });
    }

    archivosTemporales.push(pdfFile.path, excelFile.path);

    const outputPath = path.join(
        __dirname,
        "resultados",
        `resultado-${Date.now()}.xlsx`
    );

    try {
        await main({
            pdfPath: pdfFile.path,
            excelPath: excelFile.path,
            outputPath
        });

        res.download(outputPath, "resultado-comparacion.xlsx", (error) => {
            archivosTemporales.push(outputPath);

            for (const archivo of archivosTemporales) {
                fs.unlink(archivo, () => {});
            }

            if (error) {
                console.error(error.message);
            }
        });
    } catch (error) {
        for (const archivo of archivosTemporales) {
            fs.unlink(archivo, () => {});
        }

        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
