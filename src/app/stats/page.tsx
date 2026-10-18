"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/mobile/BottomNav";

type Stat = {
  platform: string;
  total: number;
  success: number;
  failed: number;
  failureRate: number;
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (r.ok) return r.json();
        if (r.status === 403) throw new Error("仅管理员可见");
        throw new Error("加载失败");
      })
      .then((list: Stat[]) => setStats(Array.isArray(list) ? list : []))
      .catch((e: Error) => setError(e.message));

    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: unknown[]) => setFavoriteCount(list.length))
      .catch(() => setFavoriteCount(0));
  }, []);

  const total = stats.reduce((s, x) => s + x.total, 0);
  const success = stats.reduce((s, x) => s + x.success, 0);
  const failed = stats.reduce((s, x) => s + x.failed, 0);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[1000px] bg-white pb-[90px]">
      <header className="sticky top-0 z-30 border-b border-sand bg-white px-4 pb-3 pt-4">
        <h1 className="text-lg font-bold tracking-tight text-ink">统计</h1>
        <p className="mt-1 text-xs text-muted">查看各平台链接抓取情况</p>
      </header>

      <main className="px-4 pt-4">
        {error ? (
          <p className="py-24 text-center text-sm text-muted">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-sand bg-white p-4">
                <span className="text-xs text-muted">抓取总次数</span>
                <div className="mt-2 text-[26px] font-bold tracking-tight text-ink">
                  {total}
                </div>
              </div>
              <div className="rounded-2xl border border-sand bg-white p-4">
                <span className="text-xs text-muted">抓取成功</span>
                <div className="mt-2 text-[26px] font-bold tracking-tight text-ink">
                  {success}
                </div>
              </div>
              <div className="rounded-2xl border border-sand bg-white p-4">
                <span className="text-xs text-muted">抓取失败</span>
                <div className="mt-2 text-[26px] font-bold tracking-tight text-ink">
                  {failed}
                </div>
              </div>
              <div className="rounded-2xl border border-sand bg-white p-4">
                <span className="text-xs text-muted">收藏总数</span>
                <div className="mt-2 text-[26px] font-bold tracking-tight text-ink">
                  {favoriteCount}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-3 text-[13px] font-bold text-ink">
                各平台抓取情况
              </div>
              {stats.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">暂无数据</p>
              ) : (
                stats.map((s) => {
                  const rate = s.total ? (s.success / s.total) * 100 : 0;
                  return (
                    <div
                      key={s.platform}
                      className="flex items-center gap-3 border-b border-sand py-3 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-ink">
                          {s.platform}
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-soft">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${Math.max(0, Math.min(100, rate))}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted">
                        {Math.round(rate)}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
