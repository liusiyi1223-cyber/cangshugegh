"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/mobile/BottomNav";
import { useThemeColor } from "@/lib/useThemeColor";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count: { favorites: number };
};

export default function StatsPage() {
  const { themeStyle } = useThemeColor();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => {
        if (r.ok) return r.json();
        if (r.status === 403) throw new Error("仅管理员可见");
        throw new Error("加载失败");
      })
      .then((list: AdminUser[]) => setUsers(Array.isArray(list) ? list : []))
      .catch((e: Error) => setError(e.message));
  }, []);

  const totalFavorites = users.reduce((s, u) => s + u._count.favorites, 0);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[1000px] bg-background pb-[110px]" style={themeStyle}>
      <header className="sticky top-0 z-30 border-b border-sand bg-brand px-4 pb-3 pt-4">
        <h1 className="text-lg font-bold tracking-tight text-onbrand">用户管理</h1>
        <p className="mt-1 text-xs text-onbrand opacity-70">查看注册用户</p>
      </header>

      <main className="px-4 pt-4">
        {error ? (
          <p className="py-24 text-center text-sm text-muted">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <span className="text-xs text-muted">用户总数</span>
                <div className="mt-2 text-[26px] font-bold tracking-tight text-ink">
                  {users.length}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <span className="text-xs text-muted">收藏总数</span>
                <div className="mt-2 text-[26px] font-bold tracking-tight text-ink">
                  {totalFavorites}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 shadow-card">
              <div className="mb-3 text-sm font-semibold text-ink">用户列表</div>
              {users.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">暂无用户</p>
              ) : (
                <div className="space-y-1">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-2 border-b border-sand py-2 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-ink">
                          {u.name || "未设置昵称"}
                          {u.role === "ADMIN" && (
                            <span className="ml-1 text-[10px] text-brand-ink">
                              管理员
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11px] text-muted">
                          {u.email}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-muted">
                          {u._count.favorites} 条收藏
                        </div>
                        <div className="text-[10px] text-muted">
                          {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
