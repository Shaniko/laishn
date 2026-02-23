import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useItem, useItems } from "@/hooks/useItems";
import { useItemFiles } from "@/hooks/useItemFiles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Edit, Trash2, Download, FileText, Image as ImageIcon, FolderOpen, Calendar, Phone, ExternalLink, ShieldCheck, ShieldX, ShieldQuestion, DollarSign, DoorOpen, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { useDirection, useDateLocale } from "@/hooks/useLocale";

export function getWarrantyStatus(warrantyEndDate: string | null, t: (key: string) => string) {
  if (!warrantyEndDate) return { label: t("warranty.not_set"), variant: "secondary" as const, icon: ShieldQuestion };
  const end = new Date(warrantyEndDate);
  if (end >= new Date()) return { label: t("warranty.active_label"), variant: "default" as const, icon: ShieldCheck };
  return { label: t("warranty.expired_label"), variant: "destructive" as const, icon: ShieldX };
}

export default function ItemView() {
  const { t } = useTranslation();
  const dir = useDirection();
  const dateLocale = useDateLocale();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: item, isLoading } = useItem(id!);
  const { deleteItem } = useItems();
  const { data: files } = useItemFiles(id!);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (files) {
      const fetchUrls = async () => {
        const urls: Record<string, string> = {};
        for (const f of files) {
          const { data } = await supabase.storage.from("item-files").createSignedUrl(f.file_path, 3600);
          if (data) urls[f.id] = data.signedUrl;
        }
        setFileUrls(urls);
      };
      fetchUrls();
    }
  }, [files]);

  const handleDelete = async () => {
    try {
      if (files && files.length > 0) {
        await supabase.storage.from("item-files").remove(files.map((f) => f.file_path));
      }
      await deleteItem.mutateAsync(id!);
      toast({ title: t("item_view.item_deleted") });
      navigate("/");
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    }
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div dir={dir} className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!item) {
    return (
      <div dir={dir} className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("item_view.not_found")}</p>
      </div>
    );
  }

  const warranty = getWarrantyStatus(item.warranty_end_date, t);
  const WarrantyIcon = warranty.icon;

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <BackArrow className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold truncate">{item.name}</h1>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/item/${id}/edit`)}>
              <Edit className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Details */}
        <Card>
          <CardContent className="p-5 space-y-4">
            {item.rooms && (
              <div className="flex items-center gap-2 text-sm">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("item_view.room")}</span>
                <span className="font-medium">{item.rooms.name}</span>
              </div>
            )}
            {item.categories && (
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("item_view.category")}</span>
                <span className="font-medium">{item.categories.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("item_view.added")}</span>
              <span>{format(new Date(item.created_at), "d MMMM yyyy", { locale: dateLocale })}</span>
            </div>
            {item.purchase_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("item_view.purchase_date")}</span>
                <span>{format(new Date(item.purchase_date), "d MMMM yyyy", { locale: dateLocale })}</span>
              </div>
            )}
            {item.purchase_price != null && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("item_view.price")}</span>
                <span className="font-medium">₪{item.purchase_price.toLocaleString()}</span>
              </div>
            )}
            {item.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warranty */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{t("warranty.title")}</span>
              <Badge variant={warranty.variant} className="gap-1">
                <WarrantyIcon className="h-3.5 w-3.5" />
                {warranty.label}
              </Badge>
            </div>
            {item.warranty_end_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("warranty.valid_until")}</span>
                <span>{format(new Date(item.warranty_end_date), "d MMMM yyyy", { locale: dateLocale })}</span>
              </div>
            )}
            {item.warranty_file_url && (
              <a href={item.warranty_file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 w-full">
                  <ExternalLink className="h-4 w-4" />
                  {t("warranty.certificate")}
                </Button>
              </a>
            )}
            {item.phone && (
              <a href={`tel:${item.phone}`}>
                <Button variant="outline" size="sm" className="gap-2 w-full mt-2">
                  <Phone className="h-4 w-4" />
                  {item.phone}
                </Button>
              </a>
            )}
            {(item as any).manual_url && (
              <a href={(item as any).manual_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 w-full mt-2">
                  <BookOpen className="h-4 w-4" />
                  {t("item_view.manual")}
                </Button>
              </a>
            )}
          </CardContent>
        </Card>

        {/* Files */}
        {files && files.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t("item_view.files")} ({files.length})</h2>
            <div className="grid gap-3">
              {files.map((f) => (
                <Card key={f.id}>
                  <CardContent className="p-3">
                    {isImage(f.file_name) && fileUrls[f.id] && (
                      <img src={fileUrls[f.id]} alt={f.file_name} className="mb-3 w-full rounded-lg object-cover max-h-64" />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        {isImage(f.file_name) ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                        <span className="truncate max-w-[200px]">{f.file_name}</span>
                      </div>
                      {fileUrls[f.id] && (
                        <a href={fileUrls[f.id]} target="_blank" rel="noopener noreferrer" download>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{t("item_view.delete_title")}</DialogTitle>
            <DialogDescription>{t("item_view.delete_confirm", { name: item.name })}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button variant="destructive" onClick={handleDelete}>{t("common.delete")}</Button>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>{t("common.cancel")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
