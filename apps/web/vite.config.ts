import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8888",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  // `vite preview` reuses server.proxy and strictPort, but not the port.
  preview: { port: 3000 },
});
