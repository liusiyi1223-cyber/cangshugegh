"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, LayoutGrid, List, Menu, Palette, Search, Sparkles, UserRound, X } from "lucide-react";
import type { FavoriteWithCollections } from "@/lib/types";
import { PLATFORMS, platformName } from "@/lib/platforms";
import { extractDominantColors } from "@/lib/image";
import { useThemeColor } from "@/lib/useThemeColor";
import { useHideVisitCount } from "@/lib/useHideVisitCount";
import BottomNav from "@/components/mobile/BottomNav";
import FavoriteActionSheet from "@/components/mobile/FavoriteActionSheet";
import BottomSheet from "@/components/mobile/BottomSheet";
import FavoriteCard from "@/components/mobile/FavoriteCard";
import FavoriteListItem from "@/components/mobile/FavoriteListItem";

const THEME_COLORS = [
  { key: "blue", name: "墨蓝", value: "#1b3a63" },
  { key: "orange", name: "陶土橙", value: "#b85c3a" },
  { key: "green", name: "翠绿", value: "#15803d" },
  { key: "indigo", name: "靛蓝", value: "#4338ca" },
  { key: "purple", name: "紫色", value: "#6d28d9" },
  { key: "pink", name: "粉色", value: "#be185d" },
  { key: "red", name: "红色", value: "#b91c1c" },
  { key: "black", name: "黑色", value: "#000000" },
  { key: "white", name: "白色", value: "#ffffff" },
];

