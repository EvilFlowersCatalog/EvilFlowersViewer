// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import dts from "file:///C:/Users/Tomas/Documents/Code/STU/EvilFlowersViewer/node_modules/vite-plugin-dts/dist/index.mjs";
import svgr from "file:///C:/Users/Tomas/Documents/Code/STU/EvilFlowersViewer/node_modules/vite-plugin-svgr/dist/index.js";
import tailwindcss from "file:///C:/Users/Tomas/Documents/Code/STU/EvilFlowersViewer/node_modules/tailwindcss/lib/index.js";
import { defineConfig } from "file:///C:/Users/Tomas/Documents/Code/STU/EvilFlowersViewer/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/Tomas/Documents/Code/STU/EvilFlowersViewer/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueDevTools from "file:///C:/Users/Tomas/Documents/Code/STU/EvilFlowersViewer/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Tomas/Documents/Code/STU/EvilFlowersViewer/vite.config.ts";
var vite_config_default = defineConfig(({ mode }) => {
  if (mode === "production") {
    return {
      plugins: [
        vue(),
        dts({
          insertTypesEntry: true
        }),
        svgr()
      ],
      css: {
        postcss: {
          plugins: [tailwindcss]
        }
      },
      resolve: {
        alias: {
          "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
        }
      },
      build: {
        lib: {
          entry: "./src/main.ts",
          name: "evilFlowersViewer",
          formats: ["es", "umd"],
          fileName: (format) => `evilFlowersViewer.${format}.js`
        },
        rollupOptions: {
          external: ["vue"],
          output: {
            globals: {
              vue: "Vue"
            }
          }
        }
      }
    };
  } else {
    return {
      plugins: [
        vue(),
        dts({
          insertTypesEntry: true
        }),
        svgr(),
        vueDevTools()
      ],
      css: {
        postcss: {
          plugins: [tailwindcss]
        }
      },
      resolve: {
        alias: {
          "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
        }
      },
      server: {
        port: 3e3
      }
    };
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxUb21hc1xcXFxEb2N1bWVudHNcXFxcQ29kZVxcXFxTVFVcXFxcRXZpbEZsb3dlcnNWaWV3ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFRvbWFzXFxcXERvY3VtZW50c1xcXFxDb2RlXFxcXFNUVVxcXFxFdmlsRmxvd2Vyc1ZpZXdlclxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvVG9tYXMvRG9jdW1lbnRzL0NvZGUvU1RVL0V2aWxGbG93ZXJzVmlld2VyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xyXG5cclxuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xyXG5pbXBvcnQgc3ZnciBmcm9tICd2aXRlLXBsdWdpbi1zdmdyJztcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ3RhaWx3aW5kY3NzJztcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBVc2VyQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcclxuaW1wb3J0IHZ1ZURldlRvb2xzIGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZS1kZXZ0b29scyc7XHJcblxyXG4vLyBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfTogVXNlckNvbmZpZykgPT4ge1xyXG4gIGlmIChtb2RlID09PSAncHJvZHVjdGlvbicpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICB2dWUoKSxcclxuICAgICAgICBkdHMoe1xyXG4gICAgICAgICAgaW5zZXJ0VHlwZXNFbnRyeTogdHJ1ZSxcclxuICAgICAgICB9KSxcclxuICAgICAgICBzdmdyKCksXHJcbiAgICAgIF0sXHJcbiAgICAgIGNzczoge1xyXG4gICAgICAgIHBvc3Rjc3M6IHtcclxuICAgICAgICAgIHBsdWdpbnM6IFt0YWlsd2luZGNzc10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgcmVzb2x2ZToge1xyXG4gICAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBidWlsZDoge1xyXG4gICAgICAgIGxpYjoge1xyXG4gICAgICAgICAgZW50cnk6ICcuL3NyYy9tYWluLnRzJyxcclxuICAgICAgICAgIG5hbWU6ICdldmlsRmxvd2Vyc1ZpZXdlcicsXHJcbiAgICAgICAgICBmb3JtYXRzOiBbJ2VzJywgJ3VtZCddLFxyXG4gICAgICAgICAgZmlsZU5hbWU6IChmb3JtYXQpID0+IGBldmlsRmxvd2Vyc1ZpZXdlci4ke2Zvcm1hdH0uanNgLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgICAgZXh0ZXJuYWw6IFsndnVlJ10sXHJcbiAgICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgICAgZ2xvYmFsczoge1xyXG4gICAgICAgICAgICAgIHZ1ZTogJ1Z1ZScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgdnVlKCksXHJcbiAgICAgICAgZHRzKHtcclxuICAgICAgICAgIGluc2VydFR5cGVzRW50cnk6IHRydWUsXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgc3ZncigpLFxyXG4gICAgICAgIHZ1ZURldlRvb2xzKCksXHJcbiAgICAgIF0sXHJcbiAgICAgIGNzczoge1xyXG4gICAgICAgIHBvc3Rjc3M6IHtcclxuICAgICAgICAgIHBsdWdpbnM6IFt0YWlsd2luZGNzc10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgcmVzb2x2ZToge1xyXG4gICAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBzZXJ2ZXI6IHtcclxuICAgICAgICBwb3J0OiAzMDAwLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuICB9XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlWLFNBQVMsZUFBZSxXQUFXO0FBRTVYLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFDakIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUyxvQkFBZ0M7QUFDekMsT0FBTyxTQUFTO0FBQ2hCLE9BQU8saUJBQWlCO0FBUG1NLElBQU0sMkNBQTJDO0FBVTVRLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFrQjtBQUNwRCxNQUFJLFNBQVMsY0FBYztBQUN6QixXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsUUFDUCxJQUFJO0FBQUEsUUFDSixJQUFJO0FBQUEsVUFDRixrQkFBa0I7QUFBQSxRQUNwQixDQUFDO0FBQUEsUUFDRCxLQUFLO0FBQUEsTUFDUDtBQUFBLE1BQ0EsS0FBSztBQUFBLFFBQ0gsU0FBUztBQUFBLFVBQ1AsU0FBUyxDQUFDLFdBQVc7QUFBQSxRQUN2QjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLE9BQU87QUFBQSxVQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsUUFDdEQ7QUFBQSxNQUNGO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxLQUFLO0FBQUEsVUFDSCxPQUFPO0FBQUEsVUFDUCxNQUFNO0FBQUEsVUFDTixTQUFTLENBQUMsTUFBTSxLQUFLO0FBQUEsVUFDckIsVUFBVSxDQUFDLFdBQVcscUJBQXFCLE1BQU07QUFBQSxRQUNuRDtBQUFBLFFBQ0EsZUFBZTtBQUFBLFVBQ2IsVUFBVSxDQUFDLEtBQUs7QUFBQSxVQUNoQixRQUFRO0FBQUEsWUFDTixTQUFTO0FBQUEsY0FDUCxLQUFLO0FBQUEsWUFDUDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGLE9BQU87QUFDTCxXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsUUFDUCxJQUFJO0FBQUEsUUFDSixJQUFJO0FBQUEsVUFDRixrQkFBa0I7QUFBQSxRQUNwQixDQUFDO0FBQUEsUUFDRCxLQUFLO0FBQUEsUUFDTCxZQUFZO0FBQUEsTUFDZDtBQUFBLE1BQ0EsS0FBSztBQUFBLFFBQ0gsU0FBUztBQUFBLFVBQ1AsU0FBUyxDQUFDLFdBQVc7QUFBQSxRQUN2QjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLE9BQU87QUFBQSxVQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsUUFDdEQ7QUFBQSxNQUNGO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixNQUFNO0FBQUEsTUFDUjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
