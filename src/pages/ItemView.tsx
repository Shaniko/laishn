import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useItem, useItems } from "@/hooks/useItems";
import { useItemFiles } from "@/hooks/useItemFiles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Edit, Trash2, Download, FileText, Image as ImageIcon, FolderOpen, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function ItemView() {
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
      // Delete storage files first
      if (files && files.length > 0) {
        await supabase.storage.from("item-files").remove(files.map((f) => f.file_path));
      }
      await deleteItem.mutateAsync(id!);
      toast({ title: "הפריט נמחק" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

  if (isLoading) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!item) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">הפריט לא נמצא</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowRight className="h-5 w-5" />
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
            {item.categories && (
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">קטגוריה:</span>
                <span className="font-medium">{item.categories.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">נוסף:</span>
              <span>{format(new Date(item.created_at), "d בMMMM yyyy", { locale: he })}</span>
            </div>
            {item.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files */}
        {files && files.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">קבצים מצורפים ({files.length})</h2>
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

      {/* Delete Confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>מחיקת פריט</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את "{item.name}"? הפעולה בלתי הפיכה.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button variant="destructive" onClick={handleDelete}>מחק</Button>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
