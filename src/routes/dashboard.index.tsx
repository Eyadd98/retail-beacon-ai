import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight, Sparkles, UploadCloud, FileWarning, Filter, Plus,
  DollarSign, ShoppingCart, Users, Clock, Percent,
  TrendingUp, AlertTriangle, Lightbulb,
  Briefcase, MapPin, GraduationCap, HeartPulse, Calendar, Star, Activity, Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useDashboardData, deriveMetrics, inferSchema, applyFilters, uniqueValues, type RawRow,
} from "@/lib/dashboard-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Papa from "papaparse";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import { CustomChartCard, type ChartConfig } from "@/components/custom-chart-card";
import {
  loadInitialState, saveDataset, insertChart as dbInsertChart,
  updateChart as dbUpdateChart, deleteChart as dbDeleteChart,
  deleteAllCharts, clearWorkspaceData,
} from "@/lib/dashboard-persistence";

function uniqueCount(rows: RawRow[], col: string, cap = 50): number {
  const set = new Set<string>();
  for (const r of rows) {
    const v = String(r[col] ?? "").trim();
    if (v) set.add(v);
    if (set.size > cap) break;
  }
  return set.size;
}

function pickPriorityNumeric(numeric: string[], keywords: string[], exclude: Set<string> = new Set()): string | undefined {
  for (const kw of keywords) {
    const hit = numeric.find((n) => !exclude.has(n) && n.toLowerCase().includes(kw));
    if (hit) return hit;
  }
  return numeric.find((n) => !exclude.has(n));
}

function seedCharts(schema: import("@/lib/dashboard-store").Schema, rows: RawRow[]): ChartConfig[] {
  const seeded: ChartConfig[] = [];
  const usedY = new Set<string>();
  const usedX = new Set<string>();

  // 1. Line chart: date + priority numeric (revenue-like)
  if (schema.date && schema.numeric.length) {
    const y = pickPriorityNumeric(schema.numeric, ["revenue", "income", "sales", "profit", "amount"]);
    if (y) {
      seeded.push({ id: crypto.randomUUID(), type: "line", x: schema.date, y });
      usedY.add(y);
    }
  }

  // 2. Donut chart: low-cardinality categorical (<=7 unique values)
  const lowCard = schema.categorical.find((c) => {
    const u = uniqueCount(rows, c);
    return u >= 2 && u <= 7;
  });
  if (lowCard && schema.numeric.length) {
    const y = pickPriorityNumeric(schema.numeric, ["count", "amount", "total"], usedY) ?? schema.numeric[0];
    seeded.push({ id: crypto.randomUUID(), type: "donut", x: lowCard, y });
    usedX.add(lowCard);
    usedY.add(y);
  }

  // 3. Bar chart: medium-cardinality categorical (8-15) to keep visuals legible
  const highCard =
    schema.categorical.find((c) => {
      if (usedX.has(c)) return false;
      const u = uniqueCount(rows, c, 16);
      return u > 7 && u <= 15;
    }) ??
    schema.categorical.find((c) => !usedX.has(c) && uniqueCount(rows, c, 16) <= 15);
  if (highCard && schema.numeric.length) {
    const y = pickPriorityNumeric(schema.numeric, ["revenue", "sales", "amount", "total"], usedY) ?? schema.numeric[0];
    seeded.push({ id: crypto.randomUUID(), type: "bar", x: highCard, y });
  }

  return seeded;
}

function getKpiIcon(label: string) {
  const lower = label.toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => lower.includes(k));
  if (has("job", "role", "department", "work")) return Briefcase;
  if (has("distance", "location", "region", "city")) return MapPin;
  if (has("education", "degree", "study")) return GraduationCap;
  if (has("satisfaction", "environment", "wellness", "health")) return HeartPulse;
  if (has("age", "years", "tenure")) return Calendar;
  if (has("rating", "score", "performance", "qa")) return Star;
  if (has("revenue", "sales", "price", "income", "salary", "cost", "profit")) return DollarSign;
  if (has("order", "cart", "qty")) return ShoppingCart;
  if (has("customer", "user", "employee", "people", "client")) return Users;
  if (has("time", "aht", "duration", "hours")) return Clock;
  if (has("rate", "conversion", "%")) return Percent;
  return Activity;
}

