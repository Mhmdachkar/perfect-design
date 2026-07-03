import { describe, it, expect } from "vitest";
import { whatsappChatUrl } from "@/lib/whatsapp";

describe("whatsappChatUrl", () => {
  it("strips non-digits and builds wa.me link", () => {
    expect(whatsappChatUrl("+961 3 123 456")).toBe("https://wa.me/9613123456");
  });

  it("returns empty string for invalid input", () => {
    expect(whatsappChatUrl("")).toBe("");
    expect(whatsappChatUrl("abc")).toBe("");
  });
});
