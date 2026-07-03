export type DashboardWidget = {
  widget: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible?: boolean;
};

export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidget[] = [
  { widget: "stat_total_clients", x: 0, y: 0, w: 1, h: 1, visible: true },
  { widget: "stat_total_workshops", x: 1, y: 0, w: 1, h: 1, visible: true },
  { widget: "stat_revenue", x: 2, y: 0, w: 1, h: 1, visible: true },
  { widget: "stat_received", x: 3, y: 0, w: 1, h: 1, visible: true },
  { widget: "stat_outstanding", x: 0, y: 1, w: 1, h: 1, visible: true },
  { widget: "stat_today_payments", x: 1, y: 1, w: 1, h: 1, visible: true },
  { widget: "stat_month_revenue", x: 2, y: 1, w: 1, h: 1, visible: true },
  { widget: "stat_profit", x: 3, y: 1, w: 1, h: 1, visible: true },
  { widget: "chart_revenue", x: 0, y: 2, w: 4, h: 2, visible: true },
  { widget: "upcoming_workshops", x: 0, y: 4, w: 2, h: 2, visible: true },
  { widget: "latest_payments", x: 2, y: 4, w: 2, h: 2, visible: true },
  { widget: "latest_expenses", x: 0, y: 6, w: 2, h: 2, visible: true },
  { widget: "kpi_glance", x: 2, y: 6, w: 2, h: 2, visible: true },
];

export const WIDGET_IDS = new Set(DEFAULT_DASHBOARD_LAYOUT.map((w) => w.widget));

export function parseDashboardLayout(raw: unknown): DashboardWidget[] {
  if (!Array.isArray(raw)) return DEFAULT_DASHBOARD_LAYOUT;
  return raw
    .filter((w): w is DashboardWidget => typeof w === "object" && w !== null && "widget" in w)
    .filter((w) => WIDGET_IDS.has(w.widget))
    .map((w) => ({ ...w, visible: w.visible !== false }));
}

export function visibleWidgets(layout: DashboardWidget[]): DashboardWidget[] {
  return layout.filter((w) => w.visible !== false);
}
