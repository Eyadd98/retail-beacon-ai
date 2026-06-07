import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type RawRow = Record<string, string>;

export type Schema = {
  headers: string[];
  numeric: string[];
  categorical: string[];
  date: string | undefined;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parseNum = (v: unknown): number | null => {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const parseDate = (v: unknown): Date | null => {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

export function inferSchema(rows: RawRow[]): Schema {
  if (!rows.length) return { headers: [], numeric: [], categorical: [], date: undefined };

  // Find the first row that actually has values to sample types from.
  const firstValid =
    rows.find((r) => r && Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim() !== "")) ??
    rows[0];
  const headers = Object.keys(firstValid);

  const numeric: string[] = [];
  const categorical: string[] = [];
  let date: string | undefined;

  const isDateString = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed) return false;
    // Require at least one date-like separator to avoid treating plain words as dates.
    if (!/[\-\/:]/.test(trimmed) && !/^\d{4}$/.test(trimmed)) return false;
    const d = new Date(trimmed);
    return !isNaN(d.getTime());
  };

  for (const h of headers) {
    // Find first non-empty value across rows for this column.
    let sample: unknown = undefined;
    for (const r of rows) {
      const v = r?.[h];
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        sample = v;
        break;
      }
    }
    if (sample === undefined) continue;

    if (typeof sample === "number" && Number.isFinite(sample)) {
      numeric.push(h);
    } else if (typeof sample === "boolean") {
      categorical.push(h);
    } else if (typeof sample === "string") {
      if (!date && isDateString(sample)) {
        date = h;
      } else {
        categorical.push(h);
      }
    } else if (sample instanceof Date) {
      if (!date) date = h;
    }
  }

  return { headers, numeric, categorical, date };
}

export type Filters = Record<string, string>;

export function applyFilters(rows: RawRow[], filters: Filters): RawRow[] {
  const active = Object.entries(filters).filter(([, v]) => v && v !== "__all__");
  if (!active.length) return rows;
  return rows.filter((r) => active.every(([k, v]) => String(r[k] ?? "").trim() === v));
}

export function uniqueValues(rows: RawRow[], col: string): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = String(r[col] ?? "").trim();
    if (v) set.add(v);
  }
  return Array.from(set).sort();
}

const fmtNum = (n: number) =>
  Math.abs(n) >= 1000
    ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : n.toLocaleString(undefined, { maximumFractionDigits: 2 });

export type Kpi = { label: string; value: string; delta: string; positive: boolean };

