import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Retailyn" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Retailyn dashboard."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/dashboard" });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full bg-gradient-primary shadow-elegant hover:opacity-90">
          Log In
        </Button>
      </form>
    </AuthShell>
  );
}
