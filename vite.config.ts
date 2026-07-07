import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// GitHub Pages serves this project at https://nandiraju.github.io/oncopd/
// so production assets must resolve under /oncopd/. Dev/preview stay at root.
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/oncopd/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
}));
