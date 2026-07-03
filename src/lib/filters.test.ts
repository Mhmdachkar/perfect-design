import { describe, it, expect } from "vitest";
import { applyTextFilter, applyFilterState } from "@/lib/filters";

describe("applyTextFilter", () => {
  const items = [
    { name: "Alice", city: "Beirut" },
    { name: "Bob", city: "Tripoli" },
  ];

  it("returns all items when query is empty", () => {
    expect(applyTextFilter(items, "", ["name"])).toHaveLength(2);
    expect(applyTextFilter(items, "  ", ["name"])).toHaveLength(2);
  });

  it("filters by field substring case-insensitively", () => {
    expect(applyTextFilter(items, "beirut", ["city"])).toEqual([items[0]]);
    expect(applyTextFilter(items, "BOB", ["name"])).toEqual([items[1]]);
  });
});

describe("applyFilterState", () => {
  const items = [
    { status: "paid", currency: "USD" },
    { status: "pending", currency: "LBP" },
  ];

  it("ignores all or empty filter values", () => {
    expect(applyFilterState(items, { status: "all", currency: "" })).toHaveLength(2);
  });

  it("applies exact match filters", () => {
    expect(applyFilterState(items, { status: "paid" })).toEqual([items[0]]);
    expect(applyFilterState(items, { currency: "LBP" })).toEqual([items[1]]);
  });
});
