import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Home } from "lucide-react";

export default function Auth() {
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
        toast({ title: "שגיאה", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "נשלח!", description: "כדאי לבדוק את האימייל שלך לקישור איפוס הסיסמה." });
        setMode("login");
      }
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "שגיאה בהתחברות", description: error.message, variant: "destructive" });
      } else if (!rememberMe) {
        // Move tokens to sessionStorage so they're cleared when the tab closes
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
        toast({ title: "שגיאה בהרשמה", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "נרשמת בהצלחה!", description: "נשאר רק לאשר את המייל שנשלח אליך:) ." });
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
          <CardTitle className="text-2xl font-bold">הבית שלי</CardTitle>
          <CardDescription>
            {mode === "login" ? "חיבור לחשבון שלך" : mode === "signup" ? "יצירת חשבון חדש" : "איפוס סיסמה"}
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
                minLength={4}
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
                  זכור אותי
                </label>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "טוען..."
                : mode === "login"
                  ? "התחברות"
                  : mode === "signup"
                    ? "הרשמה"
                    : "שכחתי סיסמא - שליחת סיסמא חדשה"}
            </Button>
          </form>

          {mode === "login" && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setMode("forgot")}
                className="text-sm text-muted-foreground hover:text-primary hover:underline underline-offset-4"
              >
                אופס, שכחתי סיסמה?
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <button onClick={() => setMode("login")} className="text-primary underline-offset-4 hover:underline">
                חזרה להתחברות
              </button>
            ) : (
              <>
                {mode === "login" ? "אין לי חשבון?" : "כבר יש לי חשבון?"}{" "}
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {mode === "login" ? "הרשמה" : "התחברות"}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
