import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { clearFailures, isLocked, recordFailure } from "@/lib/rate-limit";
import { verifyCode } from "@/lib/verify-code";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string; password?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const code = body.code?.trim();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }

  if (isLocked(email)) {
    return NextResponse.json(
      { error: "尝试次数过多，请 15 分钟后再试" },
      { status: 429 }
    );
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    recordFailure(email);
    return NextResponse.json({ error: "该邮箱未注册" }, { status: 401 });
  }

  // 验证码登录
  if (code) {
    if (!verifyCode(email, code)) {
      recordFailure(email);
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 401 });
    }
    clearFailures(email);
    await createSession(user.id);
    return NextResponse.json({ id: user.id, email: user.email });
  }

  // 密码登录
  if (!password) {
    return NextResponse.json({ error: "请输入密码" }, { status: 400 });
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    recordFailure(email);
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  clearFailures(email);
  await createSession(user.id);
  return NextResponse.json({ id: user.id, email: user.email });
}
