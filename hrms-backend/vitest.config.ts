import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Unit tests only, by design — pure business logic with model/cache
    // dependencies mocked out (see each *.test.ts for what's mocked and
    // why). No live MongoDB connection is opened by this suite.
    globals: false,
  },
});
