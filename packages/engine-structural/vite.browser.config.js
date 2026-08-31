import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/browser.ts"),
      formats: ["es"],
      fileName: "structural-engine",
    },
    outDir: "dist-browser",
    emptyOutDir: true,
    sourcemap: true,
  },
});
