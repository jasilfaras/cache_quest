import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/rest': {
        target: 'http://127.0.0.1:54321', // Local Supabase port
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:54321', // Local Supabase port
        changeOrigin: true,
      },
      '/realtime': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
    }
  },
})
