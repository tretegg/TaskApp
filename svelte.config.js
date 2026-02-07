import adapter from '@sveltejs/adapter-static'; 
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            // Capacitor expects the build to be in a 'build' or 'dist' folder
            pages: 'build',
            assets: 'build',
            fallback: 'index.html', // Essential for SPA routing
            precompress: false,
            strict: true
        })
    }
};

export default config;