function searchPlaceholder(tagFilter: string | null, filter: string): string {
  const parts = ["标题"];
  if (!tagFilter) parts.push("标签");
  if (filter === "all") parts.push("平台");
  if (parts.length === 1) return "搜索标题…";
  const head = parts.slice(0, -1).join("、");
  return `搜索${head}或${parts[parts.length - 1]}…`;
}

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteWithCollections[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { themeColor, setThemeColor, themeStyle } = useThemeColor();
  const { hide } = useHideVisitCount();
  const [avatarColors, setAvatarColors] = useState<string[]>([]);
  const [colCount, setColCount] = useState(2);
  const [layout, setLayout] = useState<"masonry" | "list">("masonry");
  const [activeFavorite, setActiveFavorite] = useState<FavoriteWithCollections | null>(
    null
  );
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [aiIds, setAiIds] = useState<string[] | null>(null);
  const [aiHistory, setAiHistory] = useState<string[]>([]);
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
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

  function applyThemeColor(value: string) {
    setThemeColor(value);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        const pref = (u?.preferences as { layout?: string } | null)?.layout;
        if (pref === "list" || pref === "masonry") setLayout(pref);
      })
      .catch(() => {});
  }, []);

  function toggleLayout() {
    setLayout((prev) => {
      const next = prev === "masonry" ? "list" : "masonry";
      fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { layout: next } }),
      }).catch(() => {});
      return next;
    });
  }

  async function aiSearch() {
    const q = query.trim();
    if (!q) return;
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          items: items.map((it) => ({
            id: it.id,
            title: it.title,
            platform: platformName(it.platform),
            time: new Date(it.createdAt).toLocaleDateString("zh-CN"),
          })),
          history: aiHistory,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (queryRef.current.trim() === q) {
          setAiIds(data.ids ?? []);
          setAiHistory((prev) => [...prev, q].slice(-5));
        }
      }
    } catch {
      // AI 失败静默忽略
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (aiIds !== null) return aiIds.includes(it.id);
      const matches =
        !q ||
        [
          it.title,
          it.author ?? "",
          it.platform ?? "",
          platformName(it.platform),
          ...(it.tags ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const platformMatch = filter === "all" || it.platform === filter;
      const tagMatch = !tagFilter || (it.tags ?? []).includes(tagFilter);
      return matches && platformMatch && tagMatch;
    });
  }, [items, query, filter, tagFilter, aiIds]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      for (const t of it.tags ?? []) set.add(t);
    }
    return [...set];
  }, [items]);

  const filterOptions = useMemo(() => {
    const used = new Set(items.map((it) => it.platform).filter(Boolean));
    return [{ key: "all", name: "全部" }, ...PLATFORMS.filter((p) => used.has(p.key))];
  }, [items]);

  useEffect(() => {
    if (filter !== "all" && !filterOptions.some((p) => p.key === filter)) {
      setFilter("all");
    }
  }, [filter, filterOptions]);

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
    const heights = new Array(colCount).fill(0);
    for (const f of filtered) {
      const est = f.cover ? 1.5 : 0.5;
      let minIdx = 0;
      for (let i = 1; i < colCount; i++) {
        if (heights[i] < heights[minIdx]) minIdx = i;
      }
      cols[minIdx].push(f);
      heights[minIdx] += est;
    }
    return cols;
  }, [filtered, colCount]);

  return (
    <div className="min-h-dvh bg-background pb-[90px]" style={themeStyle}>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-sand bg-white px-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="菜单"
            className="grid h-9 w-9 place-items-center rounded-xl text-ink hover:bg-brand-soft"
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
          <div className="leading-tight">
            <h1 className="text-base font-bold tracking-tight text-ink">收藏</h1>
            <p className="text-[11px] text-muted">{items.length} 条收藏</p>
          </div>
        </div>
        <a
            href="/me"
            aria-label="个人中心"
            className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-sand bg-white"
          >
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt="头像"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound size={18} strokeWidth={1.8} className="text-muted" />
            )}
          </a>
      </header>

      <main className="mx-auto w-full max-w-[1000px] pl-2 pr-2 pt-3">
        <div className="flex gap-2">
          <aside className="sticky top-[56px] flex max-h-[calc(100dvh-64px)] w-[68px] shrink-0 flex-col gap-1 self-start overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => {
                setTagFilter(null);
                setQuery("");
                setAiIds(null);
              }}
              className={`relative shrink-0 rounded-lg px-1 py-2 text-left text-[13px] font-medium ${
                tagFilter === null
                  ? "bg-brand-soft font-semibold text-brand"
                  : "text-muted"
              }`}
            >
              {tagFilter === null && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
              )}
              全部
            </button>
            {allTags.map((t) => {
              const active = tagFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setTagFilter(tagFilter === t ? null : t);
                    setQuery("");
                    setAiIds(null);
                  }}
                  className={`relative shrink-0 truncate rounded-lg px-1 py-2 text-left text-[13px] font-medium ${
                    active ? "bg-brand-soft font-semibold text-brand" : "text-muted"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
                  )}
                  #{t}
                </button>
              );
            })}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="sticky top-[56px] z-20 mb-2 flex flex-col gap-2 bg-background pb-2">
              {filterOptions.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {filterOptions.map((p) => {
                    const active = filter === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => {
                          setFilter(p.key);
                          setQuery("");
                          setAiIds(null);
                        }}
                        className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          active
                            ? "bg-brand text-onbrand"
                            : "bg-white text-muted ring-1 ring-sand"
                        }`}
                      >
                        {p.key === "all" ? "全部平台" : p.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex h-9 items-center gap-2 rounded-xl bg-cream px-3 text-muted focus-within:ring-1 focus-within:ring-brand">
                <Search size={17} strokeWidth={1.8} />
                <input
                  id="searchbox"
                  placeholder={searchPlaceholder(tagFilter, filter)}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setAiIds(null);
                  }}
                  className="w-full border-0 bg-transparent text-sm text-ink outline-none"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setAiIds(null);
                    }}
                    aria-label="清除搜索"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={aiSearch}
                  aria-label="AI 语义搜索"
                  className="shrink-0 text-muted"
                >
                  <Sparkles size={17} strokeWidth={1.8} />
                </button>
                <button
                  onClick={toggleLayout}
                  aria-label="切换排列方式"
                  className="shrink-0 text-muted"
                >
                  {layout === "masonry" ? (
                    <List size={17} strokeWidth={1.8} />
                  ) : (
                    <LayoutGrid size={17} strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            <div>
            {loading ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-2xl bg-brand-soft"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand bg-white px-4 py-11 text-center text-muted">
            <Bookmark
              size={27}
              strokeWidth={1.5}
              className="mx-auto mb-2.5 opacity-50"
            />
            <div className="font-semibold text-ink">
              {items.length === 0 ? "这里还没有收藏" : "没有找到匹配内容"}
            </div>
            <p className="mt-2 text-xs">
              {items.length === 0
                ? "点底部中间的 + 按钮，保存你喜欢的视频和文章。"
                : "试试其他关键词或切换收藏夹。"}
            </p>
          </div>
        ) : layout === "list" ? (
          <div className="flex flex-col gap-1">
            {filtered.map((f) => (
              <FavoriteListItem key={f.id} favorite={f} onOpen={setActiveFavorite} hide={hide} />
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-1">
            {columns.map((col, ci) => (
              <div key={ci} className="flex min-w-0 flex-1 flex-col gap-1">
                {col.map((f) => (
                  <FavoriteCard key={f.id} favorite={f} onOpen={setActiveFavorite} hide={hide} />
                ))}
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
        </div>
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
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-xl text-sm font-medium text-red-600 ring-1 ring-sand"
        >
          退出登录
        </button>
      </BottomSheet>

      <BottomNav />
    </div>
  );
}
