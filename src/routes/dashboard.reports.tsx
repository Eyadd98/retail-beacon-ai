import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export const Route = createFileRoute("/dashboard/reports")({
  component: ReportsPage,
});

const reports = [
  { name: "Q4 Revenue Summary", date: "Dec 31, 2026", size: "1.2 MB" },
  { name: "Top Performing SKUs", date: "Dec 28, 2026", size: "740 KB" },
  { name: "Regional Breakdown", date: "Dec 21, 2026", size: "892 KB" },
  { name: "Customer Cohort Analysis", date: "Dec 14, 2026", size: "2.1 MB" },
  { name: "Holiday Campaign Recap", date: "Dec 7, 2026", size: "1.8 MB" },
];

function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Auto-generated reports based on your data.</p>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {reports.map((r) => (
              <li key={r.name} className="flex items-center gap-3 p-4 transition hover:bg-accent/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.date} · {r.size}</div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}