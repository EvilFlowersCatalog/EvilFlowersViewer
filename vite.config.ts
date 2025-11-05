import { fileURLToPath, URL } from 'node:url';

import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';
import tailwindcss from 'tailwindcss';
import { defineConfig, UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig(({ mode }: UserConfig) => {
  if (mode === 'production') {
    return {
      plugins: [
        vue(),
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
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
      build: {
        lib: {
          entry: './src/main.ts',
          name: 'evilFlowersViewer',
          formats: ['es', 'umd'],
          fileName: (format) => `evilFlowersViewer.${format}.js`,
        },
        rollupOptions: {
          external: ['vue'],
          output: {
            globals: {
              vue: 'Vue',
            },
          },
        },
      },
    };
  } else {
    return {
      plugins: [
        vue(),
        dts({
          insertTypesEntry: true,
        }),
        svgr(),
        vueDevTools(),
      ],
      css: {
        postcss: {
          plugins: [tailwindcss],
        },
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
      server: {
        port: 3000,
      },
    };
  }
});
