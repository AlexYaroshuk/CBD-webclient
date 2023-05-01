import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    hot: true,
  },
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "",
    rollupOptions: {
      input: "public/assets",
    },
  },
  root: ".",
  publicDir: "public",
});
