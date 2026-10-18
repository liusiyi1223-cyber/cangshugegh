"use client";

import { useState } from "react";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);

  async function loadMe() {
    const res = await fetch("/api/auth/me");
    if (res.ok) setMe(await res.json());
    else setMe(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(mode === "login" ? "登录成功" : "注册成功");
      await loadMe();
    } else {
      setMessage(data.error ?? "出错了");
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    setMessage("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm ring-1 ring-sand">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-ink">互联网总收藏夹</h1>
          <p className="mt-1 text-sm text-muted">把分散的收藏，收到一个地方</p>
        </div>

        {me ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-muted">当前登录：{me.email}</p>
            <a
              href="/favorites"
              className="mb-3 block rounded-full bg-brand px-4 py-2 text-sm text-white transition hover:bg-brand-dark"
            >
              进入收藏
            </a>
            <button
              onClick={onLogout}
              className="text-sm text-muted hover:text-ink"
            >
              退出登录
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex gap-1 rounded-full bg-cream p-1">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm transition ${
                  mode === "login"
                    ? "bg-white text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm transition ${
                  mode === "register"
                    ? "bg-white text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                注册
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-sand bg-cream px-4 py-2.5 text-ink placeholder:text-muted focus:border-brand focus:outline-none"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="密码（至少 8 位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-sand bg-cream px-4 py-2.5 text-ink placeholder:text-muted focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
              >
                {mode === "login" ? "登录" : "注册"}
              </button>
            </form>
          </>
        )}

        {message && <p className="mt-4 text-center text-sm text-brand">{message}</p>}
      </div>
    </main>
  );
}
