"use client";

import { useCallback, useEffect, useState } from "react";

type Favorite = {
  id: string;
  title: string;
  cover?: string | null;
  author?: string | null;
  platform?: string | null;
  canonicalUrl: string;
};

export default function FavoritesPage() {
  const [text, setText] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/favorites");
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

      <form onSubmit={onSubmit} className="mb-6 space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴视频分享文本，例如：https://b23.tv/xxx"
          rows={3}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "收藏中…" : "收藏"}
        </button>
      </form>

      {message && <p className="mb-4 text-sm text-red-600">{message}</p>}

      <ul className="space-y-4">
        {favorites.map((f) => (
          <li key={f.id} className="flex gap-3 rounded border border-gray-200 p-3">
            {f.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.cover}
                alt=""
                referrerPolicy="no-referrer"
                className="h-16 w-24 shrink-0 rounded object-cover"
              />
            )}
            <div className="min-w-0">
              <a
                href={f.canonicalUrl}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-medium text-blue-600 hover:underline"
              >
                {f.title}
              </a>
              <p className="text-sm text-gray-500">
                {f.platform}
                {f.author ? ` · ${f.author}` : ""}
              </p>
            </div>
          </li>
        ))}
        {favorites.length === 0 && (
          <p className="text-gray-500">还没有收藏，粘贴一个链接试试。</p>
        )}
      </ul>
    </main>
  );
}
