"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CopyCheck, Download, Eye, Layers, Sparkles, Tag as TagIcon, Trash2 } from "lucide-react";
import type { FavoriteWithCollections } from "@/lib/types";
import { PLATFORMS, platformName } from "@/lib/platforms";
import { useThemeColor } from "@/lib/useThemeColor";
import { useHideVisitCount } from "@/lib/useHideVisitCount";
import BottomNav from "@/components/mobile/BottomNav";

export default function WorkbenchPage() {
  const [favorites, setFavorites] = useState<FavoriteWithCollections[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [userPlatforms, setUserPlatforms] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const { themeStyle } = useThemeColor();
  const { hide, setHideVisitCount } = useHideVisitCount();

  const load = useCallback(async () => {
    const [fr, ur] = await Promise.all([
      fetch("/api/favorites"),
      fetch("/api/auth/me"),
    ]);
    if (fr.ok) setFavorites(await fr.json());
    if (ur.ok) {
      const u = await ur.json();
      setUserTags(u.tags ?? []);
      setUserPlatforms(u.platforms ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tagCounts = new Map<string, number>();
  for (const f of favorites) {
    for (const t of f.tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }

  const totalVisits = favorites.reduce((s, f) => s + (f.visitCount ?? 0), 0);
  const topVisited = [...favorites]
    .filter((f) => (f.visitCount ?? 0) > 0)
    .sort((a, b) => (b.visitCount ?? 0) - (a.visitCount ?? 0))
    .slice(0, 10);

  const groupedByDate = (() => {
    const map = new Map<string, FavoriteWithCollections[]>();
    for (const f of favorites) {
      const date = new Date(f.createdAt).toLocaleDateString("zh-CN");
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(f);
    }
    return [...map.entries()].map(([date, items]) => ({ date, items }));
  })();

  async function createTag() {
    const name = newTagName.trim();
    if (!name || userTags.includes(name)) return;
    const next = [...userTags, name];
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    });
    if (res.ok) {
      setUserTags(next);
      setNewTagName("");
    }
  }

  async function removeTag(tag: string) {
    if (!confirm(`确定删除标签「${tag}」？将从所有收藏里移除该标签。`)) return;
    const targets = favorites.filter((f) => (f.tags ?? []).includes(tag));
    await Promise.all(
      targets.map((f) =>
        fetch(`/api/favorites/${f.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tags: (f.tags ?? []).filter((t) => t !== tag),
          }),
        })
      )
    );
    const next = userTags.filter((t) => t !== tag);
    await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    }).catch(() => {});
    setUserTags(next);
    await load();
  }

  async function setPlatforms(next: string[]) {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms: next }),
    });
    if (res.ok) setUserPlatforms(next);
  }

  function removePlatform(key: string) {
    setPlatforms(userPlatforms.filter((k) => k !== key));
  }

  function addPlatform(key: string) {
    if (userPlatforms.includes(key)) return;
    setPlatforms([...userPlatforms, key]);
  }

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportMarkdown() {
    const sections = groupedByDate.map(({ date, items }) => {
      const lines = items.map((f) => {
        const platform = platformName(f.platform);
        const tags = (f.tags ?? []).map((t) => `#${t}`).join(" ");
        const suffix = tags ? ` · ${tags}` : "";
        return `- [${f.title}](${f.url}) · ${platform}${suffix}`;
      });
      return `## ${date}\n\n${lines.join("\n")}`;
    });
    const content = `# 我的收藏备份\n\n共 ${favorites.length} 条\n\n${sections.join("\n\n")}\n`;
    download(`收藏备份_${new Date().toISOString().slice(0, 10)}.md`, content);
  }

  function exportJson() {
    const content = JSON.stringify(favorites, null, 2);
    download(`收藏备份_${new Date().toISOString().slice(0, 10)}.json`, content);
  }

  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  async function generateSummary() {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: favorites.map((f) => ({
            title: f.title,
            platform: f.platform,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary ?? "");
      }
    } catch {
      // AI 失败静默
    } finally {
      setSummaryLoading(false);
    }
  }

  const [duplicateIds, setDuplicateIds] = useState<string[]>([]);
  const [dedupeLoading, setDedupeLoading] = useState(false);

  async function detectDuplicates() {
    setDedupeLoading(true);
    try {
      const res = await fetch("/api/ai/dedupe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: favorites.map((f) => ({ id: f.id, title: f.title })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDuplicateIds(data.duplicateIds ?? []);
      }
    } catch {
      // AI 失败静默
    } finally {
      setDedupeLoading(false);
    }
  }

  async function removeDuplicate(id: string) {
    if (!confirm("确定删除这条重复收藏？")) return;
    await fetch(`/api/favorites/${id}`, { method: "DELETE" });
    setDuplicateIds((prev) => prev.filter((x) => x !== id));
    await load();
  }

  return (
    <div
      className="mx-auto min-h-dvh w-full max-w-[1000px] bg-background pb-[110px]"
      style={themeStyle}
    >
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-sand bg-brand px-4">
        <div className="leading-tight">
          <h1 className="text-[15px] font-bold tracking-tight text-onbrand">工作台</h1>
          <p className="text-[11px] text-onbrand opacity-70">管理标签与访问数据</p>
        </div>
      </header>

      <main className="px-4 pt-4">
        <section className="mb-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
          <div>
            <div className="text-sm font-semibold text-ink">隐藏访问次数</div>
            <div className="mt-0.5 text-xs text-muted">卡片上不显示访问次数</div>
          </div>
          <button
            onClick={() => setHideVisitCount(!hide)}
            aria-label="切换隐藏访问次数"
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              hide ? "bg-ink" : "bg-sand"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                hide ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Download size={16} className="text-ink" />
            导出备份
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportMarkdown}
              className="flex-1 rounded-xl bg-brand-soft ring-1 ring-sand px-4 py-2.5 text-sm font-medium text-ink"
            >
              导出 Markdown
            </button>
            <button
              onClick={exportJson}
              className="flex-1 rounded-xl bg-brand-soft ring-1 ring-sand px-4 py-2.5 text-sm font-medium text-ink"
            >
              导出 JSON
            </button>
          </div>
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles size={16} className="text-ink" />
            AI 收藏总结
          </div>
          {aiSummary ? (
            <>
              <p className="text-[13px] leading-relaxed text-ink">
                {aiSummary}
              </p>
              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                className="mt-2 w-full rounded-xl bg-brand-soft ring-1 ring-sand px-4 py-2 text-xs font-medium text-ink disabled:opacity-50"
              >
                {summaryLoading ? "重新生成中…" : "重新生成"}
              </button>
            </>
          ) : (
            <button
              onClick={generateSummary}
              disabled={summaryLoading || favorites.length === 0}
              className="w-full rounded-xl bg-brand-soft ring-1 ring-sand px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-50"
            >
              {summaryLoading ? "生成中…" : "生成总结"}
            </button>
          )}
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <CopyCheck size={16} className="text-ink" />
            智能去重
          </div>
          {duplicateIds.length === 0 ? (
            <button
              onClick={detectDuplicates}
              disabled={dedupeLoading || favorites.length < 2}
              className="w-full rounded-xl bg-brand-soft ring-1 ring-sand px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-50"
            >
              {dedupeLoading ? "检测中…" : "检测重复收藏"}
            </button>
          ) : (
            <div className="space-y-2">
              {duplicateIds.map((id) => {
                const f = favorites.find((x) => x.id === id);
                if (!f) return null;
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                      {f.title}
                    </span>
                    <button
                      onClick={() => removeDuplicate(id)}
                      className="shrink-0 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600"
                    >
                      删除
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => setDuplicateIds([])}
                className="w-full rounded-xl bg-brand-soft ring-1 ring-sand px-4 py-2 text-xs font-medium text-ink"
              >
                清除结果
              </button>
            </div>
          )}
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarDays size={16} className="text-ink" />
            收藏时间线
          </div>
          {groupedByDate.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">还没有收藏</p>
          ) : (
            <div className="space-y-3">
              {groupedByDate.map(({ date, items }) => (
                <div key={date}>
                  <div className="mb-1 text-xs font-medium text-muted">
                    {date} · {items.length} 条
                  </div>
                  <div className="space-y-1">
                    {items.map((f) => (
                      <div key={f.id}>
                        <div className="truncate text-[13px] text-ink">{f.title}</div>
                        {f.note && (
                          <div className="truncate pl-2 text-xs text-muted">{f.note}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Eye size={16} className="text-ink" />
            访问数据
          </div>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-[26px] font-bold tracking-tight text-ink">
              {totalVisits}
            </span>
            <span className="text-xs text-muted">总访问次数</span>
          </div>
          {topVisited.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">还没有访问记录</p>
          ) : (
            <div className="space-y-2">
              {topVisited.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2">
                  <span className="w-4 shrink-0 text-xs font-semibold text-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                    {f.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {f.visitCount} 次
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Layers size={16} className="text-ink" />
            平台管理
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.filter((p) => userPlatforms.includes(p.key)).map((p) => (
              <span
                key={p.key}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft ring-1 ring-sand px-3 py-1.5 text-[13px] text-ink"
              >
                {p.name}
                <button
                  onClick={() => removePlatform(p.key)}
                  aria-label={`移除平台 ${p.name}`}
                  className="text-ink/60 hover:text-ink"
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
          {PLATFORMS.filter((p) => !userPlatforms.includes(p.key)).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PLATFORMS.filter((p) => !userPlatforms.includes(p.key)).map((p) => (
                <button
                  key={p.key}
                  onClick={() => addPlatform(p.key)}
                  className="rounded-full bg-tag px-2.5 py-1 text-[12px] text-muted"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <TagIcon size={16} className="text-ink" />
            标签管理
          </div>
          <div className="mb-3 flex gap-2">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="新建标签"
              className="min-w-0 flex-1 rounded-xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-brand-ink"
            />
            <button
              onClick={createTag}
              disabled={!newTagName.trim()}
              className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-onbrand ring-1 ring-sand disabled:opacity-50"
            >
              新建
            </button>
          </div>
          {userTags.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">还没有标签</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...userTags]
                .sort((a, b) => (tagCounts.get(b) ?? 0) - (tagCounts.get(a) ?? 0))
                .map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft ring-1 ring-sand px-3 py-1.5 text-[13px] text-ink"
                  >
                    {tag}
                    <span className="text-[11px] text-muted">
                      {tagCounts.get(tag) ?? 0}
                    </span>
                    <button
                      onClick={() => removeTag(tag)}
                      aria-label={`删除标签 ${tag}`}
                      className="text-ink/60 hover:text-ink"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
