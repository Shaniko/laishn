import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useItems } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useRooms } from "@/hooks/useRooms";
import { useDirection, useDateLocale } from "@/hooks/useLocale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Package, DollarSign, ShieldCheck, ShieldX, DoorOpen } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";

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
  const { t } = useTranslation();
  const dir = useDirection();
  const dateLocale = useDateLocale();
  const navigate = useNavigate();
  const { data: items } = useItems();
  const { data: categories } = useCategories();
  const { data: rooms } = useRooms();

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (!items) {
    return (
      <div dir={dir} className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalItems = items.length;
  const totalSpent = items.reduce((sum, i) => sum + (i.purchase_price || 0), 0);
  const activeWarranty = items.filter((i) => i.warranty_end_date && new Date(i.warranty_end_date) >= new Date()).length;
  const expiredWarranty = items.filter((i) => i.warranty_end_date && new Date(i.warranty_end_date) < new Date()).length;

  const catMap = new Map<string, number>();
  items.forEach((i) => {
    const name = i.categories?.name || t("stats.no_category");
    catMap.set(name, (catMap.get(name) || 0) + 1);
  });
  const categoryData = Array.from(catMap, ([name, value]) => ({ name, value }));

  const roomMap = new Map<string, number>();
  items.forEach((i) => {
    const name = i.rooms?.name || t("stats.no_room");
    roomMap.set(name, (roomMap.get(name) || 0) + 1);
  });
  const roomData = Array.from(roomMap, ([name, value]) => ({ name, value }));

  const monthMap = new Map<string, number>();
  items.forEach((i) => {
    if (i.purchase_date) {
      const key = format(parseISO(i.purchase_date), "yyyy-MM");
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
  });
  const purchaseTimeline = Array.from(monthMap, ([month, count]) => ({
    month: format(parseISO(month + "-01"), "MMM yy", { locale: dateLocale }),
    count,
    sortKey: month,
  })).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const warrantyData = [
    { name: t("warranty.active_label"), value: activeWarranty },
    { name: t("warranty.expired_label"), value: expiredWarranty },
    { name: t("warranty.not_set"), value: totalItems - activeWarranty - expiredWarranty },
  ].filter((d) => d.value > 0);

  const expCatMap = new Map<string, number>();
  items.forEach((i) => {
    if (i.purchase_price) {
      const name = i.categories?.name || t("stats.no_category");
      expCatMap.set(name, (expCatMap.get(name) || 0) + i.purchase_price);
    }
  });
  const expenseData = Array.from(expCatMap, ([name, total]) => ({ name, total }));

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <BackArrow className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{t("stats.title")}</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">{t("stats.items")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">₪{totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t("stats.total_spent")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeWarranty}</p>
                <p className="text-xs text-muted-foreground">{t("stats.active_warranty")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldX className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{expiredWarranty}</p>
                <p className="text-xs text-muted-foreground">{t("stats.expired_warranty")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {categoryData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("stats.by_category")}</CardTitle>
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

        {roomData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("stats.by_room")}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={roomData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                    {roomData.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {purchaseTimeline.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("stats.purchases_monthly")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={purchaseTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name={t("stats.purchases")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {warrantyData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("stats.warranty_status")}</CardTitle>
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

        {expenseData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("stats.expenses_by_cat")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={expenseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={80} />
                  <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
                  <Bar dataKey="total" name={t("stats.expenses")} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
