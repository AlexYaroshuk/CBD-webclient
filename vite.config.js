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
  },
  root: ".",
  publicDir: "public",
});