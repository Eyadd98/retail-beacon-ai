import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CsvRow = {
  date: string;
  revenue: number;
  orders: number;
  category: string;
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

  const byMonth = new Map<string, { revenue: number; orders: number; key: number }>();
  rows.forEach((r) => {
    const d = new Date(r.date);
    if (isNaN(d.getTime())) return;
    const key = d.getFullYear() * 12 + d.getMonth();
    const label = `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
    const cur = byMonth.get(label) ?? { revenue: 0, orders: 0, key };
    cur.revenue += r.revenue;
    cur.orders += r.orders;
    byMonth.set(label, cur);
  });
  const salesOverTime = Array.from(byMonth.entries())
    .sort((a, b) => a[1].key - b[1].key)
    .map(([month, v]) => ({ month, revenue: v.revenue, orders: v.orders }));

  const byCat = new Map<string, number>();
  rows.forEach((r) => byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.revenue));
  const revenueByCategory = Array.from(byCat.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const fmtCurrency = (n: number) =>
    `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const kpis = [
    { label: "Total Revenue", value: fmtCurrency(totalRevenue), delta: `${rows.length} rows`, positive: true },
    { label: "Total Orders", value: totalOrders.toLocaleString(), delta: `${categories} categories`, positive: true },
    { label: "Avg Order Value", value: fmtCurrency(aov), delta: "per order", positive: true },
    { label: "Top Category", value: revenueByCategory[0]?.category ?? "—", delta: fmtCurrency(revenueByCategory[0]?.revenue ?? 0), positive: true },
  ];

  return { kpis, salesOverTime, revenueByCategory };
}