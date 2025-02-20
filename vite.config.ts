import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env': {},
    global: {},
  },
  plugins: [react(), crossOriginIsolation()],
  server: {
    port: 8501,
    watch: {
      usePolling: false,
      interval: 1000
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    target: 'esnext', // Ensure latest JS features, including WASM
  },
})
