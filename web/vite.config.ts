import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    // Dev proxy so the SPA can call the Express backend on :3000 without CORS.
    // In production Vercel serves the static bundle and /api/* | /webhooks/* via serverless.
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
      "/webhooks": { target: "http://localhost:3000", changeOrigin: true },
      "/health": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Split the heaviest third-party libs into their own long-lived cached
    // chunks so they don't invalidate every time app code changes.
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":  ["react", "react-dom", "react-router-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-maps":   ["react-simple-maps", "d3-geo"],
          "vendor-ui":     ["lucide-react", "class-variance-authority", "clsx", "tailwind-merge"]
        }
      }
    },
    // Raise the warn threshold — with manualChunks + lazy routes the
    // remaining chunks are sensibly sized; Vite's default 500KB warn
    // is too noisy for a rich SaaS app.
    chunkSizeWarningLimit: 700
  }
}));
