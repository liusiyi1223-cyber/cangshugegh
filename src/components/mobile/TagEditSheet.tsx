"use client";

import { useEffect, useState } from "react";
import type { Favorite } from "@prisma/client";
import { X } from "lucide-react";
import BottomSheet from "./BottomSheet";

export default function TagEditSheet({
  favorite,
  open,
  onClose,
  onSaved,
}: {
  favorite: Favorite;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTags(favorite.tags ?? []);
      setInput("");
      setSaving(false);
    }
  }, [open, favorite]);

  function addTag() {
    const t = input.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/favorites/${favorite.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    setSaving(false);
    if (res.ok) onSaved();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="编辑标签" zIndex="z-[70]">
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-sm text-brand-dark"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="text-brand-dark/60 hover:text-brand-dark"
                aria-label={`移除标签 ${t}`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="py-2 text-sm text-muted">还没有标签</p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="添加标签"
          className="min-w-0 flex-1 rounded-full bg-surface px-4 py-2.5 text-base text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
        />
        <button
          type="button"
          onClick={addTag}
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-onbrand"
        >
          添加
        </button>
      </div>

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
