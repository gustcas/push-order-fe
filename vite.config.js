import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'icon-192.svg', 'icon-512.svg'],
            manifest: {
                name: 'EDIMCA POS',
                short_name: 'POS',
                description: 'Sistema de punto de venta EDIMCA',
                theme_color: '#1e293b',
                background_color: '#f5f7fa',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                icons: [
                    { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
                    { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https?:\/\/.*\/api\//,
                        handler: 'NetworkFirst',
                        options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 },
                    },
                ],
            },
        }),
    ],
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.js$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: { '.js': 'jsx' },
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ['legacy-js-api', 'import'],
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    build: {
        outDir: 'build',
    },
});
