"use client";

import { useEffect, useRef, useState } from "react";
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
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [userTags, setUserTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTitle(favorite.title ?? "");
      setTags(favorite.tags ?? []);
      setInput("");
      setSaving(false);
      fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => setUserTags(u?.tags ?? []));
    }
  }, [open, favorite]);

  useEffect(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [open, title]);

  function addTag(t: string) {
    const tag = t.trim();
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/favorites/${favorite.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, tags }),
    });
    if (res.ok) {
      // 同步新标签到标签库
      const newTags = tags.filter((t) => !userTags.includes(t));
      if (newTags.length > 0) {
        const nextTags = [...userTags, ...newTags];
        await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: nextTags }),
        });
      }
    }
    setSaving(false);
    if (res.ok) onSaved();
  }

  const addableUserTags = userTags.filter((t) => !tags.includes(t));

  return (
    <BottomSheet open={open} onClose={onClose} title="编辑" zIndex="z-[70]">
      <label className="mb-1.5 block text-xs font-semibold text-ink">
        标题
      </label>
      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题"
        rows={1}
        className="w-full resize-none overflow-hidden rounded-xl border border-sand bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
      />

      <label className="mb-1.5 mt-4 block text-xs font-semibold text-ink">
        标签
      </label>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-sm text-ink ring-1 ring-sand"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="text-ink/60 hover:text-ink"
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

      {addableUserTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {addableUserTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addTag(t)}
              className="rounded-full bg-tag px-2.5 py-1 text-[12px] text-muted"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
              setInput("");
            }
          }}
          placeholder="新建标签"
          className="min-w-0 flex-1 rounded-full bg-surface px-4 py-2.5 text-base text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
        />
        <button
          type="button"
          onClick={() => {
            addTag(input);
            setInput("");
          }}
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-onbrand ring-1 ring-sand"
        >
          添加
        </button>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 w-full rounded-full bg-brand py-3 text-base font-medium text-onbrand ring-1 ring-sand transition disabled:opacity-50"
      >
        {saving ? "保存中…" : "保存"}
      </button>
    </BottomSheet>
  );
}
