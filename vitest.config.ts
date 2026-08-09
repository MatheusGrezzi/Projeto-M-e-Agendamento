import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // The real package throws unconditionally outside Next.js's RSC
      // resolution — swap in its no-op "react-server" build for tests.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
});
