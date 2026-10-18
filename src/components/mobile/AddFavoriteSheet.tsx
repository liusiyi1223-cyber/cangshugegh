"use client";

import { useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";

export default function AddFavoriteSheet({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setText("");
      setUrl("");
      setTitle("");
      setError("");
      setShowManual(false);
      setLoading(false);
    }
  }, [open]);

  async function handleParse() {
    const t = text.trim();
    if (!t) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setText("");
      onClose();
      onAdded();
    } else {
      setError(data.error ?? "出错了");
      setShowManual(true);
      if (data.url) setUrl(data.url);
    }
  }

  async function handleManual() {
    const u = url.trim();
    const t = title.trim();
    if (!u || !t) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: u, title: t }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      onClose();
      onAdded();
    } else {
      setError(data.error ?? "出错了");
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="添加收藏">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴分享文本或链接…"
        autoFocus
        rows={4}
        className="w-full resize-none rounded-xl bg-surface p-3 text-base text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
      />

      <button
        type="button"
        onClick={handleParse}
        disabled={loading}
        className="mt-3 w-full rounded-full bg-brand py-3 text-base font-medium text-onbrand transition disabled:opacity-50"
      >
        {loading ? "解析中…" : "解析并保存"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {showManual && (
        <div className="mt-4 rounded-xl bg-surface p-3 ring-1 ring-sand">
          <p className="text-sm font-medium text-ink">手动添加</p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="链接"
            className="mt-2 w-full rounded-lg bg-cream px-3 py-2 text-base text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            className="mt-2 w-full rounded-lg bg-cream px-3 py-2 text-base text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
          />
          <button
            type="button"
            onClick={handleManual}
            disabled={loading}
            className="mt-3 w-full rounded-full bg-surface py-2.5 text-sm font-medium text-ink ring-1 ring-sand transition disabled:opacity-50"
          >
            {loading ? "保存中…" : "手动保存"}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