export function deriveMetrics(
  rows: RawRow[],
  schema: Schema,
  opts?: { lineY?: string; barY?: string },
) {
  const kpiCols = schema.numeric.slice(0, 4);
  const kpis: Kpi[] = kpiCols.map((col) => {
    const nums = rows.map((r) => parseNum(r[col])).filter((n): n is number => n !== null);
    const sum = nums.reduce((s, n) => s + n, 0);
    const avg = nums.length ? sum / nums.length : 0;
    const useAvg = /rate|ratio|pct|percent|avg|average|aht|score/i.test(col);
    return {
      label: col,
      value: useAvg ? `${fmtNum(avg)} avg` : fmtNum(sum),
      delta: useAvg ? `total ${fmtNum(sum)}` : `${nums.length} values`,
      positive: true,
    };
  });

  const lineYCol = opts?.lineY && schema.numeric.includes(opts.lineY)
    ? opts.lineY
    : schema.numeric[0];
  let lineChart: { x: string; y: number; key: number }[] = [];
  if (schema.date && lineYCol) {
    const byDay = new Map<string, { x: string; y: number; key: number }>();
    for (const r of rows) {
      const d = parseDate(r[schema.date]);
      const n = parseNum(r[lineYCol]);
      if (!d || n === null) continue;
      const iso = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const label = `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
      const cur = byDay.get(iso) ?? { x: label, y: 0, key: d.getTime() };
      cur.y += n;
      byDay.set(iso, cur);
    }
    lineChart = Array.from(byDay.values()).sort((a, b) => a.key - b.key);
  }

  const barXCol = schema.categorical[0];
  const barYCol = opts?.barY && schema.numeric.includes(opts.barY)
    ? opts.barY
    : schema.numeric[0];
  let barChart: { x: string; y: number }[] = [];
  if (barXCol && barYCol) {
    const byCat = new Map<string, number>();
    for (const r of rows) {
      const k = String(r[barXCol] ?? "").trim() || "—";
      const n = parseNum(r[barYCol]);
      if (n === null) continue;
      byCat.set(k, (byCat.get(k) ?? 0) + n);
    }
    barChart = Array.from(byCat.entries())
      .map(([x, y]) => ({ x, y }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 12);
  }

  type InsightKind = "success" | "warning" | "idea";
  type Insight = { kind: InsightKind; title: string; detail: string; action: string };
  const insights: Insight[] = [];

  // Insight 1 — Performance (top performer in bar chart)
  if (barChart.length) {
    const total = barChart.reduce((s, b) => s + b.y, 0);
    const top = barChart[0];
    const pct = total ? Math.round((top.y / total) * 100) : 0;
    insights.push({
      kind: "success",
      title: "Top Performer",
      detail: `${top.x} drives ${pct}% of ${barYCol} across ${barXCol} (${fmtNum(top.y)}).`,
      action:
        pct >= 30
          ? `Double down: allocate more budget and replicate ${top.x}'s playbook across other ${barXCol}.`
          : `Lean in: ${top.x} leads but the field is fragmented — invest to widen the gap.`,
    });
  }

  // Insight 2 — Risk / Improvement (lowest performer)
  if (barChart.length >= 2) {
    const total = barChart.reduce((s, b) => s + b.y, 0);
    const bottom = barChart[barChart.length - 1];
    const pct = total ? Math.round((bottom.y / total) * 100) : 0;
    insights.push({
      kind: "warning",
      title: "Underperformer",
      detail: `${bottom.x} contributes only ${pct}% of ${barYCol} (${fmtNum(bottom.y)}) — the weakest in ${barXCol}.`,
      action: `Investigate operational bottlenecks in ${bottom.x}; consider reallocating resources or running a focused improvement sprint.`,
    });
  }

  // Insight 3 — Trend (line chart trajectory + forecast)
  if (lineChart.length >= 2) {
    const first = lineChart[0].y;
    const last = lineChart[lineChart.length - 1].y;
    const change = first ? Math.round(((last - first) / first) * 100) : 0;
    const avg = lineChart.reduce((s, p) => s + p.y, 0) / lineChart.length;
    const projected = last + (last - first) / Math.max(lineChart.length - 1, 1);
    insights.push({
      kind: "idea",
      title: change >= 0 ? "Positive Momentum" : "Declining Trend",
      detail: `${lineYCol} ${change >= 0 ? "grew" : "dropped"} ${Math.abs(change)}% from ${lineChart[0].x} → ${lineChart[lineChart.length - 1].x} (avg ${fmtNum(avg)}).`,
      action:
        change >= 0
          ? `Trajectory points to ~${fmtNum(projected)} next period. Lock in the wins: scale the channels behind this lift.`
          : `If the slope holds, expect ~${fmtNum(projected)} next period. Run a root-cause review before the drop compounds.`,
    });
  }

  while (insights.length < 3) {
    insights.push({
      kind: "idea",
      title: "More Signal Needed",
      detail: "Add date, categorical, and numeric columns to unlock richer recommendations.",
      action: "Upload a more complete dataset to surface prescriptive insights.",
    });
  }

  // Donut chart — distribution of selected metric across selected category
  const donutChart = barChart.map((b) => ({ name: b.x, value: b.y }));

  return {
    kpis,
    lineChart,
    lineYCol,
    lineXCol: schema.date,
    barChart,
    barXCol,
    barYCol,
    insights: insights.slice(0, 3),
  };
}

type DashboardContextValue = {
  rawRows: RawRow[] | null;
  setRawRows: (rows: RawRow[] | null) => void;
  schema: Schema | null;
  setSchema: (s: Schema | null) => void;
  filters: Filters;
  setFilter: (col: string, value: string) => void;
  resetFilters: () => void;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [rawRows, setRawRowsState] = useState<RawRow[] | null>(null);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [filters, setFilters] = useState<Filters>({});

  const setRawRows = (rows: RawRow[] | null) => {
    setRawRowsState(rows);
    setFilters({});
  };
  const setFilter = (col: string, value: string) =>
    setFilters((f) => ({ ...f, [col]: value }));
  const resetFilters = () => setFilters({});

  const value = useMemo(
    () => ({ rawRows, setRawRows, schema, setSchema, filters, setFilter, resetFilters }),
    [rawRows, schema, filters],
  );
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardData() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboardData must be used within DashboardProvider");
  return ctx;
}