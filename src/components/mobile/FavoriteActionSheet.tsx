"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  ExternalLink,
  Image as ImageIcon,
  StickyNote,
  Tag,
  Trash,
} from "lucide-react";
import { compressImage } from "@/lib/image";
import type { FavoriteWithCollections } from "@/lib/types";
import BottomSheet from "./BottomSheet";
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
  const [copied, setCopied] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    if (!favorite) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [favorite]);

  if (!favorite) return null;

  const f = favorite;

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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(f.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板不可用
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

  async function saveNote() {
    setNoteBusy(true);
    setNoteError("");
    const res = await fetch(`/api/favorites/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteText }),
    });
    const data = await res.json().catch(() => ({}));
    setNoteBusy(false);
    if (res.ok) {
      setNoteOpen(false);
      onChanged();
    } else {
      setNoteError(data.error ?? "保存失败");
    }
  }

  const rowClass =
    "flex h-12 w-full items-center gap-3 px-4 text-left text-[15px] text-ink active:bg-sand";
  const iconWrap =
    "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f3f4f6] text-ink";
  const iconClass = "h-4 w-4";

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

          <div className="overflow-y-auto pb-2 pt-2">
            <a
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className={rowClass}
              onClick={() => {
                fetch(`/api/favorites/${f.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ incrementVisit: true }),
                })
                  .then(() => onChanged())
                  .catch(() => {});
              }}
            >
              <span className={iconWrap}>
                <ExternalLink className={iconClass} strokeWidth={1.8} />
              </span>
              <span>打开原链接</span>
            </a>

            <button
              type="button"
              className={rowClass}
              onClick={copyLink}
            >
              <span className={iconWrap}>
                <Copy className={iconClass} strokeWidth={1.8} />
              </span>
              <span>{copied ? "已复制" : "复制原链接"}</span>
            </button>

            <button
              type="button"
              className={rowClass}
              onClick={() => setTagOpen(true)}
            >
              <span className={iconWrap}>
                <Tag className={iconClass} strokeWidth={1.8} />
              </span>
              <span>编辑</span>
            </button>

            <button
              type="button"
              className={rowClass}
              onClick={() => {
                setNoteText(f.note ?? "");
                setNoteError("");
                setNoteOpen(true);
              }}
            >
              <span className={iconWrap}>
                <StickyNote className={iconClass} strokeWidth={1.8} />
              </span>
              <span>笔记</span>
            </button>

            <label className={rowClass}>
              <span className={iconWrap}>
                <ImageIcon className={iconClass} strokeWidth={1.8} />
              </span>
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
              className={`${rowClass} text-red-600`}
              onClick={remove}
              disabled={busy}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                <Trash className={iconClass} strokeWidth={1.8} />
              </span>
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

      <BottomSheet open={noteOpen} onClose={() => setNoteOpen(false)} title="笔记">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="写点笔记…"
          rows={6}
          className="w-full resize-none rounded-xl border border-sand bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
        />
        {noteError && <p className="mt-2 text-xs text-danger">{noteError}</p>}
        <button
          onClick={saveNote}
          disabled={noteBusy}
          className="mt-4 w-full rounded-xl bg-ink py-3 text-[13px] font-semibold text-white disabled:opacity-55"
        >
          {noteBusy ? "保存中…" : "保存"}
        </button>
      </BottomSheet>
    </>
  );
}
