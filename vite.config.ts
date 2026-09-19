import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Custom domain (adamostberg.com) is served from the root, so base stays "/".
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
});
