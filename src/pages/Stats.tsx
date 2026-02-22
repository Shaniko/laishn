import { useNavigate } from "react-router-dom";
import { useItems } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Package, DollarSign, ShieldCheck, ShieldX } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(45, 80%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(20, 80%, 55%)",
];

export default function Stats() {
  const navigate = useNavigate();
  const { data: items } = useItems();
  const { data: categories } = useCategories();

  if (!items) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Summary
  const totalItems = items.length;
  const totalSpent = items.reduce((sum, i) => sum + (i.purchase_price || 0), 0);
  const activeWarranty = items.filter((i) => i.warranty_end_date && new Date(i.warranty_end_date) >= new Date()).length;
  const expiredWarranty = items.filter((i) => i.warranty_end_date && new Date(i.warranty_end_date) < new Date()).length;

  // Category distribution
  const catMap = new Map<string, number>();
  items.forEach((i) => {
    const name = i.categories?.name || "ללא קטגוריה";
    catMap.set(name, (catMap.get(name) || 0) + 1);
  });
  const categoryData = Array.from(catMap, ([name, value]) => ({ name, value }));

  // Purchases over time (by month)
  const monthMap = new Map<string, number>();
  items.forEach((i) => {
    if (i.purchase_date) {
      const key = format(parseISO(i.purchase_date), "yyyy-MM");
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
  });
  const purchaseTimeline = Array.from(monthMap, ([month, count]) => ({
    month: format(parseISO(month + "-01"), "MMM yy", { locale: he }),
    count,
    sortKey: month,
  })).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Warranty status
  const warrantyData = [
    { name: "אחריות פעילה", value: activeWarranty },
    { name: "אחריות פגה", value: expiredWarranty },
    { name: "לא הוגדרה", value: totalItems - activeWarranty - expiredWarranty },
  ].filter((d) => d.value > 0);

  // Expenses by category
  const expCatMap = new Map<string, number>();
  items.forEach((i) => {
    if (i.purchase_price) {
      const name = i.categories?.name || "ללא קטגוריה";
      expCatMap.set(name, (expCatMap.get(name) || 0) + i.purchase_price);
    }
  });
  const expenseData = Array.from(expCatMap, ([name, total]) => ({ name, total }));

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">סטטיסטיקות</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">פריטים</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">₪{totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">סה״כ הוצאות</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeWarranty}</p>
                <p className="text-xs text-muted-foreground">אחריות פעילה</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldX className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{expiredWarranty}</p>
                <p className="text-xs text-muted-foreground">אחריות פגה</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category distribution */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">פריטים לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Purchases over time */}
        {purchaseTimeline.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">רכישות לפי חודש</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={purchaseTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="רכישות" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Warranty status */}
        {warrantyData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">סטטוס אחריות</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={warrantyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                    <Cell fill="hsl(160, 60%, 45%)" />
                    <Cell fill="hsl(var(--destructive))" />
                    <Cell fill="hsl(var(--muted-foreground))" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Expenses by category */}
        {expenseData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">הוצאות לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={expenseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={80} />
                  <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
                  <Bar dataKey="total" name="הוצאות" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
