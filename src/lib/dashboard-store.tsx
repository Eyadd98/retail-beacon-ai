import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CsvRow = {
  date: string;
  revenue: number;
  orders: number;
  category: string;
  region?: string;
};

type DashboardContextValue = {
  rows: CsvRow[] | null;
  setRows: (rows: CsvRow[] | null) => void;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<CsvRow[] | null>(null);
  const value = useMemo(() => ({ rows, setRows }), [rows]);
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardData() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboardData must be used within DashboardProvider");
  return ctx;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function deriveMetrics(rows: CsvRow[]) {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  const aov = totalOrders ? totalRevenue / totalOrders : 0;
  const categories = new Set(rows.map((r) => r.category)).size;

  const byDay = new Map<string, { revenue: number; orders: number; key: number; label: string }>();
  rows.forEach((r) => {
    const d = new Date(r.date);
    if (isNaN(d.getTime())) return;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
    const cur = byDay.get(iso) ?? { revenue: 0, orders: 0, key: d.getTime(), label };
    cur.revenue += r.revenue;
    cur.orders += r.orders;
    byDay.set(iso, cur);
  });
  const salesOverTime = Array.from(byDay.values())
    .sort((a, b) => a.key - b.key)
    .map((v) => ({ date: v.label, revenue: v.revenue, orders: v.orders }));

  const byCat = new Map<string, number>();
  rows.forEach((r) => byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.revenue));
  const revenueByCategory = Array.from(byCat.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const byRegion = new Map<string, number>();
  rows.forEach((r) => {
    if (!r.region) return;
    byRegion.set(r.region, (byRegion.get(r.region) ?? 0) + r.revenue);
  });
  const revenueByRegion = Array.from(byRegion.entries())
    .map(([region, revenue]) => ({ region, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const fmtCurrency = (n: number) =>
    `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const kpis = [
    { label: "Total Revenue", value: fmtCurrency(totalRevenue), delta: `${rows.length} rows`, positive: true },
    { label: "Total Orders", value: totalOrders.toLocaleString(), delta: `${categories} categories`, positive: true },
    { label: "Avg Order Value", value: fmtCurrency(aov), delta: "per order", positive: true },
    { label: "Top Category", value: revenueByCategory[0]?.category ?? "—", delta: fmtCurrency(revenueByCategory[0]?.revenue ?? 0), positive: true },
  ];

  const top = revenueByCategory[0];
  const topPct = top && totalRevenue ? Math.round((top.revenue / totalRevenue) * 100) : 0;
  const topRegion = revenueByRegion[0];

  const insights = [
    `Total revenue reached ${fmtCurrency(totalRevenue)} across ${totalOrders.toLocaleString()} total orders.`,
    top
      ? `${top.category} is driving performance, making up ${topPct}% of total revenue.`
      : `No category data available to highlight a leader.`,
    topRegion
      ? `The highest performing region was ${topRegion.region} with ${fmtCurrency(topRegion.revenue)} in sales.`
      : `Add a "Region" column to your CSV to surface regional performance.`,
  ];

  return { kpis, salesOverTime, revenueByCategory, revenueByRegion, insights };
}