import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell, Search, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { DashboardProvider } from "@/lib/dashboard-store";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AI Data Analyst Dashboard" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 5, 1),
    to: new Date(2026, 5, 30),
  });
  return (
    <DashboardProvider>
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
            <SidebarTrigger />
            <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search reports, regions, SKUs…" className="pl-9" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("h-9 justify-start gap-2 text-left font-normal", !range && "text-muted-foreground")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {range?.from ? (
                        range.to ? `${format(range.from, "LLL d")} – ${format(range.to, "LLL d, y")}` : format(range.from, "LLL d, y")
                      ) : "Pick a date range"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    numberOfMonths={2}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                <Bell className="h-4 w-4" />
              </button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">AJ</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
    </DashboardProvider>
  );
}