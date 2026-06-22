import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000";
const apiProxy = {
  "/api": {
    target: apiProxyTarget,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host,
    port,
    proxy: apiProxy,
  },
  preview: {
    host,
    port,
    proxy: apiProxy,
  },
});
