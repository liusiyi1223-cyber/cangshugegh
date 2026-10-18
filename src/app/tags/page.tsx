"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Tag as TagIcon, X } from "lucide-react";
import type { FavoriteWithCollections } from "@/lib/types";
import BottomNav from "@/components/mobile/BottomNav";
import BottomSheet from "@/components/mobile/BottomSheet";
import FavoriteActionSheet from "@/components/mobile/FavoriteActionSheet";
import FavoriteCard from "@/components/mobile/FavoriteCard";

export default function TagsPage() {
  const [favorites, setFavorites] = useState<FavoriteWithCollections[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [activeFavorite, setActiveFavorite] =
    useState<FavoriteWithCollections | null>(null);

  const load = useCallback(async () => {
    const [fr, ur] = await Promise.all([
      fetch("/api/favorites"),
      fetch("/api/auth/me"),
    ]);
    if (fr.ok) setFavorites(await fr.json());
    if (ur.ok) setUserTags((await ur.json()).tags ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tagCounts = new Map<string, number>();
  for (const f of favorites) {
    for (const t of f.tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const filtered = selectedTag
    ? favorites.filter((f) => (f.tags ?? []).includes(selectedTag))
    : [];

  async function createTag() {
    const name = newTagName.trim();
    if (!name || userTags.includes(name)) return;
    const next = [...userTags, name];
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    });
    if (res.ok) {
      setUserTags(next);
      setNewTagName("");
      setNewTagOpen(false);
    }
  }

  async function removeTag(tag: string) {
    if (!confirm(`确定删除标签「${tag}」？收藏本身不会被删除。`)) return;
    const next = userTags.filter((t) => t !== tag);
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    });
    if (res.ok) setUserTags(next);
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[1000px] bg-white pb-[90px]">
      {selectedTag ? (
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-sand bg-white px-4 py-3">
          <button
            onClick={() => setSelectedTag(null)}
            aria-label="返回"
            className="grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-brand-soft"
          >
            <ArrowLeft size={22} strokeWidth={1.8} />
          </button>
          <h1 className="truncate text-lg font-bold tracking-tight text-ink">
            {selectedTag}
          </h1>
        </header>
      ) : (
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand bg-white px-4 py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink">标签</h1>
            <p className="mt-0.5 text-xs text-muted">管理你的标签</p>
          </div>
          <button
            onClick={() => {
              setNewTagName("");
              setNewTagOpen(true);
            }}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[11px] bg-brand px-3.5 text-[13px] font-semibold text-white"
          >
            <Plus size={16} strokeWidth={2} />
            新建标签
          </button>
        </header>
      )}

      <main className="px-4 pt-4">
        {selectedTag ? (
          <div className="divide-y divide-sand">
            {filtered.map((f) => (
              <FavoriteCard key={f.id} favorite={f} onOpen={setActiveFavorite} />
            ))}
            {filtered.length === 0 && (
              <p className="py-16 text-center text-sm text-muted">
                该标签下还没有收藏
              </p>
            )}
          </div>
        ) : userTags.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand bg-white px-4 py-16 text-center text-muted">
            还没有标签，点右上角「新建标签」创建一个。
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {[...userTags]
              .sort((a, b) => (tagCounts.get(b) ?? 0) - (tagCounts.get(a) ?? 0))
              .map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-[11px] border border-sand bg-white px-3 py-2.5 text-[13px] text-ink"
              >
                <button
                  onClick={() => setSelectedTag(tag)}
                  className="inline-flex items-center gap-1.5"
                >
                  <TagIcon size={14} strokeWidth={1.8} />
                  {tag}
                  <span className="text-[11px] text-muted">
                    {tagCounts.get(tag) ?? 0}
                  </span>
                </button>
                <button
                  onClick={() => removeTag(tag)}
                  aria-label={`删除标签 ${tag}`}
                  className="text-muted hover:text-red-600"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        )}
      </main>

      <FavoriteActionSheet
        favorite={activeFavorite}
        onClose={() => setActiveFavorite(null)}
        onChanged={load}
      />

      <BottomSheet
        open={newTagOpen}
        onClose={() => setNewTagOpen(false)}
        title="新建标签"
      >
        <input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="标签名称"
          autoFocus
          className="w-full rounded-[11px] border border-sand bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
        />
        <button
          onClick={createTag}
          disabled={!newTagName.trim()}
          className="mt-4 w-full rounded-[11px] bg-brand py-3 text-[13px] font-semibold text-white disabled:opacity-55"
        >
          创建
        </button>
      </BottomSheet>

      {!selectedTag && <BottomNav />}
    </div>
  );
}
