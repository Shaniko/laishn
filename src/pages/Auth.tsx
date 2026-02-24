import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Home } from "lucide-react";
import { useDirection } from "@/hooks/useLocale";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Auth() {
  const { t } = useTranslation();
  const dir = useDirection();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: t("common.error"), description: t("common.generic_error"), variant: "destructive" });
      } else {
        toast({ title: t("auth.reset_sent"), description: t("auth.reset_sent_desc") });
        setMode("login");
      }
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: t("auth.login_error"), description: t("common.generic_error"), variant: "destructive" });
      } else if (!rememberMe) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          sessionStorage.setItem("sb-session", JSON.stringify(session));
          localStorage.removeItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`);
        }
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({ title: t("auth.signup_error"), description: t("common.generic_error"), variant: "destructive" });
      } else {
        toast({ title: t("auth.signup_success"), description: t("auth.signup_confirm") });
      }
    }
    setLoading(false);
  };

  return (
    <div dir={dir} className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Home className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("app_name")}</CardTitle>
          <CardDescription>
            {mode === "login" ? t("auth.login_desc") : mode === "signup" ? t("auth.signup_desc") : t("auth.forgot_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
            {mode !== "forgot" && (
              <Input
                type="password"
                placeholder={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                dir="ltr"
              />
            )}
            {mode === "login" && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label htmlFor="rememberMe" className="text-sm cursor-pointer select-none">
                  {t("auth.remember_me")}
                </label>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t("common.loading")
                : mode === "login"
                  ? t("auth.login")
                  : mode === "signup"
                    ? t("auth.signup")
                    : t("auth.send_reset")}
            </Button>
          </form>

          {mode === "login" && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setMode("forgot")}
                className="text-sm text-muted-foreground hover:text-primary hover:underline underline-offset-4"
              >
                {t("auth.forgot_password")}
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <button onClick={() => setMode("login")} className="text-primary underline-offset-4 hover:underline">
                {t("auth.back_to_login")}
              </button>
            ) : (
              <>
                {mode === "login" ? t("auth.no_account") : t("auth.have_account")}{" "}
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {mode === "login" ? t("auth.signup") : t("auth.login")}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
