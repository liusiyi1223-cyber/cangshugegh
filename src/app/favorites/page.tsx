"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Menu, Palette, Search, UserRound, X } from "lucide-react";
import type { FavoriteWithCollections } from "@/lib/types";
import { PLATFORMS } from "@/lib/platforms";
import { extractTitle } from "@/lib/extract";
import { extractDominantColors } from "@/lib/image";
import { darken, mixWhite } from "@/lib/color";
import BottomNav from "@/components/mobile/BottomNav";
import FavoriteActionSheet from "@/components/mobile/FavoriteActionSheet";
import BottomSheet from "@/components/mobile/BottomSheet";
import FavoriteCard from "@/components/mobile/FavoriteCard";

function parseTags(s: string): string[] {
  return s
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const THEME_COLORS = [
  { key: "blue", name: "墨蓝", value: "#243342" },
  { key: "orange", name: "陶土橙", value: "#C96F4A" },
  { key: "green", name: "翠绿", value: "#16A34A" },
  { key: "indigo", name: "靛蓝", value: "#4F46E5" },
  { key: "purple", name: "紫色", value: "#7C3AED" },
  { key: "pink", name: "粉色", value: "#DB2777" },
  { key: "red", name: "红色", value: "#DC2626" },
];

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteWithCollections[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [shareTags, setShareTags] = useState("");
  const shareTagsRef = useRef<HTMLTextAreaElement>(null);
  const [sharePlatform, setSharePlatform] = useState("other");
  const [userTags, setUserTags] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeColor, setThemeColor] = useState("#243342");
  const [avatarColors, setAvatarColors] = useState<string[]>([]);
  const [colCount, setColCount] = useState(2);
  const [manualPlatform, setManualPlatform] = useState("bilibili");
  const [activeFavorite, setActiveFavorite] = useState<FavoriteWithCollections | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [fr, ur] = await Promise.all([
      fetch("/api/favorites", { cache: "no-store" }),
      fetch("/api/auth/me", { cache: "no-store" }),
    ]);
    if (fr.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (fr.ok) setItems(await fr.json());
    if (ur.ok) {
      const u = await ur.json();
      setUserTags(u.tags ?? []);
      setUserName(u.name ?? "");
      setUserAvatar(u.avatar ?? "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const u = await res.json();
        setUserTags(u.tags ?? []);
        setUserName(u.name ?? "");
        setUserAvatar(u.avatar ?? "");
      }
    } catch {
      // 静默失败，不打扰用户
    }
  }, []);

  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) refreshProfile();
    };
    const onFocus = () => refreshProfile();
    window.addEventListener("pageshow", onShow);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshProfile]);

  useEffect(() => {
    const saved = localStorage.getItem("themeColor");
    if (saved) setThemeColor(saved);
  }, []);

  function applyThemeColor(value: string) {
    setThemeColor(value);
    localStorage.setItem("themeColor", value);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matches =
        !q ||
        [it.title, it.author ?? "", it.platform ?? "", ...(it.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const platformMatch = filter === "all" || it.platform === filter;
      return matches && platformMatch;
    });
  }, [items, query, filter]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setColCount(mq.matches ? 3 : 2);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const columns = useMemo(() => {
    const cols: FavoriteWithCollections[][] = Array.from(
      { length: colCount },
      () => []
    );
    filtered.forEach((f, i) => cols[i % colCount].push(f));
    return cols;
  }, [filtered, colCount]);

  async function syncNewTags(tagsInput: string) {
    const newTags = parseTags(tagsInput).filter((t) => !userTags.includes(t));
    if (newTags.length === 0) return;
    const nextTags = [...userTags, ...newTags];
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: nextTags }),
    });
    if (res.ok) setUserTags(nextTags);
  }

  function toggleShareTag(tag: string) {
    const tags = shareTags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    setShareTags(
      tags.includes(tag)
        ? tags.filter((t) => t !== tag).join(", ")
        : [...tags, tag].join(", ")
    );
  }

  async function addFavorite(e: React.FormEvent) {
    e.preventDefault();
    const text = shareText.trim();
    if (!text) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        title: shareTitle || undefined,
        tags: parseTags(shareTags),
        platform: sharePlatform,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      await syncNewTags(shareTags);
      setShareText("");
      setShareTitle("");
      setShareTags("");
      setShowManual(false);
      await load();
    } else {
      setError(data.error ?? "收藏失败");
      setShowManual(true);
      if (data.url) setManualUrl(data.url);
    }
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    const url = manualUrl.trim();
    const title = manualTitle.trim();
    if (!url || !title) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        title,
        platform: manualPlatform,
        tags: parseTags(shareTags),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      await syncNewTags(shareTags);
      setShareText("");
      setShareTitle("");
      setShareTags("");
      setManualUrl("");
      setManualTitle("");
      setShowManual(false);
      await load();
    } else {
      setError(data.error ?? "收藏失败");
    }
  }

  return (
    <div
      className="min-h-dvh bg-white pb-[90px]"
      style={
        {
          "--color-brand": themeColor,
          "--color-brand-soft": mixWhite(themeColor, 0.9),
          "--color-brand-dark": darken(themeColor, 0.15),
        } as React.CSSProperties
      }
    >
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-sand bg-white px-4">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="菜单"
          className="grid h-[38px] w-[38px] place-items-center rounded-xl border border-sand bg-white text-brand"
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>
        <a
          href="/me"
          aria-label="个人中心"
          className="grid h-[38px] w-[38px] place-items-center overflow-hidden rounded-full border border-sand bg-white"
        >
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt="头像"
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound size={18} strokeWidth={1.8} className="text-[#65717c]" />
          )}
        </a>
      </header>

      <main className="mx-auto w-full max-w-[1000px] px-4 pt-3">
        <form
          onSubmit={addFavorite}
          className="mb-5 rounded-[15px] border border-sand bg-white p-3.5 shadow-sm"
        >
          <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Bookmark size={16} className="text-brand" strokeWidth={2} />
            粘贴分享文本，快速收藏
          </div>
          <div className="relative">
            <textarea
              id="share-text"
              aria-label="平台分享文本"
              placeholder="粘贴来自 B 站、小红书、抖音等平台的分享文本…"
              value={shareText}
              onChange={(e) => {
                setShareText(e.target.value);
                const t = extractTitle(e.target.value);
                if (t) setShareTitle(t);
              }}
              className="min-h-[60px] w-full resize-y border-0 bg-transparent pr-8 text-[13px] text-ink outline-none placeholder:text-muted"
            />
            {shareText && (
              <button
                type="button"
                onClick={() => setShareText("")}
                aria-label="清空"
                className="absolute right-0 top-2 text-muted"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              placeholder="标题（自动识别，可修改）"
              rows={4}
              className="w-full resize-none rounded-[11px] border border-sand bg-white px-3 py-2.5 pr-9 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
            />
            {shareTitle && (
              <button
                type="button"
                onClick={() => setShareTitle("")}
                aria-label="清空"
                className="absolute right-2.5 top-2.5 text-muted"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {userTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {userTags.map((tag) => {
                const selected = shareTags
                  .split(/[,，]/)
                  .map((t) => t.trim())
                  .includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleShareTag(tag)}
                    className={`rounded-full px-2.5 py-1 text-[12px] ${
                      selected
                        ? "bg-brand text-white"
                        : "bg-brand-soft text-ink"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
          <div className="relative mt-3">
            <textarea
              ref={shareTagsRef}
              value={shareTags}
              onChange={(e) => {
                setShareTags(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="新建标签（用逗号分隔）"
              rows={2}
              className="w-full resize-none overflow-hidden rounded-[11px] border border-sand bg-white px-3 py-2.5 pr-9 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
            />
            {shareTags && (
              <button
                type="button"
                onClick={() => {
                  setShareTags("");
                  if (shareTagsRef.current) {
                    shareTagsRef.current.style.height = "auto";
                  }
                }}
                aria-label="清空标签"
                className="absolute right-2.5 top-2.5 text-muted"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {(() => {
            const last = shareTags.split(/[,，]/).pop()?.trim() ?? "";
            const selected = parseTags(shareTags);
            const matches = userTags.filter(
              (t) => last && t.includes(last) && !selected.includes(t)
            );
            if (matches.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5">
                {matches.slice(0, 6).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const parts = shareTags.split(/[,，]/);
                      parts[parts.length - 1] = t;
                      setShareTags(parts.join(", "));
                    }}
                    className="rounded-full bg-brand-soft px-2.5 py-1 text-[12px] text-brand-dark"
                  >
                    {t}
                  </button>
                ))}
              </div>
            );
          })()}
          <div className="mt-2 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted">来源平台</span>
              <select
                value={sharePlatform}
                onChange={(e) => setSharePlatform(e.target.value)}
                className="rounded-[11px] border border-sand bg-white px-2.5 py-2 text-[13px] text-ink outline-none focus:border-brand"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!shareText.trim() || busy}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-[11px] bg-brand px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-55"
            >
              <Bookmark size={15} strokeWidth={2} />
              {busy ? "收藏中…" : "一键收藏"}
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-[#c65c5c]">{error}</p>}

          {showManual && (
            <div className="mt-3 space-y-2 border-t border-sand pt-3">
              <input
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="链接 *"
                className="w-full rounded-[11px] border border-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-muted"
              />
              <input
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="标题 *"
                className="w-full rounded-[11px] border border-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-muted"
              />
              <select
                value={manualPlatform}
                onChange={(e) => setManualPlatform(e.target.value)}
                className="w-full rounded-[11px] border border-sand px-3 py-3 text-sm text-ink outline-none"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addManual}
                disabled={busy}
                className="w-full rounded-[11px] bg-brand py-3 text-[13px] font-semibold text-white disabled:opacity-55"
              >
                手动保存
              </button>
            </div>
          )}
        </form>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[{ key: "all", name: "全部" }, ...PLATFORMS].map(
            (p) => (
              <button
                key={p.key}
                onClick={() => setFilter(p.key)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs ${
                  filter === p.key
                    ? "bg-brand text-white"
                    : "text-[#7d8791]"
                }`}
              >
                {p.name}
              </button>
            )
          )}
        </div>

        <div className="mb-3 flex h-11 items-center gap-2 rounded-[13px] bg-[#f7f8fa] px-3 text-muted focus-within:ring-1 focus-within:ring-brand">
          <Search size={17} strokeWidth={1.8} />
          <input
            id="searchbox"
            placeholder={
              filter === "all" ? "搜索标题、平台或标签…" : "搜索标题或标签…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-0 bg-transparent text-ink outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="清除搜索">
              <X size={16} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-[14px] bg-brand-soft" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[15px] border border-dashed border-sand bg-white px-4 py-11 text-center text-muted">
            <Bookmark size={27} strokeWidth={1.5} className="mx-auto mb-2.5 opacity-50" />
            <div className="font-semibold text-ink">
              {items.length === 0 ? "这里还没有收藏" : "没有找到匹配内容"}
            </div>
            <p className="mt-2 text-xs">
              {items.length === 0
                ? "粘贴一段平台分享文本，保存你喜欢的视频和文章。"
                : "试试其他关键词或切换收藏夹。"}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            {columns.map((col, ci) => (
              <div key={ci} className="flex min-w-0 flex-1 flex-col">
                {col.map((f) => (
                  <FavoriteCard key={f.id} favorite={f} onOpen={setActiveFavorite} />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>

      <FavoriteActionSheet
        favorite={activeFavorite}
        onClose={() => setActiveFavorite(null)}
        onChanged={load}
      />

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="设置">
        <div className="mb-3 text-sm font-semibold text-ink">主题颜色</div>
        <div className="flex flex-wrap gap-3">
          {THEME_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => applyThemeColor(c.value)}
              aria-label={c.name}
              className="grid h-10 w-10 place-items-center rounded-full"
              style={{
                backgroundColor: c.value,
                outline: themeColor === c.value ? "2px solid #1d2630" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        {userAvatar && (
          <div>
            <button
              onClick={async () => {
                try {
                  const colors = await extractDominantColors(userAvatar, 3);
                  setAvatarColors(colors);
                  if (colors[0]) applyThemeColor(colors[0]);
                } catch {
                  // 忽略
                }
              }}
              className="mt-3 flex items-center gap-1.5 rounded-full border border-sand px-3.5 py-2 text-xs text-ink"
            >
              <Palette size={14} strokeWidth={1.8} />
              从头像提取主题色
            </button>
            {avatarColors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {avatarColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => applyThemeColor(c)}
                    aria-label={`颜色 ${c}`}
                    className="grid h-8 w-8 place-items-center rounded-full"
                    style={{
                      backgroundColor: c,
                      outline:
                        themeColor === c ? "2px solid #1d2630" : "none",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <BottomNav />
    </div>
  );
}
