import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";

interface QuickAddPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  isAdding: boolean;
}

export default function QuickAddPanel({ isOpen, onClose, onAdd, isAdding }: QuickAddPanelProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Small delay to let the animation start before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
    setName("");
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || isAdding) return;

    await onAdd(trimmed);
    setName("");
    inputRef.current?.focus();
  }, [name, isAdding, onAdd]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 transition-transform duration-300 ease-out ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="border-t bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto px-4 py-4 space-y-3" dir="rtl">
          {/* Input row */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="שם המוצר..."
              disabled={isAdding}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isAdding}
              size="default"
            >
              {isAdding ? "שומר..." : "הוסף"}
            </Button>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/item/new");
              }}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              טופס מלא
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
