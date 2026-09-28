import { defineConfig } from "vitest/config";

// Real OpenAI calls with the key from apps/server/.env. Local only: the main config's
// include (test/**/*.test.ts) does not match *.live.ts, so CI never runs this.
export default defineConfig({
  test: {
    include: ["test/live/**/*.live.ts"],
    setupFiles: ["./test/support/setup.ts"],
    testTimeout: 60_000,
  },
});
