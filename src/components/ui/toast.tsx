"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "info" | "error";
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<((message: string, kind?: ToastKind) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICON = { success: Check, info: Info, error: AlertTriangle };
const TONE = { success: "text-up", info: "text-info", error: "text-down" };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++seq.current;
    setItems((prev) => [...prev.slice(-2), { id, message, kind }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2400);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        role="status"
        aria-live="polite"
        data-print-hidden
        className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {items.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-2 rounded-lg border border-line-strong bg-raised px-3.5 py-2.5 text-[0.8125rem] text-fg shadow-[0_12px_32px_rgb(0_0_0/0.32)] motion-safe:animate-[fade-in-up_320ms_var(--ease-out-expo)_both]"
            >
              <Icon size={15} strokeWidth={2} className={cn("shrink-0", TONE[t.kind])} aria-hidden="true" />
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
