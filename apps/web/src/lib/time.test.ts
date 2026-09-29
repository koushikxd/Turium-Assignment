import { describe, expect, it } from "vitest";

import { timeAgo } from "@/lib/time";

const now = new Date("2026-09-29T12:00:00Z");
const ago = (ms: number) => timeAgo(new Date(now.getTime() - ms), now);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("timeAgo", () => {
  it("says just now for the first few seconds", () => {
    expect(ago(0)).toBe("just now");
    expect(ago(9 * SECOND)).toBe("just now");
  });

  it("treats a future date (clock skew) as just now", () => {
    expect(ago(-5 * SECOND)).toBe("just now");
  });

  it("counts seconds under a minute", () => {
    expect(ago(10 * SECOND)).toBe("10 sec ago");
    expect(ago(59 * SECOND)).toBe("59 sec ago");
  });

  it("counts minutes under an hour", () => {
    expect(ago(MINUTE)).toBe("1 min ago");
    expect(ago(59 * MINUTE + 59 * SECOND)).toBe("59 min ago");
  });

  it("counts hours under a day", () => {
    expect(ago(HOUR)).toBe("1 hr ago");
    expect(ago(23 * HOUR)).toBe("23 hr ago");
  });

  it("says yesterday, then days under a week", () => {
    expect(ago(DAY)).toBe("yesterday");
    expect(ago(6 * DAY)).toBe("6 days ago");
  });

  it("falls back to a date after a week", () => {
    expect(ago(7 * DAY)).not.toMatch(/ago|yesterday/);
  });
});
