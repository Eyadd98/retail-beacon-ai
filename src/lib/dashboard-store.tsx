import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CsvRow = {
  date: string;
  revenue: number;
  orders: number;
  category: string;
  region?: string;
};

export type RawRow = Record<string, string>;

const COLUMN_ALIASES: Record<keyof CsvRow, string[]> = {
  date: ["date", "day", "timestamp", "order date", "created", "created_at", "month"],
  revenue: ["revenue", "sales", "total", "amount", "total sales", "gross", "income"],
  orders: ["orders", "order count", "transactions", "quantity", "qty", "count", "units"],
  category: ["category", "product category", "type", "segment", "product", "department"],
  region: ["region", "country", "state", "location", "area", "market", "territory"],
};

export function findColumn(headers: string[], key: keyof CsvRow): string | undefined {
  const lowered = headers.map((h) => h.trim().toLowerCase());
  for (const alias of COLUMN_ALIASES[key]) {
    const idx = lowered.indexOf(alias);
    if (idx !== -1) return headers[idx];
    const partial = lowered.findIndex((h) => h.includes(alias));
    if (partial !== -1) return headers[partial];
  }
  return undefined;
}

export function normalizeRows(raw: RawRow[]): CsvRow[] {
  if (!raw.length) return [];
  const headers = Object.keys(raw[0]);
  const map = {
    date: findColumn(headers, "date"),
    revenue: findColumn(headers, "revenue"),
    orders: findColumn(headers, "orders"),
    category: findColumn(headers, "category"),
    region: findColumn(headers, "region"),
  };
  const num = (v: unknown) =>
    Number(String(v ?? "0").replace(/[^0-9.-]/g, "")) || 0;
  return raw
    .map((r) => ({
      date: map.date ? String(r[map.date] ?? "").trim() : "",
      revenue: map.revenue ? num(r[map.revenue]) : 0,
      orders: map.orders ? num(r[map.orders]) : 0,
      category: map.category ? String(r[map.category] ?? "").trim() || "Uncategorized" : "Uncategorized",
      region: map.region ? String(r[map.region] ?? "").trim() || undefined : undefined,
    }))
    .filter((r) => r.date || r.revenue || r.orders);
}

type DashboardContextValue = {
  rows: CsvRow[] | null;
  setRows: (rows: CsvRow[] | null) => void;
  rawRows: RawRow[] | null;
  setRawRows: (rows: RawRow[] | null) => void;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<CsvRow[] | null>(null);
  const [rawRows, setRawRows] = useState<RawRow[] | null>(null);
  const value = useMemo(() => ({ rows, setRows, rawRows, setRawRows }), [rows, rawRows]);
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