import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = Number(process.env.PORT || 3000);
const allowedHosts = [
  "stemstudio.up.railway.app",
  process.env.RAILWAY_PUBLIC_DOMAIN,
].filter(Boolean) as string[];

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port,
    allowedHosts,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port,
    allowedHosts,
  },
});
