import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyCode } from "@/lib/verify-code";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: {
    email?: string;
    password?: string;
    name?: string;
    avatar?: string;
    code?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const name = body.name?.trim();
  const avatar = body.avatar?.trim();
  const code = body.code?.trim();

  if (!email || !password) {
    return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "请输入验证码" }, { status: 400 });
  }
  if (!verifyCode(email, code)) {
    return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
  }
  if (avatar && avatar.length > 500000) {
    return NextResponse.json({ error: "头像图片过大" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { email, passwordHash, name: name || null, avatar: avatar || null },
  });
  await createSession(user.id);

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    { status: 201 }
  );
}
