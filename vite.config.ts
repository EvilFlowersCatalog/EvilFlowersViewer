import { fileURLToPath, URL } from 'node:url';

import dts from 'vite-plugin-dts';
import tailwindcss from 'tailwindcss';
import { defineConfig, type UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// One config for the dev harness (index.html → src/dev.ts) and the library
// build (src/main.ts). Only `build` and the dev-only plugins differ.
const shared: UserConfig = {
  // The SearchWorker is an ES module: emit it as a module worker so it is
  // instantiated with `{ type: 'module' }` (a classic worker logs
  // "Unexpected token 'export'" and silently truncated results under Vite 8).
  worker: { format: 'es' },
  css: { postcss: { plugins: [tailwindcss] } },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
};

export default defineConfig(async ({ mode }) => {
  if (mode !== 'production') {
    // Node 25+ exposes a `localStorage` global that is unusable without
    // --localstorage-file; the devtools plugin touches it at startup.
    const g = globalThis as { localStorage?: { getItem?: unknown } };
    if (typeof g.localStorage?.getItem !== 'function') {
      g.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
    }
    const { default: vueDevTools } = await import('vite-plugin-vue-devtools');
    return { ...shared, plugins: [vue(), vueDevTools()], server: { port: 3000 } };
  }

  return {
    ...shared,
    plugins: [
      vue(),
      dts({
        insertTypesEntry: true,
        // The root tsconfig.json is `files: []` + references; point dts at the
        // app config that includes `src/**`, or it emits an empty `export {}`.
        tsconfigPath: './tsconfig.app.json',
        // Only the public type surface ships (main.ts re-exports it); the
        // components' and stores' inferred types are internal and large.
        beforeWriteFile: (filePath: string) =>
          /(\/main\.d\.ts|\/assets\/utils\/(interfaces|enums)\.d\.ts|\/core\/telemetry\/types\.d\.ts)$/.test(filePath)
            ? undefined
            : false,
      }),
    ],
    define: {
      // The bundled dependencies (pinia, vue-i18n) are compiled into this
      // library, so their dev-only branches are decided here, not by the host:
      // no devtools hooks or dev warnings ship. Vue itself stays external.
      'process.env.NODE_ENV': JSON.stringify('production'),
      __VUE_I18N_FULL_INSTALL__: 'true',
      __VUE_I18N_LEGACY_API__: 'false',
      __INTLIFY_PROD_DEVTOOLS__: 'false',
    },
    build: {
      target: 'es2022',
      // Fonts are inlined into style.css (Vite library mode inlines CSS
      // assets), keeping the stylesheet self-contained so hosts can import it
      // or inject it as a string without broken font URLs.
      lib: {
        entry: './src/main.ts',
        name: 'evilFlowersViewer',
        formats: ['es', 'umd'],
        fileName: (format) => `evilFlowersViewer.${format}.js`,
        // Vite 6+ derives the CSS name from the package; keep the historical
        // `dist/style.css` the hosts import.
        cssFileName: 'style',
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: { vue: 'Vue' },
          // Lazy features (citations, chat, drawing, QR, the pdf.js worker)
          // are separate chunks in the ES build, fetched on first use. The UMD
          // build cannot split and inlines them.
          chunkFileNames: 'chunks/[name]-[hash].js',
        },
      },
    },
  };
});
