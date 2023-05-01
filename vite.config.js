import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import copy from "vite-plugin-copy";

export default defineConfig({
  plugins: [
    vue(),
    copy({
      targets: [
        {
          src: "public/assets/*",
          dest: "dist/assets",
        },
      ],
      hook: "writeBundle", // default
    }),
  ],
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
