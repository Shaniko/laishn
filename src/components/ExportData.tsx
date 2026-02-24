import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ExportData() {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [categoriesRes, roomsRes, itemsRes, filesRes] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("rooms").select("*"),
        supabase.from("items").select("*"),
        supabase.from("item_files").select("*"),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (roomsRes.error) throw roomsRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (filesRes.error) throw filesRes.error;

      const exportData = {
        exported_at: new Date().toISOString(),
        categories: categoriesRes.data,
        rooms: roomsRes.data,
        items: itemsRes.data,
        item_files: filesRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `homevault-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("dashboard.export_success"));
    } catch {
      toast.error(t("common.generic_error"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleExport} disabled={exporting} title={t("dashboard.export_data")}>
      {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
    </Button>
  );
}
