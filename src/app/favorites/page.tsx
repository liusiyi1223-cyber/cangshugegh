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
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sand transition hover:-translate-y-1 hover:shadow-lg ${
        broken ? "opacity-80" : ""
      }`}
    >
      <div className="relative aspect-video w-full bg-sand">
        {f.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={f.cover}
            alt=""
            referrerPolicy="no-referrer"
            className={`h-full w-full object-cover ${broken ? "grayscale" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            无封面
          </div>
        )}

        {broken && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            已失效
          </span>
        )}

        {f.platform && (
          <span className="absolute right-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">
            {f.platform}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <a
          href={f.canonicalUrl}
          target="_blank"
          rel="noreferrer"
          className={`line-clamp-2 text-sm font-medium text-ink hover:text-brand ${
            broken ? "line-through" : ""
          }`}
        >
          {f.title}
        </a>

        {f.author && <p className="truncate text-xs text-muted">{f.author}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-1">
          {current.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-dark"
            >
              {c.name}
              <button
                type="button"
                onClick={() => removeFromCollection(c.id)}
                className="text-brand/70 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
          {(f.tags ?? []).map((t) => (
            <span
              key={t}
              className="rounded-full bg-cream px-2 py-0.5 text-xs text-muted ring-1 ring-sand"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-1 flex items-center gap-1 border-t border-sand pt-2">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="标签"
            className="w-14 rounded-md border border-sand bg-cream px-2 py-1 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none"
          />
          {addable.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addToCollection(e.target.value);
              }}
              className="rounded-md border border-sand bg-cream px-1 py-1 text-xs text-muted focus:border-brand focus:outline-none"
            >
              <option value="">+ 收藏夹</option>
              {addable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={toggleStatus}
            className="ml-auto text-xs text-muted hover:text-brand"
            title={broken ? "恢复" : "标记失效"}
          >
            {broken ? "恢复" : "失效"}
          </button>
          <button
            type="button"
            onClick={remove}
            className="text-xs text-muted hover:text-red-600"
          >
            删除
          </button>
        </div>
      </div>
    </div>
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
      <main className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-sand">
          <p className="mb-4 text-ink">请先登录后再使用收藏功能。</p>
          <a
            href="/login"
            className="inline-block rounded-full bg-brand px-5 py-2 text-sm text-white hover:bg-brand-dark"
          >
            去登录
          </a>
        </div>
      </main>
    );
  }

  const chipClass = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm transition ${
      active
        ? "bg-ink text-white"
        : "bg-white text-muted ring-1 ring-sand hover:text-ink hover:ring-ink/20"
    }`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">我的收藏</h1>
          <p className="mt-1 text-sm text-muted">把分散在各平台的收藏，收到一个地方</p>
        </div>
        <a href="/login" className="text-sm text-muted hover:text-ink">
          退出登录
        </a>
      </header>

      {/* 粘贴收藏区 */}
      <form
        onSubmit={onSubmit}
        className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴视频分享文本，例如：https://b23.tv/xxx"
          rows={2}
          className="w-full resize-none rounded-xl border border-sand bg-cream px-4 py-3 text-ink placeholder:text-muted focus:border-brand focus:outline-none"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "收藏中…" : "收藏"}
          </button>
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="text-sm text-brand hover:underline"
          >
            {showManual ? "收起手动添加" : "手动添加"}
          </button>
        </div>

        {showManual && (
          <div className="mt-3 flex flex-col gap-2 border-t border-sand pt-3 sm:flex-row">
            <input
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="视频链接"
              className="flex-1 rounded-xl border border-sand bg-cream px-4 py-2 text-ink placeholder:text-muted focus:border-brand focus:outline-none"
            />
            <input
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="标题"
              className="flex-1 rounded-xl border border-sand bg-cream px-4 py-2 text-ink placeholder:text-muted focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={onManualSubmit}
              disabled={loading}
              className="rounded-full bg-ink px-4 py-2 text-sm text-white transition hover:bg-black disabled:opacity-50"
            >
              保存
            </button>
          </div>
        )}

        {message && <p className="mt-3 text-sm text-brand">{message}</p>}
      </form>

      {/* 收藏夹筛选栏 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => selectCollection("all")}
          className={chipClass(collectionFilter === "all")}
        >
          全部
        </button>
        <button
          onClick={() => selectCollection("unfiled")}
          className={chipClass(collectionFilter === "unfiled")}
        >
          未分类
        </button>
        {collections.map((c) => (
          <span key={c.id} className="flex items-center gap-0.5">
            <button
              onClick={() => selectCollection(c.id)}
              className={chipClass(collectionFilter === c.id)}
            >
              {c.name} ({c._count?.favorites ?? 0})
            </button>
            <button
              onClick={() => deleteCollection(c.id)}
              className="rounded-full px-1 text-xs text-muted hover:text-red-600"
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
          className="w-28 rounded-full border border-sand bg-white px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
        />
        <button
          onClick={createCollection}
          className="rounded-full bg-ink px-3.5 py-1.5 text-sm text-white transition hover:bg-black"
        >
          新建
        </button>

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            load(e.target.value, collectionFilter);
          }}
          placeholder="搜索标题…"
          className="ml-auto w-40 rounded-full border border-sand bg-white px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
        />
      </div>

      {/* 卡片网格 */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((f) => (
            <FavoriteItem key={f.id} f={f} collections={collections} onChanged={refresh} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-sand">
          <p className="text-muted">还没有收藏，粘贴一个链接试试。</p>
        </div>
      )}

      {/* 书签小工具 */}
      <details className="mt-8 text-sm text-muted">
        <summary className="cursor-pointer text-ink hover:text-brand">
          书签小工具（一键收藏）
        </summary>
        <p className="mt-2">
          把下面这个链接拖到浏览器书签栏。之后在任意视频页点一下，就会跳转到本页并自动填好链接，再点「收藏」即可。
        </p>
        <p className="mt-2">
          <a
            href={bookmarklet}
            className="inline-block rounded-full bg-brand-soft px-4 py-1.5 text-brand-dark hover:bg-brand hover:text-white"
          >
            收藏到本页
          </a>
        </p>
      </details>
    </main>
  );
}
