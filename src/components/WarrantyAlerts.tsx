import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useDirection } from "@/hooks/useLocale";
import { differenceInDays } from "date-fns";
import type { ItemWithCategory } from "@/hooks/useItems";

interface WarrantyAlertsProps {
  items: ItemWithCategory[];
}

export default function WarrantyAlerts({ items }: WarrantyAlertsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dir = useDirection();

  const expiringItems = useMemo(() => {
    const now = new Date();
    return items
      .filter((item) => {
        if (!item.warranty_end_date) return false;
        const end = new Date(item.warranty_end_date);
        const days = differenceInDays(end, now);
        return days >= 0 && days <= 30;
      })
      .map((item) => ({
        ...item,
        daysLeft: differenceInDays(new Date(item.warranty_end_date!), now),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [items]);

  if (expiringItems.length === 0) return null;

  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <Alert className="border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/30">
      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertTitle className="text-orange-800 dark:text-orange-300">
        {t("warranty.expiring_soon")}
      </AlertTitle>
      <AlertDescription>
        <p className="text-sm text-orange-700 dark:text-orange-400 mb-2">
          {t("warranty.expiring_soon_desc", { count: expiringItems.length })}
        </p>
        <div className="space-y-1">
          {expiringItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/item/${item.id}`)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <span className="font-medium text-orange-900 dark:text-orange-200">{item.name}</span>
              <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                {t("warranty.expires_in_days", { days: item.daysLeft })}
                <Chevron className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
