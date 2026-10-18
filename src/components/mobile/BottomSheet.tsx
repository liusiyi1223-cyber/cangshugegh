"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  zIndex = "z-[60]",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  zIndex?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndex}`}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85vh] max-w-md flex-col rounded-t-2xl bg-cream animate-[sheet-up_0.25s_ease-out]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-2.5">
          <div className="h-1 w-10 rounded-full bg-sand" />
        </div>

        {title ? (
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="text-muted hover:text-ink"
            >
              <X className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <div className="pb-2" />
        )}

        <div className="overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
