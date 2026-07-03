import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import i18n from "@/lib/i18n";
import { StatusPill } from "@/components/status-pill";

describe("StatusPill", () => {
  it("renders translated workflow status in English", () => {
    render(<StatusPill status="in_progress" kind="workflow" />);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  it("renders translated financial status in Arabic", async () => {
    await i18n.changeLanguage("ar");
    render(<StatusPill status="paid" kind="financial" />);
    expect(screen.getByText(/مدفوعة/)).toBeInTheDocument();
    await i18n.changeLanguage("en");
  });
});
