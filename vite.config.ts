import { fileURLToPath, URL } from 'node:url';

import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';
import tailwindcss from 'tailwindcss';
import { defineConfig, UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

export default defineConfig(async ({ mode }: UserConfig) => {
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
    const plugins = [
      vue(),
      dts({
        insertTypesEntry: true,
      }),
      svgr(),
    ];

    const globalAny = globalThis as typeof globalThis & {
      localStorage?: StorageLike;
    };

    if (!globalAny.localStorage || typeof globalAny.localStorage.getItem !== 'function') {
      globalAny.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      };
    }

    const { default: vueDevTools } = await import('vite-plugin-vue-devtools');

    return {
      plugins: [...plugins, vueDevTools()],
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
