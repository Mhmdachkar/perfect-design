/** Chart colors aligned with design tokens in styles.css */
export const chartTheme = {
  revenue: "var(--chart-1)",
  expenses: "var(--destructive)",
  profit: "var(--chart-2)",
  palette: [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--destructive)",
  ],
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
} as const;
