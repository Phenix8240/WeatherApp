import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/', // Set the base URL for your app
    server: {
        historyApiFallback: true, // Enable history API fallback
    },
});