const INSIGHT_STYLES = {
  success: { label: "Success", icon: TrendingUp, badge: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", dot: "bg-emerald-500" },
  warning: { label: "Warning", icon: AlertTriangle, badge: "bg-amber-500/15 text-amber-600 border-amber-500/30", dot: "bg-amber-500" },
  idea:    { label: "Idea",    icon: Lightbulb,    badge: "bg-primary/15 text-primary border-primary/30",        dot: "bg-primary" },
} as const;

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const {
    rawRows, setRawRows, schema, setSchema, filters, setFilter, resetFilters,
    dateRange, setDateRange,
  } = useDashboardData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Load saved workspace, dataset, and charts on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await loadInitialState();
      if (cancelled || !state) return;
      setWorkspaceId(state.workspaceId);
      if (state.rows && state.schema) {
        setRawRows(state.rows);
        setSchema(state.schema);
        // mark as already initialized so we don't re-seed default charts
        setInitializedFor(state.schema.headers.join("|"));
        setCharts(state.charts);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => (rawRows ? applyFilters(rawRows, filters, { dateCol: schema?.date, dateRange }) : []),
    [rawRows, filters, schema?.date, dateRange],
  );
  const metrics = useMemo(
    () => (schema && filtered.length ? deriveMetrics(filtered, schema) : null),
    [filtered, schema],
  );
  const hasData = !!metrics;
  // Dynamic, smart slicers: only categoricals with <15 unique values
  const slicerCols = useMemo(() => {
    if (!schema || !rawRows) return [];
    return schema.categorical.filter((c) => {
      const u = uniqueCount(rawRows, c, 16);
      return u >= 2 && u < 15;
    });
  }, [schema, rawRows]);

  const addChart = async () => {
    const x = schema?.date ?? schema?.categorical[0] ?? "";
    const y = schema?.numeric[0] ?? "";
    const local: ChartConfig = { id: crypto.randomUUID(), type: "bar", x, y };
    if (workspaceId) {
      const saved = await dbInsertChart(workspaceId, local);
      if (saved) {
        setCharts((cs) => [...cs, saved]);
        return;
      }
    }
    setCharts((cs) => [...cs, local]);
  };
  const updateChart = (id: string, next: ChartConfig) => {
    setCharts((cs) => cs.map((c) => (c.id === id ? next : c)));
    void dbUpdateChart(next);
  };
  const removeChart = (id: string) => {
    setCharts((cs) => cs.filter((c) => c.id !== id));
    void dbDeleteChart(id);
  };

  const clearData = async () => {
    setRawRows(null);
    setSchema(null);
    resetFilters();
    setDateRange(undefined);
    setCharts([]);
    setInitializedFor(null);
    if (inputRef.current) inputRef.current.value = "";
    if (workspaceId) await clearWorkspaceData(workspaceId);
    toast.success("Cleared all data");
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      toast.error("Please upload a .csv file");
      return;
    }
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        try {
          console.log("[CSV] parsed rows:", result.data.length, result.data.slice(0, 3));
          if (result.errors?.length) console.warn("[CSV] parse errors:", result.errors);
          const raw = (result.data ?? []).filter((r) => r && Object.keys(r).length > 0);
          if (!raw.length) {
            toast.error("No valid rows found in CSV");
            return;
          }
          const inferred = inferSchema(raw);
          setRawRows(raw);
          setSchema(inferred);
          toast.success(`Processed ${raw.length} rows from ${file.name}`);
          // Persist dataset + seed + save charts
          (async () => {
            if (!workspaceId) return;
            await saveDataset(workspaceId, file.name, raw, inferred);
            await deleteAllCharts(workspaceId);
            const seeded = seedCharts(inferred, raw);
            const persisted: ChartConfig[] = [];
            for (const c of seeded) {
              const saved = await dbInsertChart(workspaceId, c);
              if (saved) persisted.push(saved);
            }
            setCharts(persisted);
            setInitializedFor(inferred.headers.join("|"));
          })();
        } catch (e) {
          console.error("[CSV] failed to process:", e);
          toast.error("Failed to parse CSV");
        }
      },
      error: (err) => {
        console.error("[CSV] read error:", err);
        toast.error(`Failed to read CSV: ${err.message}`);
      },
    });
  };

  const previewHeaders = rawRows && rawRows.length ? Object.keys(rawRows[0]) : [];
  const previewRows = rawRows ? rawRows.slice(0, 5) : [];

  return (
    <div className="space-y-6 animate-fade-in min-w-0 w-full max-w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            {hasData
              ? `Auto-detected ${schema?.numeric.length ?? 0} numeric, ${schema?.categorical.length ?? 0} categorical, ${schema?.date ? 1 : 0} date columns from your data.`
              : "Upload any CSV — the dashboard adapts to your columns automatically."}
          </p>
        </div>
        {hasData && (
          <Button variant="outline" size="sm" onClick={clearData} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Clear Data
          </Button>
        )}
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center shadow-card transition ${
          dragging ? "border-primary bg-accent/60" : "border-border bg-card hover:border-primary/60 hover:bg-accent/40"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant transition group-hover:scale-105">
          <UploadCloud className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Drag &amp; drop CSV or Excel files here</p>
          <p className="text-xs text-muted-foreground">
            {rawRows
              ? `Loaded ${rawRows.length} rows — drop a new file to replace`
              : "or click to browse — any CSV works"}
          </p>
        </div>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {hasData && slicerCols.length > 0 && (
        <Card className="shadow-card">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4 text-primary" />
              Filters
            </div>
            {slicerCols.map((col) => {
              const opts = uniqueValues(rawRows!, col);
              const val = filters[col] ?? "__all__";
              return (
                <div key={col} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{col}</span>
                  <Select value={val} onValueChange={(v) => setFilter(col, v)}>
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      {opts.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            {Object.values(filters).some((v) => v && v !== "__all__") && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>Clear</Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} / {rawRows!.length} rows
            </span>
          </CardContent>
        </Card>
      )}

      {rawRows && rawRows.length > 0 && (
        <Card className="shadow-card w-full min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Showing first {previewRows.length} of {rawRows.length} rows
            </p>
            <Table className="w-full caption-bottom">
              <TableHeader>
                <TableRow>
                  {previewHeaders.map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((r, i) => (
                  <TableRow key={i}>
                    {previewHeaders.map((h) => (
                      <TableCell key={h} className="whitespace-nowrap">{String(r[h] ?? "")}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(metrics?.kpis.length
          ? metrics.kpis
          : [0, 1, 2, 3].map((i) => ({ label: `Metric ${i + 1}`, value: "—", delta: "No data" }))
        ).map((k) => {
          const Icon = getKpiIcon(k.label);
          return (
            <Card key={k.label} className="shadow-card transition hover:shadow-elegant">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-semibold">{k.value}</div>
                <div className={`mt-1 flex items-center gap-1 text-xs ${hasData ? "text-primary" : "text-muted-foreground"}`}>
                  <ArrowUpRight className="h-3.5 w-3.5" /> {k.delta}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-xl p-[1px] bg-gradient-ai shadow-glow">
        <div className="rounded-[11px] bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-ai">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <h2 className="text-base font-semibold">AI Insights</h2>
            <span className="ml-auto text-xs text-muted-foreground">Updated 2 min ago</span>
          </div>
          <ul className="mt-4 space-y-3">
            {hasData ? (
              metrics!.insights.map((ins, i) => {
                const s = INSIGHT_STYLES[ins.kind];
                const Icon = s.icon;
                return (
                  <li key={i} className="flex gap-3 rounded-lg border border-border/60 bg-accent/40 p-3 text-sm">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${s.badge}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`h-5 px-1.5 text-[10px] font-semibold uppercase tracking-wide ${s.badge}`}>
                          {s.label}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">{ins.title}</span>
                      </div>
                      <p className="text-foreground/85">{ins.detail}</p>
                      <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/70">Action:</span> {ins.action}</p>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="flex gap-3 rounded-lg bg-accent/40 p-3 text-sm">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-gradient-primary" />
                <span className="text-foreground/90">Upload a CSV to unlock AI-powered insights about your data.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {hasData && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {charts.map((c) => (
              <CustomChartCard
                key={c.id}
                config={c}
                schema={schema!}
                rows={filtered}
                onChange={(next) => updateChart(c.id, next)}
                onRemove={() => removeChart(c.id)}
              />
            ))}
          </div>
          <Button variant="outline" onClick={addChart} className="w-full border-dashed">
            <Plus className="h-4 w-4" /> Add Chart
          </Button>
        </div>
      )}
    </div>
  );
}

function EmptyChart({ message }: { message?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <FileWarning className="h-8 w-8 text-muted-foreground/60" />
      <p className="text-sm font-medium">{message ?? "No data uploaded yet"}</p>
      {!message && <p className="text-xs">Upload a CSV to see your metrics here.</p>}
    </div>
  );
}