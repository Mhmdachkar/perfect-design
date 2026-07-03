import { describe, it, expect, beforeEach } from "vitest";
import i18n from "@/lib/i18n";
import { activityLabel, groupActivityByDate } from "@/lib/activity-labels";

describe("activityLabel", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("labels client creation in English", () => {
    expect(
      activityLabel({
        action: "clients.created",
        entity_type: "clients",
        entity_name: "Ahmad Hassan",
      }),
    ).toContain("Ahmad Hassan");
    expect(
      activityLabel({
        action: "clients.created",
        entity_type: "clients",
        entity_name: "Ahmad Hassan",
      }),
    ).toMatch(/created/i);
  });

  it("labels client creation in Arabic", async () => {
    await i18n.changeLanguage("ar");
    const label = activityLabel({
      action: "clients.created",
      entity_type: "clients",
      entity_name: "Ahmad Hassan",
    });
    expect(label).toContain("Ahmad Hassan");
    expect(label).toMatch(/تم إنشاء/);
  });

  it("labels payment received with amount", () => {
    const label = activityLabel({
      action: "payments.created",
      entity_type: "payments",
      new_values: { amount: 500, currency: "USD" },
    });
    expect(label).toMatch(/500|Payment/);
  });

  it("labels workshop status change with translated status", async () => {
    await i18n.changeLanguage("ar");
    const label = activityLabel({
      action: "workshops.updated",
      entity_type: "workshops",
      entity_name: "Curtains",
      prev_values: { workflow_status: "planning" },
      new_values: { workflow_status: "in_progress" },
    });
    expect(label).toContain("Curtains");
    expect(label).toMatch(/قيد التنفيذ/);
  });

  it("falls back for unknown actions", () => {
    const label = activityLabel({
      action: "unknown.action",
      entity_type: "custom_entity",
    });
    expect(label).toContain("custom entity");
  });
});

describe("groupActivityByDate", () => {
  it("groups items by date descending", () => {
    const groups = groupActivityByDate([
      { id: "1", created_at: "2026-01-01T10:00:00Z" },
      { id: "2", created_at: "2026-01-02T10:00:00Z" },
      { id: "3", created_at: "2026-01-01T12:00:00Z" },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].date).toBe("2026-01-02");
    expect(groups[0].items).toHaveLength(1);
    expect(groups[1].items).toHaveLength(2);
  });
});
