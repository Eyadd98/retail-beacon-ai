import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { SlidersHorizontal, Trash2, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { RawRow, Schema } from "@/lib/dashboard-store";

export type ChartType = "line" | "bar" | "area" | "donut";
export type ChartConfig = {
  id: string;
  type: ChartType;
  x: string;
  y: string;
};

const COLORS = [
  "oklch(0.65 0.22 260)", "oklch(0.7 0.2 180)", "oklch(0.72 0.2 60)",
  "oklch(0.65 0.25 20)", "oklch(0.6 0.22 320)", "oklch(0.7 0.18 140)",
  "oklch(0.62 0.2 220)", "oklch(0.7 0.2 40)", "oklch(0.6 0.22 290)",
  "oklch(0.7 0.18 100)", "oklch(0.65 0.2 350)", "oklch(0.68 0.2 200)",
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const parseNum = (v: unknown): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const parseDate = (v: unknown): Date | null => {
  if (v == null) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
};

function aggregate(rows: RawRow[], x: string, y: string, isDate: boolean) {
  if (isDate) {
    const byDay = new Map<string, { x: string; y: number; key: number }>();
    for (const r of rows) {
      const d = parseDate(r[x]);
      const n = parseNum(r[y]);
      if (!d || n === null) continue;
      const iso = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const label = `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
      const cur = byDay.get(iso) ?? { x: label, y: 0, key: d.getTime() };
      cur.y += n;
      byDay.set(iso, cur);
    }
    return Array.from(byDay.values()).sort((a, b) => a.key - b.key);
  }
  const byCat = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[x] ?? "").trim() || "—";
    const n = parseNum(r[y]);
    if (n === null) continue;
    byCat.set(k, (byCat.get(k) ?? 0) + n);
  }
  return Array.from(byCat.entries())
    .map(([x, y]) => ({ x, y }))
    .sort((a, b) => b.y - a.y)
    .slice(0, 20);
}

export function CustomChartCard({
  config, schema, rows, onChange, onRemove,
}: {
  config: ChartConfig;
  schema: Schema;
  rows: RawRow[];
  onChange: (c: ChartConfig) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const xOptions = useMemo(() => {
    const cats = schema.categorical;
    return schema.date ? [schema.date, ...cats] : cats;
  }, [schema]);
  const yOptions = schema.numeric;

  const isDate = config.x === schema.date;
  const data = useMemo(
    () => (config.x && config.y ? aggregate(rows, config.x, config.y, isDate) : []),
    [rows, config.x, config.y, isDate],
  );

  const title = config.x && config.y
    ? `${config.y} by ${config.x}`
    : "Configure chart";

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base capitalize">
          <span className="mr-2 text-xs font-medium uppercase text-muted-foreground">{config.type}</span>
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Chart Type</label>
                <Select value={config.type} onValueChange={(v) => onChange({ ...config, type: v as ChartType })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="donut">Donut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">X-Axis</label>
                <Select value={config.x || undefined} onValueChange={(v) => onChange({ ...config, x: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select column" /></SelectTrigger>
                  <SelectContent>
                    {xOptions.length === 0 && <SelectItem value="__none" disabled>No columns</SelectItem>}
                    {xOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}{c === schema.date ? " (date)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Y-Axis</label>
                <Select value={config.y || undefined} onValueChange={(v) => onChange({ ...config, y: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select column" /></SelectTrigger>
                  <SelectContent>
                    {yOptions.length === 0 && <SelectItem value="__none" disabled>No numeric columns</SelectItem>}
                    {yOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-72">
        {!config.x || !config.y ? (
          <Empty message="Open the customize menu to choose axes." />
        ) : data.length === 0 ? (
          <Empty message="No data for the selected combination." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(config.type, data, config.y)}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function renderChart(type: ChartType, data: { x: string; y: number }[], yName: string) {
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" vertical={false} />;
  const xAxis = <XAxis dataKey="x" stroke="oklch(0.5 0.02 260)" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />;
  const yAxis = <YAxis stroke="oklch(0.5 0.02 260)" fontSize={12} tickLine={false} axisLine={false} />;
  const tooltip = <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.01 255)", fontSize: 12 }} formatter={(v: number) => v.toLocaleString()} />;

  if (type === "line") {
    return (
      <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        {grid}{xAxis}{yAxis}{tooltip}
        <Line type="monotone" dataKey="y" name={yName} stroke="oklch(0.55 0.2 260)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive animationDuration={500} />
      </LineChart>
    );
  }
  if (type === "area") {
    return (
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.2 260)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="oklch(0.55 0.2 260)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {grid}{xAxis}{yAxis}{tooltip}
        <Area type="monotone" dataKey="y" name={yName} stroke="oklch(0.55 0.2 260)" strokeWidth={2} fill="url(#areaFill)" isAnimationActive animationDuration={500} />
      </AreaChart>
    );
  }
  if (type === "bar") {
    return (
      <BarChart data={data}>
        {grid}{xAxis}{yAxis}{tooltip}
        <Bar dataKey="y" name={yName} fill="oklch(0.55 0.2 260)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={500} />
      </BarChart>
    );
  }
  // donut
  const donutData = data.map((d) => ({ name: d.x, value: d.y }));
  return (
    <PieChart>
      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.01 255)", fontSize: 12 }} formatter={(v: number, n: string) => [v.toLocaleString(), n]} />
      <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: 12, paddingLeft: 16 }} />
      <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={95} paddingAngle={2} stroke="oklch(1 0 0)" strokeWidth={2} isAnimationActive animationDuration={500}>
        {donutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Pie>
    </PieChart>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <FileWarning className="h-8 w-8 text-muted-foreground/60" />
      <p className="text-sm">{message}</p>
    </div>
  );
}