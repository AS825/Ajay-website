import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // host: true → reachable from a phone in the same Wi-Fi for mobile testing.
  server: { host: true, port: 5173 },
  build: { target: 'es2022', sourcemap: true },
})
