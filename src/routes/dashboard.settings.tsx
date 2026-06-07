import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="n">Full name</Label>
              <Input id="n" defaultValue="Alex Johnson" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e">Email</Label>
              <Input id="e" type="email" defaultValue="alex@retailco.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c">Company</Label>
            <Input id="c" defaultValue="Retail Co." />
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            ["Weekly summary email", true],
            ["AI insight alerts", true],
            ["Anomaly detection", false],
          ].map(([label, on]) => (
            <div key={label as string} className="flex items-center justify-between">
              <span className="text-sm">{label as string}</span>
              <Switch defaultChecked={on as boolean} />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button className="bg-gradient-primary shadow-elegant hover:opacity-90">Save changes</Button>
      </div>
    </div>
  );
}