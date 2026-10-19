"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bookmark,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import { compressImage } from "@/lib/image";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setAvatar(base64);
    } catch {
      setError("头像上传失败");
    }
  }

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, avatar, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "注册失败，请检查填写内容");
      router.push("/favorites");
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-7 shadow-card">
        <div className="mb-5 grid h-[50px] w-[50px] place-items-center rounded-2xl bg-brand-soft text-brand">
          <Bookmark size={27} strokeWidth={1.8} />
        </div>
        <h1 className="text-[25px] font-extrabold tracking-tight text-ink">
          创建账号
        </h1>
        <p className="mt-2 mb-6 text-[13px] text-muted">
          设置你的头像和昵称，开始收藏
        </p>

        <div className="mb-5 flex flex-col items-center">
          <label className="cursor-pointer">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-brand-soft">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt="头像"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={36} className="text-muted" strokeWidth={1.5} />
              )}
            </div>
            <span className="mt-2 block text-center text-xs text-muted">
              点击上传头像
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              className="hidden"
            />
          </label>
        </div>

        <form onSubmit={submit}>
          <label className="mb-1.5 block text-xs font-semibold text-ink">
            昵称
          </label>
          <input
            type="text"
            placeholder="设置你的昵称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
          />

          <label className="mb-1.5 mt-3.5 block text-xs font-semibold text-ink">
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

          <label className="mb-1.5 mt-3.5 block text-xs font-semibold text-ink">
            验证码
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
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
              autoComplete="new-password"
              placeholder="请输入密码（至少 8 位）"
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

          {error && <p className="mt-2 text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-brand py-3 text-[13px] font-semibold text-white disabled:opacity-55"
          >
            {busy ? "请稍候…" : "创建账号"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted">
          已有账号？
          <Link href="/login" replace className="font-medium text-brand">
            登录
          </Link>
        </p>
      </div>
    </main>
  );
}
