// vite.config.js
import { APP_SHARED_DEPS } from "file:///D:/soft/dev/myp_1/a0_github_directus_11.10.2/directus/packages/extensions/dist/index.js";
import { generateExtensionsEntrypoint, resolveFsExtensions, resolveModuleExtensions } from "file:///D:/soft/dev/myp_1/a0_github_directus_11.10.2/directus/packages/extensions/dist/node.js";
import yaml from "file:///D:/soft/dev/myp_1/a0_github_directus_11.10.2/directus/node_modules/.pnpm/@rollup+plugin-yaml@4.1.2_rollup@4.46.2/node_modules/@rollup/plugin-yaml/dist/es/index.js";
import UnheadVite from "file:///D:/soft/dev/myp_1/a0_github_directus_11.10.2/directus/node_modules/.pnpm/@unhead+addons@1.11.20_rollup@4.46.2/node_modules/@unhead/addons/dist/vite.mjs";
import vue from "file:///D:/soft/dev/myp_1/a0_github_directus_11.10.2/directus/node_modules/.pnpm/@vitejs+plugin-vue@6.0.1_vi_e17ed5412f386f11d63967968166a7b6/node_modules/@vitejs/plugin-vue/dist/index.js";
import fs from "node:fs";
import path from "node:path";
import { searchForWorkspaceRoot } from "file:///D:/soft/dev/myp_1/a0_github_directus_11.10.2/directus/node_modules/.pnpm/vite@5.4.19_@types+node@24._4f118d1b55ef7c96c7a7e53fb6f58421/node_modules/vite/dist/node/index.js";
import { defineConfig } from "file:///D:/soft/dev/myp_1/a0_github_directus_11.10.2/directus/node_modules/.pnpm/vitest@3.2.4_@types+node@24_1137c1b4e62142c37a8e0d5718136b18/node_modules/vitest/dist/config.js";
import vueDevtools from "file:///D:/soft/dev/myp_1/a0_github_directus_11.10.2/directus/node_modules/.pnpm/vite-plugin-vue-devtools@7._19dcbb9998430cf4963ffdfa0cfeaa7c/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var __vite_injected_original_dirname = "D:\\soft\\dev\\myp_1\\a0_github_directus_11.10.2\\directus\\app";
var API_PATH = path.join("..", "api");
var EXTENSIONS_PATH = path.join(API_PATH, "extensions");
var extensionsPathExists = fs.existsSync(EXTENSIONS_PATH);
var vite_config_default = defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  },
  plugins: [
    directusExtensions(),
    vue(),
    UnheadVite(),
    yaml({
      transform(data) {
        return data === null ? {} : void 0;
      }
    }),
    {
      name: "watch-directus-dependencies",
      configureServer: (server) => {
        server.watcher.options = {
          ...server.watcher.options,
          ignored: [/node_modules\/(?!@directus\/).*/, "**/.git/**"]
        };
      }
    },
    vueDevtools()
  ],
  define: {
    __VUE_I18N_LEGACY_API__: false
  },
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(__vite_injected_original_dirname, "src") }]
  },
  base: process.env.NODE_ENV === "production" ? "" : "/admin",
  ...!process.env.HISTOIRE && {
    server: {
      port: 8080,
      proxy: {
        "^/(?!admin)": {
          target: process.env.API_URL ? process.env.API_URL : "http://127.0.0.1:8055/",
          changeOrigin: true
        },
        "/websocket/logs": {
          target: process.env.API_URL ? process.env.API_URL : "ws://127.0.0.1:8055/",
          changeOrigin: true
        }
      },
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd()), ...getExtensionsRealPaths()]
      }
    }
  },
  test: {
    environment: "happy-dom",
    deps: {
      optimizer: {
        web: {
          exclude: ["pinia", "url"]
        }
      }
    }
  }
});
function getExtensionsRealPaths() {
  return extensionsPathExists ? fs.readdirSync(EXTENSIONS_PATH).flatMap((typeDir) => {
    const extensionTypeDir = path.join(EXTENSIONS_PATH, typeDir);
    if (!fs.statSync(extensionTypeDir).isDirectory()) return;
    return fs.readdirSync(extensionTypeDir).map((dir) => fs.realpathSync(path.join(extensionTypeDir, dir)));
  }).filter((v) => v) : [];
}
function directusExtensions() {
  const virtualExtensionsId = "@directus-extensions";
  let extensionsEntrypoint = null;
  return [
    {
      name: "directus-extensions-serve",
      apply: "serve",
      config: () => ({
        optimizeDeps: {
          include: APP_SHARED_DEPS
        }
      }),
      async buildStart() {
        await loadExtensions();
      },
      resolveId(id) {
        if (id === virtualExtensionsId) {
          return id;
        }
      },
      load(id) {
        if (id === virtualExtensionsId) {
          return extensionsEntrypoint;
        }
      }
    },
    {
      name: "directus-extensions-build",
      apply: "build",
      config: () => ({
        build: {
          rollupOptions: {
            input: {
              index: path.resolve(__vite_injected_original_dirname, "index.html"),
              ...APP_SHARED_DEPS.reduce((acc, dep) => ({ ...acc, [dep.replace(/\//g, "_")]: dep }), {})
            },
            output: {
              entryFileNames: "assets/[name].[hash].entry.js"
            },
            external: [virtualExtensionsId],
            preserveEntrySignatures: "exports-only"
          }
        }
      })
    }
  ];
  async function loadExtensions() {
    const localExtensions = extensionsPathExists ? await resolveFsExtensions(EXTENSIONS_PATH) : /* @__PURE__ */ new Map();
    const moduleExtensions = await resolveModuleExtensions(API_PATH);
    const registryExtensions = extensionsPathExists ? await resolveFsExtensions(path.join(EXTENSIONS_PATH, ".registry")) : /* @__PURE__ */ new Map();
    const mockSetting = (source, folder, extension) => {
      const settings = [
        {
          id: extension.name,
          enabled: true,
          folder,
          bundle: null,
          source
        }
      ];
      if (extension.type === "bundle") {
        settings.push(
          ...extension.entries.map((entry) => ({
            enabled: true,
            folder: entry.name,
            bundle: extension.name,
            source
          }))
        );
      }
      return settings;
    };
    const extensionSettings = [
      ...Array.from(localExtensions.entries()).flatMap(
        ([folder, extension]) => mockSetting("local", folder, extension)
      ),
      ...Array.from(moduleExtensions.entries()).flatMap(
        ([folder, extension]) => mockSetting("module", folder, extension)
      ),
      ...Array.from(registryExtensions.entries()).flatMap(
        ([folder, extension]) => mockSetting("registry", folder, extension)
      )
    ];
    extensionsEntrypoint = generateExtensionsEntrypoint(
      { module: moduleExtensions, local: localExtensions, registry: registryExtensions },
      extensionSettings
    );
  }
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxzb2Z0XFxcXGRldlxcXFxteXBfMVxcXFxhMF9naXRodWJfZGlyZWN0dXNfMTEuMTAuMlxcXFxkaXJlY3R1c1xcXFxhcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHNvZnRcXFxcZGV2XFxcXG15cF8xXFxcXGEwX2dpdGh1Yl9kaXJlY3R1c18xMS4xMC4yXFxcXGRpcmVjdHVzXFxcXGFwcFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovc29mdC9kZXYvbXlwXzEvYTBfZ2l0aHViX2RpcmVjdHVzXzExLjEwLjIvZGlyZWN0dXMvYXBwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgQVBQX1NIQVJFRF9ERVBTIH0gZnJvbSAnQGRpcmVjdHVzL2V4dGVuc2lvbnMnO1xyXG5pbXBvcnQgeyBnZW5lcmF0ZUV4dGVuc2lvbnNFbnRyeXBvaW50LCByZXNvbHZlRnNFeHRlbnNpb25zLCByZXNvbHZlTW9kdWxlRXh0ZW5zaW9ucyB9IGZyb20gJ0BkaXJlY3R1cy9leHRlbnNpb25zL25vZGUnO1xyXG5pbXBvcnQgeWFtbCBmcm9tICdAcm9sbHVwL3BsdWdpbi15YW1sJztcclxuaW1wb3J0IFVuaGVhZFZpdGUgZnJvbSAnQHVuaGVhZC9hZGRvbnMvdml0ZSc7XHJcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcclxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgeyBzZWFyY2hGb3JXb3Jrc3BhY2VSb290IH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGVzdC9jb25maWcnO1xyXG5pbXBvcnQgdnVlRGV2dG9vbHMgZnJvbSAndml0ZS1wbHVnaW4tdnVlLWRldnRvb2xzJztcclxuXHJcbmNvbnN0IEFQSV9QQVRIID0gcGF0aC5qb2luKCcuLicsICdhcGknKTtcclxuXHJcbi8qXHJcbiAqIEBUT0RPIFRoaXMgZXh0ZW5zaW9uIHBhdGggaXMgaGFyZGNvZGVkIHRvIHRoZSBlbnYgZGVmYXVsdCAoLi9leHRlbnNpb25zKS4gVGhpcyB3b24ndCB3b3JrXHJcbiAqIGFzIGV4cGVjdGVkIHdoZW4gZXh0ZW5zaW9ucyBhcmUgcmVhZCBmcm9tIGEgZGlmZmVyZW50IGxvY2F0aW9uIGxvY2FsbHkgdGhyb3VnaCB0aGVcclxuICogRVhURU5TSU9OU19MT0NBVElPTiBlbnYgdmFyXHJcbiAqL1xyXG5jb25zdCBFWFRFTlNJT05TX1BBVEggPSBwYXRoLmpvaW4oQVBJX1BBVEgsICdleHRlbnNpb25zJyk7XHJcblxyXG5jb25zdCBleHRlbnNpb25zUGF0aEV4aXN0cyA9IGZzLmV4aXN0c1N5bmMoRVhURU5TSU9OU19QQVRIKTtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcblx0Y3NzOiB7XHJcblx0XHRwcmVwcm9jZXNzb3JPcHRpb25zOiB7XHJcblx0XHRcdHNjc3M6IHtcclxuXHRcdFx0XHRhcGk6ICdtb2Rlcm4tY29tcGlsZXInLFxyXG5cdFx0XHR9LFxyXG5cdFx0fSxcclxuXHR9LFxyXG5cdHBsdWdpbnM6IFtcclxuXHRcdGRpcmVjdHVzRXh0ZW5zaW9ucygpLFxyXG5cdFx0dnVlKCksXHJcblx0XHRVbmhlYWRWaXRlKCksXHJcblx0XHR5YW1sKHtcclxuXHRcdFx0dHJhbnNmb3JtKGRhdGEpIHtcclxuXHRcdFx0XHRyZXR1cm4gZGF0YSA9PT0gbnVsbCA/IHt9IDogdW5kZWZpbmVkO1xyXG5cdFx0XHR9LFxyXG5cdFx0fSksXHJcblx0XHR7XHJcblx0XHRcdG5hbWU6ICd3YXRjaC1kaXJlY3R1cy1kZXBlbmRlbmNpZXMnLFxyXG5cdFx0XHRjb25maWd1cmVTZXJ2ZXI6IChzZXJ2ZXIpID0+IHtcclxuXHRcdFx0XHRzZXJ2ZXIud2F0Y2hlci5vcHRpb25zID0ge1xyXG5cdFx0XHRcdFx0Li4uc2VydmVyLndhdGNoZXIub3B0aW9ucyxcclxuXHRcdFx0XHRcdGlnbm9yZWQ6IFsvbm9kZV9tb2R1bGVzXFwvKD8hQGRpcmVjdHVzXFwvKS4qLywgJyoqLy5naXQvKionXSxcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHR9LFxyXG5cdFx0fSxcclxuXHRcdHZ1ZURldnRvb2xzKCksXHJcblx0XSxcclxuXHRkZWZpbmU6IHtcclxuXHRcdF9fVlVFX0kxOE5fTEVHQUNZX0FQSV9fOiBmYWxzZSxcclxuXHR9LFxyXG5cdHJlc29sdmU6IHtcclxuXHRcdGFsaWFzOiBbeyBmaW5kOiAnQCcsIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJykgfV0sXHJcblx0fSxcclxuXHRiYXNlOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nID8gJycgOiAnL2FkbWluJyxcclxuXHQuLi4oIXByb2Nlc3MuZW52LkhJU1RPSVJFICYmIHtcclxuXHRcdHNlcnZlcjoge1xyXG5cdFx0XHRwb3J0OiA4MDgwLFxyXG5cdFx0XHRwcm94eToge1xyXG5cdFx0XHRcdCdeLyg/IWFkbWluKSc6IHtcclxuXHRcdFx0XHRcdHRhcmdldDogcHJvY2Vzcy5lbnYuQVBJX1VSTCA/IHByb2Nlc3MuZW52LkFQSV9VUkwgOiAnaHR0cDovLzEyNy4wLjAuMTo4MDU1LycsXHJcblx0XHRcdFx0XHRjaGFuZ2VPcmlnaW46IHRydWUsXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHQnL3dlYnNvY2tldC9sb2dzJzoge1xyXG5cdFx0XHRcdFx0dGFyZ2V0OiBwcm9jZXNzLmVudi5BUElfVVJMID8gcHJvY2Vzcy5lbnYuQVBJX1VSTCA6ICd3czovLzEyNy4wLjAuMTo4MDU1LycsXHJcblx0XHRcdFx0XHRjaGFuZ2VPcmlnaW46IHRydWUsXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0fSxcclxuXHRcdFx0ZnM6IHtcclxuXHRcdFx0XHRhbGxvdzogW3NlYXJjaEZvcldvcmtzcGFjZVJvb3QocHJvY2Vzcy5jd2QoKSksIC4uLmdldEV4dGVuc2lvbnNSZWFsUGF0aHMoKV0sXHJcblx0XHRcdH0sXHJcblx0XHR9LFxyXG5cdH0pLFxyXG5cdHRlc3Q6IHtcclxuXHRcdGVudmlyb25tZW50OiAnaGFwcHktZG9tJyxcclxuXHRcdGRlcHM6IHtcclxuXHRcdFx0b3B0aW1pemVyOiB7XHJcblx0XHRcdFx0d2ViOiB7XHJcblx0XHRcdFx0XHRleGNsdWRlOiBbJ3BpbmlhJywgJ3VybCddLFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdH0sXHJcblx0XHR9LFxyXG5cdH0sXHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uc1JlYWxQYXRocygpIHtcclxuXHRyZXR1cm4gZXh0ZW5zaW9uc1BhdGhFeGlzdHNcclxuXHRcdD8gZnNcclxuXHRcdFx0XHQucmVhZGRpclN5bmMoRVhURU5TSU9OU19QQVRIKVxyXG5cdFx0XHRcdC5mbGF0TWFwKCh0eXBlRGlyKSA9PiB7XHJcblx0XHRcdFx0XHRjb25zdCBleHRlbnNpb25UeXBlRGlyID0gcGF0aC5qb2luKEVYVEVOU0lPTlNfUEFUSCwgdHlwZURpcik7XHJcblx0XHRcdFx0XHRpZiAoIWZzLnN0YXRTeW5jKGV4dGVuc2lvblR5cGVEaXIpLmlzRGlyZWN0b3J5KCkpIHJldHVybjtcclxuXHRcdFx0XHRcdHJldHVybiBmcy5yZWFkZGlyU3luYyhleHRlbnNpb25UeXBlRGlyKS5tYXAoKGRpcikgPT4gZnMucmVhbHBhdGhTeW5jKHBhdGguam9pbihleHRlbnNpb25UeXBlRGlyLCBkaXIpKSk7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHQuZmlsdGVyKCh2KSA9PiB2KVxyXG5cdFx0OiBbXTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGlyZWN0dXNFeHRlbnNpb25zKCkge1xyXG5cdGNvbnN0IHZpcnR1YWxFeHRlbnNpb25zSWQgPSAnQGRpcmVjdHVzLWV4dGVuc2lvbnMnO1xyXG5cclxuXHRsZXQgZXh0ZW5zaW9uc0VudHJ5cG9pbnQgPSBudWxsO1xyXG5cclxuXHRyZXR1cm4gW1xyXG5cdFx0e1xyXG5cdFx0XHRuYW1lOiAnZGlyZWN0dXMtZXh0ZW5zaW9ucy1zZXJ2ZScsXHJcblx0XHRcdGFwcGx5OiAnc2VydmUnLFxyXG5cdFx0XHRjb25maWc6ICgpID0+ICh7XHJcblx0XHRcdFx0b3B0aW1pemVEZXBzOiB7XHJcblx0XHRcdFx0XHRpbmNsdWRlOiBBUFBfU0hBUkVEX0RFUFMsXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0fSksXHJcblx0XHRcdGFzeW5jIGJ1aWxkU3RhcnQoKSB7XHJcblx0XHRcdFx0YXdhaXQgbG9hZEV4dGVuc2lvbnMoKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0cmVzb2x2ZUlkKGlkKSB7XHJcblx0XHRcdFx0aWYgKGlkID09PSB2aXJ0dWFsRXh0ZW5zaW9uc0lkKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gaWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRsb2FkKGlkKSB7XHJcblx0XHRcdFx0aWYgKGlkID09PSB2aXJ0dWFsRXh0ZW5zaW9uc0lkKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZXh0ZW5zaW9uc0VudHJ5cG9pbnQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0fSxcclxuXHRcdHtcclxuXHRcdFx0bmFtZTogJ2RpcmVjdHVzLWV4dGVuc2lvbnMtYnVpbGQnLFxyXG5cdFx0XHRhcHBseTogJ2J1aWxkJyxcclxuXHRcdFx0Y29uZmlnOiAoKSA9PiAoe1xyXG5cdFx0XHRcdGJ1aWxkOiB7XHJcblx0XHRcdFx0XHRyb2xsdXBPcHRpb25zOiB7XHJcblx0XHRcdFx0XHRcdGlucHV0OiB7XHJcblx0XHRcdFx0XHRcdFx0aW5kZXg6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXHJcblx0XHRcdFx0XHRcdFx0Li4uQVBQX1NIQVJFRF9ERVBTLnJlZHVjZSgoYWNjLCBkZXApID0+ICh7IC4uLmFjYywgW2RlcC5yZXBsYWNlKC9cXC8vZywgJ18nKV06IGRlcCB9KSwge30pLFxyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRvdXRwdXQ6IHtcclxuXHRcdFx0XHRcdFx0XHRlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdLmVudHJ5LmpzJyxcclxuXHRcdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdFx0ZXh0ZXJuYWw6IFt2aXJ0dWFsRXh0ZW5zaW9uc0lkXSxcclxuXHRcdFx0XHRcdFx0cHJlc2VydmVFbnRyeVNpZ25hdHVyZXM6ICdleHBvcnRzLW9ubHknLFxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHR9KSxcclxuXHRcdH0sXHJcblx0XTtcclxuXHJcblx0YXN5bmMgZnVuY3Rpb24gbG9hZEV4dGVuc2lvbnMoKSB7XHJcblx0XHRjb25zdCBsb2NhbEV4dGVuc2lvbnMgPSBleHRlbnNpb25zUGF0aEV4aXN0cyA/IGF3YWl0IHJlc29sdmVGc0V4dGVuc2lvbnMoRVhURU5TSU9OU19QQVRIKSA6IG5ldyBNYXAoKTtcclxuXHRcdGNvbnN0IG1vZHVsZUV4dGVuc2lvbnMgPSBhd2FpdCByZXNvbHZlTW9kdWxlRXh0ZW5zaW9ucyhBUElfUEFUSCk7XHJcblxyXG5cdFx0Y29uc3QgcmVnaXN0cnlFeHRlbnNpb25zID0gZXh0ZW5zaW9uc1BhdGhFeGlzdHNcclxuXHRcdFx0PyBhd2FpdCByZXNvbHZlRnNFeHRlbnNpb25zKHBhdGguam9pbihFWFRFTlNJT05TX1BBVEgsICcucmVnaXN0cnknKSlcclxuXHRcdFx0OiBuZXcgTWFwKCk7XHJcblxyXG5cdFx0Y29uc3QgbW9ja1NldHRpbmcgPSAoc291cmNlLCBmb2xkZXIsIGV4dGVuc2lvbikgPT4ge1xyXG5cdFx0XHRjb25zdCBzZXR0aW5ncyA9IFtcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHRpZDogZXh0ZW5zaW9uLm5hbWUsXHJcblx0XHRcdFx0XHRlbmFibGVkOiB0cnVlLFxyXG5cdFx0XHRcdFx0Zm9sZGVyOiBmb2xkZXIsXHJcblx0XHRcdFx0XHRidW5kbGU6IG51bGwsXHJcblx0XHRcdFx0XHRzb3VyY2U6IHNvdXJjZSxcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRdO1xyXG5cclxuXHRcdFx0aWYgKGV4dGVuc2lvbi50eXBlID09PSAnYnVuZGxlJykge1xyXG5cdFx0XHRcdHNldHRpbmdzLnB1c2goXHJcblx0XHRcdFx0XHQuLi5leHRlbnNpb24uZW50cmllcy5tYXAoKGVudHJ5KSA9PiAoe1xyXG5cdFx0XHRcdFx0XHRlbmFibGVkOiB0cnVlLFxyXG5cdFx0XHRcdFx0XHRmb2xkZXI6IGVudHJ5Lm5hbWUsXHJcblx0XHRcdFx0XHRcdGJ1bmRsZTogZXh0ZW5zaW9uLm5hbWUsXHJcblx0XHRcdFx0XHRcdHNvdXJjZTogc291cmNlLFxyXG5cdFx0XHRcdFx0fSkpLFxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBzZXR0aW5ncztcclxuXHRcdH07XHJcblxyXG5cdFx0Ly8gZGVmYXVsdCB0byBlbmFibGVkIGZvciBhcHAgZXh0ZW5zaW9uIGluIGRldmVsb3BlciBtb2RlXHJcblx0XHRjb25zdCBleHRlbnNpb25TZXR0aW5ncyA9IFtcclxuXHRcdFx0Li4uQXJyYXkuZnJvbShsb2NhbEV4dGVuc2lvbnMuZW50cmllcygpKS5mbGF0TWFwKChbZm9sZGVyLCBleHRlbnNpb25dKSA9PlxyXG5cdFx0XHRcdG1vY2tTZXR0aW5nKCdsb2NhbCcsIGZvbGRlciwgZXh0ZW5zaW9uKSxcclxuXHRcdFx0KSxcclxuXHRcdFx0Li4uQXJyYXkuZnJvbShtb2R1bGVFeHRlbnNpb25zLmVudHJpZXMoKSkuZmxhdE1hcCgoW2ZvbGRlciwgZXh0ZW5zaW9uXSkgPT5cclxuXHRcdFx0XHRtb2NrU2V0dGluZygnbW9kdWxlJywgZm9sZGVyLCBleHRlbnNpb24pLFxyXG5cdFx0XHQpLFxyXG5cdFx0XHQuLi5BcnJheS5mcm9tKHJlZ2lzdHJ5RXh0ZW5zaW9ucy5lbnRyaWVzKCkpLmZsYXRNYXAoKFtmb2xkZXIsIGV4dGVuc2lvbl0pID0+XHJcblx0XHRcdFx0bW9ja1NldHRpbmcoJ3JlZ2lzdHJ5JywgZm9sZGVyLCBleHRlbnNpb24pLFxyXG5cdFx0XHQpLFxyXG5cdFx0XTtcclxuXHJcblx0XHRleHRlbnNpb25zRW50cnlwb2ludCA9IGdlbmVyYXRlRXh0ZW5zaW9uc0VudHJ5cG9pbnQoXHJcblx0XHRcdHsgbW9kdWxlOiBtb2R1bGVFeHRlbnNpb25zLCBsb2NhbDogbG9jYWxFeHRlbnNpb25zLCByZWdpc3RyeTogcmVnaXN0cnlFeHRlbnNpb25zIH0sXHJcblx0XHRcdGV4dGVuc2lvblNldHRpbmdzLFxyXG5cdFx0KTtcclxuXHR9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyVyxTQUFTLHVCQUF1QjtBQUMzWSxTQUFTLDhCQUE4QixxQkFBcUIsK0JBQStCO0FBQzNGLE9BQU8sVUFBVTtBQUNqQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLFNBQVM7QUFDaEIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsOEJBQThCO0FBQ3ZDLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8saUJBQWlCO0FBVHhCLElBQU0sbUNBQW1DO0FBV3pDLElBQU0sV0FBVyxLQUFLLEtBQUssTUFBTSxLQUFLO0FBT3RDLElBQU0sa0JBQWtCLEtBQUssS0FBSyxVQUFVLFlBQVk7QUFFeEQsSUFBTSx1QkFBdUIsR0FBRyxXQUFXLGVBQWU7QUFHMUQsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsS0FBSztBQUFBLElBQ0oscUJBQXFCO0FBQUEsTUFDcEIsTUFBTTtBQUFBLFFBQ0wsS0FBSztBQUFBLE1BQ047QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1IsbUJBQW1CO0FBQUEsSUFDbkIsSUFBSTtBQUFBLElBQ0osV0FBVztBQUFBLElBQ1gsS0FBSztBQUFBLE1BQ0osVUFBVSxNQUFNO0FBQ2YsZUFBTyxTQUFTLE9BQU8sQ0FBQyxJQUFJO0FBQUEsTUFDN0I7QUFBQSxJQUNELENBQUM7QUFBQSxJQUNEO0FBQUEsTUFDQyxNQUFNO0FBQUEsTUFDTixpQkFBaUIsQ0FBQyxXQUFXO0FBQzVCLGVBQU8sUUFBUSxVQUFVO0FBQUEsVUFDeEIsR0FBRyxPQUFPLFFBQVE7QUFBQSxVQUNsQixTQUFTLENBQUMsbUNBQW1DLFlBQVk7QUFBQSxRQUMxRDtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUEsSUFDQSxZQUFZO0FBQUEsRUFDYjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ1AseUJBQXlCO0FBQUEsRUFDMUI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNSLE9BQU8sQ0FBQyxFQUFFLE1BQU0sS0FBSyxhQUFhLEtBQUssUUFBUSxrQ0FBVyxLQUFLLEVBQUUsQ0FBQztBQUFBLEVBQ25FO0FBQUEsRUFDQSxNQUFNLFFBQVEsSUFBSSxhQUFhLGVBQWUsS0FBSztBQUFBLEVBQ25ELEdBQUksQ0FBQyxRQUFRLElBQUksWUFBWTtBQUFBLElBQzVCLFFBQVE7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNOLGVBQWU7QUFBQSxVQUNkLFFBQVEsUUFBUSxJQUFJLFVBQVUsUUFBUSxJQUFJLFVBQVU7QUFBQSxVQUNwRCxjQUFjO0FBQUEsUUFDZjtBQUFBLFFBQ0EsbUJBQW1CO0FBQUEsVUFDbEIsUUFBUSxRQUFRLElBQUksVUFBVSxRQUFRLElBQUksVUFBVTtBQUFBLFVBQ3BELGNBQWM7QUFBQSxRQUNmO0FBQUEsTUFDRDtBQUFBLE1BQ0EsSUFBSTtBQUFBLFFBQ0gsT0FBTyxDQUFDLHVCQUF1QixRQUFRLElBQUksQ0FBQyxHQUFHLEdBQUcsdUJBQXVCLENBQUM7QUFBQSxNQUMzRTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDTCxhQUFhO0FBQUEsSUFDYixNQUFNO0FBQUEsTUFDTCxXQUFXO0FBQUEsUUFDVixLQUFLO0FBQUEsVUFDSixTQUFTLENBQUMsU0FBUyxLQUFLO0FBQUEsUUFDekI7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFDRCxDQUFDO0FBRUQsU0FBUyx5QkFBeUI7QUFDakMsU0FBTyx1QkFDSixHQUNDLFlBQVksZUFBZSxFQUMzQixRQUFRLENBQUMsWUFBWTtBQUNyQixVQUFNLG1CQUFtQixLQUFLLEtBQUssaUJBQWlCLE9BQU87QUFDM0QsUUFBSSxDQUFDLEdBQUcsU0FBUyxnQkFBZ0IsRUFBRSxZQUFZLEVBQUc7QUFDbEQsV0FBTyxHQUFHLFlBQVksZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxhQUFhLEtBQUssS0FBSyxrQkFBa0IsR0FBRyxDQUFDLENBQUM7QUFBQSxFQUN2RyxDQUFDLEVBQ0EsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUNoQixDQUFDO0FBQ0w7QUFFQSxTQUFTLHFCQUFxQjtBQUM3QixRQUFNLHNCQUFzQjtBQUU1QixNQUFJLHVCQUF1QjtBQUUzQixTQUFPO0FBQUEsSUFDTjtBQUFBLE1BQ0MsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsUUFBUSxPQUFPO0FBQUEsUUFDZCxjQUFjO0FBQUEsVUFDYixTQUFTO0FBQUEsUUFDVjtBQUFBLE1BQ0Q7QUFBQSxNQUNBLE1BQU0sYUFBYTtBQUNsQixjQUFNLGVBQWU7QUFBQSxNQUN0QjtBQUFBLE1BQ0EsVUFBVSxJQUFJO0FBQ2IsWUFBSSxPQUFPLHFCQUFxQjtBQUMvQixpQkFBTztBQUFBLFFBQ1I7QUFBQSxNQUNEO0FBQUEsTUFDQSxLQUFLLElBQUk7QUFDUixZQUFJLE9BQU8scUJBQXFCO0FBQy9CLGlCQUFPO0FBQUEsUUFDUjtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUEsSUFDQTtBQUFBLE1BQ0MsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsUUFBUSxPQUFPO0FBQUEsUUFDZCxPQUFPO0FBQUEsVUFDTixlQUFlO0FBQUEsWUFDZCxPQUFPO0FBQUEsY0FDTixPQUFPLEtBQUssUUFBUSxrQ0FBVyxZQUFZO0FBQUEsY0FDM0MsR0FBRyxnQkFBZ0IsT0FBTyxDQUFDLEtBQUssU0FBUyxFQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksUUFBUSxPQUFPLEdBQUcsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUM7QUFBQSxZQUN6RjtBQUFBLFlBQ0EsUUFBUTtBQUFBLGNBQ1AsZ0JBQWdCO0FBQUEsWUFDakI7QUFBQSxZQUNBLFVBQVUsQ0FBQyxtQkFBbUI7QUFBQSxZQUM5Qix5QkFBeUI7QUFBQSxVQUMxQjtBQUFBLFFBQ0Q7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFFQSxpQkFBZSxpQkFBaUI7QUFDL0IsVUFBTSxrQkFBa0IsdUJBQXVCLE1BQU0sb0JBQW9CLGVBQWUsSUFBSSxvQkFBSSxJQUFJO0FBQ3BHLFVBQU0sbUJBQW1CLE1BQU0sd0JBQXdCLFFBQVE7QUFFL0QsVUFBTSxxQkFBcUIsdUJBQ3hCLE1BQU0sb0JBQW9CLEtBQUssS0FBSyxpQkFBaUIsV0FBVyxDQUFDLElBQ2pFLG9CQUFJLElBQUk7QUFFWCxVQUFNLGNBQWMsQ0FBQyxRQUFRLFFBQVEsY0FBYztBQUNsRCxZQUFNLFdBQVc7QUFBQSxRQUNoQjtBQUFBLFVBQ0MsSUFBSSxVQUFVO0FBQUEsVUFDZCxTQUFTO0FBQUEsVUFDVDtBQUFBLFVBQ0EsUUFBUTtBQUFBLFVBQ1I7QUFBQSxRQUNEO0FBQUEsTUFDRDtBQUVBLFVBQUksVUFBVSxTQUFTLFVBQVU7QUFDaEMsaUJBQVM7QUFBQSxVQUNSLEdBQUcsVUFBVSxRQUFRLElBQUksQ0FBQyxXQUFXO0FBQUEsWUFDcEMsU0FBUztBQUFBLFlBQ1QsUUFBUSxNQUFNO0FBQUEsWUFDZCxRQUFRLFVBQVU7QUFBQSxZQUNsQjtBQUFBLFVBQ0QsRUFBRTtBQUFBLFFBQ0g7QUFBQSxNQUNEO0FBRUEsYUFBTztBQUFBLElBQ1I7QUFHQSxVQUFNLG9CQUFvQjtBQUFBLE1BQ3pCLEdBQUcsTUFBTSxLQUFLLGdCQUFnQixRQUFRLENBQUMsRUFBRTtBQUFBLFFBQVEsQ0FBQyxDQUFDLFFBQVEsU0FBUyxNQUNuRSxZQUFZLFNBQVMsUUFBUSxTQUFTO0FBQUEsTUFDdkM7QUFBQSxNQUNBLEdBQUcsTUFBTSxLQUFLLGlCQUFpQixRQUFRLENBQUMsRUFBRTtBQUFBLFFBQVEsQ0FBQyxDQUFDLFFBQVEsU0FBUyxNQUNwRSxZQUFZLFVBQVUsUUFBUSxTQUFTO0FBQUEsTUFDeEM7QUFBQSxNQUNBLEdBQUcsTUFBTSxLQUFLLG1CQUFtQixRQUFRLENBQUMsRUFBRTtBQUFBLFFBQVEsQ0FBQyxDQUFDLFFBQVEsU0FBUyxNQUN0RSxZQUFZLFlBQVksUUFBUSxTQUFTO0FBQUEsTUFDMUM7QUFBQSxJQUNEO0FBRUEsMkJBQXVCO0FBQUEsTUFDdEIsRUFBRSxRQUFRLGtCQUFrQixPQUFPLGlCQUFpQixVQUFVLG1CQUFtQjtBQUFBLE1BQ2pGO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFDRDsiLAogICJuYW1lcyI6IFtdCn0K
