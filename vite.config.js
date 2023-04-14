import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    historyApiFallback: true,
    hot: true,
  },
  base: "/",
  root: ".", // Change this line back to "."
  publicDir: "public", // Add this line
});
