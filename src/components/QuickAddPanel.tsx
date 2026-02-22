import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, X, Camera, Mic, MicOff } from "lucide-react";

interface QuickAddPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  isAdding: boolean;
  onPhotoCapture?: (file: File) => void;
}

export default function QuickAddPanel({ isOpen, onClose, onAdd, isAdding, onPhotoCapture }: QuickAddPanelProps) {
  const [name, setName] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  const speechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
    setName("");
    stopListening();
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

  const startListening = useCallback(() => {
    if (!speechSupported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "he-IL";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setName(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [speechSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoCapture) {
      onPhotoCapture(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
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
            <div className="flex items-center gap-3">
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

              {/* Camera button */}
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                צלם
              </button>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraCapture}
              />

              {/* Voice button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`inline-flex items-center gap-1 transition-colors ${
                    isListening
                      ? "text-destructive animate-pulse"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {isListening ? "עצור" : "דבר"}
                </button>
              )}
            </div>

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
