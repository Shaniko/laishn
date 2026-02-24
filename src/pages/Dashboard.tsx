import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useItems } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useRooms } from "@/hooks/useRooms";
import { useDirection, useDateLocale } from "@/hooks/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, LogOut, Package, FolderOpen, BarChart3, ShieldCheck, ShieldX, X, DoorOpen, ArrowUpDown, MessageCircle } from "lucide-react";
import appIcon from "@/assets/app-icon.png";
import { format } from "date-fns";
import { toast } from "sonner";
import QuickAddPanel from "@/components/QuickAddPanel";
import PhotoSuggestDialog from "@/components/PhotoSuggestDialog";
import AskAssistant from "@/components/AskAssistant";
import WarrantyAlerts from "@/components/WarrantyAlerts";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ExportData from "@/components/ExportData";
import { supabase } from "@/integrations/supabase/client";

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc" | "price_high" | "price_low";

export default function Dashboard() {
  const { t } = useTranslation();
  const dir = useDirection();
  const dateLocale = useDateLocale();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoSuggestions, setPhotoSuggestions] = useState<string[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const { data: categories, ensureDefaults } = useCategories();
  const { data: rooms, ensureDefaults: ensureRoomDefaults } = useRooms();
  const { data: items, isLoading, addItem } = useItems(categoryFilter || undefined, search || undefined, roomFilter || undefined);

  const handleQuickAdd = async (name: string) => {
    await addItem.mutateAsync({ name });
    toast.success(t("dashboard.added_success", { name }));
  };

  const handlePhotoCapture = async (file: File) => {
    if (!user) return;
    setPhotoFile(file);
    setPhotoDialogOpen(true);
    setPhotoLoading(true);
    setPhotoSuggestions([]);

    try {
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("identify-image", {
        body: { imageBase64: base64, mimeType: file.type },
      });

      if (data?.suggestions?.length > 0) {
        setPhotoSuggestions(data.suggestions);
      } else {
        const fallback = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setPhotoSuggestions([fallback || t("photo.new_item")]);
      }
    } catch {
      const fallback = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setPhotoSuggestions([fallback || t("photo.new_item")]);
    }
    setPhotoLoading(false);
  };

  const handlePhotoNameSelected = async (name: string) => {
    if (!user || !photoFile) return;
    setPhotoDialogOpen(false);
    try {
      const newItem = await addItem.mutateAsync({ name });
      const filePath = `${user.id}/${newItem.id}/${Date.now()}_${photoFile.name}`;
      await supabase.storage.from("item-files").upload(filePath, photoFile);
      await supabase.from("item_files").insert({
        item_id: newItem.id,
        file_name: photoFile.name,
        file_path: filePath,
      });
      toast.success(t("dashboard.photo_saved"));
      navigate(`/item/${newItem.id}/edit`);
    } catch {
      toast.error(t("dashboard.photo_error"));
    }
    setPhotoFile(null);
  };

  const sortedItems = useMemo(() => {
    if (!items) return [];
    const sorted = [...items];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "name_asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name, "he"));
      case "name_desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name, "he"));
      case "price_high":
        return sorted.sort((a, b) => (b.purchase_price || 0) - (a.purchase_price || 0));
      case "price_low":
        return sorted.sort((a, b) => (a.purchase_price || 0) - (b.purchase_price || 0));
      default:
        return sorted;
    }
  }, [items, sortBy]);

  useEffect(() => {
    if (user?.id) {
      ensureDefaults.mutate();
      ensureRoomDefaults.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div dir={dir} className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={appIcon} alt="HomeVault" className="h-9 w-9 rounded-xl" />
            <h1 className="text-xl font-bold">{t("app_name")}</h1>
          </div>
          <div className="flex gap-1">
            <LanguageSwitcher />
            <ExportData />
            <Button variant="ghost" size="icon" onClick={() => setAssistantOpen(true)} title={t("dashboard.smart_assistant")}>
              <MessageCircle className="h-5 w-5" />
            </Button>
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
            <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${dir === "rtl" ? "right-3" : "left-3"}`} />
            <Input
              placeholder={t("dashboard.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={dir === "rtl" ? "pr-10" : "pl-10"}
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder={t("dashboard.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.all_categories")}</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roomFilter} onValueChange={(v) => setRoomFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder={t("dashboard.room")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.all_rooms")}</SelectItem>
              {rooms?.map((room) => (
                <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-36">
              <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
              <SelectValue placeholder={t("dashboard.sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("dashboard.newest")}</SelectItem>
              <SelectItem value="oldest">{t("dashboard.oldest")}</SelectItem>
              <SelectItem value="name_asc">{t("dashboard.name_asc")}</SelectItem>
              <SelectItem value="name_desc">{t("dashboard.name_desc")}</SelectItem>
              <SelectItem value="price_high">{t("dashboard.price_high")}</SelectItem>
              <SelectItem value="price_low">{t("dashboard.price_low")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Warranty Alerts */}
        {items && <WarrantyAlerts items={items} />}

        {/* Items Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="mb-4 h-16 w-16 opacity-30" />
            <p className="text-lg font-medium">{t("dashboard.no_items")}</p>
            <p className="text-sm">{t("dashboard.add_first")}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/item/${item.id}`)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    {item.rooms && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <DoorOpen className="h-3.5 w-3.5" />
                        <span>{item.rooms.name}</span>
                      </div>
                    )}
                    {item.categories && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>{item.categories.name}</span>
                      </div>
                    )}
                    {item.warranty_end_date && (
                      new Date(item.warranty_end_date) >= new Date()
                        ? <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"><ShieldCheck className="h-3 w-3" />{t("warranty.active")}</span>
                        : <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"><ShieldX className="h-3 w-3" />{t("warranty.expired")}</span>
                    )}
                  </div>
                  {item.purchase_price != null && item.purchase_price > 0 && (
                    <p className="mt-1 text-xs font-medium text-muted-foreground">₪{item.purchase_price.toLocaleString()}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "d MMMM yyyy", { locale: dateLocale })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* FAB */}
        <Button
          onClick={() => setQuickAddOpen((prev) => !prev)}
          size="lg"
          className={`fixed bottom-6 h-14 w-14 rounded-full shadow-lg transition-transform duration-200 ${dir === "rtl" ? "left-6" : "right-6"}`}
        >
          {quickAddOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>

        {/* Quick Add Panel */}
        <QuickAddPanel
          isOpen={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          onAdd={handleQuickAdd}
          isAdding={addItem.isPending}
          onPhotoCapture={handlePhotoCapture}
        />

        <PhotoSuggestDialog
          open={photoDialogOpen}
          suggestions={photoSuggestions}
          loading={photoLoading}
          onSelect={handlePhotoNameSelected}
          onClose={() => setPhotoDialogOpen(false)}
        />

        <AskAssistant
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          items={items || []}
        />
      </main>
    </div>
  );
}
