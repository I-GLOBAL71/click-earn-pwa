import { defineConfig, loadEnv } from "vite";
import path from "path";
// Removed lovable-tagger to avoid injecting Lovable branding in dev

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_BASE_URL || env.VITE_API_URL || env.APP_PUBLIC_URL || "";

  return {
    server: {
      host: "localhost",
      port: 3000,
      hmr: {
        overlay: false,
      },
      proxy: apiTarget
        ? {
            "/api": {
              target: apiTarget,
              changeOrigin: true,
              secure: true,
            },
          }
        : undefined,
    },
    plugins: [],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      exclude: [
        "@neondatabase/serverless",
        "firebase-admin",
        "@vercel/node",
        "vercel",
      ],
    },
    build: {
      rollupOptions: {
        external: [
          "@neondatabase/serverless",
          "firebase-admin",
          "@vercel/node",
          "vercel",
        ],
      },
    },
  };
});
