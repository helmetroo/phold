import { readFileSync } from 'fs';

import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    server: {
        https: {
            key: readFileSync('./.cert/key.pem'),
            cert: readFileSync('./.cert/cert.pem'),
        }
    },

    plugins: [
        VitePWA(),
        preact(),
    ]
});
