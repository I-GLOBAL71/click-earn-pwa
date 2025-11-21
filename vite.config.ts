import { defineConfig } from "vite";
import path from "path";
// Removed lovable-tagger to avoid injecting Lovable branding in dev

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 3000,
  },
  plugins: [],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
