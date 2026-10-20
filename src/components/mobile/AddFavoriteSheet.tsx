"use client";

import { useEffect, useRef, useState } from "react";
import BottomSheet from "./BottomSheet";
import { extractTitle, extractUrls } from "@/lib/extract";
import { PLATFORMS, detectPlatform } from "@/lib/platforms";

function parseTags(s: string): string[] {
  return s
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

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
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [platform, setPlatform] = useState("other");
  const [userTags, setUserTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIcon, setAiIcon] = useState<string | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setText("");
    setTitle("");
    setTagInput("");
    setPlatform("other");
    setError("");
    setShowManual(false);
    setManualUrl("");
    setManualTitle("");
    setLoading(false);
    setAiTags([]);
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setUserTags(u?.tags ?? []));
  }, [open]);

  useEffect(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [title]);

  function toggleTag(tag: string) {
    const tags = parseTags(tagInput);
    setTagInput(
      tags.includes(tag)
        ? tags.filter((t) => t !== tag).join(", ")
        : [...tags, tag].join(", ")
    );
  }

  async function syncNewTags(tagsInput: string) {
    const newTags = parseTags(tagsInput).filter((t) => !userTags.includes(t));
    if (newTags.length === 0) return;
    const next = [...userTags, ...newTags];
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    });
    if (res.ok) setUserTags(next);
  }

  async function handleParse() {
    const t = text.trim();
    if (!t) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: t,
        title: title || undefined,
        tags: parseTags(tagInput),
        platform,
        icon: aiIcon || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      await syncNewTags(tagInput);
      onClose();
      onAdded();
    } else {
      setError(data.error ?? "出错了");
      setShowManual(true);
      if (data.url) setManualUrl(data.url);
    }
  }

  async function handleManual() {
    const u = manualUrl.trim();
    const t = manualTitle.trim();
    if (!u || !t) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: u,
        title: t,
        tags: parseTags(tagInput),
        platform,
        icon: aiIcon || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      await syncNewTags(tagInput);
      onClose();
      onAdded();
    } else {
      setError(data.error ?? "出错了");
    }
  }

  async function requestAiTags() {
    const t = title.trim();
    if (!t || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiTags(data.tags ?? []);
        if (data.icon) setAiIcon(data.icon);
      }
    } catch {
      // AI 失败静默忽略
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="添加收藏" variant="center">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const t = extractTitle(e.target.value);
          if (t) setTitle(t);
          const urls = extractUrls(e.target.value);
          if (urls.length > 0) {
            const detected = detectPlatform(urls[0]);
            if (detected) setPlatform(detected);
          }
        }}
        placeholder="粘贴分享文本或链接…"
        autoFocus
        rows={3}
        className="w-full resize-none rounded-xl bg-cream p-3 text-base text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
      />

      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题（自动识别，可修改）"
        rows={1}
        className="mt-2 w-full resize-none overflow-hidden rounded-xl bg-cream px-3 py-2.5 text-sm text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
      />

      {userTags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {userTags.map((tag) => {
            const selected = parseTags(tagInput).includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  selected ? "bg-brand text-onbrand" : "bg-brand-soft text-ink"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      <input
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        placeholder="新建标签（逗号分隔）"
        className="mt-2 w-full rounded-xl bg-cream px-3 py-2.5 text-sm text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={requestAiTags}
          disabled={aiLoading || !title.trim()}
          className="rounded-full bg-brand-soft px-2.5 py-1 text-xs text-ink ring-1 ring-sand disabled:opacity-50"
        >
          {aiLoading ? "推荐中…" : "AI 推荐标签"}
        </button>
        {aiTags.map((tag) => {
          const selected = parseTags(tagInput).includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                selected ? "bg-brand text-onbrand" : "bg-tag text-muted"
              }`}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <span className="shrink-0 text-xs text-muted">平台</span>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2.5 text-sm text-ink ring-1 ring-sand focus:outline-none focus:ring-brand"
        >
          <option value="other">其他 / 自动识别</option>
          {PLATFORMS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleParse}
          disabled={loading || !text.trim()}
          className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-onbrand ring-1 ring-sand transition disabled:opacity-50"
        >
          {loading ? "解析中…" : "解析并保存"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {showManual && (
        <div className="mt-4 rounded-xl bg-cream p-3 ring-1 ring-sand">
          <p className="text-sm font-medium text-ink">手动添加</p>
          <input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="链接 *"
            className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-base text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
          />
          <input
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="标题 *"
            className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-base text-ink ring-1 ring-sand placeholder:text-muted focus:outline-none focus:ring-brand"
          />
          <button
            type="button"
            onClick={handleManual}
            disabled={loading}
            className="mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-medium text-ink ring-1 ring-sand transition disabled:opacity-50"
          >
            {loading ? "保存中…" : "手动保存"}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
