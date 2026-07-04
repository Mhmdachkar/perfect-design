import { describe, expect, it } from "vitest";
import { isBrowserOnline, isRetryableNetworkError } from "./network";

describe("offline network helpers", () => {
  it("treats fetch failures as retryable", () => {
    expect(isRetryableNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isRetryableNetworkError(new Error("Request timed out"))).toBe(true);
  });

  it("does not treat validation errors as retryable", () => {
    expect(isRetryableNetworkError(new Error("duplicate key value violates unique constraint"))).toBe(false);
  });

  it("reads browser online state", () => {
    expect(typeof isBrowserOnline()).toBe("boolean");
  });
});
