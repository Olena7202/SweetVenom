import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "VITE_");
  const base = mode === "demo" ? "/SweetVenom/" : "/";
  const apiTarget = env.VITE_API_TARGET || "http://127.0.0.1:5023";

  return {
    base,
    plugins: [
      {
        name: "public-image-paths",
        enforce: "pre",
        transform(code, id) {
          if (base === "/" || !/[/\\]src[/\\].*\.(jsx?|css)$/.test(id)) return;
          return { code: code.replaceAll("/images/", base + "images/"), map: null };
        },
      },
      react(),
    ],
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
