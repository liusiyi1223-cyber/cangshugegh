"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Image as ImageIcon,
  RotateCcw,
  Tag,
  Trash,
} from "lucide-react";
import { compressImage } from "@/lib/image";
import type { FavoriteWithCollections } from "@/lib/types";
import TagEditSheet from "./TagEditSheet";

export default function FavoriteActionSheet({
  favorite,
  onClose,
  onChanged,
}: {
  favorite: FavoriteWithCollections | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    if (!favorite) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [favorite]);

  useEffect(() => {
    setCoverError(false);
  }, [favorite?.id]);

  if (!favorite) return null;

  const f = favorite;
  const broken = f.status === "BROKEN";

  async function toggleStatus() {
    setBusy(true);
    const res = await fetch(`/api/favorites/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: broken ? "ACTIVE" : "BROKEN" }),
    });
    setBusy(false);
    if (res.ok) {
      onChanged();
      onClose();
    }
  }

  async function remove() {
    if (!confirm("确定删除这条收藏？")) return;
    setBusy(true);
    const res = await fetch(`/api/favorites/${f.id}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (res.ok) {
      onChanged();
      onClose();
    }
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImage(file, 1000);
      const res = await fetch(`/api/favorites/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover: dataUrl }),
      });
      if (res.ok) {
        onChanged();
        onClose();
      }
    } catch {
      // 上传失败则忽略，保持原封面
    } finally {
      setBusy(false);
    }
  }

  const rowClass =
    "flex h-12 w-full items-center gap-3 px-4 text-left text-[15px] text-ink active:bg-sand";
  const iconClass = "h-5 w-5 text-muted";

  return (
    <>
      <div className="fixed inset-0 z-[60]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />

        <div
          className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85vh] max-w-md flex-col rounded-t-2xl bg-cream animate-[sheet-up_0.25s_ease-out]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex justify-center pt-2.5">
            <div className="h-1 w-10 rounded-full bg-sand" />
          </div>

          <div className="flex gap-3 px-4 pb-3 pt-3">
            <div className="h-[54px] w-[96px] shrink-0 overflow-hidden rounded-lg bg-brand-soft">
              {f.cover && !coverError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.cover}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setCoverError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
                {f.title}
              </h2>
              <p className="mt-1 line-clamp-1 text-xs text-muted">
                {[f.author, f.platform].filter(Boolean).join(" · ") || " "}
              </p>
            </div>
          </div>

          <div className="overflow-y-auto pb-2">
            <a
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className={rowClass}
            >
              <ExternalLink className={iconClass} strokeWidth={1.8} />
              <span>打开原链接</span>
            </a>

            <button
              type="button"
              className={rowClass}
              onClick={() => setTagOpen(true)}
            >
              <Tag className={iconClass} strokeWidth={1.8} />
              <span>编辑</span>
            </button>

            <label className={rowClass}>
              <ImageIcon className={iconClass} strokeWidth={1.8} />
              <span>{f.cover ? "更换封面" : "补封面"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCover}
                className="hidden"
              />
            </label>

            <button
              type="button"
              className={rowClass}
              onClick={toggleStatus}
              disabled={busy}
            >
              {broken ? (
                <RotateCcw className={iconClass} strokeWidth={1.8} />
              ) : (
                <AlertTriangle className={iconClass} strokeWidth={1.8} />
              )}
              <span>{broken ? "恢复为正常" : "标记为已失效"}</span>
            </button>

            <button
              type="button"
              className={`${rowClass} text-red-600`}
              onClick={remove}
              disabled={busy}
            >
              <Trash className="h-5 w-5 text-red-600" strokeWidth={1.8} />
              <span>删除</span>
            </button>
          </div>

          <div className="px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-12 w-full rounded-full bg-surface text-[15px] font-medium text-ink ring-1 ring-sand active:bg-sand"
            >
              取消
            </button>
          </div>
        </div>
      </div>

      <TagEditSheet
        favorite={f}
        open={tagOpen}
        onClose={() => setTagOpen(false)}
        onSaved={() => {
          setTagOpen(false);
          onClose();
          onChanged();
        }}
      />
    </>
  );
}
