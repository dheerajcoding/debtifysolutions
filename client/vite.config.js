import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// /api, /sitemap.xml and /robots.txt are proxied to Express in development.
// @shared is the config + content both the server and the client read.
const api = process.env.VITE_API_TARGET || "http://localhost:5000";
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@shared": path.resolve(__dirname, "../shared") } },
  build: { rollupOptions: { output: { manualChunks: { react: ["react", "react-dom", "react-router-dom"] } } } },
  server: {
    port: 5173,
    fs: { allow: [".."] },
    proxy: { "/api": { target: api, changeOrigin: true }, "/sitemap.xml": api, "/robots.txt": api },
  },
});
