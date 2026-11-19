import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: { $lib: path.resolve('./src/lib') },
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: false },
      '/files': { target: 'http://localhost:3000', changeOrigin: false },
    },
  },
})
