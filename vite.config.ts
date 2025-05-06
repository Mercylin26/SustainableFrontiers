import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"), // Define the root of the client folder
  build: {
    outDir: path.resolve(__dirname, "dist/public"), // Build output folder for public files
    emptyOutDir: true, // Ensure the output directory is emptied before building
    target: 'esnext', // Ensure compatibility with modern JS and ES Modules
    rollupOptions: {
      external: ['express', 'path', 'fs'],  // Exclude backend modules from the frontend bundle
    },
  },
});
