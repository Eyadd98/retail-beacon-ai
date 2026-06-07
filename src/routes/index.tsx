import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BarChart3, Sparkles, TrendingUp, Zap, ShieldCheck, ArrowRight } from "lucide-react";

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
                  { l: "Revenue", v: "$842K", d: "+12.4%" },
                  { l: "Orders", v: "12,438", d: "+8.1%" },
                  { l: "AOV", v: "$67.72", d: "+3.9%" },
                  { l: "Top Region", v: "NY", d: "32% share" },
                ].map((k) => (
                  <div key={k.l} className="rounded-lg border border-border bg-background p-4 text-left">
                    <div className="text-xs text-muted-foreground">{k.l}</div>
                    <div className="mt-1 text-xl font-semibold">{k.v}</div>
                    <div className="text-xs text-primary">{k.d}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="h-48 rounded-lg bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent" />
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
          © 2026 AI Data Analyst Dashboard. AI-powered retail analytics.
        </div>
      </footer>
    </div>
  );
}
