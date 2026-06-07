import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Retailyn" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your 14-day free trial. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
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
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Alex Johnson" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 8 characters" required />
        </div>
        <Button type="submit" className="w-full bg-gradient-primary shadow-elegant hover:opacity-90">
          Create Account
        </Button>
      </form>
    </AuthShell>
  );
}
