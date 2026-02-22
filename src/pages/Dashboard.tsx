import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useItems } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, LogOut, Home, Package, FolderOpen, BarChart3, ShieldCheck, ShieldX, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const quickInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: categories, ensureDefaults } = useCategories();
  const { data: items, isLoading, addItem } = useItems(categoryFilter || undefined, search || undefined);

  useEffect(() => {
    if (user?.id) ensureDefaults.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (quickAddOpen) quickInputRef.current?.focus();
  }, [quickAddOpen]);

  const handleQuickAdd = async () => {
    const name = quickName.trim();
    if (!name) return;
    try {
      await addItem.mutateAsync({ name });
      setQuickName("");
      toast({ title: `"${name}" נוסף!` });
      quickInputRef.current?.focus();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">הבית שלי</h1>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("/stats")}>
              <BarChart3 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="חיפוש פריט..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="כל הקטגוריות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : items?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="mb-4 h-16 w-16 opacity-30" />
            <p className="text-lg font-medium">אין פריטים עדיין</p>
            <p className="text-sm">לחץ על + כדי להוסיף פריט ראשון</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items?.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/item/${item.id}`)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    {item.categories && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>{item.categories.name}</span>
                      </div>
                    )}
                    {item.warranty_end_date && (
                      new Date(item.warranty_end_date) >= new Date()
                        ? <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"><ShieldCheck className="h-3 w-3" />פעילה</span>
                        : <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"><ShieldX className="h-3 w-3" />פגה</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "d בMMMM yyyy", { locale: he })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Add Panel */}
        {quickAddOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-card p-4 shadow-lg animate-in slide-in-from-bottom">
            <div className="container mx-auto max-w-lg" dir="rtl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">הוספה מהירה</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => { setQuickAddOpen(false); navigate("/item/new"); }}>
                    <FileText className="h-3.5 w-3.5" />
                    טופס מלא
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuickAddOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleQuickAdd(); }} className="flex gap-2">
                <Input
                  ref={quickInputRef}
                  placeholder="שם המוצר..."
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!quickName.trim() || addItem.isPending}>
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* FAB */}
        <Button
          onClick={() => setQuickAddOpen((v) => !v)}
          size="lg"
          className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-30"
        >
          <Plus className={`h-6 w-6 transition-transform ${quickAddOpen ? "rotate-45" : ""}`} />
        </Button>
      </main>
    </div>
  );
}
