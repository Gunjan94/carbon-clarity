import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Backend default port is 8077 (8000 is often taken). Proxy /api -> backend.
const BACKEND = process.env.VITE_BACKEND_URL || "http://localhost:8077";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
