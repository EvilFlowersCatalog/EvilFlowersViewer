import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import tailwindcss from 'tailwindcss'
import svgr from 'vite-plugin-svgr'
import { resolve } from 'path'
import { UserConfig } from 'vite'

export default defineConfig(({ mode }: UserConfig) => {
  if (mode === 'staging') {
    return {
      plugins: [
        react(),
        dts({
          insertTypesEntry: true,
        }),
        svgr(),
      ],
      css: {
        postcss: {
          plugins: [tailwindcss],
        },
      },
    }
  }
  if (mode === 'production') {
    return {
      plugins: [
        react(),
        dts({
          insertTypesEntry: true,
        }),
        svgr(),
      ],
      css: {
        postcss: {
          plugins: [tailwindcss],
        },
      },
      build: {
        lib: {
          entry: './src/lib/index.ts',
          name: 'evilFlowersViewer',
          formats: ['es', 'umd'],
          fileName: (format) => `evilFlowersViewer.${format}.js`,
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
          },
        },
      },
    }
  }

  return {}
})
