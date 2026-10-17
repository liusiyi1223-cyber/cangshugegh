"use client";

import { useCallback, useEffect, useState } from "react";

type Collection = {
  id: string;
  name: string;
  _count?: { favorites: number };
};

type Favorite = {
  id: string;
  title: string;
  cover?: string | null;
  author?: string | null;
  platform?: string | null;
  canonicalUrl: string;
  status?: string;
  tags?: string[];
  collections?: { id: string; name: string }[];
};

function FavoriteItem({
  f,
  collections,
  onChanged,
}: {
  f: Favorite;
  collections: Collection[];
  onChanged: () => void;
}) {
  const [tag, setTag] = useState("");
  const broken = f.status === "BROKEN";
  const current = f.collections ?? [];
  const currentIds = new Set(current.map((c) => c.id));
  const addable = collections.filter((c) => !currentIds.has(c.id));

  async function patchCollectionIds(collectionIds: string[]) {
    const res = await fetch(`/api/favorites/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionIds }),
    });
    if (res.ok) onChanged();
  }

  function addToCollection(id: string) {
    patchCollectionIds([...current.map((c) => c.id), id]);
  }

  function removeFromCollection(id: string) {
    patchCollectionIds(current.map((c) => c.id).filter((cid) => cid !== id));
  }

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

  async function remove() {
    if (!confirm("确定删除这条收藏？")) return;
    const res = await fetch(`/api/favorites/${f.id}`, { method: "DELETE" });
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
          {current.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
            >
              {c.name}
              <button
                type="button"
                onClick={() => removeFromCollection(c.id)}
                className="text-blue-400 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
          {addable.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addToCollection(e.target.value);
              }}
              className="rounded border border-gray-300 px-1 py-0.5 text-xs text-gray-500"
            >
              <option value="">+ 收藏夹</option>
              {addable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

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
          <button
            type="button"
            onClick={remove}
            className="text-xs text-gray-500 hover:text-red-600"
          >
            删除
          </button>
        </div>
      </div>
    </li>
  );
}

export default function FavoritesPage() {
  const [text, setText] = useState("");
  const [bookmarklet, setBookmarklet] = useState("");
  const [q, setQ] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");

  const load = useCallback(async (query?: string, cid?: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (cid && cid !== "all") params.set("collectionId", cid);
    const qs = params.toString();
    const res = await fetch(`/api/favorites${qs ? `?${qs}` : ""}`);
    if (res.status === 401) {
      setLoggedIn(false);
      return;
    }
    setLoggedIn(true);
    if (res.ok) setFavorites(await res.json());
  }, []);

  const loadCollections = useCallback(async () => {
    const res = await fetch("/api/collections");
    if (res.ok) setCollections(await res.json());
  }, []);

  useEffect(() => {
    load();
    loadCollections();
  }, [load, loadCollections]);

  useEffect(() => {
    setBookmarklet(
      `javascript:(function(){location.href='${window.location.origin}/favorites?url='+encodeURIComponent(location.href)})()`
    );
    const url = new URLSearchParams(window.location.search).get("url");
    if (url) setText(url);
  }, []);

  const refresh = useCallback(() => {
    load(q, collectionFilter);
  }, [load, q, collectionFilter]);

  function selectCollection(cid: string) {
    setCollectionFilter(cid);
    load(q, cid);
  }

  async function createCollection() {
    const name = newCollectionName.trim();
    if (!name) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setNewCollectionName("");
      await loadCollections();
    }
  }

  async function deleteCollection(id: string) {
    if (!confirm("删除该收藏夹？收藏本身不会被删除。")) return;
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (collectionFilter === id) setCollectionFilter("all");
      await loadCollections();
      await load(q, collectionFilter === id ? "all" : collectionFilter);
    }
  }

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
      await load(q, collectionFilter);
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
      await load(q, collectionFilter);
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

  const chipClass = (active: boolean) =>
    `rounded px-3 py-1 text-sm ${
      active ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">我的收藏</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => selectCollection("all")} className={chipClass(collectionFilter === "all")}>
          全部
        </button>
        <button onClick={() => selectCollection("unfiled")} className={chipClass(collectionFilter === "unfiled")}>
          未分类
        </button>
        {collections.map((c) => (
          <span key={c.id} className="flex items-center gap-1">
            <button onClick={() => selectCollection(c.id)} className={chipClass(collectionFilter === c.id)}>
              {c.name} ({c._count?.favorites ?? 0})
            </button>
            <button
              onClick={() => deleteCollection(c.id)}
              className="text-xs text-gray-400 hover:text-red-600"
              title="删除收藏夹"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createCollection();
            }
          }}
          placeholder="新建收藏夹"
          className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          onClick={createCollection}
          className="rounded bg-gray-800 px-3 py-1 text-sm text-white"
        >
          新建
        </button>
      </div>

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
            load(e.target.value, collectionFilter);
          }}
          placeholder="搜索标题…"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <ul className="space-y-4">
        {favorites.map((f) => (
          <FavoriteItem key={f.id} f={f} collections={collections} onChanged={refresh} />
        ))}
        {favorites.length === 0 && (
          <p className="text-gray-500">还没有收藏，粘贴一个链接试试。</p>
        )}
      </ul>

      <details className="mt-6 text-sm text-gray-600">
        <summary className="cursor-pointer">书签小工具（一键收藏）</summary>
        <p className="mt-2">
          把下面这个链接拖到浏览器书签栏。之后在任意视频页点一下，就会跳转到本页并自动填好链接，再点「收藏」即可。
        </p>
        <p className="mt-2">
          <a
            href={bookmarklet}
            className="rounded bg-gray-100 px-3 py-1 text-blue-600 underline"
          >
            收藏到本页
          </a>
        </p>
      </details>
    </main>
  );
}
