import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./"  ->  WAJIB untuk Capacitor: asset di-load via path relatif (file://)
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
