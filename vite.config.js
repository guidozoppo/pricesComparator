import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                casaJonas: resolve(__dirname, 'src/front/casa-jonas.html'),
                tpa: resolve(__dirname, 'src/front/tpa.html'),
                mali: resolve(__dirname, 'src/front/mali.html'),
                perfumeria: resolve(__dirname, 'src/front/perfumeria.html'),
                murray: resolve(__dirname, 'src/front/murray.html'),
                laTranquera: resolve(__dirname, 'src/front/laTranquera.html'),
                rigolleau: resolve(__dirname, 'src/front/rigolleau.html'),
                deportesOnce: resolve(__dirname, 'src/front/deportesOnce.html'),
                chaqueño: resolve(__dirname, 'src/front/chaqueño.html'),
                eyelit: resolve(__dirname, 'src/front/eyelit.html')
            }
        }
    }
});