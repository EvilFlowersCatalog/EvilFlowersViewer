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
        // Fonts are intentionally inlined into style.css (Vite library mode
        // inlines CSS assets regardless of assetsInlineLimit). This keeps the
        // stylesheet fully self-contained, so consumers can load it however
        // they like — a normal bundler import or an inline string — without
        // broken relative font URLs. The cost is a larger CSS file (subsetted
        // to latin + latin-ext to keep it in check).
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
