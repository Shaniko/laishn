import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useItem, useItems } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useRooms } from "@/hooks/useRooms";
import { useItemFiles } from "@/hooks/useItemFiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Upload, X, FileText, Image as ImageIcon, CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

function DatePickerWithInput({
  value,
  onChange,
  label,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label: string;
}) {
  const [textValue, setTextValue] = useState(value ? format(value, "dd/MM/yyyy") : "");

  useEffect(() => {
    setTextValue(value ? format(value, "dd/MM/yyyy") : "");
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextValue(raw);
    if (raw.length === 10) {
      const parsed = parse(raw, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onChange(parsed);
      }
    } else if (raw === "") {
      onChange(undefined);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          value={textValue}
          onChange={handleTextChange}
          placeholder="dd/mm/yyyy"
          dir="ltr"
          className="flex-1 text-right"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={(d) => onChange(d)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default function ItemForm() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const { data: rooms } = useRooms();
  const { addItem, updateItem } = useItems();
  const { data: existingItem } = useItem(isNew ? "" : id!);
  const { data: files, uploadFile, deleteFile } = useItemFiles(isNew ? "" : id!);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [purchasePrice, setPurchasePrice] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState<Date | undefined>();
  const [warrantyFileUrl, setWarrantyFileUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingItem) {
      setName(existingItem.name);
      setCategoryId(existingItem.category_id || "");
      setRoomId(existingItem.room_id || "");
      setNotes(existingItem.notes || "");
      setPurchaseDate(existingItem.purchase_date ? new Date(existingItem.purchase_date) : undefined);
      setPurchasePrice(existingItem.purchase_price != null ? String(existingItem.purchase_price) : "");
      setWarrantyEndDate(existingItem.warranty_end_date ? new Date(existingItem.warranty_end_date) : undefined);
      setWarrantyFileUrl(existingItem.warranty_file_url || "");
      setPhone(existingItem.phone || "");
    }
  }, [existingItem]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "שם פריט הוא שדה חובה", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const itemData = {
        name: name.trim(),
        category_id: categoryId || null,
        room_id: roomId || null,
        notes: notes.trim(),
        purchase_date: purchaseDate ? format(purchaseDate, "yyyy-MM-dd") : null,
        purchase_price: purchasePrice ? Number(purchasePrice) : null,
        warranty_end_date: warrantyEndDate ? format(warrantyEndDate, "yyyy-MM-dd") : null,
        warranty_file_url: warrantyFileUrl.trim() || null,
        phone: phone.trim() || null,
      };

      if (isNew) {
        const newItem = await addItem.mutateAsync(itemData);
        for (const file of pendingFiles) {
          const { supabase } = await import("@/integrations/supabase/client");
          const filePath = `${user!.id}/${newItem.id}/${Date.now()}_${file.name}`;
          await supabase.storage.from("item-files").upload(filePath, file);
          await supabase.from("item_files").insert({
            item_id: newItem.id,
            file_name: file.name,
            file_path: filePath,
          });
        }
        toast({ title: "הפריט נוסף בהצלחה!" });
        navigate(`/item/${newItem.id}`);
      } else {
        await updateItem.mutateAsync({ id: id!, ...itemData });
        for (const file of pendingFiles) {
          await uploadFile.mutateAsync(file);
        }
        toast({ title: "הפריט עודכן בהצלחה!" });
        navigate(`/item/${id}`);
      }
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{isNew ? "פריט חדש" : "עריכת פריט"}</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">שם פריט *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: מקרר Samsung" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">חדר</label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר חדר" />
              </SelectTrigger>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">קטגוריה</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DatePickerWithInput value={purchaseDate} onChange={setPurchaseDate} label="תאריך רכישה" />

        {/* Purchase price */}
        <div className="space-y-2">
          <label className="text-sm font-medium">מחיר רכישה (₪)</label>
          <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0" />
        </div>

        <DatePickerWithInput value={warrantyEndDate} onChange={setWarrantyEndDate} label="תאריך סיום אחריות" />

        {/* Warranty file URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">לינק לתעודת אחריות</label>
          <Input value={warrantyFileUrl} onChange={(e) => setWarrantyFileUrl(e.target.value)} placeholder="https://..." />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-medium">טלפון שירות</label>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03-1234567" dir="ltr" className="text-right" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">הערות</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="פרטים נוספים, מספר סידורי, תאריך רכישה..." rows={4} />
        </div>

        {/* File upload */}
        <div className="space-y-3">
          <label className="text-sm font-medium">קבצים מצורפים</label>
          {files?.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 text-sm">
                {isImage(f.file_name) ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                <span className="truncate max-w-[200px]">{f.file_name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteFile.mutate({ id: f.id, file_path: f.file_path })}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-dashed bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                {isImage(f.name) ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                <span className="truncate max-w-[200px]">{f.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
            <Upload className="h-5 w-5" />
            <span>לחץ להעלאת קובץ</span>
            <input type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleFileSelect} />
          </label>
        </div>

        <Button onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? "שומר..." : "שמור"}
        </Button>
      </main>
    </div>
  );
}
