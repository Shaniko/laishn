import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Home } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "שגיאה", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "נשלח!", description: "בדוק את האימייל שלך לקישור איפוס הסיסמה." });
        setMode("login");
      }
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "שגיאה בהתחברות", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({ title: "שגיאה בהרשמה", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "נרשמת בהצלחה!", description: "בדוק את האימייל לאישור החשבון." });
      }
    }
    setLoading(false);
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Home className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">HomeVault</CardTitle>
          <CardDescription>
            {mode === "login" ? "התחבר לחשבון שלך" : mode === "signup" ? "צור חשבון חדש" : "איפוס סיסמה"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
            {mode !== "forgot" && (
              <Input
                type="password"
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                dir="ltr"
              />
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "טוען..." : mode === "login" ? "התחבר" : mode === "signup" ? "הירשם" : "שלח קישור איפוס"}
            </Button>
          </form>

          {mode === "login" && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setMode("forgot")}
                className="text-sm text-muted-foreground hover:text-primary hover:underline underline-offset-4"
              >
                שכחת סיסמה?
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <button onClick={() => setMode("login")} className="text-primary underline-offset-4 hover:underline">
                חזור להתחברות
              </button>
            ) : (
              <>
                {mode === "login" ? "אין לך חשבון?" : "כבר יש לך חשבון?"}{" "}
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {mode === "login" ? "הירשם" : "התחבר"}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
