import { describe, it, expect } from "vitest";
import {
  findWorkshopProduct,
  validateWorkshopProduct,
  buildOptionsSnapshot,
  emptyProductFormState,
} from "@/lib/workshop-measurements";

describe("validateWorkshopProduct", () => {
  it("requires product selection", () => {
    expect(validateWorkshopProduct(undefined, emptyProductFormState())).toBe("workshopProduct.productRequired");
  });

  it("requires PP preset measurement", () => {
    const product = findWorkshopProduct("pp-printing")!;
    expect(validateWorkshopProduct(product, { ...emptyProductFormState(), productId: "pp-printing", groupId: "printing-pp" })).toBe(
      "workshopProduct.measurementRequired",
    );
  });

  it("requires free-text dimensions for flex", () => {
    const product = findWorkshopProduct("flex")!;
    expect(validateWorkshopProduct(product, { ...emptyProductFormState(), productId: "flex", groupId: "printing-flex" })).toBe(
      "workshopProduct.customMeasurementRequired",
    );
  });

  it("builds options snapshot with measurement and cover", () => {
    const product = findWorkshopProduct("pp-printing")!;
    const state = {
      ...emptyProductFormState(),
      productId: "pp-printing",
      groupId: "printing-pp",
      measurement: "30×40 cm",
    };
    expect(buildOptionsSnapshot(product, state)).toEqual({
      productId: "pp-printing",
      measurement: "30×40 cm",
    });
  });

  it("allows optional custom measurement for products without required dimensions", () => {
    const product = findWorkshopProduct("curtain-blackout")!;
    const state = {
      ...emptyProductFormState(),
      productId: "curtain-blackout",
      groupId: "curtains-store",
      cover: "With Cover",
      customMeasurement: "280×260 cm",
    };
    expect(validateWorkshopProduct(product, state)).toBeNull();
  });
});
