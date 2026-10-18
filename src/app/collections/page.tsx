"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MoreHorizontal, Pencil, Plus, Trash } from "lucide-react";
import { iconFor } from "@/lib/iconFor";
import BottomNav from "@/components/mobile/BottomNav";
import BottomSheet from "@/components/mobile/BottomSheet";

type Collection = {
  id: string;
  name: string;
  _count?: { favorites: number };
};

type Favorite = {
  id: string;
  collections?: { id: string }[];
};

type Row = {
  id: string;
  name: string;
  count: number;
  icon?: string;
  collection?: Collection;
};

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [actionTarget, setActionTarget] = useState<Collection | null>(null);
  const [renameTarget, setRenameTarget] = useState<Collection | null>(null);
  const [renameName, setRenameName] = useState("");

  const load = useCallback(async () => {
    const [cr, fr] = await Promise.all([
      fetch("/api/collections"),
      fetch("/api/favorites"),
    ]);
    if (cr.ok) setCollections(await cr.json());
    if (fr.ok) setFavorites(await fr.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    const n = newName.trim();
    if (!n) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n }),
    });
    if (res.ok) {
      setNewName("");
      setNewOpen(false);
      load();
    }
  }

  async function rename() {
    if (!renameTarget) return;
    const n = renameName.trim();
    if (!n) return;
    const res = await fetch(`/api/collections/${renameTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n }),
    });
    if (res.ok) {
      setRenameName("");
      setRenameTarget(null);
      load();
    }
  }

  async function remove(c: Collection) {
    if (!confirm("删除收藏夹不会删除收藏本身，确定删除？")) return;
    const res = await fetch(`/api/collections/${c.id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const unfiledCount = favorites.filter((f) => !f.collections?.length).length;

  const rows: Row[] = [
    { id: "all", name: "全部收藏", count: favorites.length, icon: "all" },
    { id: "unfiled", name: "未分类", count: unfiledCount, icon: "unfiled" },
    ...collections.map((c) => ({
      id: c.id,
      name: c.name,
      count: c._count?.favorites ?? 0,
      collection: c,
    })),
  ];

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[1000px] bg-white pb-[90px]">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-sand bg-white px-4 py-3.5">
        <h1 className="text-lg font-bold tracking-tight text-ink">收藏夹</h1>
        <button
          onClick={() => {
            setNewName("");
            setNewOpen(true);
          }}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[11px] bg-brand px-3.5 text-[13px] font-semibold text-white"
        >
          <Plus size={16} strokeWidth={2} />
          新建
        </button>
      </header>

      <main className="px-4 pt-2">
        <div>
          {rows.map((row) => {
            const Icon = row.icon === "all" ? iconFor("全部") : iconFor(row.name);
            return (
              <div
                key={row.id}
                className="flex items-center border-b border-sand last:border-b-0"
              >
                <button
                  onClick={() =>
                    router.push(
                      row.id === "all"
                        ? "/favorites"
                        : `/favorites?collectionId=${row.id}`
                    )
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 py-3.5 text-left"
                >
                  <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-brand-soft text-[#647584]">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {row.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {row.count} 条收藏
                    </span>
                  </span>
                  {row.collection ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameName(row.name);
                          setRenameTarget(row.collection!);
                        }}
                        aria-label="重命名收藏夹"
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-brand-soft"
                      >
                        <Pencil size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionTarget(row.collection!);
                        }}
                        aria-label="删除收藏夹"
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-brand-soft"
                      >
                        <MoreHorizontal size={16} strokeWidth={2} />
                      </button>
                    </>
                  ) : (
                    <ChevronRight size={16} className="text-[#aaa]" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </main>

      <BottomSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="新建收藏夹"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="收藏夹名称"
          autoFocus
          className="w-full rounded-[11px] border border-sand bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
        />
        <button
          onClick={create}
          className="mt-4 w-full rounded-[11px] bg-brand py-3 text-[13px] font-semibold text-white"
        >
          创建
        </button>
      </BottomSheet>

      <BottomSheet
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="重命名收藏夹"
      >
        <input
          value={renameName}
          onChange={(e) => setRenameName(e.target.value)}
          placeholder="收藏夹名称"
          autoFocus
          className="w-full rounded-[11px] border border-sand bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
        />
        <button
          onClick={rename}
          className="mt-4 w-full rounded-[11px] bg-brand py-3 text-[13px] font-semibold text-white"
        >
          保存
        </button>
      </BottomSheet>

      <BottomSheet open={!!actionTarget} onClose={() => setActionTarget(null)}>
        <button
          onClick={() => {
            if (actionTarget) {
              setRenameName(actionTarget.name);
              setRenameTarget(actionTarget);
            }
            setActionTarget(null);
          }}
          className="flex h-12 w-full items-center gap-3 px-1 text-left text-[15px] text-ink active:bg-sand"
        >
          <Pencil size={16} strokeWidth={1.8} />
          <span>重命名</span>
        </button>
        <button
          onClick={() => {
            if (actionTarget) remove(actionTarget);
            setActionTarget(null);
          }}
          className="flex h-12 w-full items-center gap-3 px-1 text-left text-[15px] text-red-600 active:bg-sand"
        >
          <Trash size={16} strokeWidth={1.8} />
          <span>删除</span>
        </button>
      </BottomSheet>

      <BottomNav />
    </div>
  );
}
