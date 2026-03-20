import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    // Proxy all /api/* calls to your agri-backend during development
    // This prevents CORS errors and keeps your backend URL in one place
    proxy: {
      "/api": {
        target: "https://kishanai.onrender.com",
        changeOrigin: true,
        // Uncomment to see proxy logs:
        // configure: (proxy) => { proxy.on("proxyReq", (r) => console.log("PROXY →", r.path)); }
      },
    },
  },
  // Production: set VITE_BACKEND_URL env var and update config.js
  // define: { __BACKEND_URL__: JSON.stringify(process.env.VITE_BACKEND_URL) }
});
