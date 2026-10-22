"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  LogOut,
  MessageSquare,
  Trash,
  User as UserIcon,
} from "lucide-react";
import BottomSheet from "@/components/mobile/BottomSheet";
import { compressImage } from "@/lib/image";
import { useThemeColor } from "@/lib/useThemeColor";

type User = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
};

export default function MePage() {
  const router = useRouter();
  const { themeStyle } = useThemeColor();
  const [user, setUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [showBookmarklet, setShowBookmarklet] = useState(false);
  const [bookmarklet, setBookmarklet] = useState("");
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const loadUser = async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) setUser(await res.json());
  };

  useEffect(() => {
    loadUser();
    setBookmarklet(
      `javascript:(function(){var c=document.querySelector('meta[property="og:image"]');var t=document.querySelector('meta[property="og:title"]');location.href='${window.location.origin}/favorites?url='+encodeURIComponent(location.href)+'&cover='+encodeURIComponent(c?c.content:'')+'&title='+encodeURIComponent(t?t.content:(document.title||''))})()`
    );
  }, []);

  function openEdit() {
    setEditName(user?.name ?? "");
    setEditAvatar(user?.avatar ?? "");
    setEditError("");
    setEditOpen(true);
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setEditAvatar(await compressImage(file));
    } catch {
      setEditError("头像上传失败");
    }
  }

  async function saveProfile() {
    setEditBusy(true);
    setEditError("");
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, avatar: editAvatar }),
    });
    const data = await res.json().catch(() => ({}));
    setEditBusy(false);
    if (res.ok) {
      setUser(data);
      setEditOpen(false);
    } else {
      setEditError(data.error ?? "保存失败");
    }
  }

  async function copyBookmarklet() {
    try {
      await navigator.clipboard.writeText(bookmarklet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板不可用
    }
  }

  async function submitFeedback() {
    if (!feedbackText.trim() || feedbackBusy) return;
    setFeedbackBusy(true);
    setFeedbackError("");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: feedbackText }),
    });
    const data = await res.json().catch(() => ({}));
    setFeedbackBusy(false);
    if (res.ok) {
      setFeedbackSent(true);
      setFeedbackText("");
    } else {
      setFeedbackError(data.error ?? "提交失败");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function deleteAccount() {
    if (
      !confirm("确定注销账号？你的所有收藏和收藏夹都会被永久删除，无法恢复。")
    )
      return;
    const res = await fetch("/api/auth/account", { method: "DELETE" });
    if (res.ok) router.push("/login");
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[1000px] bg-background pb-[90px]" style={themeStyle}>
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-sand bg-brand px-4 py-3">
        <button
          onClick={() => router.back()}
          aria-label="返回"
          className="grid h-9 w-9 place-items-center rounded-lg text-onbrand hover:bg-white/10"
        >
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-onbrand">我的</h1>
      </header>

      <main className="px-4 pt-3">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <button
            onClick={openEdit}
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt="头像"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon
                  size={28}
                  className="text-muted"
                  strokeWidth={1.5}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-ink">
                {user?.name || "未设置昵称"}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">{user?.email}</p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-muted" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card">
          <button
            onClick={() => setShowBookmarklet((v) => !v)}
            className="flex h-12 w-full items-center gap-3 border-b border-sand px-4 text-left text-[15px] text-ink active:bg-sand"
          >
            <Bookmark className="h-5 w-5 text-muted" strokeWidth={1.8} />
            <span>书签小工具</span>
          </button>
          {showBookmarklet && (
            <div className="border-b border-sand px-4 py-3">
              <p className="text-xs text-muted">
                复制下面的代码，在电脑浏览器书签栏新建书签并粘贴。手机端无法拖拽书签，请在电脑浏览器使用。
              </p>
              <div className="mt-2 break-all rounded-lg bg-cream p-3 text-xs text-muted">
                {bookmarklet}
              </div>
              <button
                onClick={copyBookmarklet}
                className="mt-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-onbrand"
              >
                {copied ? "已复制" : "复制代码"}
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setFeedbackOpen(true);
              setFeedbackText("");
              setFeedbackSent(false);
              setFeedbackError("");
            }}
            className="flex h-12 w-full items-center gap-3 border-b border-sand px-4 text-left text-[15px] text-ink active:bg-sand"
          >
            <MessageSquare className="h-5 w-5 text-muted" strokeWidth={1.8} />
            <span>报告问题</span>
          </button>

          <button
            onClick={logout}
            className="flex h-12 w-full items-center gap-3 border-t border-sand px-4 text-left text-[15px] text-ink active:bg-sand"
          >
            <LogOut className="h-5 w-5 text-muted" strokeWidth={1.8} />
            <span>退出登录</span>
          </button>

          <button
            onClick={deleteAccount}
            className="flex h-12 w-full items-center gap-3 border-t border-sand px-4 text-left text-[15px] text-red-600 active:bg-sand"
          >
            <Trash className="h-5 w-5 text-red-600" strokeWidth={1.8} />
            <span>注销账号</span>
          </button>
        </div>
      </main>

      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="编辑资料">
        <div className="flex flex-col items-center pb-4">
          <label className="cursor-pointer">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-brand-soft">
              {editAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editAvatar}
                  alt="头像"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon
                  size={36}
                  className="text-muted"
                  strokeWidth={1.5}
                />
              )}
            </div>
            <span className="mt-2 block text-center text-xs text-muted">
              点击更换头像
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              className="hidden"
            />
          </label>
        </div>

        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="昵称"
          className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand-ink"
        />
        {editError && <p className="mt-2 text-xs text-danger">{editError}</p>}
        <button
          onClick={saveProfile}
          disabled={editBusy}
          className="mt-4 w-full rounded-xl bg-brand py-3 text-[13px] font-semibold text-onbrand disabled:opacity-55"
        >
          {editBusy ? "保存中…" : "保存"}
        </button>
      </BottomSheet>

      <BottomSheet
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="报告问题"
      >
        {feedbackSent ? (
          <p className="py-10 text-center text-sm text-ink">
            已收到你的反馈，谢谢！
          </p>
        ) : (
          <>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="描述你遇到的问题，或想反馈的建议…"
              rows={5}
              className="w-full resize-none rounded-xl border border-sand bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand-ink"
            />
            {feedbackError && (
              <p className="mt-2 text-xs text-danger">{feedbackError}</p>
            )}
            <button
              onClick={submitFeedback}
              disabled={!feedbackText.trim() || feedbackBusy}
              className="mt-4 w-full rounded-xl bg-brand py-3 text-[13px] font-semibold text-onbrand disabled:opacity-55"
            >
              {feedbackBusy ? "提交中…" : "提交"}
            </button>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
