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
      <div className="w-full max-w-sm rounded-lg border border-gray-200 p-6">
        <h1 className="mb-4 text-xl font-semibold">互联网总收藏夹</h1>

        {me ? (
          <div>
            <p className="mb-4">当前登录：{me.email}</p>
            <button
              onClick={onLogout}
              className="rounded bg-gray-800 px-4 py-2 text-white"
            >
              退出登录
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 rounded px-3 py-2 ${
                  mode === "login" ? "bg-gray-800 text-white" : "bg-gray-100"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 rounded px-3 py-2 ${
                  mode === "register" ? "bg-gray-800 text-white" : "bg-gray-100"
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
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="密码（至少 8 位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              <button
                type="submit"
                className="w-full rounded bg-gray-800 px-4 py-2 text-white"
              >
                {mode === "login" ? "登录" : "注册"}
              </button>
            </form>
          </>
        )}

        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
      </div>
    </main>
  );
}
