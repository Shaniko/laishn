import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Home } from "lucide-react";
import { useDirection } from "@/hooks/useLocale";

export default function ResetPassword() {
  const { t } = useTranslation();
  const dir = useDirection();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via reset link
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: t("auth.password_min"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: t("common.error"), description: t("common.generic_error"), variant: "destructive" });
    } else {
      toast({ title: t("auth.password_updated") });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div dir={dir} className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Home className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("auth.reset_title")}</CardTitle>
          <CardDescription>{t("auth.reset_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <Input
              type="password"
              placeholder={t("auth.new_password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              dir="ltr"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.update_password")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
