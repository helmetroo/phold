import { readFileSync } from 'fs';

import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import glsl from 'vite-plugin-glsl';
import { VitePWA } from 'vite-plugin-pwa';
import preact from '@preact/preset-vite';

export default defineConfig({
    server: {
        https: {
            key: readFileSync('./.cert/key.pem'),
            cert: readFileSync('./.cert/cert.pem'),
        }
    },

    plugins: [
        tsconfigPaths(),
        glsl(),
        VitePWA(),
        preact(),
    ]
});
