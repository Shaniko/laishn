import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Package } from "lucide-react";
import { ItemWithCategory } from "@/hooks/useItems";

interface AskAssistantProps {
  open: boolean;
  onClose: () => void;
  items: ItemWithCategory[];
}

export default function AskAssistant({ open, onClose, items }: AskAssistantProps) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [linkedItems, setLinkedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-assistant`;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setAnswer("");
      setLinkedItems([]);
      setQuestion("");
    }
  }, [open]);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setAnswer("");
    setLinkedItems([]);

    const itemsPayload = items.map((it) => ({
      id: it.id,
      name: it.name,
      room: it.rooms?.name || null,
      category: it.categories?.name || null,
      purchase_price: it.purchase_price,
      purchase_date: it.purchase_date,
      warranty_end_date: it.warranty_end_date,
      phone: it.phone,
      notes: it.notes,
      manual_url: (it as any).manual_url || null,
    }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ question: q, items: itemsPayload }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        setAnswer(err.error || "שגיאה בקבלת תשובה");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setAnswer(fullText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Extract linked items [ITEMS:id1,id2]
      const match = fullText.match(/\[ITEMS:([^\]]+)\]/);
      if (match) {
        setLinkedItems(match[1].split(",").map((s) => s.trim()));
        setAnswer(fullText.replace(/\[ITEMS:[^\]]+\]/, "").trim());
      }
    } catch (e) {
      console.error(e);
      setAnswer("שגיאה בחיבור לעוזר");
    }
    setLoading(false);
  };

  const matchedItems = items.filter((it) => linkedItems.includes(it.id));

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent dir="rtl" className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>עוזר חכם 🤖</DrawerTitle>
          <DrawerDescription>שאל שאלה על המוצרים שלך</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder='לדוגמה: "מתי פג האחריות של המקרר?"'
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={loading}
            />
            <Button size="icon" onClick={handleAsk} disabled={loading || !question.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {answer && (
            <ScrollArea className="max-h-[40vh] rounded-lg border bg-muted/30 p-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{answer}</p>
            </ScrollArea>
          )}

          {matchedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">מוצרים רלוונטיים:</p>
              {matchedItems.map((it) => (
                <Button
                  key={it.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    onClose();
                    navigate(`/item/${it.id}`);
                  }}
                >
                  <Package className="h-4 w-4" />
                  {it.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
