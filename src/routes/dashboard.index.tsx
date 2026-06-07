import { createFileRoute } from "@tanstack/react-router";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowUpRight, DollarSign, ShoppingCart, Receipt, Tag, Sparkles, UploadCloud, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insights } from "@/lib/dashboard-data";
import { useDashboardData, deriveMetrics, type CsvRow } from "@/lib/dashboard-store";
import Papa from "papaparse";
import { toast } from "sonner";
import { useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

const kpiIcons = [DollarSign, ShoppingCart, Receipt, Tag];

function Overview() {
  const { rows, setRows } = useDashboardData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const metrics = useMemo(() => (rows && rows.length ? deriveMetrics(rows) : null), [rows]);
  const hasData = !!metrics;

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      toast.error("Please upload a .csv file");
      return;
    }
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        try {
          const parsed: CsvRow[] = result.data
            .map((r) => {
              const lower: Record<string, string> = {};
              Object.keys(r).forEach((k) => (lower[k.trim().toLowerCase()] = String(r[k] ?? "").trim()));
              return {
                date: lower["date"] ?? "",
                revenue: Number(String(lower["revenue"] ?? "0").replace(/[^0-9.-]/g, "")) || 0,
                orders: Number(String(lower["orders"] ?? "0").replace(/[^0-9.-]/g, "")) || 0,
                category: lower["category"] || "Uncategorized",
              };
            })
            .filter((r) => r.date || r.revenue || r.orders);
          if (!parsed.length) {
            toast.error("No valid rows found in CSV");
            return;
          }
          setRows(parsed);
          toast.success(`Processed ${parsed.length} rows from ${file.name}`);
        } catch (e) {
          toast.error("Failed to parse CSV");
        }
      },
      error: () => toast.error("Failed to read CSV file"),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Your retail performance at a glance.</p>
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
            {hasData ? `Loaded ${rows!.length} rows — drop a new file to replace` : "or click to browse — expects Date, Revenue, Orders, Category"}
          </p>
        </div>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(metrics?.kpis ?? [
          { label: "Total Revenue", value: "—", delta: "No data" },
          { label: "Total Orders", value: "—", delta: "No data" },
          { label: "Avg Order Value", value: "—", delta: "No data" },
          { label: "Top Category", value: "—", delta: "No data" },
        ]).map((k, i) => {
          const Icon = kpiIcons[i];
          return (
            <Card key={k.label} className="shadow-card transition hover:shadow-elegant">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
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
            {(hasData ? insights : ["Upload a CSV to unlock AI-powered insights about your data."]).map((t, i) => (
              <li key={i} className="flex gap-3 rounded-lg bg-accent/40 p-3 text-sm">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-gradient-primary" />
                <span className="text-foreground/90">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics!.salesOverTime}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.2 260)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.55 0.2 260)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.5 0.02 260)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.02 260)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.01 255)", fontSize: 12 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stroke="oklch(0.55 0.2 260)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics!.revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" vertical={false} />
                <XAxis dataKey="category" stroke="oklch(0.5 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.02 260)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.01 255)", fontSize: 12 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="oklch(0.55 0.2 260)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <FileWarning className="h-8 w-8 text-muted-foreground/60" />
      <p className="text-sm font-medium">No data uploaded yet</p>
      <p className="text-xs">Upload a CSV to see your metrics here.</p>
    </div>
  );
}