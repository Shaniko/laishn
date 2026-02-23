import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDirection } from "@/hooks/useLocale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface PhotoSuggestDialogProps {
  open: boolean;
  suggestions: string[];
  loading: boolean;
  onSelect: (name: string) => void;
  onClose: () => void;
}

export default function PhotoSuggestDialog({
  open,
  suggestions,
  loading,
  onSelect,
  onClose,
}: PhotoSuggestDialogProps) {
  const { t } = useTranslation();
  const dir = useDirection();
  const [custom, setCustom] = useState("");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir={dir} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("photo.title")}</DialogTitle>
          <DialogDescription>
            {loading ? t("photo.identifying") : t("photo.choose")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full justify-start text-right"
                onClick={() => onSelect(s)}
              >
                {s}
              </Button>
            ))}

            <div className="flex gap-2 pt-2 border-t">
              <Input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={t("photo.custom_placeholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && custom.trim()) onSelect(custom.trim());
                }}
              />
              <Button
                disabled={!custom.trim()}
                onClick={() => onSelect(custom.trim())}
              >
                {t("photo.select")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
