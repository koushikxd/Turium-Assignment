import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/support/setup.ts"],
    reporters: ["default", "junit"],
    outputFile: { junit: "./test-results/junit.xml" },
  },
});
