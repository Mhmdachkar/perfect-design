import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const isRecovery = hash.includes("type=recovery") || hash.includes("access_token");
    if (isRecovery) {
      setReady(true);
      return;
    }
    setReady(false);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) {
      toast.error("Open the password reset link from your email.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Welcome back.");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally { setLoading(false); }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 dot-bg">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
      <div className="surface-card relative w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a strong password you haven&apos;t used before.</p>
        {!ready ? (
          <p className="mt-6 text-sm text-muted-foreground">Use the reset link from your email to continue.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />} Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
