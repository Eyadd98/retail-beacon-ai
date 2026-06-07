import { createFileRoute } from "@tanstack/react-router";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowUpRight, DollarSign, ShoppingCart, TrendingUp, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kpis, salesOverTime, revenueByCategory, insights } from "@/lib/dashboard-data";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

const kpiIcons = [DollarSign, ShoppingCart, TrendingUp, MapPin];

function Overview() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Your retail performance at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => {
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
                <div className="mt-1 flex items-center gap-1 text-xs text-primary">
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
            {insights.map((t, i) => (
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesOverTime}>
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" vertical={false} />
                <XAxis dataKey="category" stroke="oklch(0.5 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.02 260)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.01 255)", fontSize: 12 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="oklch(0.55 0.2 260)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}