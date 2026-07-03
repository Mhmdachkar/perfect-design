import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { usePh } from "@/hooks/use-ph";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";

const searchSchema = z.object({
  mode: z.enum(["sign-in", "forgot"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const ph = usePh();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"sign-in" | "forgot">(search.mode === "forgot" ? "forgot" : "sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTo = sanitizeRedirectPath(search.redirect);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: redirectTo });
    });
  }, [navigate, redirectTo]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcomeBackToast"));
        navigate({ to: redirectTo });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success(t("auth.passwordResetSent"));
        setMode("sign-in");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("auth.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 text-foreground dot-bg">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        <div className="surface-card border-border-strong bg-card/90 p-8 backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {mode === "forgot" ? t("auth.resetPassword") : t("auth.welcomeBack")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "forgot" ? t("auth.resetDescription") : t("auth.signInDescription")}
            </p>
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ph.auth.email} autoComplete="email" className="bg-surface-2" />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setMode("forgot")}>
                    {t("auth.forgot")}
                  </button>
                </div>
                <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={ph.auth.password} autoComplete="current-password" className="bg-surface-2" />
              </div>
            )}
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {mode === "forgot" ? t("auth.sendReset") : t("auth.signIn")}
            </Button>
          </form>

          {mode === "forgot" && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.haveAccount")}{" "}
              <button type="button" onClick={() => setMode("sign-in")} className="font-medium text-foreground hover:underline">{t("auth.signIn")}</button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("auth.adminNote")}
        </p>
      </div>
    </div>
  );
}
