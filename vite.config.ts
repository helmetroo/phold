import { readFileSync } from 'fs';

import { defineConfig, loadEnv } from 'vite';
import type { UserConfigExport } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import glsl from 'vite-plugin-glsl';
import { VitePWA } from 'vite-plugin-pwa';
import preact from '@preact/preset-vite';

export default defineConfig(({ mode }) => {
    const config: UserConfigExport = {
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'face-api.js': ['face-api.js']
                    }
                }
            }
        },

        plugins: [
            tsconfigPaths(),
            glsl(),
            VitePWA({
                devOptions: {
                    enabled: true,
                },

                includeAssets: [
                    'favicon.ico',
                    'apple-touch-icon.png',
                    'mask-icon.svg',
                ],

                manifest: {
                    name: 'PHOLD',
                    short_name: 'PHOLD',
                    description: 'A camera app enabling you to fold your face',
                    background_color: '#000000',
                    theme_color: '#101010',
                    icons: [{
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    }, {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    }, {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any',
                    }, {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    }],
                    start_url: '/.',
                    display: 'fullscreen',
                }
            }),
            preact(),
        ]
    };

    // Read mkcert installed locally
    const env = loadEnv(mode, process.cwd(), '');
    const isDev = env.NODE_ENV === 'development';
    if (isDev) {
        config.server.https = {
            key: readFileSync('./.cert/key.pem'),
            cert: readFileSync('./.cert/cert.pem'),
        }
    }

    return config;
});
