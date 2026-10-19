"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

type Mode = "password" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function sendCode() {
    if (!email) {
      setError("请先输入邮箱");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "验证码发送失败");
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setSending(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body =
        mode === "password" ? { email, password } : { email, code };
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "登录失败");
      if (remember) {
        localStorage.setItem("savedEmail", email);
        localStorage.setItem("savedPassword", password);
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
      }
      router.push("/favorites");
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl bg-white px-7 py-10 shadow-card">
        <div className="mb-5 grid h-[50px] w-[50px] place-items-center rounded-2xl bg-brand-soft text-brand">
          <Bookmark size={27} strokeWidth={1.8} />
        </div>
        <h1 className="text-[25px] font-extrabold tracking-tight text-ink">
          登录
        </h1>
        <p className="mt-2 mb-6 text-[13px] text-muted">
          欢迎回到我的云收藏夹
        </p>

        <div className="mb-5 grid grid-cols-2 border-b border-sand">
          <button
            onClick={() => setMode("password")}
            className={`py-3 text-[13px] font-semibold ${
              mode === "password"
                ? "border-b-2 border-brand text-brand"
                : "border-b-2 border-transparent text-muted"
            }`}
          >
            密码登录
          </button>
          <button
            onClick={() => setMode("code")}
            className={`py-3 text-[13px] font-semibold ${
              mode === "code"
                ? "border-b-2 border-brand text-brand"
                : "border-b-2 border-transparent text-muted"
            }`}
          >
            验证码登录
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="mb-1.5 block text-xs font-semibold text-ink">
            邮箱
          </label>
          <div className="relative">
            <Mail
              size={17}
              className="absolute left-3.5 top-3.5 text-muted"
              strokeWidth={1.8}
            />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-sand py-3 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
            />
          </div>

          {mode === "password" ? (
            <>
              <label className="mb-1.5 mt-3.5 block text-xs font-semibold text-ink">
                密码
              </label>
              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-3.5 top-3.5 text-muted"
                  strokeWidth={1.8}
                />
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-sand py-3 pl-10 pr-11 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "隐藏密码" : "显示密码"}
                  className="absolute right-3 top-3 text-muted"
                >
                  {show ? (
                    <EyeOff size={18} strokeWidth={1.8} />
                  ) : (
                    <Eye size={18} strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </>
          ) : (
            <label className="mb-1.5 mt-3.5 block text-xs font-semibold text-ink">
              验证码
            </label>
          )}

          {mode === "code" && (
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="6 位验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={sending || countdown > 0}
                className="shrink-0 rounded-xl border border-sand px-3.5 text-[13px] font-medium text-brand disabled:opacity-55"
              >
                {countdown > 0 ? `${countdown}s 后重发` : "发送验证码"}
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-danger">{error}</p>}

          <label className="mt-3 flex items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            记住账号和密码
          </label>

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-xl border border-brand bg-white py-3 text-[13px] font-semibold text-brand disabled:opacity-55"
          >
            {busy ? "请稍候…" : "登录"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted">
          没有账号？
          <Link href="/register" replace className="font-medium text-brand">
            注册
          </Link>
        </p>
      </div>
    </main>
  );
}
