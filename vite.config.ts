import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5174 // we use 5173 for sch4hfair-sveltekit as an auth redirect, this app doesn't support receiving auth callbacks
	}
});
