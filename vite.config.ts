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
          // The root tsconfig.json uses `files: []` + project references, so
          // point dts at the app config that actually includes `src/**` —
          // otherwise vite-plugin-dts 5 emits an empty `export {}` entry.
          tsconfigPath: './tsconfig.app.json',
        }),
        svgr(),
      ],
      // The full-text SearchWorker is an ES module (uses import/export style);
      // emit it as an ES-format worker so it is instantiated as a module worker
      // (`{ type: 'module' }`) rather than a classic one — Vite 8/Rolldown
      // otherwise logs "Unexpected token 'export'".
      worker: { format: 'es' },
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
          // Vite 6+ derives the lib CSS name from the package name
          // (evilflowersviewer.css). Pin it back to the historical `style.css`
          // so existing consumers importing dist/style.css keep working.
          cssFileName: 'style',
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
      // Match the production config: emit the SearchWorker as an ES module
      // worker so dev doesn't log "Unexpected token 'export'".
      worker: { format: 'es' },
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
