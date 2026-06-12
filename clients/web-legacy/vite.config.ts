/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 4200,
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
