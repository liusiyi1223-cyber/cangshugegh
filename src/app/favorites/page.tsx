"use client";

import { useCallback, useEffect, useState } from "react";

type Favorite = {
  id: string;
  title: string;
  cover?: string | null;
  author?: string | null;
  platform?: string | null;
  canonicalUrl: string;
  status?: string;
  tags?: string[];
};

function FavoriteItem({
  f,
  onChanged,
}: {
  f: Favorite;
  onChanged: () => void;
}) {
  const [tag, setTag] = useState("");
  const broken = f.status === "BROKEN";

  async function addTag() {
    const t = tag.trim();
    if (!t) return;
    const res = await fetch(`/api/favorites/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: [...(f.tags ?? []), t] }),
    });
    if (res.ok) {
      setTag("");
      onChanged();
    }
  }

  async function toggleStatus() {
    const res = await fetch(`/api/favorites/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: broken ? "ACTIVE" : "BROKEN" }),
    });
    if (res.ok) onChanged();
  }

  return (
    <li
      className={`flex gap-3 rounded border p-3 ${
        broken ? "border-red-200 bg-red-50 opacity-70" : "border-gray-200"
      }`}
    >
      {f.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={f.cover}
          alt=""
          referrerPolicy="no-referrer"
          className="h-16 w-24 shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <a
          href={f.canonicalUrl}
          target="_blank"
          rel="noreferrer"
          className={`block truncate font-medium text-blue-600 hover:underline ${
            broken ? "line-through" : ""
          }`}
        >
          {f.title}
        </a>
        <p className="text-sm text-gray-500">
          {f.platform}
          {f.author ? ` · ${f.author}` : ""}
          {broken && (
            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">
              已失效
            </span>
          )}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1">
          {(f.tags ?? []).map((t) => (
            <span
              key={t}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {t}
            </span>
          ))}
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="+ 标签"
            className="w-20 rounded border border-gray-300 px-2 py-0.5 text-xs"
          />
          <button
            type="button"
            onClick={toggleStatus}
            className="ml-auto text-xs text-gray-500 hover:text-red-600"
          >
            {broken ? "恢复" : "标记失效"}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function FavoritesPage() {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");

  const load = useCallback(async (query?: string) => {
    const res = await fetch(
      query ? `/api/favorites?q=${encodeURIComponent(query)}` : "/api/favorites"
    );
    if (res.status === 401) {
      setLoggedIn(false);
      return;
    }
    setLoggedIn(true);
    if (res.ok) setFavorites(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setText("");
      setMessage(data.alreadyExists ? "已收藏过该视频" : "收藏成功");
      await load();
    } else {
      setMessage(data.error ?? "出错了");
      if (data.url) {
        setManualUrl(data.url);
        setShowManual(true);
      }
    }
  }

  async function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualUrl.trim() || !manualTitle.trim()) return;
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: manualUrl, title: manualTitle }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setManualUrl("");
      setManualTitle("");
      setShowManual(false);
      setMessage(data.alreadyExists ? "已收藏过该视频" : "收藏成功");
      await load();
    } else {
      setMessage(data.error ?? "出错了");
    }
  }

  if (loggedIn === false) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="mb-4">请先登录后再使用收藏功能。</p>
        <a href="/login" className="text-blue-600 underline">
          去登录
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">我的收藏</h1>

      <form onSubmit={onSubmit} className="mb-4 space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴视频分享文本，例如：https://b23.tv/xxx"
          rows={3}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "收藏中…" : "收藏"}
          </button>
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="text-sm text-blue-600 underline"
          >
            {showManual ? "收起手动添加" : "手动添加"}
          </button>
        </div>
      </form>

      {showManual && (
        <form onSubmit={onManualSubmit} className="mb-4 space-y-2 rounded border border-gray-200 p-3">
          <input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="视频链接"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
          <input
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="标题"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
          >
            保存
          </button>
        </form>
      )}

      {message && <p className="mb-4 text-sm text-red-600">{message}</p>}

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            load(e.target.value);
          }}
          placeholder="搜索标题…"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <ul className="space-y-4">
        {favorites.map((f) => (
          <FavoriteItem key={f.id} f={f} onChanged={load} />
        ))}
        {favorites.length === 0 && (
          <p className="text-gray-500">还没有收藏，粘贴一个链接试试。</p>
        )}
      </ul>
    </main>
  );
}
