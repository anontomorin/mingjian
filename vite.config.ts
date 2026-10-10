import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 明鉴：纯前端应用，构建为可静态部署的产物。
// 若部署在非根路径（如 https://xxx.github.io/mingjian/），
// 请把 base 改为 "/mingjian/"，否则保持 "/" 即可。
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
