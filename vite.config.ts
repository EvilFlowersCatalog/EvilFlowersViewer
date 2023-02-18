import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: './src/main.tsx',
      name: 'evilFlowersViewer',
      fileName: 'evilFlowersViewer'
    }
  },
  plugins: [react()],
})