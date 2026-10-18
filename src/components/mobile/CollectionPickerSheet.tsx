"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import BottomSheet from "./BottomSheet";
import type { FavoriteWithCollections } from "@/lib/types";

type Collection = { id: string; name: string; _count?: { favorites: number } };

export default function CollectionPickerSheet({
  favorite,
  open,
  onClose,
  onSaved,
}: {
  favorite: FavoriteWithCollections;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set((favorite.collections ?? []).map((c) => c.id)));
    setSaving(false);
    fetch("/api/collections")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Collection[]) => setCollections(list));
  }, [open, favorite]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/favorites/${favorite.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionIds: [...selected] }),
    });
    setSaving(false);
    if (res.ok) onSaved();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="归入收藏夹" zIndex="z-[70]">
      {collections.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">还没有收藏夹</p>
      ) : (
        <div className="flex flex-col">
          {collections.map((c) => {
            const checked = selected.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className="flex h-12 w-full items-center gap-3 text-left text-[15px] text-ink active:bg-sand"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md ring-1 ${
                    checked ? "bg-brand ring-brand" : "bg-surface ring-sand"
                  }`}
                >
                  {checked && (
                    <Check className="h-3.5 w-3.5 text-onbrand" strokeWidth={3} />
                  )}
                </span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 w-full rounded-full bg-brand py-3 text-base font-medium text-onbrand transition disabled:opacity-50"
      >
        {saving ? "保存中…" : "保存"}
      </button>
    </BottomSheet>
  );
}
