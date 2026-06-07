import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BarChart3, Sparkles, TrendingUp, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useState } from "react";

const revenueTrend = [
  { month: "Jan", revenue: 42000, orders: 640, region: "NY" },
  { month: "Feb", revenue: 48000, orders: 712, region: "NY" },
  { month: "Mar", revenue: 55000, orders: 815, region: "CA" },
  { month: "Apr", revenue: 51000, orders: 760, region: "TX" },
  { month: "May", revenue: 63000, orders: 940, region: "NY" },
  { month: "Jun", revenue: 70000, orders: 1042, region: "CA" },
  { month: "Jul", revenue: 78000, orders: 1158, region: "NY" },
  { month: "Aug", revenue: 82000, orders: 1215, region: "FL" },
  { month: "Sep", revenue: 91000, orders: 1348, region: "CA" },
  { month: "Oct", revenue: 99000, orders: 1462, region: "NY" },
  { month: "Nov", revenue: 110000, orders: 1622, region: "NY" },
  { month: "Dec", revenue: 124000, orders: 1829, region: "CA" },
];

const totals = {
  revenue: revenueTrend.reduce((s, d) => s + d.revenue, 0),
  orders: revenueTrend.reduce((s, d) => s + d.orders, 0),
};
const defaultKpis = {
  label: "Revenue",
  revenue: "$842K",
  orders: "12,438",
  aov: "$67.72",
  region: "NY",
  rDelta: "+12.4%",
  oDelta: "+8.1%",
  aDelta: "+3.9%",
  regionDelta: "32% share",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Data Analyst Dashboard — AI-Powered Retail Analytics" },
      { name: "description", content: "Turn your retail data into revenue. AI-driven insights, dashboards, and forecasts for modern commerce teams." },
      { property: "og:title", content: "AI Data Analyst Dashboard — AI-Powered Retail Analytics" },
      { property: "og:description", content: "Turn your retail data into revenue with AI-driven insights." },
    ],
  }),
  component: Index,
});

function Index() {
  const [active, setActive] = useState<null | (typeof revenueTrend)[number]>(null);

  const kpis = active
    ? {
        revenue: `$${(active.revenue / 1000).toFixed(1)}K`,
        orders: active.orders.toLocaleString(),
        aov: `$${(active.revenue / active.orders).toFixed(2)}`,
        region: active.region,
        rDelta: active.month,
        oDelta: active.month,
        aDelta: active.month,
        regionDelta: "top region",
      }
    : defaultKpis;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">AI Data Analyst Dashboard</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#insights" className="hover:text-foreground transition-colors">AI Insights</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-primary shadow-elegant hover:opacity-90">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.08_260/_0.6),_transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 text-center animate-fade-in">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            New: GPT-powered retail forecasts
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
            AI-Powered <span className="bg-gradient-primary bg-clip-text text-transparent">Retail Analytics</span> for modern commerce
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Connect your sales data, surface what's driving revenue, and act on AI recommendations — all from one elegant dashboard.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elegant hover:opacity-90">
              <Link to="/signup">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Log In</Link>
            </Button>
          </div>

          <div className="relative mx-auto mt-20 max-w-5xl">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-ai opacity-20 blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
              <div className="flex items-center gap-1.5 border-b border-border bg-secondary/50 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              </div>
              <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
                {[
                  { l: "Revenue", v: kpis.revenue, d: kpis.rDelta },
                  { l: "Orders", v: kpis.orders, d: kpis.oDelta },
                  { l: "AOV", v: kpis.aov, d: kpis.aDelta },
                  { l: "Top Region", v: kpis.region, d: kpis.regionDelta },
                ].map((k) => (
                  <div key={k.l} className="rounded-lg border border-border bg-background p-4 text-left transition-colors">
                    <div className="text-xs text-muted-foreground">{k.l}</div>
                    <div
                      key={k.v}
                      className="mt-1 text-xl font-semibold tabular-nums animate-fade-in"
                    >
                      {k.v}
                    </div>
                    <div key={k.d} className="text-xs text-primary animate-fade-in">{k.d}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="h-48 rounded-lg bg-gradient-to-tr from-primary/5 via-primary/0 to-transparent p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueTrend}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      onMouseMove={(state: { activePayload?: Array<{ payload: (typeof revenueTrend)[number] }> }) => {
                        if (state?.activePayload?.[0]?.payload) {
                          setActive(state.activePayload[0].payload);
                        }
                      }}
                      onMouseLeave={() => setActive(null)}
                    >
                      <defs>
                        <linearGradient id="landingRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.55 0.2 260)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="oklch(0.55 0.2 260)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" hide />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid oklch(0.92 0.01 255)",
                          fontSize: 12,
                          padding: "6px 10px",
                        }}
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                        cursor={{ stroke: "oklch(0.55 0.2 260)", strokeOpacity: 0.2, strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="oklch(0.55 0.2 260)"
                        strokeWidth={2.5}
                        fill="url(#landingRev)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: "oklch(1 0 0)" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { i: TrendingUp, t: "Real-time KPIs", d: "Revenue, orders, AOV, and regional performance — refreshed live." },
            { i: Sparkles, t: "AI Insights", d: "Natural-language explanations of what changed and why it matters." },
            { i: Zap, t: "Instant Upload", d: "Drag a CSV or Excel file. We handle parsing and enrichment." },
            { i: BarChart3, t: "Beautiful Charts", d: "Time series, breakdowns, and cohorts built for executives." },
            { i: ShieldCheck, t: "Enterprise-grade", d: "SOC 2 ready. Your data stays encrypted at rest and in transit." },
            { i: ArrowRight, t: "Actionable", d: "Every insight ships with a recommended next step." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card p-6 shadow-card transition hover:shadow-elegant">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
          © 2026 AI-powered Analytics
        </div>
      </footer>
    </div>
  );
}
