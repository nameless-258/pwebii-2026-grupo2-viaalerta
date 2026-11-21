import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// No GitHub Pages a app fica em https://<utilizador>.github.io/<nome-do-repositorio>/
// O workflow de deploy define BASE_PATH automaticamente com o nome do repositório.
// Para builds manuais: BASE_PATH=/pwebii-2026-grupo2-viaalerta/ npm run build
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  }
})
