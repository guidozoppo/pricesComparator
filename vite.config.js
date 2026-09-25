import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                casaJonas: resolve(__dirname, 'src/front/casa-jonas.html'),
                tpa: resolve(__dirname, 'src/front/tpa.html'),
                mali: resolve(__dirname, 'src/front/mali.html')
            }
        }
    }
});