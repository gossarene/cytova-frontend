import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: [
      "golab-medical.cytova.io",
      "veno-lab.cytova.io",
      "ora-lab.cytova.io",
      "bero-lab.cytova.io",
      "tero-lab.cytova.io",
      "pero-lab.cytova.io",
      "kero-lab.cytova.io",
    ],
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
