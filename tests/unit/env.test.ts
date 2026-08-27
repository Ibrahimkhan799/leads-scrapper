import { afterEach, describe, expect, it } from "vitest";
import { inlineJobsEnabled, isFalsy, isTruthy } from "@/lib/env";

const original = process.env.INLINE_JOBS;

afterEach(() => {
  if (original === undefined) delete process.env.INLINE_JOBS;
  else process.env.INLINE_JOBS = original;
});

describe("env flags", () => {
  it("treats common truthy strings as true", () => {
    expect(isTruthy("true")).toBe(true);
    expect(isTruthy("1")).toBe(true);
    expect(isTruthy("yes")).toBe(true);
    expect(isFalsy("false")).toBe(true);
    expect(isFalsy("0")).toBe(true);
  });

  it("defaults inline jobs on so first-time setup does not need Redis", () => {
    delete process.env.INLINE_JOBS;
    expect(inlineJobsEnabled()).toBe(true);
  });

  it("can disable inline jobs explicitly", () => {
    process.env.INLINE_JOBS = "false";
    expect(inlineJobsEnabled()).toBe(false);
  });
});
